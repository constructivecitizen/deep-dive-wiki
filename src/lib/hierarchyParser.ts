import { ContentNode } from "@/components/HierarchicalContent";

export interface ParsedContent {
  nodes: ContentNode[];
  tagIndex: Map<string, string[]>; // tag -> node IDs
}

export class HierarchyParser {
  static parseMarkup(text: string): ParsedContent {
    const lines = text.split('\n');
    const nodes: ContentNode[] = [];
    const tagIndex = new Map<string, string[]>();
    const nodeStack: ContentNode[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const headerMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+\[([^\]]+)\])?$/);
      
      if (headerMatch) {
        const [, hashes, content, tagString] = headerMatch;
        const depth = hashes.length - 1;
        const tags = tagString ? tagString.split(',').map(t => t.trim()) : [];
        
        const node: ContentNode = {
          id: `node-${Date.now()}-${i}`,
          content: content.trim(),
          tags,
          depth,
          children: []
        };

        // Index tags
        tags.forEach(tag => {
          if (!tagIndex.has(tag)) {
            tagIndex.set(tag, []);
          }
          tagIndex.get(tag)!.push(node.id);
        });

        // Find correct parent
        while (nodeStack.length > 0 && nodeStack[nodeStack.length - 1].depth >= depth) {
          nodeStack.pop();
        }

        if (nodeStack.length === 0) {
          nodes.push(node);
        } else {
          const parent = nodeStack[nodeStack.length - 1];
          if (!parent.children) parent.children = [];
          parent.children.push(node);
        }

        nodeStack.push(node);
      } else if (line && nodeStack.length > 0) {
        // Regular content line - add to the last node
        const lastNode = nodeStack[nodeStack.length - 1];
        lastNode.content += '\n' + line;
      }
    }

    return { nodes, tagIndex };
  }

  static nodeToMarkup(node: ContentNode): string {
    const indent = '#'.repeat(node.depth + 1);
    const tags = node.tags && node.tags.length > 0 ? ` [${node.tags.join(', ')}]` : '';
    const header = `${indent} ${node.content.split('\n')[0]}${tags}`;
    
    const additionalContent = node.content.split('\n').slice(1).join('\n');
    const content = additionalContent ? `\n${additionalContent}` : '';
    
    let markup = header + content;
    
    if (node.children) {
      const childrenMarkup = node.children.map(child => this.nodeToMarkup(child)).join('\n');
      markup += '\n' + childrenMarkup;
    }
    
    return markup;
  }

  static nodesToMarkup(nodes: ContentNode[]): string {
    return nodes.map(node => this.nodeToMarkup(node)).join('\n\n');
  }
}