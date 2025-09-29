import { DocumentSection } from '../services/contentService';

export interface HierarchicalDocumentSection extends DocumentSection {
  children: HierarchicalDocumentSection[];
}

/**
 * Builds a hierarchical structure from flat document sections based on their level property.
 * Only includes sections that have children (subsections).
 */
export function buildSectionHierarchy(sections: DocumentSection[]): HierarchicalDocumentSection[] {
  if (!sections || sections.length === 0) return [];

  // Convert sections to hierarchical format
  const hierarchicalSections: HierarchicalDocumentSection[] = sections.map(section => ({
    ...section,
    children: []
  }));

  // Build parent-child relationships based on levels
  const result: HierarchicalDocumentSection[] = [];
  const stack: HierarchicalDocumentSection[] = [];

  for (const section of hierarchicalSections) {
    // Remove items from stack that are at same or deeper level
    while (stack.length > 0 && stack[stack.length - 1].level >= section.level) {
      stack.pop();
    }

    // Add to parent's children if we have a parent
    if (stack.length > 0) {
      stack[stack.length - 1].children.push(section);
    } else {
      // This is a root level section
      result.push(section);
    }

    // Add current section to stack for potential children
    stack.push(section);
  }

  // Return all sections, not just those with children
  return result;
}