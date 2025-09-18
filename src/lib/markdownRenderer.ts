import { marked } from 'marked';

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true
});

export const renderMarkdown = (content: string): string => {
  try {
    console.log('renderMarkdown input:', content.substring(0, 200));
    // Use marked directly without custom renderer for now to test
    const result = marked.parse(content);
    console.log('renderMarkdown output:', typeof result === 'string' ? result.substring(0, 200) : result);
    return typeof result === 'string' ? result : content;
  } catch (error) {
    console.warn('Markdown rendering error:', error);
    return content; // Return original content if parsing fails
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