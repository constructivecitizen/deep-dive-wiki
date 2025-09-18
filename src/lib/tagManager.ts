import { ContentNode } from "@/components/HierarchicalContent";

export interface TagFilter {
  includeTags: string[];
  excludeTags: string[];
}

export class TagManager {
  static extractAllTags(nodes: ContentNode[]): string[] {
    const tags = new Set<string>();
    
    const traverse = (node: ContentNode) => {
      node.tags?.forEach(tag => tags.add(tag));
      node.children?.forEach(traverse);
    };
    
    nodes.forEach(traverse);
    return Array.from(tags).sort();
  }

  static buildTagIndex(nodes: ContentNode[]): Map<string, string[]> {
    const tagIndex = new Map<string, string[]>();
    
    const traverse = (node: ContentNode) => {
      node.tags?.forEach(tag => {
        if (!tagIndex.has(tag)) {
          tagIndex.set(tag, []);
        }
        tagIndex.get(tag)!.push(node.id);
      });
      node.children?.forEach(traverse);
    };
    
    nodes.forEach(traverse);
    return tagIndex;
  }

  static filterNodes(nodes: ContentNode[], filter: TagFilter): ContentNode[] {
    const { includeTags, excludeTags } = filter;
    
    if (includeTags.length === 0 && excludeTags.length === 0) {
      return nodes;
    }

    const filterNode = (node: ContentNode): ContentNode | null => {
      const hasIncludedTag = includeTags.length === 0 || 
        includeTags.some(tag => node.tags?.includes(tag));
      const hasExcludedTag = excludeTags.some(tag => node.tags?.includes(tag));
      
      if (hasExcludedTag) return null;
      
      const filteredChildren = node.children?.map(filterNode).filter(Boolean) as ContentNode[] || [];
      
      // Include node if it matches filter OR has matching children
      if (hasIncludedTag || filteredChildren.length > 0) {
        return {
          ...node,
          children: filteredChildren
        };
      }
      
      return null;
    };

    return nodes.map(filterNode).filter(Boolean) as ContentNode[];
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