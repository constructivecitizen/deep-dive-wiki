import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Eye, FileText, Save, Bold, Italic, List, Link2 } from 'lucide-react';
import { ContentNode } from '@/components/HierarchicalContent';
import { HierarchyParser } from '@/lib/hierarchyParser';
import { marked } from 'marked';

interface DocumentEditorProps {
  initialContent: ContentNode[];
  onSave: (nodes: ContentNode[]) => void;
  onClose: () => void;
}

export const DocumentEditor = ({ initialContent, onSave, onClose }: DocumentEditorProps) => {
  const [markup, setMarkup] = useState('');

  useEffect(() => {
    if (initialContent.length > 0) {
      const initialMarkup = HierarchyParser.nodesToMarkup(initialContent);
      setMarkup(initialMarkup);
    } else {
      // Start with a basic template for new pages
      setMarkup('# Page Title\n\nWrite your content here...\n\n## Subtopic\n\nAdd more details here.');
    }
  }, [initialContent]);

  const handleSave = () => {
    const parsed = HierarchyParser.parseMarkup(markup);
    onSave(parsed.nodes);
  };

  const insertTemplate = () => {
    const template = `# Main Topic [example-tag, important]
This is the main content section. You can write **bold text**, *italic text*, and [links](https://example.com).

## Subtopic A [technical, detailed]
This is a subtopic with its own content and tags. Use markdown formatting:

- **Bold text** for emphasis
- *Italic text* for subtle emphasis
- \`code snippets\` for technical terms
- [External links](https://example.com) for references

### Detail 1 [implementation]
Detailed information about implementation. You can use:

1. Numbered lists
2. **Bold headings** within content
3. *Emphasized points*

### Detail 2 [theory, background]
Background theory and concepts with \`inline code\` examples.

## Subtopic B [practical, guide]
Another subtopic with practical guidance and **markdown formatting**.

# Another Main Topic [advanced]
Start a new main section here with full markdown support.`;

    setMarkup(template);
  };

  const insertMarkdown = (type: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markup.substring(start, end);
    let replacement = '';

    switch (type) {
      case 'bold':
        replacement = selectedText ? `**${selectedText}**` : '**bold text**';
        break;
      case 'italic':
        replacement = selectedText ? `*${selectedText}*` : '*italic text*';
        break;
      case 'list':
        replacement = selectedText 
          ? selectedText.split('\n').map(line => line.trim() ? `- ${line}` : line).join('\n')
          : '- List item';
        break;
      case 'link':
        replacement = selectedText ? `[${selectedText}](url)` : '[Link text](url)';
        break;
    }

    const newMarkup = markup.substring(0, start) + replacement + markup.substring(end);
    setMarkup(newMarkup);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  return (
    <div className="fixed inset-0 bg-background z-50 overflow-hidden">
      <div className="h-full flex flex-col">
        <header className="border-b border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h1 className="text-xl font-semibold">Document Editor</h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 mr-4 border-r border-border pr-4">
                <Button 
                  onClick={() => insertMarkdown('bold')} 
                  variant="outline" 
                  size="sm"
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => insertMarkdown('italic')} 
                  variant="outline" 
                  size="sm"
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => insertMarkdown('list')} 
                  variant="outline" 
                  size="sm"
                  title="List"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button 
                  onClick={() => insertMarkdown('link')} 
                  variant="outline" 
                  size="sm"
                  title="Link"
                >
                  <Link2 className="h-4 w-4" />
                </Button>
              </div>
              <Button onClick={insertTemplate} variant="outline" size="sm">
                Insert Template
              </Button>
              <Button onClick={handleSave} size="sm">
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button onClick={onClose} variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                Back to View
              </Button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            <div className="flex-1 overflow-y-auto">
              <Card className="m-4 h-[calc(100vh-120px)]">
                <div className="h-full p-4">
                  <Textarea
                    value={markup}
                    onChange={(e) => setMarkup(e.target.value)}
                    placeholder={`Start typing or paste your content...

Use markup like:
# Main Topic [tag1, tag2]
Content with **bold**, *italic*, and [links](url).

## Subtopic [tag3, tag4]
- List items
- More content

### Detail [tag5]
More detailed content with \`code\`.`}
                    className="h-full min-h-[400px] font-mono text-sm resize-none border-0 focus:ring-0 focus:border-0 p-0"
                  />
                </div>
              </Card>
            </div>

            <div className="w-80 border-l border-border bg-muted/50 p-4 overflow-y-auto">
              <h3 className="font-semibold mb-4">Markup Guide</h3>
              <div className="space-y-4 text-sm">
                <div>
                  <h4 className="font-medium mb-2">Headers & Hierarchy</h4>
                  <div className="bg-background p-2 rounded border font-mono text-xs">
                    # Level 1 [tags]<br/>
                    ## Level 2 [tags]<br/>
                    ### Level 3 [tags]<br/>
                    #### Level 4 [tags]<br/>
                    ##### Level 5 [tags]<br/>
                    ###### Level 6 [tags]
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">Tags</h4>
                  <p className="text-muted-foreground mb-2">
                    Add tags in square brackets after headers:
                  </p>
                  <div className="bg-background p-2 rounded border font-mono text-xs">
                    # Topic [tag1, tag2, tag3]
                  </div>
                </div>

                <div>
                  <h4 className="font-medium mb-2">Content & Markdown</h4>
                  <p className="text-muted-foreground mb-2">
                    Write regular paragraphs after headers with full markdown support:
                  </p>
                  <div className="bg-background p-2 rounded border font-mono text-xs">
                    **Bold text**<br/>
                    *Italic text*<br/>
                    \`inline code\`<br/>
                    [Link text](url)<br/>
                    - List items
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-medium mb-2">Tips</h4>
                  <ul className="text-muted-foreground space-y-1 text-xs">
                    <li>• Tags are hidden in display mode</li>
                    <li>• Use consistent tag names</li>
                    <li>• Headers create the hierarchy</li>
                    <li>• Paste large documents easily</li>
                    <li>• Save frequently</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};