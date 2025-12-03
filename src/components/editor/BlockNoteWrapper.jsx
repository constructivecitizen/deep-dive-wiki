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

// CSS to match the user-facing content display
// Font sizes match HierarchicalContentDisplay: xl -> lg -> base -> sm
// Indentation: 25px per level (matching chevron + gap width)
const EDITOR_STYLES = `
  /* Hide BlockNote's default side menu (drag handle) */
  .blocknote-wrapper .bn-side-menu {
    display: none !important;
  }

  /* Remove BlockNote's default vertical lines and nesting indicators */
  .blocknote-wrapper .bn-block-group {
    border-left: none !important;
    padding-left: 0 !important;
    margin-left: 0 !important;
  }
  
  .blocknote-wrapper .bn-block-outer {
    margin-left: 0 !important;
  }

  /* Base heading styles - remove default margins, match user-facing typography */
  .blocknote-wrapper [data-content-type="heading"] {
    margin-top: 0.5rem !important;
    margin-bottom: 0.25rem !important;
  }
  
  .blocknote-wrapper [data-content-type="heading"] [data-text-content] {
    font-weight: 500 !important;
    color: hsl(215 25% 15%) !important;
    line-height: 1.5 !important;
  }

  /* Level-based font sizes matching HierarchicalContentDisplay */
  .blocknote-wrapper [data-editor-level="1"] [data-text-content] {
    font-size: 1.25rem !important;  /* text-xl */
    font-weight: 600 !important;
  }
  .blocknote-wrapper [data-editor-level="2"] [data-text-content] {
    font-size: 1.125rem !important; /* text-lg */
    font-weight: 500 !important;
  }
  .blocknote-wrapper [data-editor-level="3"] [data-text-content] {
    font-size: 1rem !important;     /* text-base */
    font-weight: 500 !important;
  }
  .blocknote-wrapper [data-editor-level="4"] [data-text-content],
  .blocknote-wrapper [data-editor-level-deep] [data-text-content] {
    font-size: 0.875rem !important; /* text-sm */
    font-weight: 500 !important;
  }

  /* Level-based indentation (25px per level, starting from level 2) */
  .blocknote-wrapper [data-editor-level="1"] { margin-left: 0 !important; }
  .blocknote-wrapper [data-editor-level="2"] { margin-left: 25px !important; }
  .blocknote-wrapper [data-editor-level="3"] { margin-left: 50px !important; }
  .blocknote-wrapper [data-editor-level="4"] { margin-left: 75px !important; }
  .blocknote-wrapper [data-editor-level="5"] { margin-left: 100px !important; }
  .blocknote-wrapper [data-editor-level="6"] { margin-left: 125px !important; }
  .blocknote-wrapper [data-editor-level="7"] { margin-left: 150px !important; }
  .blocknote-wrapper [data-editor-level="8"] { margin-left: 175px !important; }
  .blocknote-wrapper [data-editor-level="9"] { margin-left: 200px !important; }
  .blocknote-wrapper [data-editor-level="10"] { margin-left: 225px !important; }
  .blocknote-wrapper [data-editor-level-deep] { 
    margin-left: calc(225px + (var(--extra-levels) * 25px)) !important; 
  }

  /* Paragraph content styling - subtle background like user-facing display */
  .blocknote-wrapper [data-content-type="paragraph"] {
    font-size: 0.875rem !important;
    line-height: 1.6 !important;
    color: hsl(215 25% 15%) !important;
  }

  /* Clean up block spacing */
  .blocknote-wrapper .bn-editor {
    padding: 0 !important;
  }
  
  .blocknote-wrapper .bn-block-content {
    padding: 2px 0 !important;
  }
`;

