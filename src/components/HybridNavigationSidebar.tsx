import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Check, 
  X, 
  Trash2,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavigationNode, WikiDocument, ContentService } from '@/services/contentService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { buildSectionHierarchy, HierarchicalDocumentSection } from '../lib/sectionHierarchy';
import { EnhancedSectionItem } from './EnhancedSectionItem';

interface HybridNavigationSidebarProps {
  structure: NavigationNode[];
  contentNodes?: WikiDocument[];
  onSectionView?: (sectionData: { content: string; title: string; level: number; parentPath: string }) => void;
  onStructureUpdate: () => void;
  onNavigationClick?: (navId: string, path: string) => void;
  currentNavId?: string | null;
}

  const FolderNode: React.FC<{
  node: NavigationNode;
  contentNodes?: WikiDocument[];
  onSectionView?: (sectionData: { content: string; title: string; level: number; parentPath: string }) => void;
  onStructureUpdate: () => void;
  onNavigationClick?: (navId: string, path: string) => void;  
  currentNavId?: string | null;
}> = ({ 
  node, 
  contentNodes, 
  onSectionView, 
  onStructureUpdate,
  onNavigationClick,
  currentNavId
}) => {
  const [expanded, setExpanded] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.title);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // Find the associated content for this folder and build hierarchical sections
  const associatedContent = contentNodes?.find(content => content.path === node.path);
  const { hierarchicalSections, flatSections } = useMemo(() => {
    if (!associatedContent?.content_json) return { hierarchicalSections: [], flatSections: [] };
    
    // Convert JSON sections to flat format first
    const flatSections = associatedContent.content_json.map((section, index) => ({
      id: section.id || `section-${index}`,
      level: section.level || 1,
      title: section.title || '',
      content: section.content || '',
      tags: section.tags || []
    }));
    
    // Build hierarchical structure (only sections with children will be returned)
    const hierarchicalSections = buildSectionHierarchy(flatSections);
    
    return { hierarchicalSections, flatSections };
  }, [associatedContent?.content_json]);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onNavigationClick) {
      onNavigationClick(node.id, node.path);
    } else {
      navigate(node.path);
    }
  };

  const handleEditStart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsEditing(true);
    setEditValue(node.title);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleEditSave = async () => {
    if (editValue.trim() && editValue !== node.title) {
      const success = await ContentService.updateNavigationNode(node.id, { 
        title: editValue.trim() 
      });
      
      if (success) {
        toast.success("Folder renamed successfully");
        onStructureUpdate();
      } else {
        toast.error("Failed to rename folder");
      }
    }
    setIsEditing(false);
  };

  const handleEditCancel = () => {
    setEditValue(node.title);
    setIsEditing(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleEditSave();
    } else if (e.key === 'Escape') {
      handleEditCancel();
    }
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (confirm(`Are you sure you want to delete "${node.title}"? This action cannot be undone.`)) {
      const success = await ContentService.deleteNavigationNode(node.id);
      
      if (success) {
        toast.success("Folder deleted successfully");
        onStructureUpdate();
      } else {
        toast.error("Failed to delete folder");
      }
    }
  };

  return (
    <>
      {/* Folder Header - Clickable to navigate */}
      <div
        className="flex items-center gap-2 py-2 px-3 rounded-md group transition-colors cursor-pointer hover:bg-accent/50"
        onClick={handleNodeClick}
      >
        {/* Expansion toggle */}
        <button
          onClick={toggleExpanded}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-accent rounded z-10"
        >
          <span className={`text-muted-foreground transform transition-transform duration-200 text-2xl origin-center ${expanded ? 'rotate-90' : ''}`}>
            ‣
          </span>
        </button>

        {/* Title - editable */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <Input
                ref={inputRef}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={handleKeyPress}
                onBlur={handleEditSave}
                className="h-6 px-1 text-sm"
                onClick={(e) => e.stopPropagation()}
              />
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditSave();
                }}
              >
                <Check className="w-3 h-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={(e) => {
                  e.stopPropagation();
                  handleEditCancel();
                }}
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <span className="text-sm truncate text-foreground group-hover:text-foreground/80">
              {node.title}
            </span>
          )}
        </div>

        {/* Action buttons */}
        {!isEditing && (
          <div 
            className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleEditStart}
              title="Edit folder name"
            >
              <Edit2 className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 text-destructive hover:text-destructive"
              onClick={handleDelete}
              title="Delete folder"
            >
              <Trash2 className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>

      {/* Document sections - Show hierarchical sections */}
      {expanded && hierarchicalSections.length > 0 && (
        <div className="mt-1">
          {hierarchicalSections.map((section, index) => (
            <EnhancedSectionItem
              key={section.id}
              section={section}
              depth={0}
              folderPath={node.path}
              onSectionView={onSectionView}
              sectionPosition={index}
              flatSections={flatSections}
            />
          ))}
        </div>
      )}
    </>
  );
};

