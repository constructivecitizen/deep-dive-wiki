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
import { useEffect, useRef } from "react";

export function BlockNoteWrapper({
  initialBlocks,
  onEditorReady,
  readOnly = false,
}) {
  const hasInitializedRef = useRef(false);
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

  return (
    <BlockNoteView
      editor={editor}
      editable={!readOnly}
      theme="light"
    />
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

export default BlockNoteWrapper;
