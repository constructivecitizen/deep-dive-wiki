// @ts-nocheck
/* eslint-disable */
/**
 * BlockNote wrapper in JSX to avoid TypeScript type inference issues
 * with BlockNote's deeply nested generic types
 * 
 * Supports N-level depth (up to 99 levels) via originalLevel metadata
 * Use Tab/Shift+Tab to indent/outdent selected blocks
 * Content blocks (paragraphs and lists) cycle through 6 colors based on parent heading level
 */
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import "@blocknote/core/fonts/inter.css";
import { useEffect, useRef, useState, useCallback } from "react";

// CSS for visual indentation of deep levels + content block backgrounds
const DEEP_LEVEL_STYLES = `
  /* Visual indentation for deep heading levels */
  .blocknote-wrapper [data-level="4"] { margin-left: 24px !important; }
  .blocknote-wrapper [data-level="5"] { margin-left: 48px !important; }
  .blocknote-wrapper [data-level="6"] { margin-left: 72px !important; }
  .blocknote-wrapper [data-level="7"] { margin-left: 96px !important; }
  .blocknote-wrapper [data-level="8"] { margin-left: 120px !important; }
  .blocknote-wrapper [data-level="9"] { margin-left: 144px !important; }
  .blocknote-wrapper [data-level="10"] { margin-left: 168px !important; }
  .blocknote-wrapper [data-level-deep] { margin-left: calc(168px + (var(--extra-levels) * 24px)) !important; }
  
  /* Visual indicators for deep levels (headings only) */
  .blocknote-wrapper [data-content-type="heading"][data-level]::before {
    content: attr(data-level-badge);
    display: inline-block;
    font-size: 9px;
    padding: 1px 4px;
    border-radius: 3px;
    margin-right: 6px;
    font-weight: 500;
    vertical-align: middle;
  }
  .blocknote-wrapper [data-content-type="heading"][data-level="4"]::before { background: #dbeafe; color: #1d4ed8; }
  .blocknote-wrapper [data-content-type="heading"][data-level="5"]::before { background: #dcfce7; color: #15803d; }
  .blocknote-wrapper [data-content-type="heading"][data-level="6"]::before { background: #f3e8ff; color: #7c3aed; }
  .blocknote-wrapper [data-content-type="heading"][data-level="7"]::before { background: #ffedd5; color: #c2410c; }
  .blocknote-wrapper [data-content-type="heading"][data-level="8"]::before { background: #fce7f3; color: #be185d; }
  .blocknote-wrapper [data-content-type="heading"][data-level="9"]::before { background: #ccfbf1; color: #0f766e; }
  .blocknote-wrapper [data-content-type="heading"][data-level-deep]::before { background: #e5e7eb; color: #374151; }
  
  /* Ensure headings have NO background color */
  .blocknote-wrapper h1, 
  .blocknote-wrapper h2, 
  .blocknote-wrapper h3, 
  .blocknote-wrapper h4, 
  .blocknote-wrapper h5, 
  .blocknote-wrapper h6 {
    background: transparent !important;
    border: none !important;
    padding: 0 !important;
  }
  
  /* Background colors for <p> and <li> elements ONLY - using data-level */
  .blocknote-wrapper p[data-level="1"],
  .blocknote-wrapper li[data-level="1"] {
    background-color: hsl(155, 40%, 96%) !important;
    border-left: 3px solid hsl(155, 40%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
  }
  
  .blocknote-wrapper p[data-level="2"],
  .blocknote-wrapper li[data-level="2"] {
    background-color: hsl(210, 50%, 96%) !important;
    border-left: 3px solid hsl(210, 50%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
  }
  
  .blocknote-wrapper p[data-level="3"],
  .blocknote-wrapper li[data-level="3"] {
    background-color: hsl(265, 45%, 96%) !important;
    border-left: 3px solid hsl(265, 45%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
  }
  
  .blocknote-wrapper p[data-level="4"],
  .blocknote-wrapper li[data-level="4"] {
    background-color: hsl(25, 55%, 96%) !important;
    border-left: 3px solid hsl(25, 55%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
  }
  
  .blocknote-wrapper p[data-level="5"],
  .blocknote-wrapper li[data-level="5"] {
    background-color: hsl(340, 40%, 96%) !important;
    border-left: 3px solid hsl(340, 40%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
  }
  
  .blocknote-wrapper p[data-level="6"],
  .blocknote-wrapper li[data-level="6"] {
    background-color: hsl(180, 45%, 96%) !important;
    border-left: 3px solid hsl(180, 45%, 75%) !important;
    padding: 8px 12px !important;
    margin: 4px 0 !important;
    border-radius: 4px !important;
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

  // Apply data attributes to blocks for visual indentation and content backgrounds
const applyDeepLevelStyles = useCallback(() => {
  if (!editor || !wrapperRef.current) return;
  
  console.log('=== APPLYING STYLES ===');
  let successCount = 0;
  let failCount = 0;
  
  try {
    const blocks = editor.document;
    
    const applyToBlocks = (blocksArr, inheritedLevel = 1) => {
      let currentLevel = inheritedLevel;
      
      for (const block of blocksArr) {
        const blockEl = 
          wrapperRef.current.querySelector(`[data-id="${block.id}"]`) ||
          wrapperRef.current.querySelector(`[data-block-id="${block.id}"]`);
        
        if (block.type === 'heading') {
          const originalLevel = block.props?.originalLevel || block.props?.level || 1;
          currentLevel = originalLevel;
          
          if (blockEl && originalLevel > 3) {
            const blockContent = blockEl.querySelector('.bn-block-content');
            if (blockContent) {
              if (originalLevel <= 10) {
                blockContent.setAttribute('data-level', originalLevel);
                blockContent.setAttribute('data-level-badge', `L${originalLevel}`);
              } else {
                blockContent.setAttribute('data-level-deep', 'true');
                blockContent.setAttribute('data-level-badge', `L${originalLevel}`);
                blockContent.style.setProperty('--extra-levels', originalLevel - 10);
              }
            }
          }
          
          if (block.children && block.children.length > 0) {
            applyToBlocks(block.children, originalLevel);
          }
        } else if (block.type === 'paragraph' || block.type === 'bulletListItem' || block.type === 'numberedListItem') {
          console.log(`Processing paragraph: "${block.content?.[0]?.text?.substring(0, 30)}"`);
          
          if (blockEl) {
            console.log('  blockEl found, searching for <p>...');
            const paragraphEl = blockEl.querySelector('p.bn-inline-content');
            const listItemEl = blockEl.querySelector('li');
            const targetEl = paragraphEl || listItemEl;
            
            console.log('  Found p.bn-inline-content:', !!paragraphEl);
            console.log('  Found li:', !!listItemEl);
            
if (targetEl) {
  const colorLevel = ((currentLevel - 1) % 6) + 1;
  
  // Instead of setAttribute, apply styles directly
  const colors = [
    { bg: 'hsl(155, 40%, 96%)', border: 'hsl(155, 40%, 75%)' }, // 1
    { bg: 'hsl(210, 50%, 96%)', border: 'hsl(210, 50%, 75%)' }, // 2
    { bg: 'hsl(265, 45%, 96%)', border: 'hsl(265, 45%, 75%)' }, // 3
    { bg: 'hsl(25, 55%, 96%)', border: 'hsl(25, 55%, 75%)' },   // 4
    { bg: 'hsl(340, 40%, 96%)', border: 'hsl(340, 40%, 75%)' }, // 5
    { bg: 'hsl(180, 45%, 96%)', border: 'hsl(180, 45%, 75%)' }  // 6
  ];
  
  const color = colors[colorLevel - 1];
  targetEl.style.backgroundColor = color.bg;
  targetEl.style.borderLeft = `3px solid ${color.border}`;
  targetEl.style.padding = '8px 12px';
  targetEl.style.margin = '4px 0';
  targetEl.style.borderRadius = '4px';
  
  console.log(`  ✓ Applied inline styles (level ${colorLevel}) to: "${targetEl.textContent.substring(0, 40)}"`);
  successCount++;
} else {
              failCount++;
              console.log(`  ✗ FAIL: No <p> or <li> found`);
              console.log('  blockEl HTML:', blockEl.outerHTML.substring(0, 200));
            }
          } else {
            failCount++;
            console.log(`  ✗ FAIL: blockEl not found for block ID ${block.id}`);
          }
          
          if (block.children && block.children.length > 0) {
            applyToBlocks(block.children, currentLevel);
          }
        } else {
          if (block.children && block.children.length > 0) {
            applyToBlocks(block.children, currentLevel);
          }
        }
      }
    };
    
    applyToBlocks(blocks);
    console.log(`=== DONE: ${successCount} colored, ${failCount} failed ===`);
  } catch (e) {
    console.error('Failed to apply level styles:', e);
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
