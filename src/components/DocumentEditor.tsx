import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Eye, FileText, Save } from 'lucide-react';
import { ContentNode } from '@/components/HierarchicalContent';
import { HierarchyParser } from '@/lib/hierarchyParser';

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
    }
  }, [initialContent]);

  const handleSave = () => {
    const parsed = HierarchyParser.parseMarkup(markup);
    onSave(parsed.nodes);
  };

  const insertTemplate = () => {
    const template = `# Main Topic [example-tag, important]
This is the main content section. You can write paragraphs here.

## Subtopic A [technical, detailed]
This is a subtopic with its own content and tags.

### Detail 1 [implementation]
Detailed information about implementation.

### Detail 2 [theory, background]
Background theory and concepts.

## Subtopic B [practical, guide]
Another subtopic with practical guidance.

# Another Main Topic [advanced]
Start a new main section here.`;

    setMarkup(template);
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
Content for the main topic.

## Subtopic [tag3, tag4]
Content for the subtopic.

### Detail [tag5]
More detailed content.`}
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
                  <h4 className="font-medium mb-2">Content</h4>
                  <p className="text-muted-foreground">
                    Write regular paragraphs after headers. They'll be associated with the nearest header above them.
                  </p>
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