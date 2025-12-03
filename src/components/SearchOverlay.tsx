import React, { useState, useRef, useEffect } from 'react';
import { X, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchOverlayProps {
  onClose: () => void;
}

export const SearchOverlay: React.FC<SearchOverlayProps> = ({ onClose }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when overlay opens
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="absolute inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col items-center pt-20">
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
      <div className="w-full max-w-xl px-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="h-14 pl-12 pr-4 text-lg rounded-xl border-2 focus-visible:ring-2"
          />
        </div>
        
        {/* Placeholder for future search results */}
        <div className="mt-8 text-center text-muted-foreground">
          <p className="text-sm">Type to search across all content</p>
          <p className="text-xs mt-2">(Search functionality coming soon)</p>
        </div>
      </div>
    </div>
  );
};
