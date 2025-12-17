import { DocumentSection } from '@/services/contentService';
import { generateSectionId } from './sectionUtils';

export interface ResolvedLink {
  type: 'same-document' | 'cross-document';
  documentPath?: string;
  sectionTitle?: string;
  sectionId?: string;
}

/**
 * Resolves an internal link target to a structured object
 * Supports:
 * - #section-title (same document)
 * - /document-path#section-title (cross document)
 * - /document-path (cross document, no section)
 */
export function resolveInternalLink(
  target: string,
  currentSections: DocumentSection[]
): ResolvedLink | null {
  // Same-document link (starts with #)
  if (target.startsWith('#')) {
    const sectionRef = decodeURIComponent(target.substring(1));
    const section = findSectionByTitleOrId(currentSections, sectionRef);
    if (section) {
      return {
        type: 'same-document',
        sectionTitle: section.title,
        sectionId: section.id
      };
    }
    // Still return a link even if section not found - it might exist
    return {
      type: 'same-document',
      sectionTitle: sectionRef
    };
  }

  // Cross-document link (starts with /)
  if (target.startsWith('/')) {
    const hashIndex = target.indexOf('#');
    if (hashIndex !== -1) {
      const path = target.substring(0, hashIndex);
      const sectionRef = decodeURIComponent(target.substring(hashIndex + 1));
      return {
        type: 'cross-document',
        documentPath: path,
        sectionTitle: sectionRef
      };
    }
    return {
      type: 'cross-document',
      documentPath: target
    };
  }

  return null;
}

/**
 * Finds a section by title (case-insensitive) or by ID
 */
function findSectionByTitleOrId(
  sections: DocumentSection[],
  ref: string
): DocumentSection | null {
  const normalizedRef = ref.toLowerCase().trim();

  // Try exact title match (case-insensitive)
  let found = sections.find(s =>
    s.title.toLowerCase().trim() === normalizedRef
  );
  if (found) return found;

  // Try ID match
  found = sections.find(s => s.id === ref);
  if (found) return found;

  // Try generated slug match
  found = sections.find(s =>
    generateSectionId(s.title) === normalizedRef
  );
  if (found) return found;

  // Try partial title match
  found = sections.find(s =>
    s.title.toLowerCase().includes(normalizedRef) ||
    normalizedRef.includes(s.title.toLowerCase())
  );
  return found || null;
}
