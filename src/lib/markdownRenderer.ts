import { marked } from 'marked';

// Configure marked for safe HTML rendering
marked.setOptions({
  breaks: true,
  gfm: true,
});

// Custom renderer to handle inline markdown within our hierarchy content
const renderer = new marked.Renderer();

// Override paragraph rendering to avoid wrapping short content in p tags unnecessarily
renderer.paragraph = ({ tokens }: any) => {
  const text = marked.parser(tokens);
  // If it's a short single line, don't wrap in p tags
  if (typeof text === 'string' && text.length < 100 && !text.includes('<')) {
    return text;
  }
  return `<p>${text}</p>`;
};

// Override code rendering for inline code
renderer.code = ({ text, lang }: any) => {
  return `<code class="inline-code">${text}</code>`;
};

renderer.codespan = ({ text }: any) => {
  return `<code class="inline-code">${text}</code>`;
};

export const renderMarkdown = (content: string): string => {
  try {
    const result = marked(content, { renderer });
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