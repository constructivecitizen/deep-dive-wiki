import { DocumentSection } from "@/services/contentService";

/**
 * Simplified BlockNote block type for conversion purposes
 * We avoid importing BlockNote types directly to prevent circular type issues
 */
export interface SimpleBlock {
  id: string;
  type: string;
  props?: Record<string, unknown>;
  content?: Array<{ type: string; text: string; styles?: Record<string, boolean> }>;
  children: SimpleBlock[];
}

/**
 * Converts flat DocumentSection array (with levels) to nested BlockNote-compatible blocks
 */
export function flatSectionsToBlocks(sections: DocumentSection[]): SimpleBlock[] {
  if (!sections || sections.length === 0) return [];

  const blocks: SimpleBlock[] = [];
  const stack: { level: number; children: SimpleBlock[] }[] = [{ level: 0, children: blocks }];

  for (const section of sections) {
    const sectionBlock = createSectionBlock(section);

    // Pop stack until we find the appropriate parent level
    while (stack.length > 1 && stack[stack.length - 1].level >= section.level) {
      stack.pop();
    }

    // Add to current parent's children
    const parent = stack[stack.length - 1];
    parent.children.push(sectionBlock);

    // Push this section onto stack for potential children
    stack.push({ level: section.level, children: sectionBlock.children });
  }

  return blocks;
}

/**
 * Creates a BlockNote-compatible block from a DocumentSection
 * Stores originalLevel for N-level support (up to 99 levels)
 */
function createSectionBlock(section: DocumentSection): SimpleBlock {
  const children: SimpleBlock[] = [];

  // Add content as paragraph blocks if present
  if (section.content && section.content.trim()) {
    const contentParagraphs = parseContentToParagraphs(section.content);
    children.push(...contentParagraphs);
  }

  return {
    id: section.id,
    type: "heading",
    props: {
      level: Math.min(section.level, 3), // BlockNote visual display (1-3)
      originalLevel: section.level, // Preserve actual level (1-99) for round-trip
      sources: section.sources || undefined, // Preserve sources for round-trip
    },
    content: [{ type: "text", text: section.title, styles: {} }],
    children,
  };
}

/**
 * Parses markdown-ish content into paragraph blocks
 */
function parseContentToParagraphs(content: string): SimpleBlock[] {
  const blocks: SimpleBlock[] = [];
  const lines = content.split('\n\n').filter(line => line.trim());

  for (const paragraph of lines) {
    if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
      // Bullet list
      const items = paragraph.split('\n').filter(l => l.trim());
      for (const item of items) {
        blocks.push({
          id: generateSectionId(),
          type: "bulletListItem",
          content: [{ type: "text", text: item.replace(/^[-*]\s*/, ''), styles: {} }],
          children: [],
        });
      }
    } else if (/^\d+\.\s/.test(paragraph)) {
      // Numbered list
      const items = paragraph.split('\n').filter(l => l.trim());
      for (const item of items) {
        blocks.push({
          id: generateSectionId(),
          type: "numberedListItem",
          content: [{ type: "text", text: item.replace(/^\d+\.\s*/, ''), styles: {} }],
          children: [],
        });
      }
    } else {
      // Regular paragraph
      blocks.push({
        id: generateSectionId(),
        type: "paragraph",
        content: parseInlineContent(paragraph.trim()),
        children: [],
      });
    }
  }

  return blocks;
}

/**
 * Parse inline markdown formatting
 */
function parseInlineContent(text: string): Array<{ type: string; text: string; styles: Record<string, boolean> }> {
  // Strip markdown and return plain text
  const cleanText = text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/\[(.+?)\]\(.+?\)/g, '$1');

  if (cleanText) {
    return [{ type: "text", text: cleanText, styles: {} }];
  }
  return [];
}

/**
 * Converts nested BlockNote blocks back to flat DocumentSection array
 */
export function blocksToFlatSections(blocks: SimpleBlock[], startLevel: number = 1): DocumentSection[] {
  const sections: DocumentSection[] = [];
  flattenBlocks(blocks, startLevel, sections);
  return sections;
}

/**
 * Recursively flattens blocks to DocumentSections
 */
function flattenBlocks(blocks: SimpleBlock[], level: number, result: DocumentSection[]): void {
  for (const block of blocks) {
    if (block.type === "heading") {
      const section = blockToSection(block, level);
      result.push(section);
      
      // Separate content from nested headings
      const { contentBlocks, headingBlocks } = categorizeChildren(block.children);
      
      if (contentBlocks.length > 0) {
        section.content = blocksToMarkdown(contentBlocks);
      }
      
      if (headingBlocks.length > 0) {
        flattenBlocks(headingBlocks, level + 1, result);
      }
    }
  }
}

/**
 * Separates children into content blocks and heading blocks
 */
function categorizeChildren(children: SimpleBlock[]): { contentBlocks: SimpleBlock[]; headingBlocks: SimpleBlock[] } {
  const contentBlocks: SimpleBlock[] = [];
  const headingBlocks: SimpleBlock[] = [];
  
  for (const child of children) {
    if (child.type === "heading") {
      headingBlocks.push(child);
    } else {
      contentBlocks.push(child);
    }
  }
  
  return { contentBlocks, headingBlocks };
}

/**
 * Converts a heading block to a DocumentSection
 * Uses originalLevel if available for N-level support
 */
function blockToSection(block: SimpleBlock, level: number): DocumentSection {
  const title = extractTextContent(block.content);
  
  // Use originalLevel from props if available (preserves levels 4-99)
  const actualLevel = (block.props?.originalLevel as number) || level;
  
  // Preserve sources if stored in block props
  const sources = (block.props?.sources as string[]) || undefined;
  
  return {
    id: block.id,
    title,
    level: actualLevel,
    content: "",
    tags: [],
    sources,
  };
}

/**
 * Extracts plain text from inline content
 */
function extractTextContent(content?: Array<{ type: string; text: string }>): string {
  if (!content) return "";
  return content.filter(item => item.type === "text").map(item => item.text).join("");
}

/**
 * Converts content blocks back to markdown string
 */
function blocksToMarkdown(blocks: SimpleBlock[]): string {
  const parts: string[] = [];
  
  for (const block of blocks) {
    const text = extractTextContent(block.content);
    
    switch (block.type) {
      case "paragraph":
        parts.push(text);
        break;
      case "bulletListItem":
        parts.push(`- ${text}`);
        break;
      case "numberedListItem":
        parts.push(`1. ${text}`);
        break;
      default:
        parts.push(text);
    }
  }
  
  return parts.join('\n\n');
}

/**
 * Generates a unique ID for new sections
 */
export function generateSectionId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Validates round-trip conversion
 */
export function validateRoundTrip(original: DocumentSection[]): { 
  isValid: boolean; 
  differences: string[] 
} {
  const blocks = flatSectionsToBlocks(original);
  const converted = blocksToFlatSections(blocks);
  
  const differences: string[] = [];
  
  if (original.length !== converted.length) {
    differences.push(`Section count mismatch: ${original.length} vs ${converted.length}`);
  }
  
  for (let i = 0; i < Math.min(original.length, converted.length); i++) {
    const orig = original[i];
    const conv = converted[i];
    
    if (orig.title !== conv.title) {
      differences.push(`Title mismatch at index ${i}: "${orig.title}" vs "${conv.title}"`);
    }
    if (orig.level !== conv.level) {
      differences.push(`Level mismatch at index ${i}: ${orig.level} vs ${conv.level}`);
    }
  }
  
  return { isValid: differences.length === 0, differences };
}
