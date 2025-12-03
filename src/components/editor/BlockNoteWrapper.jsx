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

// Design system content level colors (fallbacks if CSS vars not available)
const CONTENT_COLORS = {
  1: { bg: '160 40% 95%', border: '160 40% 70%' },
  2: { bg: '210 40% 95%', border: '210 40% 70%' },
  3: { bg: '270 40% 95%', border: '270 40% 70%' },
  4: { bg: '40 50% 95%', border: '40 50% 70%' },
  5: { bg: '340 40% 95%', border: '340 40% 70%' },
  6: { bg: '190 40% 95%', border: '190 40% 70%' },
};

// Helper to get CSS variable value or fallback
function getCSSVar(varName, fallback) {
  try {
    const value = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
    return value || fallback;
  } catch {
    return fallback;
  }
}

export function BlockNoteWrapper({
  initialBlocks,
  onEditorReady,
  readOnly = false,
}) {
  const hasInitializedRef = useRef(false);
  const wrapperRef = useRef(null);
  const editor = useCreateBlockNote();

  // Apply inline styles directly to blocks for visual styling
  const applyBlockStyles = useCallback(() => {
    if (!editor || !wrapperRef.current) return;
    
    try {
      const blocks = editor.document;
      let currentHeadingLevel = 1;
      let foundElements = 0;
      let totalBlocks = 0;
      
      // Flatten all blocks to process in order
      const flattenBlocks = (blocksArr, result = []) => {
        for (const block of blocksArr) {
          result.push(block);
          if (block.children && block.children.length > 0) {
            flattenBlocks(block.children, result);
          }
        }
        return result;
      };
      
      const allBlocks = flattenBlocks(blocks);
      totalBlocks = allBlocks.length;
      
      for (const block of allBlocks) {
        // Find the outer block element first
        const blockOuter = wrapperRef.current.querySelector(`.bn-block-outer[data-id="${block.id}"]`);
        if (!blockOuter) continue;
        
        // Find the .bn-block-content element inside
        const blockContent = blockOuter.querySelector('.bn-block-content');
        if (!blockContent) continue;
        
        foundElements++;
        
        if (block.type === 'heading') {
          const originalLevel = block.props?.originalLevel || block.props?.level || 1;
          currentHeadingLevel = originalLevel;
          
          // Apply indentation directly via inline style
          const indentPx = (originalLevel - 1) * 12;
          blockContent.style.marginLeft = `${indentPx}px`;
          
          // Apply font styling to the heading element
          const h = blockContent.querySelector('h1, h2, h3');
          if (h) {
            // Get foreground color from CSS var
            const fgColor = getCSSVar('--foreground', '222.2 84% 4.9%');
            h.style.color = `hsl(${fgColor})`;
            
            if (originalLevel === 1) {
              h.style.fontSize = '1.25rem';
              h.style.fontWeight = '600';
              h.style.lineHeight = '1.625';
            } else if (originalLevel === 2) {
              h.style.fontSize = '1.125rem';
              h.style.fontWeight = '500';
              h.style.lineHeight = '1.625';
            } else if (originalLevel === 3) {
              h.style.fontSize = '1rem';
              h.style.fontWeight = '500';
              h.style.lineHeight = '1.5';
            } else {
              // Level 4+ - smaller font
              h.style.fontSize = '0.875rem';
              h.style.fontWeight = '500';
              h.style.lineHeight = '1.5';
            }
          }
          
          // Store data attribute for debugging
          blockContent.setAttribute('data-level', originalLevel);
          
        } else if (block.type === 'paragraph') {
          // Apply colored background to paragraphs based on preceding heading level
          const colorLevel = ((currentHeadingLevel - 1) % 6) + 1;
          const indentPx = (currentHeadingLevel - 1) * 12;
          
          // Get colors from CSS vars or use fallbacks
          const bgColor = getCSSVar(`--content-level-${colorLevel}`, CONTENT_COLORS[colorLevel].bg);
          const borderColor = getCSSVar(`--content-border-${colorLevel}`, CONTENT_COLORS[colorLevel].border);
          
          // Apply inline styles directly - highest specificity
          blockContent.style.background = `hsl(${bgColor})`;
          blockContent.style.borderLeft = `2px solid hsl(${borderColor})`;
          blockContent.style.borderRadius = '0.375rem';
          blockContent.style.padding = '7px 9px';
          blockContent.style.margin = '4px 0';
          blockContent.style.marginLeft = `${indentPx}px`;
          
          // Store data attributes for debugging
          blockContent.setAttribute('data-content-level', colorLevel);
          blockContent.setAttribute('data-indent', Math.min(currentHeadingLevel, 10));
        }
      }
      
      console.log(`[BlockNote Styles] Applied inline styles to ${foundElements}/${totalBlocks} blocks`);
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

  // Additional delayed style application for reliability
  useEffect(() => {
    const timer1 = setTimeout(applyBlockStyles, 300);
    const timer2 = setTimeout(applyBlockStyles, 600);
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [applyBlockStyles]);

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
