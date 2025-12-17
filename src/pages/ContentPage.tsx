import React, { useEffect, useReducer, useCallback, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SimpleFilterPanel } from "@/components/SimpleFilterPanel";
import { BlockNoteSectionEditor } from "@/components/editor";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { FolderLandingPage } from "@/components/FolderLandingPage";
import { useLayoutContext } from "@/components/PersistentLayout";
import { NavigationNode, WikiDocument, ContentService, DocumentSection } from "@/services/contentService";
import { extractSectionFullContent } from '@/lib/sectionContentExtractor';
import { SectionViewData } from '@/hooks/useNavigationState';

/**
 * ContentPage - Main content display component
 * 
 * Key architectural changes:
 * 1. Uses centralized navigation state from useLayoutContext
 * 2. Section navigation is handled via navigation.navigateToSection() - atomic updates
 * 3. Hash-based navigation only used for initial page load, not for in-page navigation
 * 4. No more pendingHashRef - cleaner flow with single source of truth
 */

// Page data types
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

// Reduced state - navigation state is now in context
interface ContentPageState {
  pageData: PageData | null;
  filteredDocuments: WikiDocument[];
  filters: {
    searchTerm: string;
    selectedTags: string[];
  };
  isLoading: boolean;
}

type ContentPageAction =  
  | { type: 'SET_PAGE_DATA'; payload: PageData | null }
  | { type: 'SET_FILTERED_DOCUMENTS'; payload: WikiDocument[] }
  | { type: 'SET_FILTERS'; payload: Partial<ContentPageState['filters']> }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: ContentPageState = {
  pageData: null,
  filteredDocuments: [],
  filters: {
    searchTerm: '',
    selectedTags: []
  },
  isLoading: true,
};

