// @ts-nocheck
/* eslint-disable */
/**
 * BlockNote wrapper in JSX to avoid TypeScript type inference issues
 * with BlockNote's deeply nested generic types
 */
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronUp, ChevronDown, Users, User } from "lucide-react";

export function BlockNoteWrapper({
  initialBlocks,
  onEditorReady,
  readOnly = false,
  includeChildren = true,
  onIncludeChildrenChange,
}) {
  const hasInitializedRef = useRef(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const editor = useCreateBlockNote();

  // Pass editor to parent
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Initialize editor content
  useEffect(() => {
    if (hasInitializedRef.current || !editor || !initialBlocks) return;
    
    try {
      if (initialBlocks.length > 0) {
        const blocksForEditor = initialBlocks.map((block) => ({
          id: block.id,
          type: block.type,
          props: {
            textColor: "default",
            backgroundColor: "default",
            textAlignment: "left",
            ...(block.props || {}),
          },
          content: block.content || [],
          children: block.children ? convertChildren(block.children) : [],
        }));
        
        editor.replaceBlocks(editor.document, blocksForEditor);
      }
      hasInitializedRef.current = true;
    } catch (error) {
      console.error("Failed to initialize editor content:", error);
      hasInitializedRef.current = true;
    }
  }, [editor, initialBlocks]);

  // Track selection changes for level adjustment controls
  useEffect(() => {
    if (!editor) return;
    
    const handleSelectionChange = () => {
      try {
        const selection = editor.getSelection();
        if (selection && selection.blocks && selection.blocks.length > 0) {
          setSelectedBlockId(selection.blocks[0].id);
        } else {
          // Try to get cursor block
          const cursorBlock = editor.getTextCursorPosition()?.block;
          setSelectedBlockId(cursorBlock?.id || null);
        }
      } catch (e) {
        setSelectedBlockId(null);
      }
    };

    // Subscribe to editor changes
    const unsubscribe = editor.onSelectionChange(handleSelectionChange);
    return () => unsubscribe?.();
  }, [editor]);

  // Increase level (indent) - moves block deeper in hierarchy
  const handleIncreaseLevel = useCallback(() => {
    if (!editor || !selectedBlockId) return;
    
    try {
      const block = editor.getBlock(selectedBlockId);
      if (!block || block.type !== "heading") return;
      
      const currentLevel = block.props?.level || 1;
      if (currentLevel >= 3) return; // Max heading level is 3
      
      // Get children if includeChildren is true
      const blocksToUpdate = [selectedBlockId];
      
      if (includeChildren && block.children && block.children.length > 0) {
        collectChildIds(block.children, blocksToUpdate);
      }
      
      // Update the heading level
      editor.updateBlock(selectedBlockId, {
        props: { ...block.props, level: currentLevel + 1 },
      });
      
      // If include children, update child heading levels too
      if (includeChildren && block.children) {
        updateChildLevels(editor, block.children, 1);
      }
    } catch (error) {
      console.error("Failed to increase level:", error);
    }
  }, [editor, selectedBlockId, includeChildren]);

  // Decrease level (outdent) - moves block shallower in hierarchy
  const handleDecreaseLevel = useCallback(() => {
    if (!editor || !selectedBlockId) return;
    
    try {
      const block = editor.getBlock(selectedBlockId);
      if (!block || block.type !== "heading") return;
      
      const currentLevel = block.props?.level || 1;
      if (currentLevel <= 1) return; // Min heading level is 1
      
      // Update the heading level
      editor.updateBlock(selectedBlockId, {
        props: { ...block.props, level: currentLevel - 1 },
      });
      
      // If include children, update child heading levels too
      if (includeChildren && block.children) {
        updateChildLevels(editor, block.children, -1);
      }
    } catch (error) {
      console.error("Failed to decrease level:", error);
    }
  }, [editor, selectedBlockId, includeChildren]);

  // Get current block level for display
  const getCurrentBlockLevel = () => {
    if (!editor || !selectedBlockId) return null;
    try {
      const block = editor.getBlock(selectedBlockId);
      if (block?.type === "heading") {
        return block.props?.level || 1;
      }
    } catch (e) {}
    return null;
  };

  const currentLevel = getCurrentBlockLevel();

  return (
    <div className="blocknote-wrapper">
      {/* Level adjustment toolbar - only show when a heading is selected */}
      {currentLevel !== null && !readOnly && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-md border border-border">
          <span className="text-xs text-muted-foreground">Level {currentLevel}</span>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleDecreaseLevel}
              disabled={currentLevel <= 1}
              className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
              title="Decrease level (outdent)"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
            <button
              onClick={handleIncreaseLevel}
              disabled={currentLevel >= 3}
              className="p-1 rounded hover:bg-accent disabled:opacity-30 disabled:cursor-not-allowed"
              title="Increase level (indent)"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>

          <div className="h-4 w-px bg-border mx-1" />

          {/* Include children toggle */}
          <button
            onClick={() => onIncludeChildrenChange?.(!includeChildren)}
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors ${
              includeChildren 
                ? "bg-primary text-primary-foreground" 
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
            title={includeChildren ? "Include children in level changes" : "Only change selected block"}
          >
            {includeChildren ? <Users className="w-3 h-3" /> : <User className="w-3 h-3" />}
            <span>{includeChildren ? "With children" : "Only this"}</span>
          </button>
        </div>
      )}
      
      <BlockNoteView
        editor={editor}
        editable={!readOnly}
        theme="light"
      />
    </div>
  );
}

function convertChildren(children) {
  return children.map((block) => ({
    id: block.id,
    type: block.type,
    props: {
      textColor: "default",
      backgroundColor: "default",
      textAlignment: "left",
      ...(block.props || {}),
    },
    content: block.content || [],
    children: block.children ? convertChildren(block.children) : [],
  }));
}

function collectChildIds(children, ids) {
  for (const child of children) {
    ids.push(child.id);
    if (child.children && child.children.length > 0) {
      collectChildIds(child.children, ids);
    }
  }
}

function updateChildLevels(editor, children, delta) {
  for (const child of children) {
    if (child.type === "heading") {
      const currentLevel = child.props?.level || 1;
      const newLevel = Math.max(1, Math.min(3, currentLevel + delta));
      
      try {
        editor.updateBlock(child.id, {
          props: { ...child.props, level: newLevel },
        });
      } catch (e) {
        console.error("Failed to update child level:", e);
      }
    }
    
    if (child.children && child.children.length > 0) {
      updateChildLevels(editor, child.children, delta);
    }
  }
}

export default BlockNoteWrapper;
