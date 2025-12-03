// @ts-nocheck
/* eslint-disable */
/**
 * BlockNote wrapper in JSX to avoid TypeScript type inference issues
 * with BlockNote's deeply nested generic types
 * 
 * Supports N-level depth (up to 99 levels) via originalLevel metadata
 */
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { useEffect, useRef, useState, useCallback } from "react";
import { ChevronUp, ChevronDown, Users, User, AlertTriangle } from "lucide-react";

// Color palette for deep level indicators (cycles through 6 colors)
const LEVEL_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-300',
  'bg-green-100 text-green-700 border-green-300',
  'bg-purple-100 text-purple-700 border-purple-300',
  'bg-orange-100 text-orange-700 border-orange-300',
  'bg-pink-100 text-pink-700 border-pink-300',
  'bg-teal-100 text-teal-700 border-teal-300',
];

export function BlockNoteWrapper({
  initialBlocks,
  onEditorReady,
  readOnly = false,
  includeChildren = true,
  onIncludeChildrenChange,
}) {
  const hasInitializedRef = useRef(false);
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [hasDeepLevels, setHasDeepLevels] = useState(false);
  const editor = useCreateBlockNote();

  // Check for deep levels (4+) in initial blocks
  useEffect(() => {
    if (initialBlocks) {
      const checkDeepLevels = (blocks) => {
        for (const block of blocks) {
          const originalLevel = block.props?.originalLevel;
          if (originalLevel && originalLevel > 3) {
            return true;
          }
          if (block.children && checkDeepLevels(block.children)) {
            return true;
          }
        }
        return false;
      };
      setHasDeepLevels(checkDeepLevels(initialBlocks));
    }
  }, [initialBlocks]);

  // Pass editor to parent
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  // Initialize editor content with originalLevel preserved
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
            // Ensure originalLevel is preserved
            originalLevel: block.props?.originalLevel || block.props?.level || 1,
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

  // Get the actual level (originalLevel) from a block
  const getBlockOriginalLevel = (block) => {
    return block?.props?.originalLevel || block?.props?.level || 1;
  };

  // Increase level (indent) - supports N levels (up to 99)
  const handleIncreaseLevel = useCallback(() => {
    if (!editor || !selectedBlockId) return;
    
    try {
      const block = editor.getBlock(selectedBlockId);
      if (!block || block.type !== "heading") return;
      
      const currentOriginalLevel = getBlockOriginalLevel(block);
      if (currentOriginalLevel >= 99) return; // Max level is 99
      
      const newOriginalLevel = currentOriginalLevel + 1;
      const newVisualLevel = Math.min(newOriginalLevel, 3);
      
      // Update the heading level
      editor.updateBlock(selectedBlockId, {
        props: { 
          ...block.props, 
          level: newVisualLevel,
          originalLevel: newOriginalLevel,
        },
      });
      
      // If include children, update child heading levels too
      if (includeChildren && block.children) {
        updateChildLevels(editor, block.children, 1);
      }
      
      // Update hasDeepLevels flag
      if (newOriginalLevel > 3) {
        setHasDeepLevels(true);
      }
    } catch (error) {
      console.error("Failed to increase level:", error);
    }
  }, [editor, selectedBlockId, includeChildren]);

  // Decrease level (outdent) - supports N levels
  const handleDecreaseLevel = useCallback(() => {
    if (!editor || !selectedBlockId) return;
    
    try {
      const block = editor.getBlock(selectedBlockId);
      if (!block || block.type !== "heading") return;
      
      const currentOriginalLevel = getBlockOriginalLevel(block);
      if (currentOriginalLevel <= 1) return; // Min level is 1
      
      const newOriginalLevel = currentOriginalLevel - 1;
      const newVisualLevel = Math.min(newOriginalLevel, 3);
      
      // Update the heading level
      editor.updateBlock(selectedBlockId, {
        props: { 
          ...block.props, 
          level: newVisualLevel,
          originalLevel: newOriginalLevel,
        },
      });
      
      // If include children, update child heading levels too
      if (includeChildren && block.children) {
        updateChildLevels(editor, block.children, -1);
      }
    } catch (error) {
      console.error("Failed to decrease level:", error);
    }
  }, [editor, selectedBlockId, includeChildren]);

  // Get current block level for display (uses originalLevel)
  const getCurrentBlockLevel = () => {
    if (!editor || !selectedBlockId) return null;
    try {
      const block = editor.getBlock(selectedBlockId);
      if (block?.type === "heading") {
        return getBlockOriginalLevel(block);
      }
    } catch (e) {}
    return null;
  };

  const currentLevel = getCurrentBlockLevel();
  
  // Get color class for level indicator badge
  const getLevelColorClass = (level) => {
    if (level <= 3) return 'bg-muted text-muted-foreground';
    const colorIndex = (level - 4) % LEVEL_COLORS.length;
    return LEVEL_COLORS[colorIndex];
  };

  return (
    <div className="blocknote-wrapper">
      {/* Deep level warning banner */}
      {hasDeepLevels && !readOnly && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-amber-50 border border-amber-200 rounded-md text-amber-800 text-xs">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>
            This document has deep hierarchy (level 4+). Visual display is limited to H1-H3, but all levels are preserved.
            Use <strong>Markdown mode</strong> for precise level control with <code>####</code> syntax.
          </span>
        </div>
      )}
      
      {/* Level adjustment toolbar - only show when a heading is selected */}
      {currentLevel !== null && !readOnly && (
        <div className="flex items-center gap-2 mb-2 p-2 bg-muted/50 rounded-md border border-border">
          {/* Level indicator with color coding for deep levels */}
          <span className={`text-xs px-2 py-0.5 rounded border ${getLevelColorClass(currentLevel)}`}>
            Level {currentLevel}
          </span>
          
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
              disabled={currentLevel >= 99}
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
      // Ensure originalLevel is preserved in children
      originalLevel: block.props?.originalLevel || block.props?.level || 1,
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

// Update child levels with N-level support
function updateChildLevels(editor, children, delta) {
  for (const child of children) {
    if (child.type === "heading") {
      const currentOriginalLevel = child.props?.originalLevel || child.props?.level || 1;
      const newOriginalLevel = Math.max(1, Math.min(99, currentOriginalLevel + delta));
      const newVisualLevel = Math.min(newOriginalLevel, 3);
      
      try {
        editor.updateBlock(child.id, {
          props: { 
            ...child.props, 
            level: newVisualLevel,
            originalLevel: newOriginalLevel,
          },
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