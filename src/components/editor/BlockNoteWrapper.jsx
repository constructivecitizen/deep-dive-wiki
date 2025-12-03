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
import { useEffect, useRef, useCallback } from "react";

// CSS for visual styling to match view mode
const EDITOR_STYLES = `
  /* Base indentation: 25px per level starting at level 2 */
  .blocknote-wrapper [data-level="1"] { margin-left: 0 !important; }
  .blocknote-wrapper [data-level="2"] { margin-left: 25px !important; }
  .blocknote-wrapper [data-level="3"] { margin-left: 50px !important; }
  .blocknote-wrapper [data-level="4"] { margin-left: 75px !important; }
  .blocknote-wrapper [data-level="5"] { margin-left: 100px !important; }
  .blocknote-wrapper [data-level="6"] { margin-left: 125px !important; }
  .blocknote-wrapper [data-level="7"] { margin-left: 150px !important; }
  .blocknote-wrapper [data-level="8"] { margin-left: 175px !important; }
  .blocknote-wrapper [data-level="9"] { margin-left: 200px !important; }
  .blocknote-wrapper [data-level="10"] { margin-left: 225px !important; }
  .blocknote-wrapper [data-level-deep] { margin-left: calc(225px + (var(--extra-levels) * 25px)) !important; }
  
  /* Font sizing based on level */
  .blocknote-wrapper [data-level="1"] h1,
  .blocknote-wrapper [data-level="1"] h2,
  .blocknote-wrapper [data-level="1"] h3 {
    font-size: 1.25rem !important;
    font-weight: 600 !important;
    color: hsl(var(--foreground)) !important;
  }
  .blocknote-wrapper [data-level="2"] h1,
  .blocknote-wrapper [data-level="2"] h2,
  .blocknote-wrapper [data-level="2"] h3 {
    font-size: 1.125rem !important;
    font-weight: 500 !important;
    color: hsl(var(--foreground)) !important;
  }
  .blocknote-wrapper [data-level="3"] h1,
  .blocknote-wrapper [data-level="3"] h2,
  .blocknote-wrapper [data-level="3"] h3,
  .blocknote-wrapper [data-level="4"] h1,
  .blocknote-wrapper [data-level="4"] h2,
  .blocknote-wrapper [data-level="4"] h3 {
    font-size: 1rem !important;
    font-weight: 500 !important;
    color: hsl(var(--foreground)) !important;
  }
  .blocknote-wrapper [data-level="5"] h1,
  .blocknote-wrapper [data-level="5"] h2,
  .blocknote-wrapper [data-level="5"] h3,
  .blocknote-wrapper [data-level="6"] h1,
  .blocknote-wrapper [data-level="6"] h2,
  .blocknote-wrapper [data-level="6"] h3,
  .blocknote-wrapper [data-level-deep] h1,
  .blocknote-wrapper [data-level-deep] h2,
  .blocknote-wrapper [data-level-deep] h3 {
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    color: hsl(var(--muted-foreground)) !important;
  }

  /* Colored paragraph blocks - matching content-level colors from index.css */
  .blocknote-wrapper [data-content-level] {
    border-radius: 0.375rem !important;
    padding: 7px 9px !important;
    margin: 4px 0 !important;
  }
  .blocknote-wrapper [data-content-level]::before {
    content: '' !important;
    position: absolute !important;
    left: 0 !important;
    top: 0 !important;
    bottom: 0 !important;
    width: 3px !important;
    border-radius: 3px 0 0 3px !important;
  }
  .blocknote-wrapper [data-content-level] {
    position: relative !important;
    padding-left: 12px !important;
  }
  
  /* Level 1 - Warm green/teal */
  .blocknote-wrapper [data-content-level="1"] {
    background: hsl(155 40% 96%) !important;
  }
  .blocknote-wrapper [data-content-level="1"]::before {
    background: hsl(155 40% 75%) !important;
  }
  
  /* Level 2 - Soft blue */
  .blocknote-wrapper [data-content-level="2"] {
    background: hsl(200 50% 96%) !important;
  }
  .blocknote-wrapper [data-content-level="2"]::before {
    background: hsl(200 50% 75%) !important;
  }
  
  /* Level 3 - Light purple */
  .blocknote-wrapper [data-content-level="3"] {
    background: hsl(270 40% 96%) !important;
  }
  .blocknote-wrapper [data-content-level="3"]::before {
    background: hsl(270 40% 75%) !important;
  }
  
  /* Level 4 - Warm amber */
  .blocknote-wrapper [data-content-level="4"] {
    background: hsl(35 50% 96%) !important;
  }
  .blocknote-wrapper [data-content-level="4"]::before {
    background: hsl(35 50% 75%) !important;
  }
  
  /* Level 5 - Soft pink */
  .blocknote-wrapper [data-content-level="5"] {
    background: hsl(330 40% 96%) !important;
  }
  .blocknote-wrapper [data-content-level="5"]::before {
    background: hsl(330 40% 75%) !important;
  }
  
  /* Level 6 - Cool cyan */
  .blocknote-wrapper [data-content-level="6"] {
    background: hsl(180 40% 96%) !important;
  }
  .blocknote-wrapper [data-content-level="6"]::before {
    background: hsl(180 40% 75%) !important;
  }

  /* Paragraph indentation to match parent heading */
  .blocknote-wrapper [data-content-level][data-indent="1"] { margin-left: 0 !important; }
  .blocknote-wrapper [data-content-level][data-indent="2"] { margin-left: 25px !important; }
  .blocknote-wrapper [data-content-level][data-indent="3"] { margin-left: 50px !important; }
  .blocknote-wrapper [data-content-level][data-indent="4"] { margin-left: 75px !important; }
  .blocknote-wrapper [data-content-level][data-indent="5"] { margin-left: 100px !important; }
  .blocknote-wrapper [data-content-level][data-indent="6"] { margin-left: 125px !important; }
  .blocknote-wrapper [data-content-level][data-indent="7"] { margin-left: 150px !important; }
  .blocknote-wrapper [data-content-level][data-indent="8"] { margin-left: 175px !important; }
  .blocknote-wrapper [data-content-level][data-indent="9"] { margin-left: 200px !important; }
  .blocknote-wrapper [data-content-level][data-indent="10"] { margin-left: 225px !important; }
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

  // Apply data attributes to blocks for visual styling
  const applyBlockStyles = useCallback(() => {
    if (!editor || !wrapperRef.current) return;
    
    try {
      const blocks = editor.document;
      let currentHeadingLevel = 1;
      
      const applyToBlocks = (blocksArr) => {
        for (let i = 0; i < blocksArr.length; i++) {
          const block = blocksArr[i];
          const blockEl = wrapperRef.current.querySelector(`[data-block-id="${block.id}"]`);
          
          if (block.type === 'heading') {
            const originalLevel = block.props?.originalLevel || block.props?.level || 1;
            currentHeadingLevel = originalLevel;
            
            if (blockEl) {
              if (originalLevel <= 10) {
                blockEl.setAttribute('data-level', originalLevel);
              } else {
                blockEl.setAttribute('data-level-deep', 'true');
                blockEl.style.setProperty('--extra-levels', originalLevel - 10);
              }
            }
          } else if (block.type === 'paragraph') {
            // Apply colored background to paragraphs based on preceding heading level
            if (blockEl) {
              const colorLevel = ((currentHeadingLevel - 1) % 6) + 1;
              blockEl.setAttribute('data-content-level', colorLevel);
              blockEl.setAttribute('data-indent', Math.min(currentHeadingLevel, 10));
            }
          }
          
          if (block.children && block.children.length > 0) {
            applyToBlocks(block.children);
          }
        }
      };
      applyToBlocks(blocks);
    } catch (e) {
      console.error('Failed to apply block styles:', e);
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
            // Ensure originalLevel is preserved
            originalLevel: block.props?.originalLevel || block.props?.level || 1,
          },
          content: block.content || [],
          children: block.children ? convertChildren(block.children) : [],
        }));
        
        editor.replaceBlocks(editor.document, blocksForEditor);
      }
      hasInitializedRef.current = true;
      // Apply styles after initialization
      setTimeout(applyBlockStyles, 100);
    } catch (error) {
      console.error("Failed to initialize editor content:", error);
      hasInitializedRef.current = true;
    }
  }, [editor, initialBlocks, applyBlockStyles]);

  // Apply styles when editor content changes
  useEffect(() => {
    if (!editor) return;
    
    const unsubscribe = editor.onChange(() => {
      // Debounce the style application
      setTimeout(applyBlockStyles, 50);
    });
    
    return () => unsubscribe?.();
  }, [editor, applyBlockStyles]);

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
      }
      
      if (hasUpdates) {
        setTimeout(applyBlockStyles, 50);
      }
    } catch (error) {
      console.error("Failed to change level:", error);
    }
  }, [editor, applyBlockStyles]);

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
