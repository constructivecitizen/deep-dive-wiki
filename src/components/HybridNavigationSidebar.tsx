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
  Search,
  ExternalLink,
  Home,
  Sun,
  Moon
} from 'lucide-react';
import { useTheme } from '@/hooks/use-theme';
import { useNavigate, useLocation } from 'react-router-dom';
import { NavigationNode, WikiDocument, ContentService } from '../services/contentService';
import { NavigationContextValue } from '@/hooks/useNavigationState';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { toast } from 'sonner';
import { buildSectionHierarchy } from '../lib/sectionHierarchy';
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
  navigation: NavigationContextValue;
  expandDepth?: number;
  expandMode?: 'depth' | 'mixed';
  onExpandDepthChange?: (depth: number) => void;
  showDescriptions?: 'on' | 'off' | 'mixed';
  onShowDescriptionsChange?: (mode: 'on' | 'off') => void;
  onSearchOpen?: () => void;
  onCollapseAll?: () => void;
  sidebarCollapseKey?: number;
}

// Helper to collect expanded state from sidebar
export const collectSidebarState = (): { expandedFolders: string[], expandedSections: string[] } => {
  const state = (window as any).__sidebarExpandedState || { expandedFolders: [], expandedSections: [] };
  return state;
};

// Helper to serialize sidebar state to URL params
export const serializeSidebarState = (state: { expandedFolders: string[], expandedSections: string[] }): string => {
  return btoa(JSON.stringify(state));
};

// Helper to deserialize sidebar state from URL params
export const deserializeSidebarState = (encoded: string | null): { expandedFolders: string[], expandedSections: string[] } | null => {
  if (!encoded) return null;
  try {
    return JSON.parse(atob(encoded));
  } catch {
    return null;
  }
};

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
  navigation: NavigationContextValue;
  collapseKey?: number;
  initialExpandedFolders?: string[];
  initialExpandedSections?: string[];
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
  navigation,
  collapseKey,
  initialExpandedFolders,
  initialExpandedSections
}) => {
  // Check if this folder should be initially expanded based on restored state
  const shouldBeExpanded = initialExpandedFolders?.includes(node.id) ?? true;
  const [expanded, setExpanded] = useState(shouldBeExpanded);

  // Track expanded state globally for "open in new tab"
  React.useEffect(() => {
    const state = (window as any).__sidebarExpandedState || { expandedFolders: [], expandedSections: [] };
    if (expanded) {
      if (!state.expandedFolders.includes(node.id)) {
        state.expandedFolders.push(node.id);
      }
    } else {
      state.expandedFolders = state.expandedFolders.filter((id: string) => id !== node.id);
    }
    (window as any).__sidebarExpandedState = state;
  }, [expanded, node.id]);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(node.title);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (collapseKey !== undefined && collapseKey > 0) {
      setExpanded(false);
    }
  }, [collapseKey]);

  const associatedContent = contentNodes?.find(content => content.path === node.path);
  const { hierarchicalSections, flatSections } = useMemo(() => {
    if (!associatedContent?.content_json) return { hierarchicalSections: [], flatSections: [] };
    
    const flatSections = associatedContent.content_json.map((section, index) => ({
      id: section.id || `section-${index}`,
      level: section.level || 1,
      title: section.title || '',
      content: section.content || '',
      tags: section.tags || []
    }));
    
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
    const isViewingSection = navigation.documentPath === node.path && navigation.sectionId;
    
    if (isViewingSection) {
      navigation.clearSection();
      navigate(node.path);
      return;
    }
    
    navigation.navigateToDocument(node.path);
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
      const success = await ContentService.updateNavigationNode(node.id, { title: editValue.trim() });
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
    if (e.key === 'Enter') handleEditSave();
    else if (e.key === 'Escape') handleEditCancel();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${node.title}"?`)) {
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
    if (onNavigationClick) onNavigationClick(node.id, node.path);
    else navigate(node.path);
    if (setShowEditor) setShowEditor(true);
  };

  const isActiveNode = navigation.isAtDocument(node.path);

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sidebarState = collectSidebarState();
    const encodedState = serializeSidebarState(sidebarState);
    window.open(`${window.location.origin}${node.path}?sidebarState=${encodedState}`, '_blank');
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div
            className={`relative flex items-center gap-1 py-1 pr-2 rounded-md group transition-colors cursor-pointer min-w-0 border-l-2 ${
              isActiveNode ? 'bg-primary/10 border-l-primary text-primary' : 'hover:bg-accent/50 border-l-transparent'
            }`}
            onClick={handleNodeClick}
          >
            <button onClick={toggleExpanded} className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-accent rounded z-10">
              {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </button>
            <div className="flex-1 min-w-0">
              {isEditing ? (
                <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                  <Input ref={inputRef} value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={handleKeyPress} onBlur={handleEditSave} className="h-6 px-1 text-sm" onClick={(e) => e.stopPropagation()} />
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleEditSave(); }}><Check className="w-3 h-3" /></Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={(e) => { e.stopPropagation(); handleEditCancel(); }}><X className="w-3 h-3" /></Button>
                </div>
              ) : (
                <div className={`text-sm truncate whitespace-nowrap group-hover:text-foreground/80 ${isActiveNode ? 'text-sidebar-primary font-medium' : 'text-foreground'}`} title={node.title}>{node.title}</div>
              )}
            </div>
            {!isEditing && (
              <div className="absolute right-2 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity bg-sidebar/95 rounded px-1" onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleEditContent} title="Edit folder content"><FileText className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={handleEditStart} title="Edit folder name"><Edit2 className="w-3 h-3" /></Button>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive" onClick={handleDelete} title="Delete folder"><Trash2 className="w-3 h-3" /></Button>
              </div>
            )}
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleOpenInNewTab}><ExternalLink className="w-4 h-4 mr-2" />Open in new tab</ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {expanded && hierarchicalSections.length > 0 && (
        <div className="mt-1">
          {hierarchicalSections
            .filter(section => section.title.toLowerCase().trim() !== node.title.toLowerCase().trim())
            .map((section, index) => (
              <EnhancedSectionItem key={section.id} section={section} depth={0} folderPath={node.path} sectionPosition={index} flatSections={flatSections} currentPath={currentPath} onSectionNavigate={onSectionNavigate} navigation={navigation} collapseKey={collapseKey} initialExpandedSections={initialExpandedSections} />
            ))}
        </div>
      )}
    </>
  );
};

