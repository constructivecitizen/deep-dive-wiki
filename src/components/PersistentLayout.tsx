import React, { useState, useEffect, createContext, useContext, useCallback } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { WikiLayout } from './WikiLayout';
import { NavigationNode, WikiDocument, ContentService } from '@/services/contentService';
import { useNavigationState, NavigationContextValue, SectionViewData } from '@/hooks/useNavigationState';

/**
 * Layout Context - provides shared state between layout and content pages
 * 
 * Key changes from previous implementation:
 * 1. Navigation state is now managed by useNavigationState hook
 * 2. Removed separate activeSectionId/activeDocumentPath - now atomic in navigation state
 * 3. Added navigationVersion to force re-renders when navigation changes
 */

interface LayoutContextType {
  // Editor/Filter UI state
  showEditor: boolean;
  showFilters: boolean;
  setShowEditor: (show: boolean) => void;
  setShowFilters: (show: boolean) => void;
  
  // Navigation structure data
  navigationStructure: NavigationNode[];
  onStructureUpdate: () => void;
  
  // Centralized navigation state and actions
  navigation: NavigationContextValue;
  
  // Section navigation helper - allows ContentPage to provide navigation implementation
  handleSectionNavigate: (sectionTitle: string) => void;
  setSectionNavigateHandler: (handler: ((title: string) => void) | null) => void;
  
  // Expand/collapse state for content display
  expandDepth: number;
  expandMode: 'depth' | 'mixed';
  manualOverrides: Record<string, boolean>;
  setExpandDepth: (depth: number) => void;
  setManualOverride: (sectionId: string, isExpanded: boolean) => void;
  
  // Description visibility state
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
  
  // Navigation state - centralized and atomic
  const navigation = useNavigationState();
  
  // Navigation structure data
  const [navigationStructure, setNavigationStructure] = useState<NavigationNode[]>([]);
  const [contentNodes, setContentNodes] = useState<WikiDocument[]>([]);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [hasInitialNavigation, setHasInitialNavigation] = useState(false);
  
  // UI state
  const [showEditor, setShowEditor] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // Expand/collapse state - default to collapsed (matches Home button behavior)
  const [expandDepth, setExpandDepth] = useState(0);
  const [expandMode, setExpandMode] = useState<'depth' | 'mixed'>('depth');
  const [manualOverrides, setManualOverrides] = useState<Record<string, boolean>>({});
  
  // Description visibility state - default to off (matches Home button behavior)
  const [showDescriptions, setShowDescriptionsState] = useState<'on' | 'off' | 'mixed'>('off');
  const [descriptionOverrides, setDescriptionOverrides] = useState<Record<string, boolean>>({});
  
  // Sidebar collapse trigger
  const [sidebarCollapseKey, setSidebarCollapseKey] = useState(0);
  
  // Section navigation handler - set by ContentPage
  const sectionNavigateHandlerRef = React.useRef<((title: string) => void) | null>(null);

  const setSectionNavigateHandler = useCallback((handler: ((title: string) => void) | null) => {
    sectionNavigateHandlerRef.current = handler;
  }, []);

  const handleSectionNavigate = useCallback((sectionTitle: string) => {
    if (sectionNavigateHandlerRef.current) {
      sectionNavigateHandlerRef.current(sectionTitle);
    }
  }, []);

  // Load navigation data
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

  const handleStructureUpdate = useCallback(() => {
    loadNavigationData();
  }, []);

  // Expand depth handlers
  const handleSetManualOverride = useCallback((sectionId: string, isExpanded: boolean) => {
    setManualOverrides(prev => ({ ...prev, [sectionId]: isExpanded }));
    setExpandMode('mixed');
  }, []);

  const handleExpandDepthChange = useCallback((depth: number) => {
    setExpandDepth(depth);
    setExpandMode('depth');
    setManualOverrides({});
  }, []);

  // Description visibility handlers
  const handleSetDescriptionOverride = useCallback((sectionId: string, isVisible: boolean) => {
    setDescriptionOverrides(prev => ({ ...prev, [sectionId]: isVisible }));
    setShowDescriptionsState('mixed');
  }, []);

  const handleShowDescriptionsChange = useCallback((mode: 'on' | 'off') => {
    setShowDescriptionsState(mode);
    setDescriptionOverrides({});
  }, []);

  // Collapse all handler
  const handleCollapseAll = useCallback(() => {
    setExpandDepth(0);
    setExpandMode('depth');
    setManualOverrides({});
    setSidebarCollapseKey(prev => prev + 1);
  }, []);

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
      onStructureUpdate: handleStructureUpdate,
      navigation,
      handleSectionNavigate,
      setSectionNavigateHandler,
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
        onSectionNavigate={handleSectionNavigate}
        navigation={navigation}
        expandDepth={expandDepth}
        expandMode={expandMode}
        onExpandDepthChange={handleExpandDepthChange}
        showDescriptions={showDescriptions}
        onShowDescriptionsChange={handleShowDescriptionsChange}
        onCollapseAll={handleCollapseAll}
        sidebarCollapseKey={sidebarCollapseKey}
      >
        <Outlet />
      </WikiLayout>
    </LayoutContext.Provider>
  );
};
