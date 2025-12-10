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
      
      // Check document title match
      if (docTitle.toLowerCase().includes(normalizedQuery)) {
        const isExactMatch = docTitle.toLowerCase() === normalizedQuery;
        results.push({
          id: `doc-${item.id}`,
          documentId: item.id,
          documentTitle: docTitle,
          documentPath: docPath,
          matchedText: this.highlightMatch(docTitle, query),
          matchType: 'title',
          relevanceScore: isExactMatch ? 100 : 80 + this.calculateProximityScore(docTitle, normalizedQuery)
        });
      }
      
      // Check sections
      if (sections) {
        for (const section of sections) {
          const sectionTitle = section.title || '';
          const sectionContent = section.content || '';
          
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
}
