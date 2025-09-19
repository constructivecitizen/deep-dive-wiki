import { ContentService, WikiDocument } from "@/services/contentService";

export interface TagFilter {
  includeTags: string[];
  excludeTags: string[];
}

export class TagManager {
  static extractAllTags(nodes: WikiDocument[]): string[] {
    const tags = new Set<string>();
    
    nodes.forEach(doc => {
      doc.tags?.forEach(tag => tags.add(tag));
    });
    
    return Array.from(tags).sort();
  }

  static buildTagIndex(nodes: WikiDocument[]): Map<string, string[]> {
    const tagIndex = new Map<string, string[]>();
    
    nodes.forEach(doc => {
      doc.tags?.forEach(tag => {
        if (!tagIndex.has(tag)) {
          tagIndex.set(tag, []);
        }
        tagIndex.get(tag)!.push(doc.id);
      });
    });
    
    return tagIndex;
  }

  static filterByTags(nodes: WikiDocument[], includeTags: string[]): WikiDocument[] {
    if (includeTags.length === 0) return nodes;
    
    return nodes.filter(doc => 
      includeTags.some(tag => doc.tags?.includes(tag))
    );
  }

  static filterByContent(nodes: WikiDocument[], searchTerm: string): WikiDocument[] {
    if (!searchTerm) return nodes;
    
    const search = searchTerm.toLowerCase();
    return nodes.filter(doc => 
      doc.title.toLowerCase().includes(search) ||
      JSON.stringify(doc.content_json).toLowerCase().includes(search)
    );
  }

  static getAllTags(nodes: WikiDocument[]): string[] {
    return this.extractAllTags(nodes);
  }

  static filterNodes(nodes: WikiDocument[], filter: TagFilter): WikiDocument[] {
    const { includeTags, excludeTags } = filter;
    
    if (includeTags.length === 0 && excludeTags.length === 0) {
      return nodes;
    }

    return nodes.filter(doc => {
      const docTags = doc.tags || [];
      
      // Check if document should be excluded
      const shouldExclude = excludeTags.some(tag => docTags.includes(tag));
      if (shouldExclude) return false;
      
      // Check if document matches include filter (if any include tags are specified)
      const matchesInclude = includeTags.length === 0 || includeTags.some(tag => docTags.includes(tag));
      
      return matchesInclude;
    });
  }

  static getTagSuggestions(currentInput: string, allTags: string[]): string[] {
    if (!currentInput) return allTags;
    
    const input = currentInput.toLowerCase();
    return allTags
      .filter(tag => tag.toLowerCase().includes(input))
      .sort((a, b) => {
        const aStarts = a.toLowerCase().startsWith(input);
        const bStarts = b.toLowerCase().startsWith(input);
        if (aStarts && !bStarts) return -1;
        if (!aStarts && bStarts) return 1;
        return a.localeCompare(b);
      });
  }
}

// Export instance for easier usage
export const tagManager = new TagManager();