export function BlockNoteWrapper({
  initialBlocks,
  onEditorReady,
  readOnly = false,
}) {
  const hasInitializedRef = useRef(false);
  const wrapperRef = useRef(null);
  const editor = useCreateBlockNote();

  // Inject editor styles once
  useEffect(() => {
    const styleId = 'blocknote-editor-styles';
    if (!document.getElementById(styleId)) {
      const styleEl = document.createElement('style');
      styleEl.id = styleId;
      styleEl.textContent = EDITOR_STYLES;
      document.head.appendChild(styleEl);
    }
  }, []);

  // Apply data attributes to ALL heading blocks for visual styling
  const applyLevelStyles = useCallback(() => {
    if (!editor || !wrapperRef.current) return;
    
    try {
      const blocks = editor.document;
      const applyToBlocks = (blocksArr) => {
        for (const block of blocksArr) {
          if (block.type === 'heading') {
            const originalLevel = block.props?.originalLevel || block.props?.level || 1;
            const blockEl = wrapperRef.current.querySelector(`[data-block-id="${block.id}"]`);
            if (blockEl) {
              // Remove any previous level attributes
              blockEl.removeAttribute('data-editor-level');
              blockEl.removeAttribute('data-editor-level-deep');
              
              if (originalLevel <= 10) {
                blockEl.setAttribute('data-editor-level', originalLevel);
              } else {
                blockEl.setAttribute('data-editor-level-deep', 'true');
                blockEl.style.setProperty('--extra-levels', originalLevel - 10);
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
      console.error('Failed to apply level styles:', e);
    }
  }, [editor]);

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
            originalLevel: block.props?.originalLevel || block.props?.level || 1,
          },
          content: block.content || [],
          children: block.children ? convertChildren(block.children) : [],
        }));
        
        editor.replaceBlocks(editor.document, blocksForEditor);
      }
      hasInitializedRef.current = true;
      setTimeout(applyLevelStyles, 100);
    } catch (error) {
      console.error("Failed to initialize editor content:", error);
      hasInitializedRef.current = true;
    }
  }, [editor, initialBlocks, applyLevelStyles]);

  // Apply level styles when editor content changes
  useEffect(() => {
    if (!editor) return;
    
    const unsubscribe = editor.onChange(() => {
      setTimeout(applyLevelStyles, 50);
    });
    
    return () => unsubscribe?.();
  }, [editor, applyLevelStyles]);

  // Get the actual level (originalLevel) from a block
  const getBlockOriginalLevel = (block) => {
    return block?.props?.originalLevel || block?.props?.level || 1;
  };

  // Handle indent/outdent for selected blocks
  const handleLevelChange = useCallback((delta) => {
    if (!editor) return;
    
    try {
      let blocksToUpdate = [];
      
      const selection = editor.getSelection();
      if (selection && selection.blocks && selection.blocks.length > 0) {
        blocksToUpdate = selection.blocks;
      } else {
        const cursorBlock = editor.getTextCursorPosition()?.block;
        if (cursorBlock) {
          blocksToUpdate = [cursorBlock];
        }
      }
      
      if (blocksToUpdate.length === 0) return;
      
      let hasUpdates = false;
      
      for (const block of blocksToUpdate) {
        if (block.type !== "heading") continue;
        
        const currentOriginalLevel = getBlockOriginalLevel(block);
        const newOriginalLevel = currentOriginalLevel + delta;
        
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
      }
      
      if (hasUpdates) {
        setTimeout(applyLevelStyles, 50);
      }
    } catch (error) {
      console.error("Failed to change level:", error);
    }
  }, [editor, applyLevelStyles]);

  // Tab/Shift+Tab keyboard handler for indent/outdent
  useEffect(() => {
    if (!editor || readOnly) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        e.stopPropagation();
        
        if (e.shiftKey) {
          handleLevelChange(-1);
        } else {
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
      originalLevel: block.props?.originalLevel || block.props?.level || 1,
    },
    content: block.content || [],
    children: block.children ? convertChildren(block.children) : [],
  }));
}

export default BlockNoteWrapper;