const ThemeToggleButton: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="ghost" size="sm" onClick={toggleTheme} className="w-8 h-8 p-0 flex-shrink-0" title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}>
      {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
    </Button>
  );
};

export const HybridNavigationSidebar: React.FC<HybridNavigationSidebarProps> = ({
  structure, contentNodes = [], onStructureUpdate, onNavigationClick, currentNavId, setShowEditor, currentPath, onSectionNavigate, navigation, expandDepth = 1, expandMode = 'depth', onExpandDepthChange, showDescriptions = 'on', onShowDescriptionsChange, onSearchOpen, onCollapseAll, sidebarCollapseKey
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Parse sidebar state from URL on initial load
  const initialSidebarState = React.useMemo(() => {
    const params = new URLSearchParams(location.search);
    const encodedState = params.get('sidebarState');
    return deserializeSidebarState(encodedState);
  }, []);  // Only run once on mount

  // Clean up URL params after loading (so the ugly sidebarState param doesn't stay in URL)
  React.useEffect(() => {
    if (initialSidebarState) {
      const params = new URLSearchParams(location.search);
      params.delete('sidebarState');
      const newSearch = params.toString();
      const newUrl = `${location.pathname}${newSearch ? `?${newSearch}` : ''}${location.hash}`;
      window.history.replaceState({}, '', newUrl);
    }
  }, [initialSidebarState]);

  // Initialize global state tracker
  React.useEffect(() => {
    if (!(window as any).__sidebarExpandedState) {
      (window as any).__sidebarExpandedState = { expandedFolders: [], expandedSections: [] };
    }
  }, []);

  const [isCreating, setIsCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isFiltersPaneOpen, setIsFiltersPaneOpen] = useState(true);
  const [expandedFilters, setExpandedFilters] = useState({ ventureLevel: false, technology: false, marketProduct: false, content: false });
  const [filters, setFilters] = useState({
    ventureLevel: { early: true, pmf: true, scaleUp: true },
    technology: { aiLlm: true, aiOther: true, nonAi: true },
    marketProduct: { b2b: true, b2c: true, saas: true, internalTooling: true, shopSite: true, multiMarketplace: true, service: true },
    content: { overviews: true, pitfalls: true, tips: true, steps: true, frameworks: true, diligence: true, gptTips: true, agenticTools: true, tooling: true, news: true, discussions: true, debates: true, postmortem: true }
  });

  const handleCreateFolder = async () => {
    if (newFolderName.trim()) {
      const folder = await ContentService.createNavigationFolder(newFolderName.trim());
      if (folder) { toast.success("Folder created successfully"); onStructureUpdate(); setIsCreating(false); setNewFolderName(""); }
      else { toast.error("Failed to create folder"); }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreateFolder();
    else if (e.key === 'Escape') { setIsCreating(false); setNewFolderName(""); }
  };

  const startCreating = () => { setIsCreating(true); setNewFolderName(""); setTimeout(() => inputRef.current?.focus(), 0); };

  const topLevelNodes = structure.filter(node => !node.parent_id).sort((a, b) => (a.order_index || 0) - (b.order_index || 0));

  const toggleFilterSection = (section: keyof typeof expandedFilters) => setExpandedFilters(prev => ({ ...prev, [section]: !prev[section] }));
  const toggleFilter = (category: keyof typeof filters, filter: string) => setFilters(prev => ({ ...prev, [category]: { ...prev[category], [filter]: !prev[category][filter as keyof typeof prev[typeof category]] } }));

  const FilterSection = ({ title, sectionKey, items }: { title: string; sectionKey: keyof typeof expandedFilters; items: { key: string; label: string }[] }) => (
    <div className="mb-1 min-w-0">
      <button onClick={() => toggleFilterSection(sectionKey)} className="flex items-center justify-start gap-1 w-full py-0.5 pr-2 hover:bg-accent/50 rounded-md transition-colors min-w-0">
        {expandedFilters[sectionKey] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
        <span className="text-sm text-foreground truncate whitespace-nowrap flex-1 min-w-0" style={{ textAlign: 'left' }}>{title}</span>
      </button>
      {expandedFilters[sectionKey] && (
        <div className="space-y-1 mt-1" style={{ marginLeft: '31px' }}>
          {items.map(item => (
            <div key={item.key} className="flex items-center justify-start space-x-2 py-0.5 min-w-0">
              <Checkbox id={`${sectionKey}-${item.key}`} checked={filters[sectionKey][item.key as keyof typeof filters[typeof sectionKey]]} onCheckedChange={() => toggleFilter(sectionKey, item.key)} className="h-4 w-4 flex-shrink-0" />
              <label htmlFor={`${sectionKey}-${item.key}`} className="text-sm text-left text-foreground cursor-pointer hover:text-foreground/80 transition-colors truncate whitespace-nowrap flex-1 min-w-0" style={{ textAlign: 'left' }} title={item.label}>{item.label}</label>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const filterSections = [
    { title: "Venture level", sectionKey: "ventureLevel" as const, items: [{ key: "early", label: "early" }, { key: "pmf", label: "PMF" }, { key: "scaleUp", label: "scale-up" }] },
    { title: "Technology", sectionKey: "technology" as const, items: [{ key: "aiLlm", label: "AI (LLM)" }, { key: "aiOther", label: "AI (other)" }, { key: "nonAi", label: "Non-AI" }] },
    { title: "Market/Product type", sectionKey: "marketProduct" as const, items: [{ key: "b2b", label: "b2b" }, { key: "b2c", label: "b2c" }, { key: "saas", label: "saas" }, { key: "internalTooling", label: "internal tooling" }, { key: "shopSite", label: "shop site" }, { key: "multiMarketplace", label: "2/multi marketplace" }, { key: "service", label: "service" }] },
    { title: "Content", sectionKey: "content" as const, items: [{ key: "overviews", label: "Overviews/summaries" }, { key: "pitfalls", label: "Top pitfalls" }, { key: "tips", label: "Tips" }, { key: "steps", label: "Steps" }, { key: "frameworks", label: "Frameworks" }, { key: "diligence", label: "Diligence/Checklists" }, { key: "gptTips", label: "GPT tips" }, { key: "agenticTools", label: "Agentic Tools" }, { key: "tooling", label: "Tooling" }, { key: "news", label: "News" }, { key: "discussions", label: "Discussions" }, { key: "debates", label: "Debates" }, { key: "postmortem", label: "Postmortem Data" }] }
  ];

  return (
    <div className="h-full w-full flex flex-col bg-sidebar">
      <div className="flex-1 overflow-y-auto p-3 flex flex-col">
        <div className="flex-1 overflow-y-auto">
          {topLevelNodes.length > 0 ? topLevelNodes.map((item) => (
            <FolderNode key={item.id} node={item} contentNodes={contentNodes} onStructureUpdate={onStructureUpdate} onNavigationClick={onNavigationClick} currentNavId={currentNavId} setShowEditor={setShowEditor} currentPath={currentPath} allRootNodes={topLevelNodes} onSectionNavigate={onSectionNavigate} navigation={navigation} collapseKey={sidebarCollapseKey} initialExpandedFolders={initialSidebarState?.expandedFolders} initialExpandedSections={initialSidebarState?.expandedSections} />
          )) : <div className="p-3 text-center text-muted-foreground"><p className="text-sm">No folders found</p></div>}
        </div>
        <div className="mt-3 pt-1 pb-0 border-t border-sidebar-border/50">
          <button onClick={onSearchOpen} className="w-full flex items-center gap-2 px-2 pt-1 pb-0 text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 rounded-md transition-colors"><Search className="w-3 h-3" /><span>Search...</span></button>
        </div>
      </div>
      <div className="border-t border-sidebar-border/50 p-3">
        <Collapsible open={isFiltersPaneOpen} onOpenChange={setIsFiltersPaneOpen}>
          <CollapsibleTrigger className="w-full flex items-center gap-1 cursor-pointer hover:bg-accent/30 rounded px-1 py-0.5 -mx-1">
            <ChevronRight className={`w-3 h-3 text-sidebar-foreground/70 transition-transform ${isFiltersPaneOpen ? 'rotate-90' : ''}`} />
            <span className="text-xs font-medium text-sidebar-foreground/70 uppercase tracking-wide">Filters</span>
          </CollapsibleTrigger>
          <CollapsibleContent><div className="space-y-1 mt-3">{filterSections.map((section) => <FilterSection key={section.sectionKey} title={section.title} sectionKey={section.sectionKey} items={section.items} />)}</div></CollapsibleContent>
        </Collapsible>
        <div className="py-2 border-t border-sidebar-border/50 flex items-center gap-2 mt-3" style={{ paddingLeft: '2px' }}>
          <div className="flex items-center gap-1.5"><label className="text-xs text-muted-foreground whitespace-nowrap">Desc:</label><Select value={showDescriptions} onValueChange={(value: string) => { if (value === 'on' || value === 'off') onShowDescriptionsChange?.(value); }}><SelectTrigger className="h-7 w-9 text-sm text-center px-1 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 [&>svg]:hidden"><SelectValue /></SelectTrigger><SelectContent align="end" className="min-w-[3rem]"><SelectItem value="on" className="text-sm text-center justify-center">On</SelectItem><SelectItem value="off" className="text-sm text-center justify-center">Off</SelectItem><SelectItem value="-" disabled className="text-sm text-center justify-center">-</SelectItem></SelectContent></Select></div>
          <div className="flex items-center gap-1.5"><label className="text-xs text-muted-foreground whitespace-nowrap">Depth:</label><Input type="text" value={expandMode === 'mixed' ? '-' : (expandDepth + 1).toString()} onChange={(e) => { const num = parseInt(e.target.value); if (!isNaN(num) && num >= 1) onExpandDepthChange?.(num - 1); }} className="h-7 text-sm w-7 text-center px-0 focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0" /></div>
          <Button variant="ghost" size="sm" onClick={() => { onCollapseAll?.(); onShowDescriptionsChange?.('off'); }} className="w-8 h-8 p-0 flex-shrink-0" title="Collapse all sections"><Home className="w-4 h-4" /></Button>
          <ThemeToggleButton />
          <div className="flex-shrink-0">
            <Button variant="ghost" size="sm" onClick={startCreating} className="w-8 h-8 p-0" title="Add new folder"><Plus className="w-4 h-4" /></Button>
            {isCreating && <div className="mt-2 flex items-center gap-2 absolute left-3 right-3 bg-sidebar z-10"><Input ref={inputRef} value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)} onKeyDown={handleKeyPress} placeholder="Folder name..." className="text-sm" /><Button variant="ghost" size="sm" onClick={handleCreateFolder} disabled={!newFolderName.trim()} className="h-6 w-6 p-0"><Check className="w-3 h-3" /></Button><Button variant="ghost" size="sm" onClick={() => { setIsCreating(false); setNewFolderName(""); }} className="h-6 w-6 p-0"><X className="w-3 h-3" /></Button></div>}
          </div>
        </div>
      </div>
    </div>
  );
};
