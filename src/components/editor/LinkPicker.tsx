import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, FileText, Hash, Loader2, ChevronRight, Link2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SearchService, SearchResult } from '@/services/searchService';

interface LinkPickerProps {
  currentDocumentPath?: string;
  onSelect: (linkSyntax: string) => void;
  onClose: () => void;
}

export const LinkPicker: React.FC<LinkPickerProps> = ({ 
  currentDocumentPath, 
  onSelect, 
  onClose 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when picker opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        handleResultSelect(results[selectedIndex]);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, results, selectedIndex]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (searchTerm.trim().length >= 2) {
        setIsLoading(true);
        const searchResults = await SearchService.search(searchTerm);
        setResults(searchResults);
        setSelectedIndex(0);
        setIsLoading(false);
      } else {
        setResults([]);
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const generateLinkSyntax = useCallback((result: SearchResult): string => {
    const targetTitle = result.sectionTitle || result.documentTitle;
    const isSameDocument = currentDocumentPath === result.documentPath;
    
    if (isSameDocument) {
      // Same document: [[display text|#Section Title]]
      return `[[${targetTitle}|#${targetTitle}]]`;
    } else {
      // Different document: [[display text|/path#Section Title]] or [[display text|/path]]
      if (result.sectionTitle) {
        return `[[${result.sectionTitle}|${result.documentPath}#${result.sectionTitle}]]`;
      } else {
        return `[[${result.documentTitle}|${result.documentPath}]]`;
      }
    }
  }, [currentDocumentPath]);

  const handleResultSelect = useCallback((result: SearchResult) => {
    const linkSyntax = generateLinkSyntax(result);
    onSelect(linkSyntax);
  }, [generateLinkSyntax, onSelect]);

  const getMatchTypeIcon = (type: SearchResult['matchType']) => {
    switch (type) {
      case 'title': return <FileText className="h-4 w-4 text-primary" />;
      case 'section-title': return <Hash className="h-4 w-4 text-accent-foreground" />;
      case 'content': return <FileText className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const renderHighlightedText = (text: string) => {
    const parts = text.split(/\*\*(.*?)\*\*/g);
    return parts.map((part, i) => 
      i % 2 === 1 
        ? <mark key={i} className="bg-primary/20 text-foreground px-0.5 rounded">{part}</mark>
        : part
    );
  };

  return (
    <div 
      className="fixed inset-0 z-[60] bg-black/50 flex items-start justify-center pt-20"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="w-full max-w-xl mx-4 bg-card rounded-lg shadow-xl border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2 text-sm font-medium">
            <Link2 className="h-4 w-4" />
            Insert Internal Link
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Search input */}
        <div className="p-4">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search for a section to link to..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-10 px-3 text-sm pr-10"
            />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
            )}
          </div>
        </div>
        
        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-[50vh] overflow-y-auto border-t">
            <div className="p-2 space-y-1">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultSelect(result)}
                  className={`w-full text-left px-3 py-2.5 rounded-md flex items-start gap-3 transition-colors ${
                    index === selectedIndex 
                      ? 'bg-accent text-accent-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getMatchTypeIcon(result.matchType)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-0.5">
                    {/* Breadcrumb path */}
                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground flex-wrap">
                      {result.breadcrumbPath.map((segment, i) => (
                        <React.Fragment key={i}>
                          {i > 0 && <ChevronRight className="h-2.5 w-2.5 shrink-0" />}
                          <span>{segment}</span>
                        </React.Fragment>
                      ))}
                    </div>
                    {/* Title */}
                    <div className="font-medium text-sm">
                      {renderHighlightedText(result.sectionTitle || result.documentTitle)}
                    </div>
                    {/* Preview of what link will look like */}
                    <div className="text-[10px] text-muted-foreground/70 font-mono mt-1">
                      {generateLinkSyntax(result)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {searchTerm.length >= 2 && !isLoading && results.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm border-t">
            No results found for "{searchTerm}"
          </div>
        )}
        
        {searchTerm.length > 0 && searchTerm.length < 2 && (
          <div className="text-center py-4 text-muted-foreground text-xs border-t">
            Type at least 2 characters to search
          </div>
        )}

        {searchTerm.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-xs border-t">
            <p>Search for a document or section to create an internal link</p>
            <p className="mt-1 opacity-70">Use ↑↓ to navigate, Enter to select, Esc to close</p>
          </div>
        )}
      </div>
    </div>
  );
};
