import { DocumentSection } from '../services/contentService';

/**
 * Extracts the full content for a section including all its nested content
 */
export function extractSectionFullContent(
  targetSection: DocumentSection,
  allSections: DocumentSection[]
): {
  content: string;
  title: string;
  level: number;
  parentPath: string;
  sectionHierarchy: Array<{
    title: string;
    level: number;
  }>;
} {
  // Build section hierarchy using the same stack-based approach as the sidebar
  const sectionHierarchy: Array<{ title: string; level: number }> = [];
  const targetIndex = allSections.findIndex(s => s.id === targetSection.id);
  
  if (targetIndex >= 0) {
    // Use stack-based approach to build ancestry while processing sections up to target
    const ancestryStack: Array<{ title: string; level: number }> = [];
    
    // Process sections up to and including the target to build proper hierarchy
    for (let i = 0; i <= targetIndex; i++) {
      const section = allSections[i];
      
      // Remove items from stack that are at same or deeper level
      while (ancestryStack.length > 0 && ancestryStack[ancestryStack.length - 1].level >= section.level) {
        ancestryStack.pop();
      }
      
      // If this is not the target section, add it to the stack as a potential ancestor
      if (i < targetIndex) {
        ancestryStack.push({
          title: section.title,
          level: section.level
        });
      } else {
        // This is the target section - the current stack contains its direct ancestry
        sectionHierarchy.push(...ancestryStack);
      }
    }
  }

  // Build the full content
  let fullContent = '';
  
  // Add the section title as a header
  const headerLevel = '#'.repeat(Math.max(1, targetSection.level || 1));
  fullContent += `${headerLevel} ${targetSection.title}\n\n`;
  
  // Add the section's own content if it exists
  if (targetSection.content && targetSection.content.trim()) {
    fullContent += targetSection.content.trim() + '\n\n';
  }
  
  // Recursively add all nested content from the original sections array
  fullContent += extractNestedContent(allSections, targetSection.id, targetSection.level || 1);

  return {
    content: fullContent.trim(),
    title: targetSection.title,
    level: targetSection.level,
    parentPath: '',
    sectionHierarchy
  };
}

/**
 * Extracts nested content that appears after a section in the flat structure
 */
function extractNestedContent(
  sections: DocumentSection[],
  parentSectionId: string,
  parentLevel: number
): string {
  let content = '';
  
  // Find the parent section index
  const parentIndex = sections.findIndex(s => s.id === parentSectionId);
  if (parentIndex === -1) return content;
  
  // Look for subsequent sections that are nested under this parent
  for (let i = parentIndex + 1; i < sections.length; i++) {
    const section = sections[i];
    const sectionLevel = section.level || 1;
    
    // If we hit a section at the same or higher level, we're done with this branch
    if (sectionLevel <= parentLevel) {
      break;
    }
    
    // This section is nested under our parent, include it
    const headerLevel = '#'.repeat(Math.max(1, sectionLevel));
    content += `${headerLevel} ${section.title}\n\n`;
    
    if (section.content && section.content.trim()) {
      content += section.content.trim() + '\n\n';
    }
  }
  
  return content;
}