const contentPageReducer = (state: ContentPageState, action: ContentPageAction): ContentPageState => {
  switch (action.type) {
    case 'SET_PAGE_DATA':
      return { ...state, pageData: action.payload };
    case 'SET_FILTERED_DOCUMENTS':
      return { ...state, filteredDocuments: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// Helper: Convert sections to markdown
const convertSectionsToMarkdown = (sections: DocumentSection[]): string => {
  if (!sections || sections.length === 0) return '';
  
  return sections.map(section => {
    const headerLevel = '#'.repeat(Math.max(1, section.level));
    const tags = section.tags?.length > 0 ? ` [${section.tags.join(', ')}]` : '';
    return `${headerLevel} ${section.title}${tags}\n\n${section.content || ''}\n\n`;
  }).join('').trim();
};

const ContentPage: React.FC = () => {
  const [state, dispatch] = useReducer(contentPageReducer, initialState);
  const { 
    showEditor, 
    showFilters, 
    setShowEditor, 
    setShowFilters, 
    navigationStructure,
    onStructureUpdate,
    navigation,
    setSectionNavigateHandler,
    expandDepth,
    expandMode,
    manualOverrides,
    setManualOverride,
    showDescriptions,
    descriptionOverrides,
    setDescriptionOverride
  } = useLayoutContext();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  // Track if initial hash has been processed for this path
  const processedHashRef = useRef<string | null>(null);

  // Load page data
  const loadPageData = async (currentPath: string): Promise<PageData | null> => {
    try {
      const contentItem = await ContentService.getContentItemByPath(currentPath);
      
      if (!contentItem) {
        return null;
      }
      
      if (contentItem.content_json !== null && contentItem.content_json !== undefined) {
        return {
          type: 'document',
          document: {
            ...contentItem,
            content_json: contentItem.content_json || []
          },
          sections: contentItem.content_json || []
        };
      }
      
      return {
        type: 'document',
        document: {
          ...contentItem,
          content_json: []
        },
        sections: []
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
      return pageData;
    } catch (error) {
      console.error('Error loading current page data:', error);
      dispatch({ type: 'SET_PAGE_DATA', payload: null });
      return null;
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

  /**
   * Navigate to a section within the current document
   * This is the core section navigation logic, called by both:
   * 1. Sidebar section clicks (via setSectionNavigateHandler)
   * 2. Main content section clicks
   * 
   * Uses centralized navigation state for atomic updates
   */
  const navigateToSectionByTitle = useCallback((sectionTitle: string) => {
    if (!state.pageData || state.pageData.type !== 'document') return;
    
    // Avoid re-navigating to the same section (check against centralized state)
    if (navigation.sectionTitle?.toLowerCase() === sectionTitle.toLowerCase()) {
      return;
    }
    
    const targetSection = state.pageData.sections.find(
      s => s.title.toLowerCase() === sectionTitle.toLowerCase()
    );
    
    if (targetSection) {
      const { content, title, level, parentPath, sectionHierarchy } = 
        extractSectionFullContent(targetSection, state.pageData.sections);
      
      const viewData: SectionViewData = {
        content,
        title,
        level,
        parentPath,
        sectionHierarchy
      };
      
      // Atomic state update - no race conditions
      navigation.navigateToSection(
        state.pageData.document.path,
        targetSection.id,
        targetSection.title,
        viewData
      );
    }
  }, [state.pageData, navigation]);

  /**
   * Navigate to a section by ID (used for hash-based initial load)
   */
  const navigateToSectionById = useCallback((sectionId: string) => {
    if (!state.pageData || state.pageData.type !== 'document') return false;
    
    const targetSection = state.pageData.sections.find(s => {
      // Match by ID directly or by generated slug from title
      const generatedId = s.title
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/--+/g, '-')
        .trim();
      return s.id === sectionId || generatedId === sectionId;
    });
    
    if (targetSection) {
      const { content, title, level, parentPath, sectionHierarchy } = 
        extractSectionFullContent(targetSection, state.pageData.sections);
      
      const viewData: SectionViewData = {
        content,
        title,
        level,
        parentPath,
        sectionHierarchy
      };
      
      navigation.navigateToSection(
        state.pageData.document.path,
        targetSection.id,
        targetSection.title,
        viewData
      );
      
      return true;
    }
    
    return false;
  }, [state.pageData, navigation]);

  // Register section navigation handler with layout context
  useEffect(() => {
    setSectionNavigateHandler(navigateToSectionByTitle);
    
    return () => {
      setSectionNavigateHandler(null);
    };
  }, [navigateToSectionByTitle, setSectionNavigateHandler]);

  /**
   * Main page load effect - triggered by pathname changes
   * 
   * This effect:
   * 1. Loads page data for the new path
   * 2. Updates navigation state to reflect the new document
   * 3. Stores any hash for processing after data loads
   */
  useEffect(() => {
    const initializePage = async () => {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      // Reset processed hash when path changes
      processedHashRef.current = null;
      
      try {
        const pageData = await loadCurrentPageData(location.pathname);
        await loadAllDocuments();
        
        // Update navigation state to this document
        if (pageData?.type === 'document') {
          // If there's a hash and we haven't processed it, let the hash effect handle it
          // Otherwise, navigate to document root
          if (!location.hash) {
            navigation.navigateToDocument(pageData.document.path);
          }
        }
      } catch (error) {
        console.error('Error initializing page:', error);
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    initializePage();
  }, [location.pathname]); // Only pathname, not hash

  /**
   * Hash navigation effect - handles initial section navigation from URL
   * 
   * Only processes hash ONCE per path change to avoid loops
   */
  useEffect(() => {
    // Don't process if:
    // 1. Still loading
    // 2. No hash
    // 3. Already processed this hash for this path
    // 4. No page data
    if (state.isLoading || !location.hash || !state.pageData) return;
    
    const hash = location.hash.slice(1);
    const pathWithHash = `${location.pathname}#${hash}`;
    
    // Skip if already processed this exact path+hash combo
    if (processedHashRef.current === pathWithHash) return;
    
    processedHashRef.current = pathWithHash;
    
    if (state.pageData.type !== 'document') return;
    
    // Handle #root - clear section view
    if (hash === 'root') {
      navigation.navigateToDocument(state.pageData.document.path);
      // Clean URL
      window.history.replaceState(null, '', location.pathname);
      return;
    }
    
    // Try to navigate to section by ID
    const success = navigateToSectionById(hash);
    
    if (success) {
      // Clean URL after successful navigation
      window.history.replaceState(null, '', location.pathname);
    }
  }, [state.isLoading, state.pageData, location.hash, location.pathname, navigation, navigateToSectionById]);

  /**
   * Clear section view - returns to document root
   */
  const handleClearSection = useCallback(() => {
    navigation.clearSection();
  }, [navigation]);

  // Handle manual section toggle for expand/collapse
  const handleSectionToggle = useCallback((sectionId: string, currentlyExpanded: boolean) => {
    setManualOverride(sectionId, !currentlyExpanded);
  }, [setManualOverride]);

  // Handle description toggle
  const handleDescriptionToggle = useCallback((sectionId: string, currentlyVisible: boolean) => {
    setDescriptionOverride(sectionId, !currentlyVisible);
  }, [setDescriptionOverride]);

  // Filter handler
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

  // Editor save handler
  const handleEditorSave = async (sections: DocumentSection[], skipReload = false) => {
    if (!state.pageData || state.pageData.type !== 'document') return;
    
    try {
      await ContentService.saveDocumentContent(state.pageData.document.path, sections);
      onStructureUpdate();
      
      if (!skipReload) {
        await loadCurrentPageData(state.pageData.document.path);
      }
    } catch (error) {
      console.error('Error saving document:', error);
    }
  };

  // Create document handler
  const handleCreateDocument = async () => {
    if (!state.pageData || state.pageData.type !== 'folder') return;
    
    const folderData = state.pageData;
    
    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, '');
      const documentPath = folderData.folder.path === '/' 
        ? `/new-document-${timestamp}` 
        : `${folderData.folder.path}/new-document-${timestamp}`;
      
      const initialSections = [{
        id: '1',
        title: 'New Document',
        level: 1,
        content: 'Start writing your content here...',
        tags: []
      }];
      
      const success = await ContentService.saveDocumentContent(documentPath, initialSections);
      
      if (success) {
        navigate(documentPath);
        setShowEditor(true);
      }
    } catch (error) {
      console.error('Error creating new document:', error);
    }
  };

  // Render page content
  const renderPageContent = () => {
    if (!state.pageData) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">Page not found</p>
        </div>
      );
    }

    if (state.pageData.type === 'folder') {
      const folderData = state.pageData;
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

    return (
      <div className="space-y-6">
        {/* Breadcrumb */}
        <PageBreadcrumb 
          currentPath={location.pathname} 
          navigationStructure={navigationStructure}
          pageTitle={document.title}
          sectionTitle={navigation.sectionView?.title}
          sectionHierarchy={navigation.sectionView?.sectionHierarchy}
          onSectionBack={handleClearSection}
          onSectionNavigate={navigateToSectionByTitle}
        />
        
        {showEditor ? (
          <BlockNoteSectionEditor
            sections={sections}
            onSave={handleEditorSave}
            onClose={() => setShowEditor(false)}
          />
        ) : navigation.sectionView ? (
          // Showing a specific section
          <div className="space-y-4">
            <h1 className="text-3xl font-bold mb-1">{navigation.sectionView.title}</h1>
            <HierarchicalContentDisplay
              content={navigation.sectionView.content}
              onSectionClick={navigateToSectionByTitle}
              activeNodeId={navigation.sectionId || undefined}
              documentTitle={navigation.sectionView.title}
              expandedSections={expandMode === 'mixed' ? manualOverrides : undefined}
              defaultExpandDepth={expandMode === 'depth' ? expandDepth : undefined}
              onToggleSection={handleSectionToggle}
              showDescriptions={showDescriptions}
              descriptionOverrides={descriptionOverrides}
              onToggleDescription={handleDescriptionToggle}
            />
          </div>
        ) : (
          // Showing full document
          <div className="space-y-6">
            <HierarchicalContentDisplay
              content={convertSectionsToMarkdown(sections)}
              onSectionClick={navigateToSectionByTitle}
              activeNodeId={navigation.sectionId || undefined}
              documentTitle={document.title}
              expandedSections={expandMode === 'mixed' ? manualOverrides : undefined}
              defaultExpandDepth={expandMode === 'depth' ? expandDepth : undefined}
              onToggleSection={handleSectionToggle}
              showDescriptions={showDescriptions}
              descriptionOverrides={descriptionOverrides}
              onToggleDescription={handleDescriptionToggle}
            />
          </div>
        )}
      </div>
    );
  };

  // Get all unique tags
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

      {renderPageContent()}
    </>
  );
};

export default ContentPage;
