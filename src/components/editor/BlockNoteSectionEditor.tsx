import { 
  flatSectionsToBlocks, 
  blocksToFlatSections,
  SimpleBlock 
} from "@/lib/blockNoteConversions";
import { DocumentSection } from "@/services/contentService";
import { useEffect, useCallback, useRef, useState, lazy, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  FileText, Eye, Bold, Italic, List, Link2, Code, Edit3 
} from "lucide-react";
import { HierarchyParser } from "@/lib/hierarchyParser";

// Lazy load the JSX wrapper to isolate BlockNote types
const BlockNoteWrapper = lazy(() => import("./BlockNoteWrapper"));

const AUTO_SAVE_DELAY = 2000; // 2 seconds debounce

interface BlockNoteSectionEditorProps {
  sections: DocumentSection[];
  onSave: (sections: DocumentSection[], skipReload?: boolean) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

/**
 * BlockNote-based editor for hierarchical document sections
 * with mode toggle, formatting toolbar, and markup guide
 */
export function BlockNoteSectionEditor({
  sections,
  onSave,
  onClose,
  readOnly = false,
}: BlockNoteSectionEditorProps) {
  const editorRef = useRef<any>(null);
  const [editorMode, setEditorMode] = useState<'blocknote' | 'markdown'>('blocknote');
  const [markdownContent, setMarkdownContent] = useState('');
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hasChangesRef = useRef(false);
  
  // Convert flat sections to BlockNote blocks for initial content
  const initialBlocks = flatSectionsToBlocks(sections);

  // Convert sections to markdown on mount and mode switch
  useEffect(() => {
    const markdown = sectionsToMarkdown(sections);
    setMarkdownContent(markdown);
  }, [sections]);

  // Handle editor ready callback
  const handleEditorReady = useCallback((editor: any) => {
    editorRef.current = editor;
  }, []);

  // Get current content as sections
  const getCurrentSections = useCallback((): DocumentSection[] => {
    if (editorMode === 'blocknote' && editorRef.current) {
      const currentBlocks = editorRef.current.document;
      const simpleBlocks = convertEditorBlocksToSimpleBlocks(currentBlocks);
      return blocksToFlatSections(simpleBlocks);
    } else {
      return markdownToSections(markdownContent);
    }
  }, [editorMode, markdownContent]);

  // Perform save - skipReload=true for auto-save (keep editor open), false for close
  const performSave = useCallback((closeAfter = false) => {
    try {
      console.log('performSave called, closeAfter:', closeAfter);
      const flatSections = getCurrentSections();
      console.log('Saving sections:', flatSections.length, 'skipReload:', !closeAfter);
      // Auto-save (closeAfter=false) should skip reload to keep editor state intact
      // Manual close (closeAfter=true) should reload to show updated content
      onSave(flatSections, !closeAfter);
      hasChangesRef.current = false;
      if (closeAfter) {
        console.log('Closing editor after save');
        onClose?.();
      }
    } catch (error) {
      console.error("Failed to save editor content:", error);
    }
  }, [getCurrentSections, onSave, onClose]);

  // Trigger auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    console.log('triggerAutoSave called');
    hasChangesRef.current = true;
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    autoSaveTimerRef.current = setTimeout(() => {
      console.log('Auto-save timer fired, hasChanges:', hasChangesRef.current);
      if (hasChangesRef.current) {
        performSave(false);
      }
    }, AUTO_SAVE_DELAY);
  }, [performSave]);

  // Cleanup auto-save timer on unmount
  useEffect(() => {
    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, []);

  // Handle manual save with close
  const handleSaveAndClose = useCallback(() => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    performSave(true);
  }, [performSave]);

  // Toggle between BlockNote and Markdown modes - saves before switching
  const toggleEditorMode = useCallback(() => {
    // Cancel any pending auto-save
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    
    if (editorMode === 'blocknote') {
      // Convert current BlockNote content to markdown
      if (editorRef.current) {
        const currentBlocks = editorRef.current.document;
        const simpleBlocks = convertEditorBlocksToSimpleBlocks(currentBlocks);
        const flatSections = blocksToFlatSections(simpleBlocks);
        
        // Save before switching (skipReload=true to keep editor open)
        onSave(flatSections, true);
        hasChangesRef.current = false;
        
        const markdown = sectionsToMarkdown(flatSections);
        setMarkdownContent(markdown);
      }
      setEditorMode('markdown');
    } else {
      // Parse markdown to sections and save before switching
      const flatSections = markdownToSections(markdownContent);
      onSave(flatSections, true);
      hasChangesRef.current = false;
      
      // Note: BlockNote will reinitialize with the saved sections
      setEditorMode('blocknote');
    }
  }, [editorMode, markdownContent, onSave]);

  // Insert markdown formatting at cursor
  const insertMarkdown = useCallback((type: string) => {
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = markdownContent.substring(start, end);
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

    const newContent = markdownContent.substring(0, start) + replacement + markdownContent.substring(end);
    setMarkdownContent(newContent);

    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + replacement.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }, [markdownContent]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        performSave(false);
      }
      if (e.key === "Escape" && onClose) {
        if (autoSaveTimerRef.current) {
          clearTimeout(autoSaveTimerRef.current);
        }
        if (hasChangesRef.current) {
          performSave(false);
        }
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [performSave, onClose]);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
      <div 
        className="bg-background h-full w-full flex flex-col" 
        style={{ pointerEvents: 'auto' }}
        role="dialog" 
        aria-modal="true"
        aria-labelledby="editor-title"
      >
        {/* Header Toolbar */}
        <header className="border-b border-border bg-card p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              <h1 id="editor-title" className="text-xl font-semibold">Document Editor</h1>
              <span className="text-sm text-muted-foreground">
                ({sections.length} sections)
              </span>
            </div>
            <div className="flex items-center gap-2">
              {/* Mode Toggle */}
              <Button
                onClick={toggleEditorMode}
                variant="outline"
                size="sm"
                className="mr-4"
                title={editorMode === 'blocknote' ? 'Switch to Markdown' : 'Switch to Visual Editor'}
              >
                {editorMode === 'blocknote' ? (
                  <>
                    <Code className="h-4 w-4 mr-2" />
                    Markdown
                  </>
                ) : (
                  <>
                    <Edit3 className="h-4 w-4 mr-2" />
                    Visual
                  </>
                )}
              </Button>

              {/* Markdown Formatting Toolbar */}
              {editorMode === 'markdown' && (
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
              )}

              {/* Close button */}
              {onClose && (
                <Button onClick={handleSaveAndClose} size="sm">
                  <Eye className="h-4 w-4 mr-2" />
                  Save & Close
                </Button>
              )}
            </div>
          </div>
        </header>

        {/* Editor + Sidebar */}
        <div className="flex-1 flex overflow-hidden">
          {/* Main Editor Area */}
          <div className="flex-1 p-4 overflow-y-auto">
            {editorMode === 'blocknote' ? (
              <Suspense fallback={<div className="text-muted-foreground p-4">Loading editor...</div>}>
                <BlockNoteWrapper
                  initialBlocks={initialBlocks}
                  onEditorReady={handleEditorReady}
                  readOnly={readOnly}
                  onChange={triggerAutoSave}
                />
              </Suspense>
            ) : (
              <Textarea
                value={markdownContent}
                onChange={(e) => {
                  setMarkdownContent(e.target.value);
                  triggerAutoSave();
                }}
                placeholder={`Start typing or paste your content...

Use markup like:
# Main Topic [tag1, tag2]
Content with **bold**, *italic*, and [links](url).

## Subtopic [tag3, tag4]
- List items
- More content

### Detail [tag5]
More detailed content with \`code\`.`}
                className="h-full min-h-[400px] w-full font-mono text-sm resize-none bg-background border border-border rounded-md p-4 cursor-text focus:ring-2 focus:ring-ring focus:ring-offset-2"
              />
            )}
          </div>

          {/* Markup Guide Sidebar */}
          <div className="w-80 border-l border-border bg-muted/50 p-4 overflow-y-auto">
            <h3 className="font-semibold mb-4">Markup Guide</h3>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Headers & Hierarchy</h4>
                <p className="text-muted-foreground text-xs mb-2">
                  Supports up to 99 levels of depth using # symbols:
                </p>
                <div className="bg-background p-2 rounded border font-mono text-xs">
                  # Level 1 [tags]<br/>
                  ## Level 2 [tags]<br/>
                  ### Level 3 [tags]<br/>
                  #### Level 4 [tags]<br/>
                  ##### Level 5 [tags]<br/>
                  ...<br/>
                  {'#'.repeat(10)} Level 10 [tags]
                </div>
                <p className="text-muted-foreground text-xs mt-2">
                  Visual editor shows levels 4+ as H3, but all levels are preserved.
                </p>
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
                  `inline code`<br/>
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
                  <li>• Save frequently (Ctrl/Cmd+S)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Convert DocumentSection[] to markdown string
 */
function sectionsToMarkdown(sections: DocumentSection[]): string {
  return HierarchyParser.sectionsToMarkup(
    sections.map(s => ({
      title: s.title,
      content: s.content,
      level: s.level,
      tags: s.tags || [],
    }))
  );
}

/**
 * Parse markdown string to DocumentSection[]
 */
function markdownToSections(markdown: string): DocumentSection[] {
  const parsed = HierarchyParser.parseMarkup(markdown);
  return parsed.sections.map(s => ({
    id: s.id,
    title: s.title,
    content: s.content,
    level: s.level,
    tags: s.tags,
  }));
}

/**
 * Convert BlockNote editor blocks back to SimpleBlock[]
 */
function convertEditorBlocksToSimpleBlocks(editorBlocks: any[]): SimpleBlock[] {
  return editorBlocks.map((block: any) => ({
    id: block.id,
    type: block.type,
    props: block.props,
    content: block.content,
    children: block.children ? convertEditorBlocksToSimpleBlocks(block.children) : [],
  }));
}

export default BlockNoteSectionEditor;
