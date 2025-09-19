import { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Search, X, Filter, Tag as TagIcon } from 'lucide-react';
import { WikiDocument } from '@/services/contentService';
import { TagManager, TagFilter } from '@/lib/tagManager';

interface FilterPanelProps {
  allNodes: WikiDocument[];
  onFilterChange: (filteredNodes: WikiDocument[]) => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const FilterPanel = ({ allNodes, onFilterChange, isOpen, onToggle }: FilterPanelProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<TagFilter>({ includeTags: [], excludeTags: [] });
  
  const allTags = useMemo(() => TagManager.extractAllTags(allNodes), [allNodes]);
  
  const filteredTags = useMemo(() => {
    return TagManager.getTagSuggestions(searchTerm, allTags);
  }, [searchTerm, allTags]);

  const applyFilter = (newFilter: TagFilter) => {
    setFilter(newFilter);
    const filtered = TagManager.filterNodes(allNodes, newFilter);
    onFilterChange(filtered);
  };

  const addIncludeTag = (tag: string) => {
    if (!filter.includeTags.includes(tag)) {
      const newFilter = {
        ...filter,
        includeTags: [...filter.includeTags, tag],
        excludeTags: filter.excludeTags.filter(t => t !== tag)
      };
      applyFilter(newFilter);
    }
  };

  const addExcludeTag = (tag: string) => {
    if (!filter.excludeTags.includes(tag)) {
      const newFilter = {
        ...filter,
        excludeTags: [...filter.excludeTags, tag],
        includeTags: filter.includeTags.filter(t => t !== tag)
      };
      applyFilter(newFilter);
    }
  };

  const removeIncludeTag = (tag: string) => {
    const newFilter = {
      ...filter,
      includeTags: filter.includeTags.filter(t => t !== tag)
    };
    applyFilter(newFilter);
  };

  const removeExcludeTag = (tag: string) => {
    const newFilter = {
      ...filter,
      excludeTags: filter.excludeTags.filter(t => t !== tag)
    };
    applyFilter(newFilter);
  };

  const clearAllFilters = () => {
    const newFilter = { includeTags: [], excludeTags: [] };
    applyFilter(newFilter);
  };

  const hasActiveFilters = filter.includeTags.length > 0 || filter.excludeTags.length > 0;

  if (!isOpen) {
    return (
      <Button
        onClick={onToggle}
        variant="outline"
        size="sm"
        className="fixed top-4 left-4 z-40 shadow-lg"
      >
        <Filter className="h-4 w-4 mr-2" />
        Filters
        {hasActiveFilters && (
          <Badge variant="secondary" className="ml-2 px-1 py-0 text-xs">
            {filter.includeTags.length + filter.excludeTags.length}
          </Badge>
        )}
      </Button>
    );
  }

  return (
    <Card className="fixed top-4 left-4 w-80 max-h-[80vh] overflow-hidden z-40 shadow-lg">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <TagIcon className="h-4 w-4" />
            <h3 className="font-semibold">Filter by Tags</h3>
          </div>
          <Button onClick={onToggle} variant="ghost" size="sm">
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tags..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <div className="overflow-y-auto max-h-96">
        {hasActiveFilters && (
          <div className="p-4 bg-muted/50">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-medium">Active Filters</h4>
              <Button onClick={clearAllFilters} variant="ghost" size="sm" className="text-xs">
                Clear All
              </Button>
            </div>
            
            {filter.includeTags.length > 0 && (
              <div className="mb-3">
                <p className="text-xs text-muted-foreground mb-1">Include:</p>
                <div className="flex flex-wrap gap-1">
                  {filter.includeTags.map(tag => (
                    <Badge key={tag} variant="default" className="text-xs">
                      {tag}
                      <Button
                        onClick={() => removeIncludeTag(tag)}
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 ml-1 hover:bg-destructive hover:text-destructive-foreground"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {filter.excludeTags.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Exclude:</p>
                <div className="flex flex-wrap gap-1">
                  {filter.excludeTags.map(tag => (
                    <Badge key={tag} variant="destructive" className="text-xs">
                      {tag}
                      <Button
                        onClick={() => removeExcludeTag(tag)}
                        variant="ghost"
                        size="sm"
                        className="h-3 w-3 p-0 ml-1 hover:bg-background hover:text-foreground"
                      >
                        <X className="h-2 w-2" />
                      </Button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div className="p-4">
          <h4 className="text-sm font-medium mb-3">Available Tags ({allTags.length})</h4>
          <div className="space-y-1">
            {filteredTags.map(tag => {
              const isIncluded = filter.includeTags.includes(tag);
              const isExcluded = filter.excludeTags.includes(tag);
              
              return (
                <div key={tag} className="flex items-center justify-between group">
                  <Badge
                    variant={isIncluded ? "default" : isExcluded ? "destructive" : "outline"}
                    className="text-xs cursor-pointer flex-1 justify-start"
                    onClick={() => isIncluded ? removeIncludeTag(tag) : isExcluded ? removeExcludeTag(tag) : addIncludeTag(tag)}
                  >
                    {tag}
                  </Badge>
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-2 transition-opacity">
                    {!isIncluded && (
                      <Button
                        onClick={() => addIncludeTag(tag)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-green-600 hover:bg-green-100 hover:text-green-700"
                        title="Include"
                      >
                        +
                      </Button>
                    )}
                    {!isExcluded && (
                      <Button
                        onClick={() => addExcludeTag(tag)}
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-600 hover:bg-red-100 hover:text-red-700"
                        title="Exclude"
                      >
                        -
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
};