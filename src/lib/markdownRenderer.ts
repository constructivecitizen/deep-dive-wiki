import { marked } from 'marked';
import DOMPurify from 'dompurify';

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

export const renderMarkdown = (content: string): string => {
  try {
    // Parse markdown to HTML
    const rawHtml = marked.parse(content);
    const htmlString = typeof rawHtml === 'string' ? rawHtml : content;
    
    // Sanitize HTML to remove malicious content (XSS protection)
    const cleanHtml = DOMPurify.sanitize(htmlString, {
      ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 
                     'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote', 'hr', 'table', 
                     'thead', 'tbody', 'tr', 'th', 'td', 'img', 'del', 'ins', 'span', 'div'],
      ALLOWED_ATTR: ['href', 'title', 'alt', 'src', 'class'],
      ALLOW_DATA_ATTR: false,
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
    .replace(/\*\*(.*?)\*\*/g, '$1') // Bold
    .replace(/\*(.*?)\*/g, '$1')     // Italic
    .replace(/`(.*?)`/g, '$1')       // Code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Links
    .replace(/^[#\s]+/gm, '')        // Headers
    .replace(/^[-*+]\s/gm, '')       // Lists
    .trim();
};