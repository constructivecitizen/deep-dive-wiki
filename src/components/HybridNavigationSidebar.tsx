import React, { useState, useRef, useMemo } from 'react';
import { 
  Plus, 
  Edit2, 
  Check, 
  X, 
  Trash2,
  ChevronDown,
  ChevronRight,
  FileText,
  Pencil,
  ChevronUp,
  Search,
  Filter,
  ExternalLink,
  Home
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NavigationNode, WikiDocument, ContentService } from '../services/contentService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { buildSectionHierarchy, HierarchicalDocumentSection } from '../lib/sectionHierarchy';
import { EnhancedSectionItem } from './EnhancedSectionItem';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface HybridNavigationSidebarProps {
  structure: NavigationNode[];
  contentNodes?: WikiDocument[];
  onStructureUpdate: () => void;
  onNavigationClick?: (navId: string, path: string) => void;
  currentNavId?: string | null;
  setShowEditor?: (show: boolean) => void;
  currentPath?: string;
  onSectionNavigate?: (sectionTitle: string) => void;
  activeSectionId?: string | null;
  activeDocumentPath?: string | null;
  setActiveSectionId?: (id: string | null) => void;
  expandDepth?: number;
  expandMode?: 'depth' | 'mixed';
  onExpandDepthChange?: (depth: number) => void;
  showDescriptions?: 'on' | 'off' | 'mixed';
  onShowDescriptionsChange?: (mode: 'on' | 'off') => void;
  onSearchOpen?: () => void;
  onCollapseAll?: () => void;
}

  const FolderNode: React.FC<{
  node: NavigationNode;
  contentNodes?: WikiDocument[];
  onStructureUpdate: () => void;
  onNavigationClick?: (navId: string, path: string) => void;  
  currentNavId?: string | null;
  setShowEditor?: (show: boolean) => void;
  currentPath?: string;
  allRootNodes: NavigationNode[];
  onSectionNavigate?: (sectionTitle: string) => void;
  activeSectionId?: string | null;
  activeDocumentPath?: string | null;
  setActiveSectionId?: (id: string | null) => void;
}> = ({
  node, 
  contentNodes, 
  onStructureUpdate,
  onNavigationClick,
  currentNavId,
  setShowEditor,
  currentPath,
  allRootNodes,
  onSectionNavigate,
  activeSectionId,
  activeDocumentPath,
  setActiveSectionId
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
    
    // Build hierarchical structure
    const hierarchicalSections = buildSectionHierarchy(flatSections);
    
    return { hierarchicalSections, flatSections };
  }, [associatedContent?.content_json, associatedContent?.title]);

  const toggleExpanded = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpanded(!expanded);
  };

  const handleNodeClick = (e: React.MouseEvent) => {
    e.preventDefault();
    
    // Special case: If clicking the same folder while a section of that document is active,
    // force a hash change to trigger ContentPage's useEffect and clear the section view
    const isSameDocumentActiveSection = activeDocumentPath === node.path && !!activeSectionId;
    
    if (isSameDocumentActiveSection) {
      // Immediately clear the active section to update the sidebar highlight
      setActiveSectionId?.(null);
      navigate(`${node.path}#root`);
      return;
    }
    
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

  const handleEditContent = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    // Navigate to the folder and enable editor mode
    if (onNavigationClick) {
      onNavigationClick(node.id, node.path);
    } else {
      navigate(node.path);
    }
    // Enable editor mode
    if (setShowEditor) {
      setShowEditor(true);
    }
  };


  // Check if this node is the currently active one (but not when a section is active)
  // Strip hash from current path for accurate comparison
  const currentPathBase = currentPath?.split('#')[0] ?? currentPath;
  const isActiveNode = currentPathBase === node.path && !activeSectionId;

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}${node.path}`;
    window.open(url, '_blank');
  };

  return (
    <>
      {/* Folder Header - Clickable to navigate */}
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={`relative flex items-center gap-1 py-1 pr-2 rounded-md group transition-colors cursor-pointer min-w-0 border-l-2 ${
              isActiveNode 
                ? 'bg-primary/10 border-l-primary text-primary' 
                : 'hover:bg-accent/50 border-l-transparent'
            }`}
            onClick={handleNodeClick}
          >
        {/* Expansion toggle */}
        <button
          onClick={toggleExpanded}
          className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-accent rounded z-10"
        >
          {expanded ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
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
            <div 
              className={`text-sm truncate whitespace-nowrap group-hover:text-foreground/80 ${
                isActiveNode ? 'text-sidebar-primary font-medium' : 'text-foreground'
              }`}
              title={node.title}
            >
              {node.title}
            </div>
          )}
        </div>

        {/* Action buttons */}
        {!isEditing && (
          <div 
            className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-sidebar/95 rounded px-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              onClick={handleEditContent}
              title="Edit folder content"
            >
              <FileText className="w-3 h-3" />
            </Button>
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
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleOpenInNewTab}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in new tab
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Document sections - Show hierarchical sections */}
      {expanded && hierarchicalSections.length > 0 && (
        <div className="mt-1">
          {hierarchicalSections
            .filter(section => section.title.toLowerCase().trim() !== node.title.toLowerCase().trim())
            .map((section, index) => (
              <EnhancedSectionItem
                key={section.id}
                section={section}
                depth={0}
                folderPath={node.path}
                sectionPosition={index}
                flatSections={flatSections}
                currentPath={currentPath}
                onSectionNavigate={onSectionNavigate}
                activeSectionId={activeSectionId}
                activeDocumentPath={activeDocumentPath}
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
  onStructureUpdate,
  onNavigationClick,
  currentNavId,
  setShowEditor,
  currentPath,
  onSectionNavigate,
  activeSectionId,
  activeDocumentPath,
  setActiveSectionId,
  expandDepth = 1,
  expandMode = 'depth',
  onExpandDepthChange,
  showDescriptions = 'on',
  onShowDescriptionsChange,
  onSearchOpen,
  onCollapseAll
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter states
  const [expandedFilters, setExpandedFilters] = useState({
    ventureLevel: false,
    technology: false,
    marketProduct: false,
    content: false
  });

  const [filters, setFilters] = useState({
    ventureLevel: {
      early: true,
      pmf: true,
      scaleUp: true
    },
    technology: {
      aiLlm: true,
      aiOther: true,
      nonAi: true
    },
    marketProduct: {
      b2b: true,
      b2c: true,
      saas: true,
      internalTooling: true,
      shopSite: true,
      multiMarketplace: true,
      service: true
    },
    content: {
      overviews: true,
      pitfalls: true,
      tips: true,
      steps: true,
      frameworks: true,
      diligence: true,
      gptTips: true,
      agenticTools: true,
      tooling: true,
      news: true,
      discussions: true,
      debates: true,
      postmortem: true
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

  // Only show top-level nodes, no nested structure, sorted by order_index
  const topLevelNodes = structure
    .filter(node => !node.parent_id)
    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

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
    items: { key: string; label: string }[];
  }) => {
    return (
      <div className="mb-1 min-w-0">
        <button
          onClick={() => toggleFilterSection(sectionKey)}
          className="flex items-center justify-start gap-1 w-full py-0.5 pr-2 hover:bg-accent/50 rounded-md transition-colors min-w-0"
        >
        {expandedFilters[sectionKey] ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
        <span className="text-sm text-foreground truncate whitespace-nowrap flex-1 min-w-0" style={{ textAlign: 'left' }}>{title}</span>
      </button>
      
      {expandedFilters[sectionKey] && (
        <div className="space-y-1 mt-1" style={{ marginLeft: '31px' }}>
          {items.map(item => (
            <div key={item.key} className="flex items-center justify-start space-x-2 py-0.5 min-w-0">
              <Checkbox
                id={`${sectionKey}-${item.key}`}
                checked={filters[sectionKey][item.key as keyof typeof filters[typeof sectionKey]]}
                onCheckedChange={() => toggleFilter(sectionKey, item.key)}
                className="h-4 w-4 flex-shrink-0"
              />
              <label 
                htmlFor={`${sectionKey}-${item.key}`}
                className="text-sm text-left text-foreground cursor-pointer hover:text-foreground/80 transition-colors truncate whitespace-nowrap flex-1 min-w-0"
                style={{ textAlign: 'left' }}
                title={item.label}
              >
                {item.label}
              </label>
            </div>
          ))}
        </div>
      )}
    </div>
    );
  };

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
    <div className="h-full w-full flex flex-col bg-sidebar">
      {/* Navigation Tree */}
      <div className="flex-1 section-bg-3 overflow-y-auto p-3 flex flex-col">
        <div className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide mb-3 px-1">
          Navigation
        </div>
        <div className="flex-1 overflow-y-auto">
          {topLevelNodes.length > 0 ? (
            topLevelNodes.map((item) => (
              <FolderNode
                key={item.id}
                node={item}
                contentNodes={contentNodes}
                onStructureUpdate={onStructureUpdate}
                onNavigationClick={onNavigationClick}
                currentNavId={currentNavId}
                setShowEditor={setShowEditor}
                currentPath={currentPath}
                allRootNodes={topLevelNodes}
                onSectionNavigate={onSectionNavigate}
                activeSectionId={activeSectionId}
                activeDocumentPath={activeDocumentPath}
                setActiveSectionId={setActiveSectionId}
              />
            ))
          ) : (
            <div className="p-3 text-center text-muted-foreground">
              <p className="text-sm">No folders found</p>
            </div>
          )}
        </div>

        {/* Search trigger - at bottom of Navigation */}
        <div className="mt-3 pt-2 border-t border-sidebar-border/50">
          <button
            onClick={onSearchOpen}
            className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"
          >
            <Search className="w-4 h-4" />
            <span>Search...</span>
          </button>
        </div>
      </div>

      {/* Filters Section */}
      <div className="border-t border-sidebar-border section-bg-2 p-3">
        <div className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide mb-3 px-1">
          Filters
        </div>
        <div className="space-y-1">
          {filterSections.map((section) => (
            <FilterSection
              key={section.sectionKey}
              title={section.title}
              sectionKey={section.sectionKey}
              items={section.items}
            />
          ))}
        </div>

        {/* Bottom Controls - Plus Button (left) and Controls (right) */}
        <div className="py-2 px-3 border-t border-sidebar-border flex items-center justify-between mt-3">
          {/* Home and Plus Buttons on the left */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={onCollapseAll}
              className="w-8 h-8 p-0"
              title="Collapse all sections"
            >
              <Home className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={startCreating}
              className="w-8 h-8 p-0"
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

          {/* Controls on the right */}
          <div className="flex items-center gap-3">
            {/* Content Depth Control */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                Content Depth:
              </label>
              <Input
                type="text"
                value={expandMode === 'mixed' ? '-' : (expandDepth + 1).toString()}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  if (value === '-' || value === '') return;
                  const num = parseInt(value);
                  if (!isNaN(num) && num >= 1 && num <= 21) {
                    onExpandDepthChange?.(num - 1);
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const value = e.currentTarget.value.trim();
                    if (value === '-' || value === '') return;
                    const num = parseInt(value);
                    if (!isNaN(num) && num >= 1 && num <= 21) {
                      onExpandDepthChange?.(num - 1);
                    }
                  }
                }}
                className="h-7 text-sm w-7 text-center px-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>

            {/* Description Visibility Control */}
            <div className="flex items-center gap-1.5">
              <label className="text-xs text-muted-foreground whitespace-nowrap">
                Descriptions:
              </label>
              <Select
                value={showDescriptions}
                onValueChange={(value: string) => {
                  if (value === 'on' || value === 'off') {
                    onShowDescriptionsChange?.(value);
                  }
                }}
              >
                <SelectTrigger className="h-7 w-9 text-sm text-center px-1 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 [&>svg]:hidden">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent align="end" className="min-w-[3rem]">
                  <SelectItem value="on" className="text-sm text-center justify-center">On</SelectItem>
                  <SelectItem value="off" className="text-sm text-center justify-center">Off</SelectItem>
                  <SelectItem value="-" disabled className="text-sm text-center justify-center">-</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};