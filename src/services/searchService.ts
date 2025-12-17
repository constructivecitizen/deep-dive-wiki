import { supabase } from "@/integrations/supabase/client";
import { DocumentSection } from "./contentService";

export interface SearchResult {
  id: string;
  documentId: string;
  documentTitle: string;
  documentPath: string;
  sectionId?: string;
  sectionTitle?: string;
  matchedText: string;
  fullContent: string;
  breadcrumbPath: string[];
  matchType: 'title' | 'section-title' | 'content';
  relevanceScore: number;
}

export class SearchService {
  /**
   * Search across all documents and sections with relevance ranking
   * Prioritizes: exact title matches > section title matches > content matches
   */
  static async search(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];
    
    const normalizedQuery = query.toLowerCase().trim();
    const results: SearchResult[] = [];
    
    // Fetch all documents with content
    const { data, error } = await supabase
      .from('content_items')
      .select('*');
    
    if (error) {
      console.error('Search error:', error);
      return [];
    }
    
    if (!data) return [];
    
    for (const item of data) {
      const docTitle = item.title || '';
      const docPath = item.path || '';
      const sections = this.normalizeContentJson(item.content_json);
      
      // Build section hierarchy map for breadcrumbs
      const sectionHierarchy = this.buildSectionHierarchy(sections || []);
      
      // Check document title match
      if (docTitle.toLowerCase().includes(normalizedQuery)) {
        const isExactMatch = docTitle.toLowerCase() === normalizedQuery;
        results.push({
          id: `doc-${item.id}`,
          documentId: item.id,
          documentTitle: docTitle,
          documentPath: docPath,
          matchedText: this.highlightMatch(docTitle, query),
          fullContent: docTitle,
          breadcrumbPath: [docTitle],
          matchType: 'title',
          relevanceScore: isExactMatch ? 100 : 80 + this.calculateProximityScore(docTitle, normalizedQuery)
        });
      }
      
      // Check sections
      if (sections) {
        for (const section of sections) {
          const sectionTitle = section.title || '';
          const sectionContent = section.content || '';
          const breadcrumb = this.getBreadcrumbPath(section.id, sectionHierarchy, docTitle);
          
          // Section title match
          if (sectionTitle.toLowerCase().includes(normalizedQuery)) {
            const isExactMatch = sectionTitle.toLowerCase() === normalizedQuery;
            results.push({
              id: `section-${item.id}-${section.id}`,
              documentId: item.id,
              documentTitle: docTitle,
              documentPath: docPath,
              sectionId: section.id,
              sectionTitle: sectionTitle,
              matchedText: this.highlightMatch(sectionTitle, query),
              fullContent: sectionContent || sectionTitle,
              breadcrumbPath: breadcrumb,
              matchType: 'section-title',
              relevanceScore: isExactMatch ? 70 : 50 + this.calculateProximityScore(sectionTitle, normalizedQuery)
            });
          }
          
          // Content match
          if (sectionContent.toLowerCase().includes(normalizedQuery)) {
            const snippet = this.extractSnippet(sectionContent, normalizedQuery);
            results.push({
              id: `content-${item.id}-${section.id}`,
              documentId: item.id,
              documentTitle: docTitle,
              documentPath: docPath,
              sectionId: section.id,
              sectionTitle: sectionTitle,
              matchedText: this.highlightMatch(snippet, query),
              fullContent: sectionContent,
              breadcrumbPath: breadcrumb,
              matchType: 'content',
              relevanceScore: 30 + this.calculateProximityScore(sectionContent, normalizedQuery)
            });
          }
        }
      }
    }
    
    // Sort by relevance score descending
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);
    
    // Deduplicate - keep highest scoring result per section
    const seen = new Set<string>();
    return results.filter(r => {
      const key = r.sectionId ? `${r.documentId}-${r.sectionId}` : r.documentId;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
  
  /**
   * Calculate how early/prominently the query appears in the text
   */
  private static calculateProximityScore(text: string, query: string): number {
    const index = text.toLowerCase().indexOf(query);
    if (index === -1) return 0;
    // Earlier matches get higher scores (max 19 points)
    return Math.max(0, 19 - Math.floor(index / 10));
  }
  
  /**
   * Extract a snippet around the matched text
   */
  private static extractSnippet(content: string, query: string, contextLength: number = 60): string {
    const lowerContent = content.toLowerCase();
    const index = lowerContent.indexOf(query.toLowerCase());
    
    if (index === -1) return content.slice(0, contextLength * 2);
    
    const start = Math.max(0, index - contextLength);
    const end = Math.min(content.length, index + query.length + contextLength);
    
    let snippet = content.slice(start, end);
    
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';
    
    return snippet;
  }
  
  /**
   * Add highlight markers around matched text
   */
  private static highlightMatch(text: string, query: string): string {
    if (!query) return text;
    const regex = new RegExp(`(${this.escapeRegex(query)})`, 'gi');
    return text.replace(regex, '**$1**');
  }
  
  private static escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  private static normalizeContentJson(contentJson: any): DocumentSection[] | null {
    if (!contentJson) return null;
    if (Array.isArray(contentJson)) return contentJson;
    if (contentJson && typeof contentJson === 'object' && 'sections' in contentJson) {
      return contentJson.sections || [];
    }
    return null;
  }
  
  /**
   * Build a map of section IDs to their parent IDs for breadcrumb generation
   */
  private static buildSectionHierarchy(sections: DocumentSection[]): Map<string, { title: string; parentId: string | null; level: number }> {
    const hierarchy = new Map<string, { title: string; parentId: string | null; level: number }>();
    const parentStack: { id: string; level: number }[] = [];
    
    for (const section of sections) {
      const level = section.level || 1;
      
      // Pop from stack until we find a parent with lower level
      while (parentStack.length > 0 && parentStack[parentStack.length - 1].level >= level) {
        parentStack.pop();
      }
      
      const parentId = parentStack.length > 0 ? parentStack[parentStack.length - 1].id : null;
      hierarchy.set(section.id, { title: section.title || '', parentId, level });
      
      parentStack.push({ id: section.id, level });
    }
    
    return hierarchy;
  }
  
  /**
   * Get the full breadcrumb path for a section
   */
  private static getBreadcrumbPath(
    sectionId: string, 
    hierarchy: Map<string, { title: string; parentId: string | null; level: number }>,
    docTitle: string
  ): string[] {
    const path: string[] = [docTitle];
    const visited = new Set<string>();
    let currentId: string | null = sectionId;
    const sectionTitles: string[] = [];
    
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const info = hierarchy.get(currentId);
      if (info) {
        sectionTitles.unshift(info.title);
        currentId = info.parentId;
      } else {
        break;
      }
    }
    
    return [...path, ...sectionTitles];
  }
}
