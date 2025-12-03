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

// CSS styles injected into the editor for styling based on data attributes
const EDITOR_STYLES = `
  /* Heading styles based on data-original-level */
  .blocknote-wrapper [data-content-type="heading"][data-original-level] .bn-inline-content {
    color: hsl(var(--foreground, 222.2 84% 4.9%));
  }
  
  /* Level 1 headings */
  .blocknote-wrapper [data-content-type="heading"][data-original-level="1"] .bn-inline-content {
    font-size: 1.25rem;
    font-weight: 600;
    line-height: 1.625;
  }
  
  /* Level 2 headings */
  .blocknote-wrapper [data-content-type="heading"][data-original-level="2"] .bn-inline-content {
    font-size: 1.125rem;
    font-weight: 500;
    line-height: 1.625;
  }
  
  /* Level 3 headings */
  .blocknote-wrapper [data-content-type="heading"][data-original-level="3"] .bn-inline-content {
    font-size: 1rem;
    font-weight: 500;
    line-height: 1.5;
  }
  
  /* Level 4+ headings (default for any level >= 4) */
  .blocknote-wrapper [data-content-type="heading"][data-original-level] .bn-inline-content {
    font-size: 0.875rem;
    font-weight: 500;
    line-height: 1.5;
  }
  
  /* Re-apply specific levels with higher specificity */
  .blocknote-wrapper [data-content-type="heading"][data-original-level="1"] .bn-inline-content {
    font-size: 1.25rem !important;
    font-weight: 600 !important;
  }
  .blocknote-wrapper [data-content-type="heading"][data-original-level="2"] .bn-inline-content {
    font-size: 1.125rem !important;
    font-weight: 500 !important;
  }
  .blocknote-wrapper [data-content-type="heading"][data-original-level="3"] .bn-inline-content {
    font-size: 1rem !important;
    font-weight: 500 !important;
  }
  
  /* Paragraph styles based on data-color-level (cycles 1-6) */
  .blocknote-wrapper [data-content-type="paragraph"][data-color-level] {
    border-radius: 0.375rem;
    padding: 7px 9px;
    margin: 4px 0;
  }
  
  .blocknote-wrapper [data-content-type="paragraph"][data-color-level="1"] {
    background: hsl(var(--content-level-1, 160 40% 95%));
    border-left: 2px solid hsl(var(--content-border-1, 160 40% 70%));
  }
  .blocknote-wrapper [data-content-type="paragraph"][data-color-level="2"] {
    background: hsl(var(--content-level-2, 210 40% 95%));
    border-left: 2px solid hsl(var(--content-border-2, 210 40% 70%));
  }
  .blocknote-wrapper [data-content-type="paragraph"][data-color-level="3"] {
    background: hsl(var(--content-level-3, 270 40% 95%));
    border-left: 2px solid hsl(var(--content-border-3, 270 40% 70%));
  }
  .blocknote-wrapper [data-content-type="paragraph"][data-color-level="4"] {
    background: hsl(var(--content-level-4, 40 50% 95%));
    border-left: 2px solid hsl(var(--content-border-4, 40 50% 70%));
  }
  .blocknote-wrapper [data-content-type="paragraph"][data-color-level="5"] {
    background: hsl(var(--content-level-5, 340 40% 95%));
    border-left: 2px solid hsl(var(--content-border-5, 340 40% 70%));
  }
  .blocknote-wrapper [data-content-type="paragraph"][data-color-level="6"] {
    background: hsl(var(--content-level-6, 190 40% 95%));
    border-left: 2px solid hsl(var(--content-border-6, 190 40% 70%));
  }
`;

// Helper to flatten blocks
function flattenBlocks(blocksArr, result = []) {
  for (const block of blocksArr) {
    result.push(block);
    if (block.children && block.children.length > 0) {
      flattenBlocks(block.children, result);
    }
  }
  return result;
}

export function BlockNoteWrapper({
  initialBlocks,
  onEditorReady,
  readOnly = false,
}) {
  const hasInitializedRef = useRef(false);
  const wrapperRef = useRef(null);
  const observerRef = useRef(null);
  const rafRef = useRef(null);
  const editor = useCreateBlockNote();

  // Apply data attributes to blocks for CSS-based styling
  const applyDataAttributes = useCallback(() => {
    if (!editor || !wrapperRef.current) return;
    
    try {
      const blocks = editor.document;
      let currentHeadingLevel = 1;
      
      const allBlocks = flattenBlocks(blocks);
      
      for (const block of allBlocks) {
        const blockElement = wrapperRef.current.querySelector(`.bn-block[data-id="${block.id}"]`);
        if (!blockElement) continue;
        
        const blockContent = blockElement.querySelector('.bn-block-content');
        if (!blockContent) continue;
        
        if (block.type === 'heading') {
          const originalLevel = block.props?.originalLevel || block.props?.level || 1;
          currentHeadingLevel = originalLevel;
          
          // Set data attribute for CSS targeting
          blockContent.setAttribute('data-original-level', originalLevel);
          
          // Apply indentation inline (CSS can't use attr() in calc())
          const indentPx = (originalLevel - 1) * 12;
          blockContent.style.marginLeft = `${indentPx}px`;
          
        } else if (block.type === 'paragraph') {
          // Color cycles through 1-6 based on heading level
          const colorLevel = ((currentHeadingLevel - 1) % 6) + 1;
          
          // Set data attributes for CSS targeting
          blockContent.setAttribute('data-original-level', currentHeadingLevel);
          blockContent.setAttribute('data-color-level', colorLevel);
          
          // Apply indentation inline
          const indentPx = (currentHeadingLevel - 1) * 12;
          blockContent.style.marginLeft = `${indentPx}px`;
        }
      }
    } catch (e) {
      console.error('Failed to apply data attributes:', e);
    }
  }, [editor]);

  // Use MutationObserver to detect BlockNote re-renders and reapply attributes
  useEffect(() => {
    if (!editor || !wrapperRef.current) return;
    
    // Debounced attribute application
    const scheduleApply = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      rafRef.current = requestAnimationFrame(() => {
        applyDataAttributes();
      });
    };
    
    // Create observer
    observerRef.current = new MutationObserver((mutations) => {
      // Only react to relevant mutations
      const hasRelevantMutation = mutations.some(m => 
        m.type === 'childList' || 
        (m.type === 'attributes' && m.attributeName !== 'data-original-level' && m.attributeName !== 'data-color-level')
      );
      
      if (hasRelevantMutation) {
        scheduleApply();
      }
    });
    
    observerRef.current.observe(wrapperRef.current, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style', 'data-id', 'data-content-type']
    });
    
    // Initial application
    scheduleApply();
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [editor, applyDataAttributes]);

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
    } catch (error) {
      console.error("Failed to initialize editor content:", error);
      hasInitializedRef.current = true;
    }
  }, [editor, initialBlocks]);

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
      }
    } catch (error) {
      console.error("Failed to change level:", error);
    }
  }, [editor]);

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
      <style>{EDITOR_STYLES}</style>
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
