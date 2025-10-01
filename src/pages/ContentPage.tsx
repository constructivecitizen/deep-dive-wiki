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

// Constants
const PAGE_TYPES = {
  LOADING: 'loading',
  CONTENT: 'content',
  FOLDER: 'folder'
} as const;

// Interfaces
interface PageDataDocument {
  type: 'document';
  document: WikiDocument;
  sections: DocumentSection[];
}

interface PageDataFolder {
  type: 'folder';
  folder: NavigationNode;
  documents: WikiDocument[];
}

type PageData = PageDataDocument | PageDataFolder;

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
  
  // Current section ID for navigation
  currentSectionId: string | null;
  
  // Filter state
  filters: {
    searchTerm: string;
    selectedTags: string[];
  };
  
  // UI states
  isLoading: boolean;
}

// Actions for state management
type ContentPageAction =  
  // Page data actions
  | { type: 'SET_PAGE_DATA'; payload: PageData | null }
  | { type: 'SET_FILTERED_DOCUMENTS'; payload: WikiDocument[] }
  | { type: 'SET_SECTION_VIEW'; payload: ContentPageState['sectionView'] }
  | { type: 'SET_CURRENT_SECTION'; payload: string | null }
  | { type: 'SET_FILTERS'; payload: Partial<ContentPageState['filters']> }
  // UI actions
  | { type: 'SET_LOADING'; payload: boolean };

// Initial state
const initialState: ContentPageState = {
  pageData: null,
  filteredDocuments: [],
  sectionView: null,
  currentSectionId: null,
  filters: {
    searchTerm: '',
    selectedTags: []
  },
  isLoading: true,
};

