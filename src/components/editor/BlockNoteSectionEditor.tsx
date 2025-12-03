import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { 
  flatSectionsToBlocks, 
  blocksToFlatSections,
  SimpleBlock 
} from "@/lib/blockNoteConversions";
import { DocumentSection } from "@/services/contentService";
import { useEffect, useCallback, useRef } from "react";

interface BlockNoteSectionEditorProps {
  sections: DocumentSection[];
  onSave: (sections: DocumentSection[]) => void;
  onClose?: () => void;
  readOnly?: boolean;
}

/**
 * BlockNote-based editor for hierarchical document sections
 * Uses standard BlockNote blocks (headings, paragraphs, lists)
 * Converts between flat DocumentSection[] and BlockNote's nested block structure
 */
export function BlockNoteSectionEditor({
  sections,
  onSave,
  onClose,
  readOnly = false,
}: BlockNoteSectionEditorProps) {
  const hasInitializedRef = useRef(false);
  
  // Convert flat sections to BlockNote blocks for initial content
  const initialBlocks = flatSectionsToBlocks(sections);

  // Create the BlockNote editor
  const editor = useCreateBlockNote();

  // Initialize editor content from sections
  useEffect(() => {
    if (hasInitializedRef.current || !editor) return;
    
    try {
      const blocksForEditor = convertSimpleBlocksToEditorBlocks(initialBlocks);
      
      if (blocksForEditor.length > 0) {
        editor.replaceBlocks(editor.document, blocksForEditor);
      }
      
      hasInitializedRef.current = true;
    } catch (error) {
      console.error("Failed to initialize editor content:", error);
      hasInitializedRef.current = true;
    }
  }, [editor, initialBlocks]);

  // Handle save - convert BlockNote blocks back to flat sections
  const handleSave = useCallback(() => {
    if (!editor) return;
    
    try {
      const currentBlocks = editor.document;
      const simpleBlocks = convertEditorBlocksToSimpleBlocks(currentBlocks);
      const flatSections = blocksToFlatSections(simpleBlocks);
      onSave(flatSections);
    } catch (error) {
      console.error("Failed to save editor content:", error);
    }
  }, [editor, onSave]);

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
        <BlockNoteView
          editor={editor}
          editable={!readOnly}
          theme="light"
        />
      </div>
    </div>
  );
}

/**
 * Convert SimpleBlock[] to BlockNote editor blocks
 */
function convertSimpleBlocksToEditorBlocks(simpleBlocks: SimpleBlock[]): any[] {
  return simpleBlocks.map((block) => ({
    id: block.id,
    type: block.type,
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
      ...(block.props || {}),
    },
    content: block.content || [],
    children: convertSimpleBlocksToEditorBlocks(block.children),
  }));
}

/**
 * Convert BlockNote editor blocks back to SimpleBlock[]
 */
function convertEditorBlocksToSimpleBlocks(editorBlocks: any[]): SimpleBlock[] {
  return editorBlocks.map((block) => ({
    id: block.id,
    type: block.type,
    props: block.props,
    content: block.content,
    children: block.children ? convertEditorBlocksToSimpleBlocks(block.children) : [],
  }));
}

export default BlockNoteSectionEditor;
