import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, FileText, Hash, Type, Loader2, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SearchService, SearchResult } from '@/services/searchService';
import { useNavigate } from 'react-router-dom';

interface SearchOverlayProps {
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Auto-focus input when overlay opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape key, navigate with arrows
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
        handleResultClick(results[selectedIndex]);
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

  const handleResultClick = useCallback((result: SearchResult) => {
    const path = result.sectionId 
      ? `${result.documentPath}#${result.sectionId}`
      : result.documentPath;
    navigate(path);
    onClose();
  }, [navigate, onClose]);

  const getMatchTypeIcon = (type: SearchResult['matchType']) => {
    switch (type) {
      case 'title': return <FileText className="h-4 w-4 text-primary" />;
      case 'section-title': return <Hash className="h-4 w-4 text-accent-foreground" />;
      case 'content': return <Type className="h-4 w-4 text-muted-foreground" />;
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
    <div className="absolute inset-x-0 top-0 z-50 bg-background/80 backdrop-blur-sm flex flex-col items-center pt-16 pb-8" style={{ height: 'auto', maxHeight: '70%' }}>
      {/* Close button */}
      <Button 
        variant="ghost" 
        size="icon" 
        className="absolute top-4 right-4"
        onClick={onClose}
      >
        <X className="h-5 w-5" />
      </Button>
      
      {/* Search container */}
      <div className="w-full max-w-xl px-6 flex flex-col gap-3">
        <div className="relative">
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search documents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-12 px-4 text-base rounded-lg border-2 focus-visible:ring-2 pr-10"
          />
          {isLoading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-muted-foreground" />
          )}
        </div>
        
        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-[60vh] overflow-y-auto rounded-lg border bg-card shadow-lg">
            <div className="p-2 space-y-1">
              {results.map((result, index) => (
                <button
                  key={result.id}
                  onClick={() => handleResultClick(result)}
                  className={`w-full text-left px-3 py-3 rounded-md flex items-start gap-3 transition-colors ${
                    index === selectedIndex 
                      ? 'bg-accent text-accent-foreground' 
                      : 'hover:bg-muted'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getMatchTypeIcon(result.matchType)}
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    {/* Breadcrumb path - full names */}
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
                    {/* Full content preview */}
                    <p className="text-xs text-muted-foreground line-clamp-3 leading-relaxed">
                      {renderHighlightedText(result.fullContent.length > 300 
                        ? result.matchedText 
                        : result.fullContent)}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
        
        {searchTerm.length >= 2 && !isLoading && results.length === 0 && (
          <div className="text-center py-6 text-muted-foreground text-sm">
            No results found for "{searchTerm}"
          </div>
        )}
        
        {searchTerm.length > 0 && searchTerm.length < 2 && (
          <div className="text-center py-4 text-muted-foreground text-xs">
            Type at least 2 characters to search
          </div>
        )}
      </div>
    </div>
  );
};