// Reducer function
const contentPageReducer = (state: ContentPageState, action: ContentPageAction): ContentPageState => {
  switch (action.type) {
    case 'SET_PAGE_DATA':
      return { ...state, pageData: action.payload, sectionView: null, currentSectionId: null }; // Clear section view when loading new page
    case 'SET_FILTERED_DOCUMENTS':
      return { ...state, filteredDocuments: action.payload };
    case 'SET_SECTION_VIEW':
      return { ...state, sectionView: action.payload };
    case 'SET_CURRENT_SECTION':
      return { ...state, currentSectionId: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

const ContentPage: React.FC = () => {
  const [state, dispatch] = useReducer(contentPageReducer, initialState);
  const { 
    showEditor, 
    showFilters, 
    setShowEditor, 
    setShowFilters, 
    navigationStructure,
    setActiveSectionId,
    sectionNavigateRef
  } = useLayoutContext();
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

  const loadPageData = async (currentPath: string): Promise<PageData | null> => {
    try {
      // Try to get document first
      const document = await ContentService.getDocumentByPath(currentPath);
      if (document) {
        return {
          type: 'document',
          document,
          sections: document.content_json || []
        };
      }

      // Try to get folder
      const folder = await ContentService.getNavigationNodeByPath(currentPath);
      if (folder) {
        const allDocuments = await ContentService.getAllDocuments();
        // Get documents in this folder
        const folderDocuments = allDocuments.filter(doc => 
          doc.path.startsWith(folder.path + '/') || doc.path === folder.path
        );
        
        return {
          type: 'folder',
          folder,
          documents: folderDocuments
        };
      }

      return null;
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
    if (!state.pageData || state.pageData.type !== 'document') return;
    
    try {
      // Use the document title for pre-header content
      const documentTitle = state.pageData.document.title;
      
      // Parse the markdown content into sections
      const { HierarchyParser } = await import('@/lib/hierarchyParser');
      const sections = HierarchyParser.parseMarkup(content, documentTitle).sections;
      
      // Save the document content
      await ContentService.saveDocumentContent(state.pageData.document.path, sections);
      
      // Reload the page data to reflect changes
      await loadCurrentPageData(state.pageData.document.path);
      
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

  // Handle URL hash for section navigation on initial load
  useEffect(() => {
    if (!state.pageData || state.pageData.type !== 'document' || !location.hash) return;
    
    const hash = location.hash.slice(1); // Remove the # symbol
    if (!hash) return;

    // Find section by hash (could be section ID or generated from title)
    const targetSection = state.pageData.sections.find(s => {
      const generatedId = s.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
      return s.id === hash || generatedId === hash;
    });

    if (targetSection) {
      // Navigate to the section
      handleSectionNavigate(targetSection.title);
      // Clear the hash from URL since we're using state-based navigation now
      window.history.replaceState(null, '', location.pathname);
    }
  }, [state.pageData, location.hash]);

  // Handle section navigation
  const handleSectionNavigate = (sectionTitle: string) => {
    if (!state.pageData || state.pageData.type !== 'document') return;
    
    const targetSection = state.pageData.sections.find(
      s => s.title.toLowerCase() === sectionTitle.toLowerCase()
    );
    
    if (targetSection) {
      const { content, title, level, parentPath, sectionHierarchy } = 
        extractSectionFullContent(targetSection, state.pageData.sections);
      
      dispatch({
        type: 'SET_SECTION_VIEW',
        payload: {
          content,
          title,
          level,
          parentPath,
          sectionHierarchy
        }
      });
      dispatch({ type: 'SET_CURRENT_SECTION', payload: targetSection.id });
      setActiveSectionId(targetSection.id);
    }
  };

  const handleClearSection = () => {
    dispatch({ type: 'SET_SECTION_VIEW', payload: null });
    dispatch({ type: 'SET_CURRENT_SECTION', payload: null });
    setActiveSectionId(null);
  };

  // Provide section navigation function to layout context
  useEffect(() => {
    sectionNavigateRef.current = handleSectionNavigate;
  }, [sectionNavigateRef]);

  // Update active section ID in layout context
  useEffect(() => {
    setActiveSectionId(state.currentSectionId);
  }, [state.currentSectionId, setActiveSectionId]);

  const handleCreateDocument = async () => {
    if (!state.pageData || state.pageData.type !== 'folder') return;
    
    const folderData = state.pageData; // Type narrowed to PageDataFolder
    
    try {
      // Create a unique document name within the folder
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const documentPath = folderData.folder.path === '/' 
        ? `/new-document-${timestamp}` 
        : `${folderData.folder.path}/new-document-${timestamp}`;
      
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
      const folderData = state.pageData; // Type narrowed to PageDataFolder
      
      // Get child folders for this folder
      const childFolders = navigationStructure.filter(node => 
        node.parent_id === folderData.folder.id
      );
      
      return (
        <FolderLandingPage
          folder={folderData.folder}
          children={childFolders}
          documents={folderData.documents}
          onCreateDocument={handleCreateDocument}
          onToggleDocumentEditor={() => setShowEditor(!showEditor)}
        />
      );
    }

    // Document page
    const { document, sections } = state.pageData;
    
    // Check if first section is pre-header content (matches document title)
    const firstSection = sections[0];
    const hasPreHeaderContent = firstSection && 
      firstSection.title === document.title && 
      firstSection.level === 1;

    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <PageBreadcrumb 
          currentPath={location.pathname} 
          navigationStructure={navigationStructure}
          pageTitle={document.title}
          sectionTitle={state.sectionView?.title}
          sectionHierarchy={state.sectionView?.sectionHierarchy}
          onSectionBack={handleClearSection}
          onSectionNavigate={handleSectionNavigate}
        />
        
        {showEditor ? (
          <UnifiedEditor
            editorData={{
              type: 'document',
              content: convertSectionsToMarkdown(sections)
            }}
            onSave={handleEditorSave}
            onClose={() => setShowEditor(false)}
          />
        ) : state.sectionView ? (
          // Showing a specific section
          <div className="space-y-6">
            <div className="border-b pb-4">
              <h1 className="text-3xl font-bold">{state.sectionView.title}</h1>
              {state.sectionView.sectionHierarchy && state.sectionView.sectionHierarchy.length > 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  {state.sectionView.sectionHierarchy.map(s => s.title).join(' > ')}
                </p>
              )}
            </div>
            <HierarchicalContentDisplay 
              content={state.sectionView.content}
              onSectionClick={handleSectionNavigate}
              activeNodeId={state.currentSectionId || undefined}
              documentTitle={state.sectionView.title}
            />
          </div>
        ) : (
          // Showing full document
          <div className="space-y-6">
            {/* Show document title if there's pre-header content */}
            {hasPreHeaderContent && (
              <div className="border-b pb-4">
                <h1 className="text-3xl font-bold">{document.title}</h1>
              </div>
            )}
            <HierarchicalContentDisplay 
              content={convertSectionsToMarkdown(sections)}
              onSectionClick={handleSectionNavigate}
              activeNodeId={state.currentSectionId || undefined}
              documentTitle={document.title}
            />
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