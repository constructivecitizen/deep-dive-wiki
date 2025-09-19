// IMPORTANT: This should ONLY be used in DocumentEditor for markdown parsing
// All other components should work directly with JSON sections from the database

export interface ParsedContent {
  sections: Array<{
    id: string;
    title: string;
    content: string;
    level: number;
    tags: string[];
  }>;
}

export class HierarchyParser {
  static parseMarkup(text: string): ParsedContent {
    const lines = text.split('\n');
    const sections: Array<{
      id: string;
      title: string; 
      content: string;
      level: number;
      tags: string[];
    }> = [];

    let currentSection: any = null;
    let sectionCounter = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const headerMatch = line.match(/^(#{1,6})\s+(.+?)(?:\s+\[([^\]]+)\])?$/);
      
      if (headerMatch) {
        // Save previous section if exists
        if (currentSection) {
          sections.push(currentSection);
        }

        const [, hashes, title, tagString] = headerMatch;
        const level = hashes.length;
        const tags = tagString ? tagString.split(',').map(t => t.trim()) : [];
        
        currentSection = {
          id: `section-${++sectionCounter}`,
          title: title.trim(),
          content: '',
          level,
          tags
        };
      } else if (line && currentSection) {
        // Add content to current section
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    }

    // Add final section
    if (currentSection) {
      sections.push(currentSection);
    }

    return { sections };
  }

  static sectionsToMarkup(sections: Array<{
    title: string;
    content: string;
    level: number;
    tags: string[];
  }>): string {
    return sections.map(section => {
      const indent = '#'.repeat(section.level);
      const tags = section.tags && section.tags.length > 0 ? ` [${section.tags.join(', ')}]` : '';
      const header = `${indent} ${section.title}${tags}`;
      return section.content ? `${header}\n${section.content}` : header;
    }).join('\n\n');
  }
}
