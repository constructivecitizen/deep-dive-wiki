import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink } from 'lucide-react';
import { HierarchicalDocumentSection } from '../lib/sectionHierarchy';
import { NavigationContextValue } from '@/hooks/useNavigationState';
import { useNavigate } from 'react-router-dom';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

interface EnhancedSectionItemProps {
  section: HierarchicalDocumentSection;
  depth: number;
  folderPath: string;
  sectionPosition: number;
  flatSections: any[];
  currentPath?: string;
  onSectionNavigate?: (sectionTitle: string) => void;
  
  // Centralized navigation state
  navigation: NavigationContextValue;
  
  collapseKey?: number;
  initialExpandedSections?: string[];
}

/**
 * EnhancedSectionItem - represents a section within a document in the sidebar
 * 
 * Key changes:
 * 1. Uses navigation.isAtSection() for highlighting
 * 2. Properly distinguishes between same-document and cross-document navigation
 * 3. No stale closure issues since we use the navigation context directly
 */
// Helper to collect expanded state
const collectSidebarState = (): { expandedFolders: string[], expandedSections: string[] } => {
  const state = (window as any).__sidebarExpandedState || { expandedFolders: [], expandedSections: [] };
  return state;
};

// Helper to serialize sidebar state to URL params
const serializeSidebarState = (state: { expandedFolders: string[], expandedSections: string[] }): string => {
  return btoa(JSON.stringify(state));
};

export const EnhancedSectionItem: React.FC<EnhancedSectionItemProps> = ({
  section,
  depth,
  folderPath,
  sectionPosition,
  flatSections,
  currentPath,
  onSectionNavigate,
  navigation,
  collapseKey,
  initialExpandedSections
}) => {
  // Check if this section should be initially expanded based on restored state
  const shouldBeExpanded = initialExpandedSections?.includes(section.id) ?? false;
  const [isExpanded, setIsExpanded] = useState(shouldBeExpanded);
  const navigate = useNavigate();

  // Track expanded state globally for "open in new tab"
  React.useEffect(() => {
    const state = (window as any).__sidebarExpandedState || { expandedFolders: [], expandedSections: [] };
    if (isExpanded) {
      if (!state.expandedSections.includes(section.id)) {
        state.expandedSections.push(section.id);
      }
    } else {
      state.expandedSections = state.expandedSections.filter((id: string) => id !== section.id);
    }
    (window as any).__sidebarExpandedState = state;
  }, [isExpanded, section.id]);

  // Collapse when collapseKey changes
  React.useEffect(() => {
    if (collapseKey !== undefined && collapseKey > 0) {
      setIsExpanded(false);
    }
  }, [collapseKey]);

  /**
   * Handle clicking a section
   * 
   * Key logic:
   * 1. If already on the same document, just call onSectionNavigate
   * 2. If on a different document, navigate with hash to trigger URL-based loading
   */
  const handleSectionClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Check if we're on the same document (compare without hash)
    const currentPathOnly = currentPath?.split('#')[0];
    const isOnSameDocument = currentPathOnly === folderPath;
    
    if (isOnSameDocument && onSectionNavigate) {
      // Same document - use direct section navigation (no URL change needed)
      onSectionNavigate(section.title);
    } else {
      // Different document - navigate with hash for initial load
      navigate(`${folderPath}#${section.id}`);
    }
  };

  const hasChildren = section.children && section.children.length > 0;
  
  // Indentation: depth 0 = 16px, depth 1 = 31px, deeper = 31 + (depth-1)*16
  const indentationPx = depth === 0 ? 16 : depth === 1 ? 31 : 31 + (depth - 1) * 16;
  
  // Use centralized navigation for active state
  // Section is active when both document path AND section ID match
  const isActive = navigation.isAtSection(folderPath, section.id);

  const handleOpenInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const sidebarState = collectSidebarState();
    const encodedState = serializeSidebarState(sidebarState);
    const url = `${window.location.origin}${folderPath}?sidebarState=${encodedState}#${section.id}`;
    window.open(url, '_blank');
  };

  return (
    <div className="text-sm">
      <ContextMenu>
        <ContextMenuTrigger asChild>
          <div 
            className={`flex items-center gap-1 py-0.5 pr-3 rounded cursor-pointer transition-colors border-l-2 ${
              isActive
                ? 'bg-primary/10 border-l-primary text-primary font-medium' 
                : 'hover:bg-accent text-muted-foreground hover:text-foreground border-l-transparent'
            }`}
            style={{ marginLeft: `${indentationPx}px` }}
            onClick={handleSectionClick}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (hasChildren) setIsExpanded(!isExpanded);
              }}
              className="flex-shrink-0 w-4 h-4 flex items-center justify-center hover:bg-accent rounded transition-colors"
            >
              {hasChildren ? (
                isExpanded ? (
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
            </button>
            
            <span className="truncate flex-1 overflow-hidden text-ellipsis whitespace-nowrap" title={section.title}>
              {section.title}
            </span>
          </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
          <ContextMenuItem onClick={handleOpenInNewTab}>
            <ExternalLink className="w-4 h-4 mr-2" />
            Open in new tab
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {isExpanded && hasChildren && (
        <div className="mt-1">
          {section.children.map((child, index) => (
            <EnhancedSectionItem
              key={`${child.title}-${index}`}
              section={child}
              depth={depth + 1}
              folderPath={folderPath}
              sectionPosition={sectionPosition + index + 1}
              flatSections={flatSections}
              currentPath={currentPath}
              onSectionNavigate={onSectionNavigate}
              navigation={navigation}
              collapseKey={collapseKey}
              initialExpandedSections={initialExpandedSections}
            />
          ))}
        </div>
      )}
    </div>
  );
};
