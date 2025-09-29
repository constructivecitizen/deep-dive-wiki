import React, { useEffect, useState, useReducer } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SimpleFilterPanel } from "@/components/SimpleFilterPanel";
import { UnifiedEditor } from "@/components/UnifiedEditor";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { FolderLandingPage } from "@/components/FolderLandingPage";
import { useLayoutContext } from "@/components/PersistentLayout";
import { NavigationNode, WikiDocument, ContentService, DocumentSection } from "@/services/contentService";
import { extractSectionFullContent } from '@/lib/sectionContentExtractor';
import { findSectionByHash, generateSectionId } from '@/lib/sectionUtils';

// Constants
const PAGE_TYPES = {
  LOADING: 'loading',
  CONTENT: 'content',
  FOLDER: 'folder'
} as const;

// Interfaces
interface PageData {
  type: 'content' | 'folder';
  title: string;
  content?: string;
  path: string;
  children?: NavigationNode[];
}

// State for managing content and UI
interface ContentPageState {
  // Current page data
  pageData: PageData | null;
  filteredDocuments: WikiDocument[];
  
  // Section view data (when viewing a specific section)
  sectionView: {
    content: string;
    title: string;
    level: number;
    parentPath: string;
    sectionHierarchy: Array<{ title: string; level: number }>;
  } | null;
  
  // UI states
  isLoading: boolean;
}

// Actions for state management
type ContentPageAction =  
  // Page data actions
  | { type: 'SET_PAGE_DATA'; payload: PageData | null }
  | { type: 'SET_FILTERED_DOCUMENTS'; payload: WikiDocument[] }
  | { type: 'SET_SECTION_VIEW'; payload: ContentPageState['sectionView'] }
  // UI actions
  | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: ContentPageState = {
  pageData: null,
  filteredDocuments: [],
  sectionView: null,
  isLoading: true,
};

