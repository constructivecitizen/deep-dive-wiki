interface DocumentSection {
  id: string;
  level: number;
  title: string;
  tags: string[];
  children: DocumentSection[];
}

export const extractSectionContent = (fullContent: string, section: DocumentSection): string => {
  const lines = fullContent.split('\n');
  const sectionStartPattern = new RegExp(`^#{${section.level}}\\s+${escapeRegExp(section.title)}`);
  
  let sectionStartIndex = -1;
  let sectionEndIndex = lines.length;
  
  // Find the start of the section
  for (let i = 0; i < lines.length; i++) {
    if (sectionStartPattern.test(lines[i])) {
      sectionStartIndex = i;
      break;
    }
  }
  
  if (sectionStartIndex === -1) {
    return ''; // Section not found
  }
  
  // Find the end of the section (next heading at same or higher level)
  for (let i = sectionStartIndex + 1; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^(#{1,30})\s/);
    if (headingMatch && headingMatch[1].length <= section.level) {
      sectionEndIndex = i;
      break;
    }
  }
  
  // Extract the section content
  const sectionLines = lines.slice(sectionStartIndex, sectionEndIndex);
  return sectionLines.join('\n');
};

export const replaceSectionContent = (
  fullContent: string, 
  section: DocumentSection, 
  newContent: string,
  newTitle?: string
): string => {
  const lines = fullContent.split('\n');
  const sectionStartPattern = new RegExp(`^#{${section.level}}\\s+${escapeRegExp(section.title)}`);
  
  let sectionStartIndex = -1;
  let sectionEndIndex = lines.length;
  
  // Find the start of the section
  for (let i = 0; i < lines.length; i++) {
    if (sectionStartPattern.test(lines[i])) {
      sectionStartIndex = i;
      break;
    }
  }
  
  if (sectionStartIndex === -1) {
    return fullContent; // Section not found, return original
  }
  
  // Find the end of the section
  for (let i = sectionStartIndex + 1; i < lines.length; i++) {
    const headingMatch = lines[i].match(/^(#{1,30})\s/);
    if (headingMatch && headingMatch[1].length <= section.level) {
      sectionEndIndex = i;
      break;
    }
  }
  
  // Create the new section content
  const headerPrefix = '#'.repeat(section.level);
  const finalTitle = newTitle || section.title;
  const newSectionLines = newContent.split('\n');
  
  // Ensure the first line is the header if it's not already
  if (!newSectionLines[0].startsWith(headerPrefix)) {
    newSectionLines.unshift(`${headerPrefix} ${finalTitle}`);
  } else if (newTitle) {
    // Update the title if provided
    newSectionLines[0] = `${headerPrefix} ${finalTitle}`;
  }
  
  // Replace the section
  const beforeSection = lines.slice(0, sectionStartIndex);
  const afterSection = lines.slice(sectionEndIndex);
  
  return [...beforeSection, ...newSectionLines, ...afterSection].join('\n');
};

const escapeRegExp = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};