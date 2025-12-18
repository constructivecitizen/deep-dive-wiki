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
  static parseMarkup(text: string, documentTitle?: string): ParsedContent {
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
    let preHeaderContent: string[] = [];
    let foundFirstHeader = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();

      const headerMatch = trimmedLine.match(/^(#{1,99})\s+(.+?)(?:\s+\[([^\]]+)\])?$/);
      
      if (headerMatch) {
        foundFirstHeader = true;
        
        // If we have pre-header content, create a section for it
        if (preHeaderContent.length > 0 && documentTitle) {
          sections.push({
            id: `section-${++sectionCounter}`,
            title: documentTitle,
            content: preHeaderContent.join('\n'),
            level: 1,
            tags: []
          });
          preHeaderContent = [];
        }
        
        // Save previous section if exists
        if (currentSection) {
          // Trim trailing whitespace from content
          currentSection.content = currentSection.content.trim();
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
      } else {
        if (!foundFirstHeader) {
          // Collect pre-header content (preserve blank lines)
          if (trimmedLine || preHeaderContent.length > 0) {
            preHeaderContent.push(trimmedLine);
          }
        } else if (currentSection) {
          // Add content to current section (preserve blank lines for paragraph separation)
          currentSection.content += (currentSection.content ? '\n' : '') + trimmedLine;
        }
      }
    }

    // Handle remaining pre-header content if no headers were found
    if (preHeaderContent.length > 0 && documentTitle && !foundFirstHeader) {
      sections.push({
        id: `section-${++sectionCounter}`,
        title: documentTitle,
        content: preHeaderContent.join('\n'),
        level: 1,
        tags: []
      });
    }

    // Add final section
    if (currentSection) {
      currentSection.content = currentSection.content.trim();
      sections.push(currentSection);
    }

    return { sections };
  }

  static sectionsToMarkup(sections: Array<{
    title: string;
    content: string;
    level: number;
    tags: string[];
  }>, documentTitle?: string): string {
    return sections.map((section, index) => {
      // If this is the first section and its title matches the document title, 
      // output only content (it's the pre-header content)
      if (index === 0 && documentTitle && section.title === documentTitle && section.level === 1) {
        return section.content || '';
      }
      
      const indent = '#'.repeat(section.level);
      const tags = section.tags && section.tags.length > 0 ? ` [${section.tags.join(', ')}]` : '';
      const header = `${indent} ${section.title}${tags}`;
      return section.content ? `${header}\n${section.content}` : header;
    }).join('\n\n');
  }
}