export const HybridNavigationSidebar: React.FC<HybridNavigationSidebarProps> = ({ 
  structure, 
  contentNodes = [],
  onSectionView,
  onStructureUpdate,
  onNavigationClick,
  currentNavId
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter states
  const [expandedFilters, setExpandedFilters] = useState({
    ventureLevel: true,
    technology: true,
    marketProduct: true,
    content: true
  });

  const [filters, setFilters] = useState({
    ventureLevel: {
      early: false,
      pmf: false,
      scaleUp: false
    },
    technology: {
      aiLlm: false,
      aiOther: false,
      nonAi: false
    },
    marketProduct: {
      b2b: false,
      b2c: false,
      saas: false,
      internalTooling: false,
      shopSite: false,
      multiMarketplace: false,
      service: false
    },
    content: {
      overviews: false,
      pitfalls: false,
      tips: false,
      steps: false,
      frameworks: false,
      diligence: false,
      gptTips: false,
      agenticTools: false,
      tooling: false,
      news: false,
      discussions: false,
      debates: false,
      postmortem: false
    }
  });

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      const folder = await ContentService.createNavigationFolder(newFolderName.trim());
      
      if (folder) {
        toast.success("Folder created successfully");
        onStructureUpdate();
        setIsCreating(false);
        setNewFolderName("");
      } else {
        toast.error("Failed to create folder");
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleCreateFolder();
    } else if (e.key === 'Escape') {
      setIsCreating(false);
      setNewFolderName("");
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setNewFolderName("");
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  // Only show top-level nodes, no nested structure
  const topLevelNodes = structure.filter(node => !node.parent_id);

  const toggleFilterSection = (section: keyof typeof expandedFilters) => {
    setExpandedFilters(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const toggleFilter = (category: keyof typeof filters, filter: string) => {
    setFilters(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [filter]: !prev[category][filter as keyof typeof prev[typeof category]]
      }
    }));
  };

  const FilterSection = ({ 
    title, 
    sectionKey, 
    items 
  }: { 
    title: string; 
    sectionKey: keyof typeof expandedFilters; 
    items: { key: string; label: string }[] 
  }) => (
    <div className="mb-3">
      <button
        onClick={() => toggleFilterSection(sectionKey)}
        className="flex items-center gap-2 w-full p-2 hover:bg-accent/50 rounded-md transition-colors"
      >
        {expandedFilters[sectionKey] ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-sm font-medium text-foreground">{title}</span>
      </button>
      
      {expandedFilters[sectionKey] && (
        <div className="ml-6 space-y-2 mt-2">
          {items.map(item => (
            <div key={item.key} className="flex items-center space-x-2">
              <Checkbox
                id={`${sectionKey}-${item.key}`}
                checked={filters[sectionKey][item.key as keyof typeof filters[typeof sectionKey]]}
                onCheckedChange={() => toggleFilter(sectionKey, item.key)}
                className="h-4 w-4"
              />
              <label 
                htmlFor={`${sectionKey}-${item.key}`}
                className="text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
              >
                {item.label}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const filterSections = [
    {
      title: "Venture level",
      sectionKey: "ventureLevel" as const,
      items: [
        { key: "early", label: "early" },
        { key: "pmf", label: "PMF" },
        { key: "scaleUp", label: "scale-up" }
      ]
    },
    {
      title: "Technology",
      sectionKey: "technology" as const,
      items: [
        { key: "aiLlm", label: "AI (LLM)" },
        { key: "aiOther", label: "AI (other)" },
        { key: "nonAi", label: "Non-AI" }
      ]
    },
    {
      title: "Market/Product type",
      sectionKey: "marketProduct" as const,
      items: [
        { key: "b2b", label: "b2b" },
        { key: "b2c", label: "b2c" },
        { key: "saas", label: "saas" },
        { key: "internalTooling", label: "internal tooling" },
        { key: "shopSite", label: "shop site" },
        { key: "multiMarketplace", label: "2/multi marketplace" },
        { key: "service", label: "service" }
      ]
    },
    {
      title: "Content",
      sectionKey: "content" as const,
      items: [
        { key: "overviews", label: "Overviews/summaries / critical commentary" },
        { key: "pitfalls", label: "Top pitfalls" },
        { key: "tips", label: "Tips" },
        { key: "steps", label: "Steps" },
        { key: "frameworks", label: "Frameworks" },
        { key: "diligence", label: "Diligence/Checklists" },
        { key: "gptTips", label: "GPT tips" },
        { key: "agenticTools", label: "Agentic Tools / Approaches" },
        { key: "tooling", label: "Tooling" },
        { key: "news", label: "News" },
        { key: "discussions", label: "Discussions" },
        { key: "debates", label: "Debates" },
        { key: "postmortem", label: "Postmortem Data" }
      ]
    }
  ];

  return (
    <div className="h-full flex flex-col">
      {/* Filters Section */}
      <div className="border-b border-border p-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">
          Filters
        </div>
        <div className="space-y-1">
          {filterSections.map(section => (
            <FilterSection
              key={section.sectionKey}
              title={section.title}
              sectionKey={section.sectionKey}
              items={section.items}
            />
          ))}
        </div>
      </div>

      {/* Navigation Tree */}
      <div className="flex-1 overflow-y-auto p-3">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3 px-1">
          Navigation
        </div>
        {topLevelNodes.length > 0 ? (
          topLevelNodes.map((item) => (
            <FolderNode
              key={item.id}
              node={item}
              contentNodes={contentNodes}
              onSectionView={onSectionView}
              onStructureUpdate={onStructureUpdate}
              onNavigationClick={onNavigationClick}
              currentNavId={currentNavId}
            />
          ))
        ) : (
          <div className="p-3 text-center text-muted-foreground">
            <p className="text-sm">No folders found</p>
          </div>
        )}
      </div>

      {/* New Folder Button */}
      <div className="p-2 border-t border-border">
        <Button
          variant="ghost"
          size="sm"
          onClick={startCreating}
          className="w-8 h-8 p-0 mx-auto block"
          title="Add new folder"
        >
          <Plus className="w-4 h-4" />
        </Button>

        {isCreating && (
          <div className="mt-2 flex items-center gap-2">
            <Input
              ref={inputRef}
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Folder name..."
              className="text-sm"
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCreateFolder}
              disabled={!newFolderName.trim()}
              className="h-6 w-6 p-0"
            >
              <Check className="w-3 h-3" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setIsCreating(false);
                setNewFolderName("");
              }}
              className="h-6 w-6 p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};