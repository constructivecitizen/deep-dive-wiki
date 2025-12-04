// @ts-nocheck
/* eslint-disable */
/**
 * BlockNote wrapper in JSX to avoid TypeScript type inference issues
 * with BlockNote's deeply nested generic types
 * 
 * Supports N-level depth (up to 99 levels) via originalLevel metadata
 * Use Tab/Shift+Tab to indent/outdent selected blocks
 */
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { useEffect, useRef, useState, useCallback } from "react";

// Color palette for deep level indicators (cycles through 6 colors)
const LEVEL_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-300',
  'bg-green-100 text-green-700 border-green-300',
  'bg-purple-100 text-purple-700 border-purple-300',
  'bg-orange-100 text-orange-700 border-orange-300',
  'bg-pink-100 text-pink-700 border-pink-300',
  'bg-teal-100 text-teal-700 border-teal-300',
];

// CSS for visual indentation of deep levels and typography overrides
const DEEP_LEVEL_STYLES = `
  .blocknote-wrapper [data-level="4"] { margin-left: 24px !important; }
  .blocknote-wrapper [data-level="5"] { margin-left: 48px !important; }
  .blocknote-wrapper [data-level="6"] { margin-left: 72px !important; }
  .blocknote-wrapper [data-level="7"] { margin-left: 96px !important; }
  .blocknote-wrapper [data-level="8"] { margin-left: 120px !important; }
  .blocknote-wrapper [data-level="9"] { margin-left: 144px !important; }
  .blocknote-wrapper [data-level="10"] { margin-left: 168px !important; }
  .blocknote-wrapper [data-level-deep] { margin-left: calc(168px + (var(--extra-levels) * 24px)) !important; }
  
  /* Visual indicators for deep levels */
  .blocknote-wrapper [data-level]::before {
    content: attr(data-level-badge);
    display: inline-block;
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 3px;
    margin-right: 6px;
    font-weight: 500;
    vertical-align: middle;
  }
  .blocknote-wrapper [data-level="4"]::before { background: #dbeafe; color: #1d4ed8; }
  .blocknote-wrapper [data-level="5"]::before { background: #dcfce7; color: #15803d; }
  .blocknote-wrapper [data-level="6"]::before { background: #f3e8ff; color: #7c3aed; }
  .blocknote-wrapper [data-level="7"]::before { background: #ffedd5; color: #c2410c; }
  .blocknote-wrapper [data-level="8"]::before { background: #fce7f3; color: #be185d; }
  .blocknote-wrapper [data-level="9"]::before { background: #ccfbf1; color: #0f766e; }
  .blocknote-wrapper [data-level-deep]::before { background: #e5e7eb; color: #374151; }
  
  /* Typography overrides to match main content view */
  .blocknote-wrapper .ProseMirror {
    font-family: ui-sans-serif, system-ui, sans-serif !important;
    background-color: transparent !important;
  }
  
  /* Align h2+ headings with paragraph text above them */
  .blocknote-wrapper [data-content-type="heading"] {
    margin-left: 0 !important;
    padding-left: 0 !important;
  }
  
  .blocknote-wrapper .bn-block-outer {
    margin-left: 0 !important;
  }
  
  .blocknote-wrapper .bn-block-content {
    padding-left: 0 !important;
  }
  
  .blocknote-wrapper .bn-block-content::before {
    padding-inline-start: 0 !important;
  }
  
  .blocknote-wrapper h1,
  .blocknote-wrapper h2,
  .blocknote-wrapper h3,
  .blocknote-wrapper h4,
  .blocknote-wrapper h5,
  .blocknote-wrapper h6 {
    margin-left: -0.5em !important;
  }
  
  .blocknote-wrapper .ProseMirror h1,
  .blocknote-wrapper [data-content-type="heading"][data-level="1"] .bn-inline-content {
    font-size: 1.25rem !important;
    font-weight: 600 !important;
    margin-bottom: 0.5rem !important;
    line-height: 1.625 !important;
  }
  
  .blocknote-wrapper .ProseMirror h2,
  .blocknote-wrapper [data-content-type="heading"][data-level="2"] .bn-inline-content {
    font-size: 1.125rem !important;
    font-weight: 500 !important;
    margin-bottom: 0.5rem !important;
    line-height: 1.625 !important;
  }
  
  .blocknote-wrapper .ProseMirror h3,
  .blocknote-wrapper [data-content-type="heading"][data-level="3"] .bn-inline-content {
    font-size: 1rem !important;
    font-weight: 500 !important;
    margin-bottom: 0.5rem !important;
    line-height: 1.5 !important;
  }
  
  .blocknote-wrapper .ProseMirror p,
  .blocknote-wrapper [data-content-type="paragraph"] .bn-inline-content {
    font-size: 0.875rem !important;
    margin-bottom: 0.5rem !important;
    line-height: 1.625 !important;
  }
  
  /* Target BlockNote's internal text elements */
  .blocknote-wrapper .bn-inline-content {
    font-size: inherit !important;
  }
`;

