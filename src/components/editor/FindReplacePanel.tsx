import { useState, useCallback, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { X, ChevronUp, ChevronDown, Replace, ReplaceAll } from "lucide-react";

interface FindReplacePanelProps {
  content: string;
  onContentChange: (newContent: string) => void;
  onClose: () => void;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}

export function FindReplacePanel({
  content,
  onContentChange,
  onClose,
  textareaRef,
}: FindReplacePanelProps) {
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [matches, setMatches] = useState<number[]>([]);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const findInputRef = useRef<HTMLInputElement>(null);

  // Focus find input on mount
  useEffect(() => {
    findInputRef.current?.focus();
  }, []);

  // Find all matches when search text or content changes
  useEffect(() => {
    if (!findText) {
      setMatches([]);
      setCurrentMatchIndex(0);
      return;
    }

    const searchContent = caseSensitive ? content : content.toLowerCase();
    const searchTerm = caseSensitive ? findText : findText.toLowerCase();
    const foundMatches: number[] = [];
    let pos = 0;

    while ((pos = searchContent.indexOf(searchTerm, pos)) !== -1) {
      foundMatches.push(pos);
      pos += 1;
    }

    setMatches(foundMatches);
    if (foundMatches.length > 0 && currentMatchIndex >= foundMatches.length) {
      setCurrentMatchIndex(0);
    }
  }, [findText, content, caseSensitive]);

  // Highlight current match in textarea
  useEffect(() => {
    if (matches.length > 0 && textareaRef.current) {
      const pos = matches[currentMatchIndex];
      textareaRef.current.focus();
      textareaRef.current.setSelectionRange(pos, pos + findText.length);
      
      // Scroll to selection
      const lineHeight = 20;
      const linesBeforeMatch = content.substring(0, pos).split('\n').length;
      textareaRef.current.scrollTop = Math.max(0, (linesBeforeMatch - 5) * lineHeight);
    }
  }, [currentMatchIndex, matches, findText, textareaRef, content]);

  const goToNextMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev + 1) % matches.length);
  }, [matches.length]);

  const goToPrevMatch = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((prev) => (prev - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const replaceCurrent = useCallback(() => {
    if (matches.length === 0 || !findText) return;
    
    const pos = matches[currentMatchIndex];
    const newContent = 
      content.substring(0, pos) + 
      replaceText + 
      content.substring(pos + findText.length);
    
    onContentChange(newContent);
  }, [content, findText, replaceText, matches, currentMatchIndex, onContentChange]);

  const replaceAll = useCallback(() => {
    if (!findText) return;
    
    let newContent = content;
    if (caseSensitive) {
      newContent = content.split(findText).join(replaceText);
    } else {
      const regex = new RegExp(findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      newContent = content.replace(regex, replaceText);
    }
    
    onContentChange(newContent);
  }, [content, findText, replaceText, caseSensitive, onContentChange]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        goToNextMatch();
      } else if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        goToPrevMatch();
      } else if ((e.metaKey || e.ctrlKey) && e.key === "h") {
        e.preventDefault();
        replaceCurrent();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goToNextMatch, goToPrevMatch, replaceCurrent]);

  return (
    <div className="flex items-center gap-2 p-2 bg-muted/80 border-b border-border">
      {/* Find input */}
      <div className="flex items-center gap-1">
        <Input
          ref={findInputRef}
          value={findText}
          onChange={(e) => setFindText(e.target.value)}
          placeholder="Find"
          className="h-7 w-40 text-xs"
        />
        <span className="text-xs text-muted-foreground min-w-[50px]">
          {matches.length > 0 ? `${currentMatchIndex + 1}/${matches.length}` : "0/0"}
        </span>
        <Button
          onClick={goToPrevMatch}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={matches.length === 0}
          title="Previous (Shift+Enter)"
        >
          <ChevronUp className="h-3.5 w-3.5" />
        </Button>
        <Button
          onClick={goToNextMatch}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={matches.length === 0}
          title="Next (Enter)"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Replace input */}
      <div className="flex items-center gap-1 border-l border-border pl-2">
        <Input
          value={replaceText}
          onChange={(e) => setReplaceText(e.target.value)}
          placeholder="Replace"
          className="h-7 w-40 text-xs"
        />
        <Button
          onClick={replaceCurrent}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={matches.length === 0}
          title="Replace (Ctrl+H)"
        >
          <Replace className="h-3.5 w-3.5" />
        </Button>
        <Button
          onClick={replaceAll}
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0"
          disabled={!findText}
          title="Replace All"
        >
          <ReplaceAll className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Options */}
      <div className="flex items-center gap-1 border-l border-border pl-2">
        <Button
          onClick={() => setCaseSensitive(!caseSensitive)}
          variant={caseSensitive ? "secondary" : "ghost"}
          size="sm"
          className="h-7 px-2 text-xs"
          title="Case Sensitive"
        >
          Aa
        </Button>
      </div>

      {/* Close */}
      <Button
        onClick={onClose}
        variant="ghost"
        size="sm"
        className="h-7 w-7 p-0 ml-auto"
        title="Close (Esc)"
      >
        <X className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
