import React, { useEffect, useState, useReducer } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SimpleActionMenu } from "@/components/SimpleActionMenu";
import { SimpleFilterPanel } from "@/components/SimpleFilterPanel";
import { UnifiedEditor } from "@/components/UnifiedEditor";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { FolderLandingPage } from "@/components/FolderLandingPage";
import { WikiLayout } from "@/components/WikiLayout";
import { NavigationNode, WikiDocument, ContentService } from "@/services/contentService";
import { extractSectionFullContent } from '@/lib/sectionContentExtractor';

// Constants
const PAGE_TYPES = {
  LOADING: 'loading',
  CONTENT: 'content',
  FOLDER: 'folder'
} as const;

// State types
interface AppState {
  isLoading: boolean;
  pageData: PageData | null;
  allDocuments: WikiDocument[];
  navigationStructure: NavigationNode[];
  filteredNodes: WikiDocument[];
}

type PageData = 
  | { type: 'loading' }
  | { type: 'content'; title: string; content: string; path: string }  
  | { type: 'folder'; title: string; content: string; path: string }
  | null;

type AppAction = 
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_PAGE_DATA'; payload: PageData | null }
  | { type: 'SET_ALL_DOCUMENTS'; payload: WikiDocument[] }
  | { type: 'SET_NAVIGATION_STRUCTURE'; payload: NavigationNode[] }
  | { type: 'SET_FILTERED_NODES'; payload: WikiDocument[] };

const appReducer = (state: AppState, action: AppAction): AppState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_PAGE_DATA':
      return { ...state, pageData: action.payload };
    case 'SET_ALL_DOCUMENTS':
      return { ...state, allDocuments: action.payload };
    case 'SET_NAVIGATION_STRUCTURE':
      return { ...state, navigationStructure: action.payload };
    case 'SET_FILTERED_NODES':
      return { ...state, filteredNodes: action.payload };
    default:
      return state;
  }
};

const initialState: AppState = {
  isLoading: true,
  pageData: null,
  allDocuments: [],
  navigationStructure: [],
  filteredNodes: []
};

const ContentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(appReducer, initialState);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showEditor, setShowEditor] = useState(false);

  // Handle URL hash changes for section navigation
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1); // Remove the # symbol
      if (hash && state.pageData?.type === 'content') {
        // Scroll to section if it exists
        const element = document.getElementById(hash);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }
    };
    
    window.addEventListener('hashchange', handleHashChange);
    handleHashChange(); // Handle initial hash
    
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [state.pageData]);

  // Load page data function
  const loadPageData = async (currentPath: string): Promise<PageData> => {
    try {
      // Try to get document first
      const document = await ContentService.getDocumentByPath(currentPath);
      if (document) {
        return {
          type: 'content',
          title: document.title,
          content: document.content_markup || '',
          path: document.path
        };
      }

      // Try to get folder
      const folder = await ContentService.getNavigationNodeByPath(currentPath);
      if (folder) {
        return {
          type: 'folder',
          title: folder.title,
          content: '',
          path: folder.path
        };
      }

      return null;
    } catch (error) {
      console.error('Error loading page data:', error);
      return null;
    }
  };

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        const [navStructure, documents] = await Promise.all([
          ContentService.getNavigationStructure(),
          ContentService.getAllDocuments()
        ]);
        
        dispatch({ type: 'SET_NAVIGATION_STRUCTURE', payload: navStructure });
        dispatch({ type: 'SET_ALL_DOCUMENTS', payload: documents });
        dispatch({ type: 'SET_FILTERED_NODES', payload: documents });
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };

    loadInitialData();
  }, []);

  // Load page content when path changes
  useEffect(() => {
    const loadData = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      const data = await loadPageData(location.pathname);
      dispatch({ type: 'SET_PAGE_DATA', payload: data });
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    loadData();
  }, [location.pathname]);

  const handleFilter = (filters: { searchTerm: string; selectedTags: string[] }) => {
    let filtered = [...state.allDocuments];

    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(doc => 
        doc.title.toLowerCase().includes(term) ||
        doc.content_markup?.toLowerCase().includes(term)
      );
    }

    if (filters.selectedTags.length > 0) {
      filtered = filtered.filter(doc => 
        doc.tags?.some(tag => filters.selectedTags.includes(tag))
      );
    }

    dispatch({ type: 'SET_FILTERED_NODES', payload: filtered });
  };

  const handleContentNodeClick = (nodeId: string) => {
    console.log('Content node clicked:', nodeId);
  };

  const handleNavigationClick = async (navId: string, path: string) => {
    navigate(path);
  };

  const refreshAllData = async () => {
    const [navStructure, documents] = await Promise.all([
      ContentService.getNavigationStructure(),
      ContentService.getAllDocuments()
    ]);
    
    dispatch({ type: 'SET_NAVIGATION_STRUCTURE', payload: navStructure });
    dispatch({ type: 'SET_ALL_DOCUMENTS', payload: documents });
    dispatch({ type: 'SET_FILTERED_NODES', payload: documents });
  };

  const renderBreadcrumb = () => {
    const hash = window.location.hash.slice(1);
    
    if (state.pageData?.type === 'content') {
      return (
        <PageBreadcrumb 
          currentPath={state.pageData.path}
          navigationStructure={state.navigationStructure}
          pageTitle={state.pageData.title}
          sectionTitle={hash || undefined}
        />
      );
    }
    
    if (state.pageData?.type === 'folder') {
      return (
        <PageBreadcrumb 
          currentPath={state.pageData.path}
          navigationStructure={state.navigationStructure}
          pageTitle={state.pageData.title}
        />
      );
    }
    
    return null;
  };

  const renderPageTitle = () => {
    const hash = window.location.hash.slice(1);
    
    if (state.pageData?.type === 'content') {
      const title = hash ? `${state.pageData.title} - ${hash}` : state.pageData.title;
      return <h1 className="text-4xl font-bold text-foreground mb-6">{title}</h1>;
    }
    
    if (state.pageData?.type === 'folder') {
      return <h1 className="text-4xl font-bold text-foreground mb-6">{state.pageData.title}</h1>;
    }
    
    return <h1 className="text-4xl font-bold text-foreground mb-6">Content Not Found</h1>;
  };

  const renderContent = () => {
    if (state.pageData?.type === 'content') {
      return (
        <div className="space-y-6">
          {showEditor ? (
            <div>Editor placeholder - {state.pageData.title}</div>
          ) : (
            <div className="bg-card rounded-lg border border-border p-8">
              <HierarchicalContentDisplay 
                content={state.pageData.content}
                onSectionClick={handleContentNodeClick}
              />
            </div>
          )}
        </div>
      );
    }
    
    if (state.pageData?.type === 'folder') {
      return (
        <div className="bg-card rounded-lg border border-border p-8">
          <HierarchicalContentDisplay 
            content={state.pageData.content}
            onSectionClick={handleContentNodeClick}
          />
        </div>
      );
    }
    
    return (
      <div className="bg-card rounded-lg border border-border p-8">
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">Content not found</p>
        </div>
      </div>
    );
  };

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <WikiLayout
      navigationStructure={state.navigationStructure}
      contentNodes={state.filteredNodes}
      onContentNodeClick={handleContentNodeClick}
      onStructureUpdate={refreshAllData}
      onNavigationClick={handleNavigationClick}
      actionMenu={
        <SimpleActionMenu 
          onToggleDocumentEditor={() => setShowEditor(true)}
          onToggleFilter={() => {}}
        />
      }
    >
      <div className="space-y-6">
        {renderBreadcrumb()}
        {renderPageTitle()}
        {renderContent()}
      </div>
    </WikiLayout>
  );
};

export default ContentPage;