// Reducer function
const contentPageReducer = (state: ContentPageState, action: ContentPageAction): ContentPageState => {
  switch (action.type) {
    case 'SET_PAGE_DATA':
      return { ...state, pageData: action.payload, sectionView: null }; // Clear section view when loading new page
    case 'SET_FILTERED_DOCUMENTS':
      return { ...state, filteredDocuments: action.payload };
    case 'SET_SECTION_VIEW':
      return { ...state, sectionView: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

const ContentPage: React.FC = () => {
  const [state, dispatch] = useReducer(contentPageReducer, initialState);
  const { showEditor, showFilters, setShowEditor, setShowFilters, navigationStructure } = useLayoutContext();
  const location = useLocation();
  const navigate = useNavigate();

  // Helper function to convert DocumentSection[] to markdown string
  const convertSectionsToMarkdown = (sections: DocumentSection[]): string => {
    if (!sections || sections.length === 0) return '';
    
    return sections.map(section => {
      const headerLevel = '#'.repeat(Math.max(1, section.level));
      const tags = section.tags?.length > 0 ? ` [${section.tags.join(', ')}]` : '';
      return `${headerLevel} ${section.title}${tags}\n\n${section.content || ''}\n\n`;
    }).join('').trim();
  };

  const loadPageData = async (currentPath: string): Promise<PageData> => {
    try {
      // Try to get document first
      const document = await ContentService.getDocumentByPath(currentPath);
      if (document) {
        return {
          type: 'content',
          title: document.title,
          content: convertSectionsToMarkdown(document.content_json || []),
          path: document.path
        };
      }

      // Try to get folder
      const folder = await ContentService.getNavigationNodeByPath(currentPath);
      if (folder) {
        const children = await ContentService.getNavigationNodeChildren(currentPath);
        return {
          type: 'folder',
          title: folder.title,
          path: folder.path,
          children
        };
      }

      // Default case - create a new document structure
      return {
        type: 'content',
        title: 'New Document',
        content: '',
        path: currentPath
      };
    } catch (error) {
      console.error('Error loading page data:', error);
      throw error;
    }
  };

  const loadCurrentPageData = async (path: string) => {
    try {
      const pageData = await loadPageData(path);
      dispatch({ type: 'SET_PAGE_DATA', payload: pageData });
    } catch (error) {
      console.error('Error loading current page data:', error);
      dispatch({ type: 'SET_PAGE_DATA', payload: null });
    }
  };

  const loadAllDocuments = async () => {
    try {
      const documents = await ContentService.getAllDocuments();
      dispatch({ type: 'SET_FILTERED_DOCUMENTS', payload: documents });
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  const handleFilter = async (filters: { 
    searchTerm: string; 
    selectedTags: string[];
    dateRange: { start: Date | null; end: Date | null };
  }) => {
    try {
      const documents = await ContentService.getAllDocuments();
      let filtered = [...documents];

      if (filters.searchTerm) {
        const term = filters.searchTerm.toLowerCase();
        filtered = filtered.filter(doc => 
          doc.title.toLowerCase().includes(term) ||
          convertSectionsToMarkdown(doc.content_json || []).toLowerCase().includes(term)
        );
      }

      if (filters.selectedTags.length > 0) {
        filtered = filtered.filter(doc => 
          doc.tags?.some(tag => filters.selectedTags.includes(tag))
        );
      }

      dispatch({ type: 'SET_FILTERED_DOCUMENTS', payload: filtered });
    } catch (error) {
      console.error('Error filtering documents:', error);
    }
  };

  const handleStructureUpdate = async () => {
    // Reload current page data to reflect any changes
    if (location.pathname) {
      await loadCurrentPageData(location.pathname);
    }
  };

  const handleEditorSave = async (content: string) => {
    if (!state.pageData) return;
    
    try {
      // Parse the markdown content into sections
      const { HierarchyParser } = await import('@/lib/hierarchyParser');
      const sections = HierarchyParser.parseMarkup(content).sections;
      
      // Save the document content
      await ContentService.saveDocumentContent(state.pageData.path, sections);
      
      // Reload the page data to reflect changes
      await loadCurrentPageData(state.pageData.path);
      
      // Close the editor
      setShowEditor(false);
      
      console.log('Document saved successfully');
    } catch (error) {
      console.error('Error saving document:', error);
      // Keep editor open on error so user doesn't lose their changes
    }
  };

  // Load current page on mount and path change
  useEffect(() => {
    const initializePage = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      try {
        // Load current page data
        await loadCurrentPageData(location.pathname);
        
        // Load documents for filtering
        await loadAllDocuments();
        
      } catch (error) {
        console.error('Error initializing page:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializePage();
  }, [location.pathname]);

  // Handle section extraction for hash navigation
  useEffect(() => {
    if (location.hash && state.pageData?.type === 'content') {
      const sectionId = location.hash.substring(1); // Remove # from hash
      
      try {
        // Get the document to extract sections from
        const getDocument = async () => {
          const document = await ContentService.getDocumentByPath(location.pathname);
          if (document && document.content_json) {
            const section = findSectionByHash(document.content_json, sectionId);
            
            if (section) {
              const sectionContent = extractSectionFullContent(section, document.content_json);
              dispatch({ 
                type: 'SET_SECTION_VIEW', 
                payload: sectionContent
              });
            } else {
              // Section not found, clear section view
              dispatch({ type: 'SET_SECTION_VIEW', payload: null });
            }
          }
        };
        
        getDocument();
      } catch (error) {
        console.error('Error extracting section content:', error);
        dispatch({ type: 'SET_SECTION_VIEW', payload: null });
      }
    } else {
      // No hash, clear section view
      dispatch({ type: 'SET_SECTION_VIEW', payload: null });
    }
  }, [location.hash, location.pathname]);

  const handleCreateDocument = async () => {
    if (!state.pageData || state.pageData.type !== 'folder') return;
    
    try {
      // Create a unique document name within the folder
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const documentPath = state.pageData.path === '/' 
        ? `/new-document-${timestamp}` 
        : `${state.pageData.path}/new-document-${timestamp}`;
      
      // Create a new document with initial content
      const initialSections = [{
        id: '1',
        title: 'New Document',
        level: 1,
        content: 'Start writing your content here...',
        tags: []
      }];
      
      // Save the new document
      const success = await ContentService.saveDocumentContent(documentPath, initialSections);
      
      if (success) {
        // Navigate to the new document and open editor
        navigate(documentPath);
        setShowEditor(true);
      } else {
        console.error('Failed to create new document');
      }
    } catch (error) {
      console.error('Error creating new document:', error);
    }
  };

  const renderPageContent = () => {
    if (!state.pageData) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Page not found</p>
        </div>
      );
    }

    if (state.pageData.type === 'folder') {
      return (
        <FolderLandingPage
          folder={state.pageData as any}
          children={state.pageData.children || []}
          documents={state.filteredDocuments}
          onCreateDocument={handleCreateDocument}
          onToggleDocumentEditor={() => setShowEditor(!showEditor)}
        />
      );
    }

    // Content page
    return (
      <div className="space-y-6">
        <PageBreadcrumb 
          currentPath={state.pageData.path} 
          navigationStructure={navigationStructure} 
          sectionTitle={state.sectionView?.title}
          sectionHierarchy={state.sectionView?.sectionHierarchy}
          onSectionBack={() => navigate(state.pageData?.path || location.pathname)}
          onSectionNavigate={(sectionTitle) => {
            // Navigate to section using proper generateSectionId utility
            const sectionId = generateSectionId(sectionTitle);
            navigate(`${state.pageData?.path || location.pathname}#${sectionId}`);
          }}
        />
        
        {showEditor ? (
          <UnifiedEditor
            editorData={{ 
              type: 'document', 
              content: state.sectionView?.content || state.pageData.content || '' 
            }}
            onSave={handleEditorSave}
            onClose={() => setShowEditor(false)}
          />
        ) : (
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <h1 className="text-2xl font-bold mb-6">
              {state.sectionView?.title || state.pageData.title}
            </h1>
            
            {/* Show section content if viewing a section, otherwise show full content */}
            {state.sectionView ? (
              <HierarchicalContentDisplay 
                content={state.sectionView.content}
                currentSectionId={location.hash.substring(1)}
                documentPath={state.pageData.path}
                onSectionClick={(sectionId) => {
                  // Find the section and navigate to it
                  const sectionHash = generateSectionId(sectionId);
                  navigate(`${state.pageData.path}#${sectionHash}`);
                }}
                activeNodeId={location.hash.substring(1) || undefined}
              />
            ) : state.pageData.content && (
              <HierarchicalContentDisplay 
                content={state.pageData.content}
                documentPath={state.pageData.path}
                onSectionClick={(sectionId) => {
                  // Find the section and navigate to it
                  const sectionHash = generateSectionId(sectionId);
                  navigate(`${state.pageData.path}#${sectionHash}`);
                }}
                activeNodeId={location.hash.substring(1) || undefined}
              />
            )}
          </div>
        )}
      </div>
    );
  };

  // Get all unique tags from filtered documents
  const allTags = [...new Set(state.filteredDocuments.flatMap(doc => doc.tags || []))];

  if (state.isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <>
      {showFilters && (
        <div className="mb-6">
          <SimpleFilterPanel 
            isOpen={showFilters}
            onClose={() => setShowFilters(false)}
            onFilter={handleFilter}
            allTags={allTags}
          />
        </div>
      )}

      {/* Content based on page type */}
      {renderPageContent()}
    </>
  );
};

export default ContentPage;