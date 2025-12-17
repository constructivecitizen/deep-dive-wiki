import React, { useEffect, useReducer, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { SimpleFilterPanel } from "@/components/SimpleFilterPanel";
import { BlockNoteSectionEditor } from "@/components/editor";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { FolderLandingPage } from "@/components/FolderLandingPage";
import { useLayoutContext } from "@/components/PersistentLayout";
import { NavigationNode, WikiDocument, ContentService, DocumentSection } from "@/services/contentService";
import { extractSectionFullContent } from "@/lib/sectionContentExtractor";
import { resolveInternalLink } from "@/lib/internalLinkResolver";
import { SectionViewData } from "@/hooks/useNavigationState";

/**
 * ContentPage - Main content display component
 *
 * Key architectural notes:
 * 1. Uses centralized navigation state from useLayoutContext
 * 2. Section navigation is handled via navigation.navigateToSection() - atomic updates
 * 3. Hash-based navigation only used for initial page load from URL
 * 4. Hash effect checks navigation.sectionId to determine if section already loaded
 */

// Page data types
interface PageDataDocument {
  type: "document";
  document: WikiDocument;
  sections: DocumentSection[];
}

interface PageDataFolder {
  type: "folder";
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
  | { type: "SET_PAGE_DATA"; payload: PageData | null }
  | { type: "SET_FILTERED_DOCUMENTS"; payload: WikiDocument[] }
  | { type: "SET_FILTERS"; payload: Partial<ContentPageState["filters"]> }
  | { type: "SET_LOADING"; payload: boolean };

const initialState: ContentPageState = {
  pageData: null,
  filteredDocuments: [],
  filters: {
    searchTerm: "",
    selectedTags: [],
  },
  isLoading: true,
};

const contentPageReducer = (state: ContentPageState, action: ContentPageAction): ContentPageState => {
  switch (action.type) {
    case "SET_PAGE_DATA":
      return { ...state, pageData: action.payload };
    case "SET_FILTERED_DOCUMENTS":
      return { ...state, filteredDocuments: action.payload };
    case "SET_FILTERS":
      return { ...state, filters: { ...state.filters, ...action.payload } };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
};

// Helper: Convert sections to markdown
const convertSectionsToMarkdown = (sections: DocumentSection[]): string => {
  if (!sections || sections.length === 0) return "";

  return sections
    .map((section) => {
      const headerLevel = "#".repeat(Math.max(1, section.level));
      const tags = section.tags?.length > 0 ? ` [${section.tags.join(", ")}]` : "";
      return `${headerLevel} ${section.title}${tags}\n\n${section.content || ""}\n\n`;
    })
    .join("")
    .trim();
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
    setDescriptionOverride,
  } = useLayoutContext();

  const location = useLocation();
  const navigate = useNavigate();

  // Extract stable functions from navigation to use in effects
  const { navigateToDocument, navigateToSection } = navigation;

  // Load page data
  const loadPageData = async (currentPath: string): Promise<PageData | null> => {
    try {
      const contentItem = await ContentService.getContentItemByPath(currentPath);

      if (!contentItem) {
        return null;
      }

      if (contentItem.content_json !== null && contentItem.content_json !== undefined) {
        return {
          type: "document",
          document: {
            ...contentItem,
            content_json: contentItem.content_json || [],
          },
          sections: contentItem.content_json || [],
        };
      }

      return {
        type: "document",
        document: {
          ...contentItem,
          content_json: [],
        },
        sections: [],
      };
    } catch (error) {
      console.error("Error loading page data:", error);
      throw error;
    }
  };

  const loadCurrentPageData = async (path: string) => {
    try {
      const pageData = await loadPageData(path);
      dispatch({ type: "SET_PAGE_DATA", payload: pageData });
      return pageData;
    } catch (error) {
      console.error("Error loading current page data:", error);
      dispatch({ type: "SET_PAGE_DATA", payload: null });
      return null;
    }
  };

  const loadAllDocuments = async () => {
    try {
      const documents = await ContentService.getAllDocuments();
      dispatch({ type: "SET_FILTERED_DOCUMENTS", payload: documents });
    } catch (error) {
      console.error("Error loading documents:", error);
    }
  };

  /**
   * Navigate to a section within the current document by title.
   * Called by:
   * 1. Sidebar section clicks (via setSectionNavigateHandler)
   * 2. Main content section clicks
   */
  const navigateToSectionByTitle = useCallback(
    (sectionTitle: string) => {
      if (!state.pageData || state.pageData.type !== "document") return;

      // Avoid re-navigating to the same section
      if (navigation.sectionTitle?.toLowerCase() === sectionTitle.toLowerCase()) {
        return;
      }

      const targetSection = state.pageData.sections.find((s) => s.title.toLowerCase() === sectionTitle.toLowerCase());

      if (targetSection) {
        const { content, title, level, parentPath, sectionHierarchy } = extractSectionFullContent(
          targetSection,
          state.pageData.sections,
        );

        const viewData: SectionViewData = {
          content,
          title,
          level,
          parentPath,
          sectionHierarchy,
        };

        navigateToSection(state.pageData.document.path, targetSection.id, targetSection.title, viewData);
      }
    },
    [state.pageData, navigation.sectionTitle, navigateToSection],
  );

  /**
   * Navigate to a section by ID (used for hash-based initial load).
   * Returns true if section was found and navigation occurred.
   */
  const navigateToSectionById = useCallback(
    (sectionId: string, pageData: PageData | null): boolean => {
      if (!pageData || pageData.type !== "document") return false;

      const targetSection = pageData.sections.find((s) => {
        // Match by ID directly or by generated slug from title
        const generatedId = s.title
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .replace(/\s+/g, "-")
          .replace(/--+/g, "-")
          .trim();
        return s.id === sectionId || generatedId === sectionId;
      });

      if (targetSection) {
        const { content, title, level, parentPath, sectionHierarchy } = extractSectionFullContent(
          targetSection,
          pageData.sections,
        );

        const viewData: SectionViewData = {
          content,
          title,
          level,
          parentPath,
          sectionHierarchy,
        };

        navigateToSection(pageData.document.path, targetSection.id, targetSection.title, viewData);

        return true;
      }

      return false;
    },
    [navigateToSection],
  );

  /**
   * Handle clicks on internal links within content
   * Supports same-document links (#section) and cross-document links (/path#section)
   */
  const handleInternalLinkClick = useCallback(
    (target: string) => {
      if (!state.pageData || state.pageData.type !== "document") return;

      const resolved = resolveInternalLink(target, state.pageData.sections);

      if (!resolved) {
        console.warn("Could not resolve internal link:", target);
        return;
      }

      if (resolved.type === "same-document" && resolved.sectionTitle) {
        // Navigate to section in current document
        navigateToSectionByTitle(resolved.sectionTitle);
      } else if (resolved.type === "cross-document") {
        // Navigate to different document
        const url = resolved.sectionTitle
          ? `${resolved.documentPath}#${encodeURIComponent(resolved.sectionTitle)}`
          : resolved.documentPath;
        navigate(url || "/");
      }
    },
    [state.pageData, navigateToSectionByTitle, navigate],
  );

  // Register section navigation handler with layout context
  useEffect(() => {
    setSectionNavigateHandler(navigateToSectionByTitle);
    return () => setSectionNavigateHandler(null);
  }, [navigateToSectionByTitle, setSectionNavigateHandler]);

  /**
   * Main page load effect - triggered by pathname changes.
   *
   * Loads page data and sets navigation to document root (unless hash present).
   */
  useEffect(() => {
    const initializePage = async () => {
      dispatch({ type: "SET_LOADING", payload: true });

      try {
        const pageData = await loadCurrentPageData(location.pathname);
        await loadAllDocuments();

        // If no hash, navigate to document root
        // If hash present, the hash effect will handle section navigation
        if (pageData?.type === "document" && !location.hash) {
          navigateToDocument(pageData.document.path);
        }
      } catch (error) {
        console.error("Error initializing page:", error);
      } finally {
        dispatch({ type: "SET_LOADING", payload: false });
      }
    };

    initializePage();
  }, [location.pathname, navigateToDocument]); // Note: location.hash intentionally excluded

  /**
   * Hash navigation effect - handles section navigation from URL hash.
   *
   * Key logic:
   * 1. Wait for page data to load
   * 2. Check if we already have a section selected for this document
   * 3. If not, process the hash to navigate to the section
   * 4. Clean URL after processing
   *
   * This approach avoids the stale ref issue by checking actual navigation state.
   */
  useEffect(() => {
    // Wait for loading to complete
    if (state.isLoading) return;

    // No hash to process
    if (!location.hash) return;

    // No page data yet
    if (!state.pageData || state.pageData.type !== "document") return;

    const hash = location.hash.slice(1);
    const currentDocPath = state.pageData.document.path;

    // Check if we already have a section selected for THIS document
    // This prevents reprocessing after navigation.navigateToSection has already run
    if (navigation.sectionId && navigation.documentPath === currentDocPath) {
      // Already have a section selected, just clean the URL
      window.history.replaceState(null, "", location.pathname);
      return;
    }

    // Handle #root - navigate to document root
    if (hash === "root") {
      navigateToDocument(currentDocPath);
      window.history.replaceState(null, "", location.pathname);
      return;
    }

    // Try to navigate to section by ID
    const success = navigateToSectionById(hash, state.pageData);

    // Clean URL regardless of success (hash has been processed)
    window.history.replaceState(null, "", location.pathname);
  }, [
    state.isLoading,
    state.pageData,
    location.hash,
    location.pathname,
    navigation.sectionId,
    navigation.documentPath,
    navigateToDocument,
    navigateToSectionById,
  ]);

  /**
   * Clear section view - returns to document root
   */
  const handleClearSection = useCallback(() => {
    navigation.clearSection();
  }, [navigation]);

  // Handle manual section toggle for expand/collapse
  const handleSectionToggle = useCallback(
    (sectionId: string, currentlyExpanded: boolean) => {
      setManualOverride(sectionId, !currentlyExpanded);
    },
    [setManualOverride],
  );

  // Handle description toggle
  const handleDescriptionToggle = useCallback(
    (sectionId: string, currentlyVisible: boolean) => {
      setDescriptionOverride(sectionId, !currentlyVisible);
    },
    [setDescriptionOverride],
  );

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
        filtered = filtered.filter(
          (doc) =>
            doc.title.toLowerCase().includes(term) ||
            convertSectionsToMarkdown(doc.content_json || [])
              .toLowerCase()
              .includes(term),
        );
      }

      if (filters.selectedTags.length > 0) {
        filtered = filtered.filter((doc) => doc.tags?.some((tag) => filters.selectedTags.includes(tag)));
      }

      dispatch({ type: "SET_FILTERED_DOCUMENTS", payload: filtered });
    } catch (error) {
      console.error("Error filtering documents:", error);
    }
  };

  // Editor save handler
  const handleEditorSave = async (sections: DocumentSection[], skipReload = false) => {
    if (!state.pageData || state.pageData.type !== "document") return;

    try {
      await ContentService.saveDocumentContent(state.pageData.document.path, sections);
      onStructureUpdate();

      if (!skipReload) {
        await loadCurrentPageData(state.pageData.document.path);
      }
    } catch (error) {
      console.error("Error saving document:", error);
    }
  };

  // Create document handler
  const handleCreateDocument = async () => {
    if (!state.pageData || state.pageData.type !== "folder") return;

    const folderData = state.pageData;

    try {
      const timestamp = new Date().toISOString().slice(0, 19).replace(/[:-]/g, "");
      const documentPath =
        folderData.folder.path === "/"
          ? `/new-document-${timestamp}`
          : `${folderData.folder.path}/new-document-${timestamp}`;

      const initialSections = [
        {
          id: "1",
          title: "New Document",
          level: 1,
          content: "Start writing your content here...",
          tags: [],
        },
      ];

      const success = await ContentService.saveDocumentContent(documentPath, initialSections);

      if (success) {
        navigate(documentPath);
        setShowEditor(true);
      }
    } catch (error) {
      console.error("Error creating new document:", error);
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

    if (state.pageData.type === "folder") {
      const folderData = state.pageData;
      const childFolders = navigationStructure.filter((node) => node.parent_id === folderData.folder.id);

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
          <BlockNoteSectionEditor sections={sections} onSave={handleEditorSave} onClose={() => setShowEditor(false)} />
        ) : navigation.sectionView ? (
          // Showing a specific section
          <div className="space-y-4">
            <h1 className="text-3xl font-bold mb-1">{navigation.sectionView.title}</h1>
            <HierarchicalContentDisplay
              content={navigation.sectionView.content}
              onSectionClick={navigateToSectionByTitle}
              onInternalLinkClick={handleInternalLinkClick}
              activeNodeId={navigation.sectionId || undefined}
              documentTitle={navigation.sectionView.title}
              expandedSections={expandMode === "mixed" ? manualOverrides : undefined}
              defaultExpandDepth={expandMode === "depth" ? expandDepth : undefined}
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
              onInternalLinkClick={handleInternalLinkClick}
              activeNodeId={navigation.sectionId || undefined}
              documentTitle={document.title}
              expandedSections={expandMode === "mixed" ? manualOverrides : undefined}
              defaultExpandDepth={expandMode === "depth" ? expandDepth : undefined}
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
  const allTags = [...new Set(state.filteredDocuments.flatMap((doc) => doc.tags || []))];

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
