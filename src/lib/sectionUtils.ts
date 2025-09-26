import { DocumentSection } from '../services/contentService';

/**
 * Finds a section by its ID in a flat array of document sections
 */
export function findSectionById(sections: DocumentSection[], sectionId: string): DocumentSection | null {
  return sections.find(section => section.id === sectionId) || null;
}

/**
 * Generates a section ID from a section title for URL hash navigation
 */
export function generateSectionId(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters except hyphens and spaces
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single hyphen
    .trim()
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

/**
 * Finds a section by matching its title to the hash (for backward compatibility)
 */
export function findSectionByHash(sections: DocumentSection[], hash: string): DocumentSection | null {
  if (!hash) return null;
  
  // Try to find by exact ID match first
  let section = findSectionById(sections, hash);
  if (section) return section;
  
  // Try to find by matching generated ID from title
  section = sections.find(s => generateSectionId(s.title) === hash);
  if (section) return section;
  
  // Last resort: try to find by partial title match
  const searchTerm = hash.replace(/-/g, ' ').toLowerCase();
  return sections.find(s => s.title.toLowerCase().includes(searchTerm)) || null;
}