export function BlockNoteWrapper({
  initialBlocks,
  onEditorReady,
  readOnly = false,
  onChange,
}) {
  const hasInitializedRef = useRef(false);
  const wrapperRef = useRef(null);
  const [hasDeepLevels, setHasDeepLevels] = useState(false);
  const editor = useCreateBlockNote();

  // Inject deep level styles once
  useEffect(() => {
    const styleId = 'blocknote-deep-level-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = DEEP_LEVEL_STYLES;
      document.head.appendChild(styleEl);
    }
  }, []);

  // Apply data attributes to blocks for visual indentation
  const applyDeepLevelStyles = useCallback(() => {
    if (!editor || !wrapperRef.current) return;
    
    try {
      const blocks = editor.document;
      const applyToBlocks = (blocksArr) => {
        for (const block of blocksArr) {
          if (block.type === 'heading') {
            const originalLevel = block.props?.originalLevel || block.props?.level || 1;
            if (originalLevel > 3) {
              // Find the DOM element for this block
              const blockEl = wrapperRef.current.querySelector(`[data-block-id="${block.id}"]`);
              if (blockEl) {
                if (originalLevel <= 10) {
                  blockEl.setAttribute('data-level', originalLevel);
                  blockEl.setAttribute('data-level-badge', `L${originalLevel}`);
                } else {
                  blockEl.setAttribute('data-level-deep', 'true');
                  blockEl.setAttribute('data-level-badge', `L${originalLevel}`);
                  blockEl.style.setProperty('--extra-levels', originalLevel - 10);
                }
              }
            }
          }
          if (block.children && block.children.length > 0) {
            applyToBlocks(block.children);
          }
        }
      };
      applyToBlocks(blocks);
    } catch (e) {
      console.error('Failed to apply deep level styles:', e);
    }
  }, [editor]);

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
      // Apply deep level styles after initialization
      setTimeout(applyDeepLevelStyles, 100);
    } catch (error) {
      console.error("Failed to initialize editor content:", error);
      hasInitializedRef.current = true;
    }
  }, [editor, initialBlocks, applyDeepLevelStyles]);

  // Apply deep level styles when editor content changes and notify parent
  useEffect(() => {
    if (!editor) return;
    
    const unsubscribe = editor.onChange(() => {
      // Debounce the style application
      setTimeout(applyDeepLevelStyles, 50);
      // Notify parent of changes for auto-save
      onChange?.();
    });
    
    return () => unsubscribe?.();
  }, [editor, applyDeepLevelStyles, onChange]);

  // Get the actual level (originalLevel) from a block
  const getBlockOriginalLevel = (block) => {
    return block?.props?.originalLevel || block?.props?.level || 1;
  };

  // Handle indent/outdent for selected blocks
  const handleLevelChange = useCallback((delta) => {
    if (!editor) return;
    
    try {
      // Get selected blocks or fall back to cursor block
      let blocksToUpdate = [];
      
      const selection = editor.getSelection();
      if (selection && selection.blocks && selection.blocks.length > 0) {
        blocksToUpdate = selection.blocks;
      } else {
        // Fall back to cursor block
        const cursorBlock = editor.getTextCursorPosition()?.block;
        if (cursorBlock) {
          blocksToUpdate = [cursorBlock];
        }
      }
      
      if (blocksToUpdate.length === 0) return;
      
      let hasUpdates = false;
      
      for (const block of blocksToUpdate) {
        // Only update heading blocks
        if (block.type !== "heading") continue;
        
        const currentOriginalLevel = getBlockOriginalLevel(block);
        const newOriginalLevel = currentOriginalLevel + delta;
        
        // Check bounds
        if (newOriginalLevel < 1 || newOriginalLevel > 99) continue;
        
        const newVisualLevel = Math.min(newOriginalLevel, 3);
        
        editor.updateBlock(block.id, {
          props: { 
            ...block.props, 
            level: newVisualLevel,
            originalLevel: newOriginalLevel,
          },
        });
        
        hasUpdates = true;
        
        // Update hasDeepLevels flag if we go above level 3
        if (newOriginalLevel > 3) {
          setHasDeepLevels(true);
        }
      }
      
      if (hasUpdates) {
        setTimeout(applyDeepLevelStyles, 50);
      }
    } catch (error) {
      console.error("Failed to change level:", error);
    }
  }, [editor, applyDeepLevelStyles]);

  // Tab/Shift+Tab keyboard handler for indent/outdent
  useEffect(() => {
    if (!editor || readOnly) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.shiftKey) {
          // Shift+Tab = outdent (decrease level)
          handleLevelChange(-1);
        } else {
          // Tab = indent (increase level)
          handleLevelChange(1);
        }
      }
    };
    
    const wrapper = wrapperRef.current;
    if (wrapper) {
      wrapper.addEventListener('keydown', handleKeyDown, true);
      return () => wrapper.removeEventListener('keydown', handleKeyDown, true);
    }
  }, [editor, readOnly, handleLevelChange]);

  return (
    <div className="blocknote-wrapper" ref={wrapperRef}>
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

export default BlockNoteWrapper;
