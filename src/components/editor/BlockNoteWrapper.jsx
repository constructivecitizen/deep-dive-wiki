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

// CSS for visual styling to match view mode
const DEEP_LEVEL_STYLES = `
  /* Base heading styles matching view mode */
  .blocknote-wrapper [data-node-type="heading"] .bn-inline-content {
    line-height: 1.625 !important; /* leading-relaxed */
  }
  
  /* Level 1 (H1): text-xl font-semibold - matches depth 0 */
  .blocknote-wrapper [data-node-type="heading"][data-level="1"] .bn-inline-content {
    font-size: 1.25rem !important;
    font-weight: 600 !important;
  }
  
  /* Level 2 (H2): text-lg font-medium - matches depth 1 */
  .blocknote-wrapper [data-node-type="heading"][data-level="2"] .bn-inline-content {
    font-size: 1.125rem !important;
    font-weight: 500 !important;
  }
  
  /* Level 3 (H3): text-base font-medium - matches depth 2 */
  .blocknote-wrapper [data-node-type="heading"][data-level="3"] .bn-inline-content {
    font-size: 1rem !important;
    font-weight: 500 !important;
    line-height: 1.5 !important; /* leading-normal */
  }
  
  /* Level 4+ styling via data-original-level attribute */
  .blocknote-wrapper [data-original-level="4"] .bn-inline-content,
  .blocknote-wrapper [data-original-level="5"] .bn-inline-content,
  .blocknote-wrapper [data-original-level="6"] .bn-inline-content,
  .blocknote-wrapper [data-original-level="7"] .bn-inline-content,
  .blocknote-wrapper [data-original-level="8"] .bn-inline-content,
  .blocknote-wrapper [data-original-level="9"] .bn-inline-content,
  .blocknote-wrapper [data-original-level="10"] .bn-inline-content {
    font-size: 0.875rem !important;
    font-weight: 500 !important;
    line-height: 1.5 !important;
  }
  
  /* Indentation: 25px per level to match view mode */
  .blocknote-wrapper [data-original-level="2"] { margin-left: 25px !important; }
  .blocknote-wrapper [data-original-level="3"] { margin-left: 50px !important; }
  .blocknote-wrapper [data-original-level="4"] { margin-left: 75px !important; }
  .blocknote-wrapper [data-original-level="5"] { margin-left: 100px !important; }
  .blocknote-wrapper [data-original-level="6"] { margin-left: 125px !important; }
  .blocknote-wrapper [data-original-level="7"] { margin-left: 150px !important; }
  .blocknote-wrapper [data-original-level="8"] { margin-left: 175px !important; }
  .blocknote-wrapper [data-original-level="9"] { margin-left: 200px !important; }
  .blocknote-wrapper [data-original-level="10"] { margin-left: 225px !important; }
  
  /* Paragraph blocks following headings - inherit parent indentation */
  .blocknote-wrapper [data-node-type="paragraph"] .bn-inline-content {
    font-size: 0.875rem !important;
    line-height: 1.5 !important;
  }
`;

export function BlockNoteWrapper({
  initialBlocks,
  onEditorReady,
  readOnly = false,
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

  // Apply data attributes to blocks for visual styling to match view mode
  const applyDeepLevelStyles = useCallback(() => {
    if (!editor || !wrapperRef.current) return;
    
    try {
      const blocks = editor.document;
      const applyToBlocks = (blocksArr) => {
        for (const block of blocksArr) {
          if (block.type === 'heading') {
            const originalLevel = block.props?.originalLevel || block.props?.level || 1;
            // Find the DOM element for this block and apply data-original-level for CSS targeting
            const blockEl = wrapperRef.current.querySelector(`[data-block-id="${block.id}"]`);
            if (blockEl) {
              blockEl.setAttribute('data-original-level', originalLevel);
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

  // Apply deep level styles when editor content changes
  useEffect(() => {
    if (!editor) return;
    
    const unsubscribe = editor.onChange(() => {
      // Debounce the style application
      setTimeout(applyDeepLevelStyles, 50);
    });
    
    return () => unsubscribe?.();
  }, [editor, applyDeepLevelStyles]);

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
