import { useEffect, useState, useReducer } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { WikiLayout } from "@/components/WikiLayout";
import { ContentService, NavigationNode, WikiDocument } from "@/services/contentService";
import { SimpleActionMenu } from "@/components/SimpleActionMenu";
import { SimpleFilterPanel } from "@/components/SimpleFilterPanel";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { TagManager } from "@/lib/tagManager";
import { UnifiedEditor, EditorData } from "@/components/UnifiedEditor";
import { SectionView } from "@/components/SectionView";
import { FolderLandingPage } from "@/components/FolderLandingPage";
import { toast } from "sonner";
import { HierarchyParser } from "@/lib/hierarchyParser";

// Constants
const PAGE_TYPES = {
  LOADING: 'loading',
  CONTENT: 'content',
  FOLDER: 'folder'
} as const;

// State types
type PageData = 
  | { type: 'loading' }
  | { type: 'content'; data: WikiDocument }
  | { type: 'folder'; data: NavigationNode; children: NavigationNode[] }
  | null;

interface AppState {
  pageData: PageData;
  navigationStructure: NavigationNode[];
  allContentNodes: WikiDocument[];
  filteredContent: WikiDocument[];
  isNavigating: boolean;
}

type AppAction = 
  | { type: 'SET_LOADING' }
  | { type: 'SET_CONTENT'; payload: WikiDocument }
  | { type: 'SET_FOLDER'; payload: { data: NavigationNode; children: NavigationNode[] } }
  | { type: 'SET_NOT_FOUND' }
  | { type: 'SET_NAVIGATION'; payload: NavigationNode[] }
  | { type: 'SET_ALL_CONTENT'; payload: WikiDocument[] }
  | { type: 'SET_FILTERED_CONTENT'; payload: WikiDocument[] }
  | { type: 'SET_NAVIGATING'; payload: boolean }
  | { type: 'UPDATE_CONTENT_NODE'; payload: WikiDocument };

const initialState: AppState = {
  pageData: { type: 'loading' },
  navigationStructure: [],
  allContentNodes: [],
  filteredContent: [],
  isNavigating: false
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, pageData: { type: 'loading' } };
    case 'SET_CONTENT':
      return { ...state, pageData: { type: 'content', data: action.payload } };
    case 'SET_FOLDER':
      return { ...state, pageData: { type: 'folder', ...action.payload } };
    case 'SET_NOT_FOUND':
      return { ...state, pageData: null };
    case 'SET_NAVIGATION':
      return { ...state, navigationStructure: action.payload };
    case 'SET_ALL_CONTENT':
      return { 
        ...state, 
        allContentNodes: action.payload,
        filteredContent: action.payload 
      };
    case 'SET_FILTERED_CONTENT':
      return { ...state, filteredContent: action.payload };
    case 'SET_NAVIGATING':
      return { ...state, isNavigating: action.payload };
    case 'UPDATE_CONTENT_NODE':
      const updatedNodes = state.allContentNodes.map(node => 
        node.id === action.payload.id ? action.payload : node
      );
      const updatedPageData = state.pageData?.type === 'content' && state.pageData.data.id === action.payload.id
        ? { type: 'content' as const, data: action.payload }
        : state.pageData;
      return {
        ...state,
        allContentNodes: updatedNodes,
        pageData: updatedPageData
      };
    default:
      return state;
  }
}

const ContentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Consolidated state management with reducer
  const [state, dispatch] = useReducer(appReducer, initialState);
  const { pageData, navigationStructure, allContentNodes, filteredContent, isNavigating } = state;
  
  // Local UI state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);  
  const [editorData, setEditorData] = useState<EditorData | null>(null);
  const [viewingSection, setViewingSection] = useState<{
    content: string;
    title: string;
    level: number;
    parentPath: string;
    sectionHierarchy?: Array<{
      title: string;
      level: number;
    }>;
  } | null>(null);

  const handleSectionView = (sectionData: {
    content: string;
    title: string;
    level: number;
    parentPath: string;
  }) => {
    setViewingSection(sectionData);
  };

  const handleSectionNavigate = (sectionTitle: string) => {
    // Find the section by title in the current document and navigate to it
    if (pageData?.type === 'content' && pageData.data.content_json) {
      const targetSection = pageData.data.content_json.find(section => section.title === sectionTitle);
      if (targetSection) {
        // Import the section content extractor
        import('@/lib/sectionContentExtractor').then(({ extractSectionFullContent }) => {
          const sectionData = extractSectionFullContent(targetSection, pageData.data.content_json || []);
          setViewingSection({
            content: sectionData.content,
            title: sectionData.title,
            level: sectionData.level,
            parentPath: pageData.data.path,
            sectionHierarchy: sectionData.sectionHierarchy
          });
        });
      }
    }
  };

  // Atomic page data loading function - returns data for synchronous handling
  const loadPageData = async (currentPath: string): Promise<PageData> => {
    setViewingSection(null);
    
    try {
      // Load all required data atomically
      const [contentData, folderData, folderChildren] = await Promise.all([
        ContentService.getDocumentByPath(currentPath),
        currentPath !== '/' ? ContentService.getNavigationNodeByPath(currentPath) : null,
        currentPath !== '/' ? ContentService.getNavigationNodeChildren(currentPath) : []
      ]);
      
      // Return page data based on what we found
      if (contentData) {
        return { type: 'content', data: contentData };
      } else if (folderData) {
        return { type: 'folder', data: folderData, children: folderChildren };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error loading page data:', error);
      return null;
    }
  };

  // Load initial data on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [structure, allNodes] = await Promise.all([
          ContentService.getNavigationStructure(),
          ContentService.getAllDocuments()
        ]);
        dispatch({ type: 'SET_NAVIGATION', payload: structure });
        dispatch({ type: 'SET_ALL_CONTENT', payload: allNodes });
      } catch (error) {
        console.error('Error loading initial data:', error);
      }
    };
    
    loadInitialData();
  }, []);

  // Load page content when route changes - only if we don't already have data for this path
  useEffect(() => {
    const currentPath = location.pathname;
    const hasCorrectData = pageData && 
      ((pageData.type === 'content' && pageData.data.path === currentPath) || 
       (pageData.type === 'folder' && pageData.data.path === currentPath));

    if (!hasCorrectData) {
      dispatch({ type: 'SET_LOADING' });
      loadPageData(currentPath).then(data => {
        if (data) {
          if (data.type === 'content') {
            dispatch({ type: 'SET_CONTENT', payload: data.data });
          } else if (data.type === 'folder') {
            dispatch({ type: 'SET_FOLDER', payload: { data: data.data, children: data.children } });
          }
        } else {
          dispatch({ type: 'SET_NOT_FOUND' });
        }
      });
    }
  }, [location.pathname]);

  const handleFilter = (filters: {
    searchTerm: string;
    selectedTags: string[];
    dateRange: { start: Date | null; end: Date | null };
  }) => {
    let filtered = [...allContentNodes];

    // Apply search filter
    if (filters.searchTerm) {
      filtered = TagManager.filterByContent(filtered, filters.searchTerm);
    }

    // Apply tag filter
    if (filters.selectedTags.length > 0) {
      filtered = TagManager.filterByTags(filtered, filters.selectedTags);
    }

    dispatch({ type: 'SET_FILTERED_CONTENT', payload: filtered });
  };

  const handleContentNodeClick = (nodeId: string) => {
    setActiveNodeId(nodeId);
    const element = document.getElementById(nodeId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNodeUpdate = (updatedNode: WikiDocument) => {
    dispatch({ type: 'UPDATE_CONTENT_NODE', payload: updatedNode });
    console.log('Update node:', updatedNode.id, updatedNode);
  };

  // Synchronized navigation flow - load data first, then navigate
  const handleNavigationClick = async (navId: string, path: string) => {
    if (isNavigating || pageData?.type === 'loading') return; // Prevent multiple concurrent navigations
    
    dispatch({ type: 'SET_NAVIGATING', payload: true });
    dispatch({ type: 'SET_LOADING' });
    
    try {
      // Load data first
      const data = await loadPageData(path);
      
      // Set data in state
      if (data) {
        if (data.type === 'content') {
          dispatch({ type: 'SET_CONTENT', payload: data.data });
        } else if (data.type === 'folder') {
          dispatch({ type: 'SET_FOLDER', payload: { data: data.data, children: data.children } });
        }
      } else {
        dispatch({ type: 'SET_NOT_FOUND' });
      }
      
      // Navigate after data is ready
      navigate(path, { replace: true });
    } catch (error) {
      console.error('Navigation error:', error);
      dispatch({ type: 'SET_NOT_FOUND' });
    } finally {
      dispatch({ type: 'SET_NAVIGATING', payload: false });
    }
  };

  // Refresh all data atomically
  const refreshAllData = async () => {
    try {
      const [structure, allNodes] = await Promise.all([
        ContentService.getNavigationStructure(),
        ContentService.getAllDocuments()
      ]);
      dispatch({ type: 'SET_NAVIGATION', payload: structure });
      dispatch({ type: 'SET_ALL_CONTENT', payload: allNodes });
      
      // Refresh current page data
      const data = await loadPageData(location.pathname);
      if (data) {
        if (data.type === 'content') {
          dispatch({ type: 'SET_CONTENT', payload: data.data });
        } else if (data.type === 'folder') {
          dispatch({ type: 'SET_FOLDER', payload: { data: data.data, children: data.children } });
        }
      } else {
        dispatch({ type: 'SET_NOT_FOUND' });
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  };

  // Helper function to find navigation node by path
  const findNodeByPath = (nodes: NavigationNode[], targetPath: string): NavigationNode | null => {
    for (const node of nodes) {
      if (node.path === targetPath) return node;
      const found = findNodeByPath(node.children || [], targetPath);
      if (found) return found;
    }
    return null;
  };

  // Render breadcrumb navigation
  const renderBreadcrumb = () => {
    // Only show for content pages, not during transitions
    if (!pageData || pageData.type !== 'content' || isNavigating) return null;
    
    const breadcrumbItems = [];
    const pathParts = pageData.data.path.split('/').filter(part => part);
    
    // Build breadcrumb path - start with Home if not root
    if (pathParts.length > 0) {
      breadcrumbItems.push({ title: 'Home', href: '/', isLast: false });
    }

    // Add each path segment
    for (let i = 1; i <= pathParts.length; i++) {
      const currentPath = '/' + pathParts.slice(0, i).join('/');
      const isLast = i === pathParts.length;
      
      const navNode = findNodeByPath(navigationStructure, currentPath);
      if (navNode) {
        breadcrumbItems.push({ title: navNode.title, href: currentPath, isLast });
      }
    }

    // Hide breadcrumbs for top-level pages (e.g., /deep-structures)
    // Only show breadcrumbs when there are 3+ items: Home + Top-level + Sub-page
    return breadcrumbItems.length > 2 ? (
      <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
        {breadcrumbItems.map((item, index) => (
          <div key={index} className="flex items-center">
            {index > 0 && <span className="h-4 w-4 mx-2">‣</span>}
            {item.isLast ? (
              <span className="text-foreground font-medium">{item.title}</span>
            ) : (
              <Link to={item.href} className="hover:text-foreground transition-colors">
                {item.title}
              </Link>
            )}
          </div>
        ))}
      </nav>
    ) : null;
  };

  // Render page title
  const renderPageTitle = () => {
    if (!pageData || pageData.type === 'loading') return null;
    
    const isContentPage = pageData.type === 'content';
    const targetPath = pageData.data.path;
    const currentNavNode = findNodeByPath(navigationStructure, targetPath);
    const displayTitle = currentNavNode?.title || pageData.data.title || 'Page';
    
    return <h1 className="text-4xl font-bold text-foreground">{displayTitle}</h1>;
  };

  // Render main content based on page type
  const renderContent = () => {
    if (!pageData) return <div className="text-center py-12"><p className="text-muted-foreground">Content not found</p></div>;
    
    if (pageData.type === 'content') {
      return (
        <div className="bg-card rounded-lg border border-border p-8 relative">
          <HierarchicalContentDisplay 
            content={HierarchyParser.sectionsToMarkup(pageData.data.content_json || [])}
            onSectionClick={handleContentNodeClick}
            onSectionView={handleSectionView}
          />
        </div>
      );
    }
    
    if (pageData.type === 'folder') {
      // If folder has content, show it
      if (pageData.data.content_json) {
        return (
          <div className="bg-card rounded-lg border border-border p-8 relative">
            <HierarchicalContentDisplay 
              content={HierarchyParser.sectionsToMarkup(pageData.data.content_json || [])}
              onSectionClick={handleContentNodeClick}
              onSectionView={handleSectionView}
            />
          </div>
        );
      }
      
      // Otherwise show folder landing page
      return (
        <FolderLandingPage
          folder={pageData.data}
          children={pageData.children}
          documents={allContentNodes}
          onCreateDocument={() => {
            setEditorData({ type: 'document', content: '' });
          }}
        />
      );
    }
    
    return null;
  };


  if (pageData?.type === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  // If no page data found for this route
  if (!pageData) {
    return (
      <WikiLayout 
        navigationStructure={navigationStructure}
        contentNodes={filteredContent}
        onContentNodeClick={handleContentNodeClick}
        activeNodeId={activeNodeId}
      >
        <div className="text-center py-16">
          <h1 className="text-4xl font-bold text-foreground mb-4">Content Not Found</h1>
          <p className="text-muted-foreground mb-8">
            The requested page doesn't exist yet. You can create it using the document editor.
          </p>
          <button 
            onClick={async () => {
              setEditorData({
                type: 'document',
                content: '',
              });
            }}
            className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Create Page
          </button>
        </div>
      </WikiLayout>
    );
  }

  return (
    <>
      <WikiLayout 
        navigationStructure={navigationStructure}
        contentNodes={filteredContent}
        onContentNodeClick={handleContentNodeClick}
        activeNodeId={activeNodeId}
        onStructureUpdate={refreshAllData}
        onSectionView={handleSectionView}
        onNavigationClick={handleNavigationClick}
        actionMenu={
          <SimpleActionMenu 
            onToggleDocumentEditor={() => setEditorData({
              type: 'document',
              content: pageData?.type === 'content' 
                ? HierarchyParser.sectionsToMarkup(pageData.data.content_json || [])
                : '',
            })}
            onToggleFilter={() => setShowFilterPanel(!showFilterPanel)}
          />
        }
      >
        <div className="space-y-6">
          {viewingSection ? (
            <SectionView 
              sectionData={viewingSection}
              onBack={() => setViewingSection(null)}
              onSectionNavigate={handleSectionNavigate}
              navigationStructure={navigationStructure}
            />
          ) : (
            <>
              {renderBreadcrumb()}
              {renderPageTitle()}
              {renderContent()}
            </>
          )}
        </div>
      </WikiLayout>

      <SimpleFilterPanel 
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onFilter={handleFilter}
        allTags={TagManager.getAllTags(allContentNodes)}
      />

      <UnifiedEditor 
        editorData={editorData}
        onSave={async (content: string) => {
          // Handle document save
          const currentPath = location.pathname;
          const parsed = HierarchyParser.parseMarkup(content);
          const success = await ContentService.saveDocumentContent(currentPath, parsed.sections);
          
          if (success) {
            toast.success("Document saved successfully");
            await refreshAllData();
          } else {
            toast.error("Failed to save document");
          }
        }}
        onClose={() => setEditorData(null)}
      />
    </>
  );
};

export default ContentPage;