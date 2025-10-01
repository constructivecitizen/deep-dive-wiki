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
      setActiveDocumentPath
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
      >
        <Outlet />
      </WikiLayout>
    </LayoutContext.Provider>
  );
};