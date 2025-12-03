import { 
  flatSectionsToBlocks, 
  blocksToFlatSections,
  SimpleBlock 
} from "@/lib/blockNoteConversions";
import { DocumentSection } from "@/services/contentService";
import { useEffect, useCallback, useRef, useState, lazy, Suspense } from "react";

// Lazy load the JSX wrapper to isolate BlockNote types
const BlockNoteWrapper = lazy(() => import("./BlockNoteWrapper"));

interface BlockNoteSectionEditorProps {
  sections: DocumentSection[];
  onSave: (sections: DocumentSection[]) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

/**
 * BlockNote-based editor for hierarchical document sections
 * Uses a JSX wrapper to avoid TypeScript type inference issues
 */
export function BlockNoteSectionEditor({
  sections,
  onSave,
  onClose,
  readOnly = false,
}: BlockNoteSectionEditorProps) {
  const editorRef = useRef<any>(null);
  
  // Convert flat sections to BlockNote blocks for initial content
  const initialBlocks = flatSectionsToBlocks(sections);

  // Handle editor ready callback
  const handleEditorReady = useCallback((editor: any) => {
    editorRef.current = editor;
  }, []);

  // Handle save - convert BlockNote blocks back to flat sections
  const handleSave = useCallback(() => {
    if (!editorRef.current) return;
    
    try {
      const currentBlocks = editorRef.current.document;
      const simpleBlocks = convertEditorBlocksToSimpleBlocks(currentBlocks);
      const flatSections = blocksToFlatSections(simpleBlocks);
      onSave(flatSections);
    } catch (error) {
      console.error("Failed to save editor content:", error);
    }
  }, [onSave]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (e.key === "Escape" && onClose) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleSave, onClose]);

  return (
    <div className="flex flex-col h-full bg-background">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">
            Section Editor
          </span>
          <span className="text-xs text-muted-foreground">
            ({sections.length} sections)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Save
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-sm font-medium bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-auto p-4">
        <Suspense fallback={<div className="text-muted-foreground">Loading editor...</div>}>
          <BlockNoteWrapper
            initialBlocks={initialBlocks}
            onEditorReady={handleEditorReady}
            readOnly={readOnly}
          />
        </Suspense>
      </div>
    </div>
  );
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
