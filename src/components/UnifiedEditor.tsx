import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Eye, FileText, Save, Bold, Italic, List, Link2, X } from 'lucide-react';
import { ContentNode } from '@/components/HierarchicalContent';
import { HierarchyParser } from '@/lib/hierarchyParser';

export interface EditorData {
  type: 'document' | 'section';
  content: string;
  title?: string;
  level?: number;
  position?: number;
  parentPath?: string;
}

interface UnifiedEditorProps {
  editorData: EditorData | null;
  onSave: (content: string, title?: string) => void;
  onClose: () => void;
}

export const UnifiedEditor = ({ editorData, onSave, onClose }: UnifiedEditorProps) => {
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    if (editorData) {
      setContent(editorData.content || '');
      setTitle(editorData.title || '');
      setIsFullscreen(editorData.type === 'document');
    }
  }, [editorData]);

  const handleSave = () => {
    if (editorData?.type === 'section') {
      onSave(content, title);
    } else {
      onSave(content);
    }
    onClose();
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

    setContent(template);
  };

  const insertMarkdown = (type: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
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

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);

    // Set cursor position after insertion
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  if (!editorData) return null;

  // Fullscreen editor for documents
  if (isFullscreen) {
    return (
      <div 
        className="fixed inset-0 bg-background z-[100] overflow-hidden pointer-events-auto" 
        role="dialog" 
        aria-modal="true"
        aria-labelledby="editor-title"
        aria-describedby="editor-description"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-full flex flex-col pointer-events-auto">
          <header className="border-b border-border bg-card p-4 pointer-events-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <h1 id="editor-title" className="text-xl font-semibold">Document Editor</h1>
                <span id="editor-description" className="sr-only">Full-screen document editor with markdown support</span>
              </div>
              <div className="flex items-center gap-2 pointer-events-auto">
                <div className="flex items-center gap-1 mr-4 border-r border-border pr-4">
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Bold button clicked');
                      insertMarkdown('bold');
                    }} 
                    variant="outline" 
                    size="sm"
                    title="Bold"
                    className="pointer-events-auto"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Italic button clicked');
                      insertMarkdown('italic');
                    }} 
                    variant="outline" 
                    size="sm"
                    title="Italic"
                    className="pointer-events-auto"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('List button clicked');
                      insertMarkdown('list');
                    }} 
                    variant="outline" 
                    size="sm"
                    title="List"
                    className="pointer-events-auto"
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button 
                    onClick={(e) => {
                      e.stopPropagation();
                      console.log('Link button clicked');
                      insertMarkdown('link');
                    }} 
                    variant="outline" 
                    size="sm"
                    title="Link"
                    className="pointer-events-auto"
                  >
                    <Link2 className="h-4 w-4" />
                  </Button>
                </div>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Template button clicked');
                    insertTemplate();
                  }} 
                  variant="outline" 
                  size="sm"
                  className="pointer-events-auto"
                >
                  Insert Template
                </Button>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Save button clicked');
                    handleSave();
                  }} 
                  size="sm"
                  className="pointer-events-auto"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
                <Button 
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log('Back to View button clicked');
                    onClose();
                  }} 
                  variant="outline" 
                  size="sm"
                  className="pointer-events-auto"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Back to View
                </Button>
              </div>
            </div>
          </header>

          <div className="flex-1 overflow-hidden pointer-events-auto">
            <div className="h-full flex">
              <div className="flex-1 overflow-y-auto pointer-events-auto">
                <Card className="m-4 h-[calc(100vh-120px)] pointer-events-auto">
                  <div className="h-full p-4 pointer-events-auto">
                    <Textarea
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      placeholder={`Start typing or paste your content...

Use markup like:
# Main Topic [tag1, tag2]
Content with **bold**, *italic*, and [links](url).

## Subtopic [tag3, tag4]
- List items
- More content

### Detail [tag5]
More detailed content with \`code\`.`}
                      className="h-full min-h-[400px] font-mono text-sm resize-none border-0 focus:ring-0 focus:border-0 p-0 pointer-events-auto"
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
  }

  // Modal editor for sections
  return (
    <Dialog open={!!editorData} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col" aria-describedby="section-editor-description">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Edit Section</span>
            <span id="section-editor-description" className="sr-only">Modal editor for editing section content and title</span>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 space-y-4 overflow-hidden">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Section Title
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter section title..."
              className="w-full"
            />
          </div>
          
          <div className="flex-1 flex flex-col">
            <label className="text-sm font-medium text-foreground mb-2 block">
              Content
            </label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter section content..."
              className="flex-1 min-h-[300px] resize-none"
            />
          </div>
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Section
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};