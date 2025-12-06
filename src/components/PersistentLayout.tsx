import React, { useState, useEffect, createContext, useContext } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { WikiLayout } from './WikiLayout';

import { NavigationNode, WikiDocument, ContentService } from '@/services/contentService';

// Context for sharing editor/filter state between layout and pages
interface LayoutContextType {
  showEditor: boolean;
  showFilters: boolean;
  setShowEditor: (show: boolean) => void;
  setShowFilters: (show: boolean) => void;
  navigationStructure: NavigationNode[];
  sectionNavigateRef: React.MutableRefObject<((sectionTitle: string) => void) | null>;
  activeSectionId: string | null;
  activeDocumentPath: string | null; // Track which document the active section belongs to
  setActiveSectionId: (id: string | null) => void;
  setActiveDocumentPath: (path: string | null) => void;
  onStructureUpdate: () => void;
  expandDepth: number;
  expandMode: 'depth' | 'mixed';
  manualOverrides: Record<string, boolean>;
  setExpandDepth: (depth: number) => void;
  setManualOverride: (sectionId: string, isExpanded: boolean) => void;
  showDescriptions: 'on' | 'off' | 'mixed';
  descriptionOverrides: Record<string, boolean>;
  setShowDescriptions: (mode: 'on' | 'off') => void;
  setDescriptionOverride: (sectionId: string, isVisible: boolean) => void;
}

const LayoutContext = createContext<LayoutContextType | null>(null);

export const useLayoutContext = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayoutContext must be used within PersistentLayout');
  }
  return context;
};

export const PersistentLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [navigationStructure, setNavigationStructure] = useState<NavigationNode[]>([]);
  const [contentNodes, setContentNodes] = useState<WikiDocument[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [hasInitialNavigation, setHasInitialNavigation] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [activeDocumentPath, setActiveDocumentPath] = useState<string | null>(null);
  const [expandDepth, setExpandDepth] = useState(1);
  const [expandMode, setExpandMode] = useState<'depth' | 'mixed'>('depth');
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});
  const [showDescriptions, setShowDescriptionsState] = useState<'on' | 'off' | 'mixed'>('on');
  const [descriptionOverrides, setDescriptionOverrides] = useState<Record<string, boolean>>({});
  
  // Ref for section navigation function - will be set by ContentPage
  const sectionNavigateRef = React.useRef<((sectionTitle: string) => void) | null>(null);

  const loadNavigationData = async (isInitial = false) => {
    try {
      if (isInitial) {
        setIsInitialLoading(true);
      }
      const [structure, documents] = await Promise.all([
        ContentService.getNavigationStructure(),
        ContentService.getAllDocuments()
      ]);

      setNavigationStructure(structure);
      setContentNodes(documents);
    } catch (error) {
      console.error('Error loading navigation data:', error);
    } finally {
      if (isInitial) {
        setIsInitialLoading(false);
      }
    }
  };

  useEffect(() => {
    loadNavigationData(true);
  }, []);

  // Navigate to first root folder on initial load
  useEffect(() => {
    if (!hasInitialNavigation && navigationStructure.length > 0 && location.pathname === '/') {
      const firstRootFolder = navigationStructure.find(node => !node.parent_id);
      if (firstRootFolder) {
        navigate(firstRootFolder.path, { replace: true });
        setHasInitialNavigation(true);
      }
    }
  }, [navigationStructure, hasInitialNavigation, location.pathname, navigate]);

  const handleStructureUpdate = () => {
    loadNavigationData();
  };

  const handleSetManualOverride = (sectionId: string, isExpanded: boolean) => {
    setManualOverrides(prev => ({ ...prev, [sectionId]: isExpanded }));
    setExpandMode('mixed');
  };

  const handleExpandDepthChange = (depth: number) => {
    setExpandDepth(depth);
    setExpandMode('depth');
    setManualOverrides({});
  };

  const handleSetDescriptionOverride = (sectionId: string, isVisible: boolean) => {
    setDescriptionOverrides(prev => ({ ...prev, [sectionId]: isVisible }));
    setShowDescriptionsState('mixed');
  };

  const handleShowDescriptionsChange = (mode: 'on' | 'off') => {
    setShowDescriptionsState(mode);
    setDescriptionOverrides({});
  };

  const handleCollapseAll = () => {
    // Set expand depth to 0 (which displays as "1" in UI but means no auto-expansion)
    setExpandDepth(0);
    setExpandMode('depth');
    setManualOverrides({});
  };

  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <LayoutContext.Provider value={{ 
      showEditor, 
      showFilters, 
      setShowEditor, 
      setShowFilters,
      navigationStructure,
      sectionNavigateRef,
      activeSectionId,
      activeDocumentPath,
      setActiveSectionId,
      setActiveDocumentPath,
      onStructureUpdate: handleStructureUpdate,
      expandDepth,
      expandMode,
      manualOverrides,
      setExpandDepth: handleExpandDepthChange,
      setManualOverride: handleSetManualOverride,
      showDescriptions,
      descriptionOverrides,
      setShowDescriptions: handleShowDescriptionsChange,
      setDescriptionOverride: handleSetDescriptionOverride
    }}>
      <WikiLayout
        navigationStructure={navigationStructure}
        contentNodes={contentNodes}
        onStructureUpdate={handleStructureUpdate}
        setShowEditor={setShowEditor}
        currentPath={location.pathname + location.hash}
        onSectionNavigate={(title) => {
          console.log('WikiLayout calling sectionNavigateRef with:', title);
          sectionNavigateRef.current?.(title);
        }}
        activeSectionId={activeSectionId}
        activeDocumentPath={activeDocumentPath}
        setActiveSectionId={setActiveSectionId}
        expandDepth={expandDepth}
        expandMode={expandMode}
        onExpandDepthChange={handleExpandDepthChange}
        showDescriptions={showDescriptions}
        onShowDescriptionsChange={handleShowDescriptionsChange}
        onCollapseAll={handleCollapseAll}
      >
        <Outlet />
      </WikiLayout>
    </LayoutContext.Provider>
  );
};