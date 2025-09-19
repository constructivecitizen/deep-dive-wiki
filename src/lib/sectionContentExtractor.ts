import { DocumentSection } from '../services/contentService';

/**
 * Extracts the full content for a section including all its nested content
 */
export function extractSectionFullContent(
  sections: DocumentSection[],
  targetSectionId: string
): string {
  const findSectionAndContent = (
    sectionList: DocumentSection[],
    sectionId: string,
    currentLevel: number = 1
  ): string | null => {
    for (let i = 0; i < sectionList.length; i++) {
      const section = sectionList[i];
      
      if (section.id === sectionId) {
        // Found the target section, now collect all content
        let fullContent = '';
        
        // Add the section title as a header
        const headerLevel = '#'.repeat(Math.max(1, section.level || 1));
        fullContent += `${headerLevel} ${section.title}\n\n`;
        
        // Add the section's own content if it exists
        if (section.content && section.content.trim()) {
          fullContent += section.content.trim() + '\n\n';
        }
        
        // Recursively add all nested content from the original sections array
        fullContent += extractNestedContent(sectionList, section.id, section.level || 1);
        
        return fullContent.trim();
      }
    }
    
    return null;
  };

  return findSectionAndContent(sections, targetSectionId) || '';
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