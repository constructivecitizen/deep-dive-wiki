import { marked, Renderer } from 'marked';
import DOMPurify from 'dompurify';

/**
 * Preprocesses content to convert wiki-style [[links]] to markdown links
 * Supports:
 * - [[Section Title]] - same document link (display text = destination)
 * - [[display text|#Section Title]] - same document link with custom display text
 * - [[/document-path#Section Title]] - cross-document link
 * - [[display text|/document-path#Section Title]] - cross-document link with custom display text
 * - [[/document-path]] - document link without section
 */
const preprocessWikiLinks = (content: string): string => {
  return content.replace(/\[\[([^\]]+)\]\]/g, (match, linkText) => {
    const trimmedText = linkText.trim();
    
    // Check for pipe-separated format: [[display text|destination]]
    const pipeIndex = trimmedText.indexOf('|');
    let displayText: string;
    let destination: string;
    
    if (pipeIndex !== -1) {
      displayText = trimmedText.substring(0, pipeIndex).trim();
      destination = trimmedText.substring(pipeIndex + 1).trim();
    } else {
      destination = trimmedText;
      displayText = ''; // Will be derived from destination
    }
    
    // Cross-document link (starts with /)
    if (destination.startsWith('/')) {
      // If no custom display text, derive from destination
      if (!displayText) {
        const hashIndex = destination.indexOf('#');
        if (hashIndex !== -1) {
          displayText = destination.substring(hashIndex + 1);
        } else {
          const parts = destination.split('/').filter(Boolean);
          displayText = parts[parts.length - 1] || destination;
        }
      }
      return `[${displayText}](internal:${destination})`;
    }
    
    // Same-document link - use # prefix
    // If destination starts with #, it's explicit; otherwise add #
    const target = destination.startsWith('#') ? destination : `#${encodeURIComponent(destination)}`;
    if (!displayText) {
      displayText = destination.startsWith('#') ? destination.substring(1) : destination;
    }
    return `[${displayText}](internal:${target})`;
  });
};

// Create custom renderer for internal links
const createRenderer = (): Renderer => {
  const renderer = new Renderer();
  
  const originalLink = renderer.link.bind(renderer);
  
  renderer.link = ({ href, title, text }) => {
    // Handle internal links
    if (href?.startsWith('internal:')) {
      const target = href.replace('internal:', '');
      const titleAttr = title ? ` title="${title}"` : '';
      return `<a href="${target}" class="internal-link"${titleAttr} data-internal-link="${target}">${text}</a>`;
    }
    
    // External links open in new tab
    const titleAttr = title ? ` title="${title}"` : '';
    return `<a href="${href}" target="_blank" rel="noopener noreferrer"${titleAttr}>${text}</a>`;
  };
  
  return renderer;
};

// Configure marked with custom renderer
marked.setOptions({
  breaks: true,
  gfm: true
});

export const renderMarkdown = (content: string): string => {
  try {
    // Preprocess wiki-style links
    const preprocessed = preprocessWikiLinks(content);
    
    // Parse markdown to HTML with custom renderer
    const rawHtml = marked.parse(preprocessed, { renderer: createRenderer() });
    const htmlString = typeof rawHtml === 'string' ? rawHtml : content;
    
    // Sanitize HTML to remove malicious content (XSS protection)
    // Note: data-internal-link attribute is allowed for click handling
    const cleanHtml = DOMPurify.sanitize(htmlString, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'hr', 'table', 
                     'thead', 'tbody', 'tr', 'th', 'td', 'img', 'del', 'ins', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class', 'data-internal-link', 'target', 'rel'],
      ALLOW_DATA_ATTR: true,
      ALLOW_UNKNOWN_PROTOCOLS: false
    });
    
    return cleanHtml;
  } catch (error) {
    console.warn('Markdown rendering error:', error);
    // Return escaped plain text on error
    return content.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }
};

export const stripMarkdown = (content: string): string => {
  // Remove markdown syntax for plain text display
  return content
    .replace(/\[\[([^|\]]+)\|[^\]]+\]\]/g, '$1') // Wiki links with custom display text
    .replace(/\[\[([^\]]+)\]\]/g, '$1') // Wiki links without custom display text
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1')     // Italic
    .replace(/`(.*?)`/g, '$1')       // Code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/^[#\s]+/gm, '')        // Headers
    .replace(/^[-*+]\s/gm, '')       // Lists
    .trim();
};