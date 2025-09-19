import { useEffect, useState } from "react";
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

// Single state type for atomic page updates
type PageData = 
  | { type: 'loading' }
  | { type: 'content'; data: WikiDocument }
  | { type: 'folder'; data: NavigationNode; children: NavigationNode[] }
  | null;

const ContentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Single atomic state for page data
  const [pageData, setPageData] = useState<PageData>({ type: 'loading' });
  const [navigationStructure, setNavigationStructure] = useState<NavigationNode[]>([]);
  const [allContentNodes, setAllContentNodes] = useState<WikiDocument[]>([]);
  const [filteredContent, setFilteredContent] = useState<WikiDocument[]>([]);
  
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [editorData, setEditorData] = useState<EditorData | null>(null);
  const [viewingSection, setViewingSection] = useState<{
    content: string;
    title: string;
    level: number;
    parentPath: string;
  } | null>(null);

  const handleSectionView = (sectionData: {
    content: string;
    title: string;
    level: number;
    parentPath: string;
  }) => {
    setViewingSection(sectionData);
  };

  const refreshAllData = async () => {
    const structure = await ContentService.getNavigationStructure();
    setNavigationStructure(structure);
    const allNodes = await ContentService.getAllDocuments();
    setAllContentNodes(allNodes);
    setFilteredContent(allNodes);
    
    // Refresh current page data if needed
    if (location.pathname !== '/') {
      await loadPageData(location.pathname);
    }
  };

  // Atomic page data loading function
  const loadPageData = async (currentPath: string) => {
    setViewingSection(null);
    
    // Load all required data first
    const [contentData, folderData, folderChildren] = await Promise.all([
      ContentService.getDocumentByPath(currentPath),
      currentPath !== '/' ? ContentService.getNavigationNodeByPath(currentPath) : null,
      currentPath !== '/' ? ContentService.getNavigationNodeChildren(currentPath) : []
    ]);
    
    // Set page data atomically based on what we found
    if (contentData) {
      setPageData({ type: 'content', data: contentData });
    } else if (folderData) {
      setPageData({ type: 'folder', data: folderData, children: folderChildren });
    } else {
      setPageData(null);
    }
  };

  // Load navigation structure on mount
  useEffect(() => {
    const loadNavigationStructure = async () => {
      const structure = await ContentService.getNavigationStructure();
      setNavigationStructure(structure);
    };
    
    loadNavigationStructure();
  }, []);

  // Load content when route changes (no circular dependencies)
  useEffect(() => {
    loadPageData(location.pathname);
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

    setFilteredContent(filtered);
  };

  const handleContentNodeClick = (nodeId: string) => {
    setActiveNodeId(nodeId);
    const element = document.getElementById(nodeId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const handleNodeUpdate = (updatedNode: WikiDocument) => {
    // Update local state optimistically
    setAllContentNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === updatedNode.id ? updatedNode : node
      )
    );
    
    // Update current content if it matches
    if (pageData?.type === 'content' && pageData.data.id === updatedNode.id) {
      setPageData({ type: 'content', data: updatedNode });
    }
    
    console.log('Update node:', updatedNode.id, updatedNode);
  };

  const handleNavigationClick = async (navId: string, path: string) => {
    navigate(path);
    await refreshAllData();
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
        currentPath={location.pathname}
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
        currentPath={location.pathname}
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
              navigationStructure={navigationStructure}
            />
          ) : pageData ? (
            <>
              {/* Title and Breadcrumb Logic */}
              {(() => {
                // Helper function to find navigation node by path
                const findNodeByPath = (nodes: NavigationNode[], targetPath: string): NavigationNode | null => {
                  for (const node of nodes) {
                    if (node.path === targetPath) return node;
                    const found = findNodeByPath(node.children || [], targetPath);
                    if (found) return found;
                  }
                  return null;
                };

                // Get the current page data and determine display info
                const isContentPage = pageData.type === 'content';
                const targetPath = isContentPage ? pageData.data.path : pageData.data.path;
                const currentNavNode = findNodeByPath(navigationStructure, targetPath);
                const displayTitle = currentNavNode?.title || 
                  (isContentPage ? pageData.data.title : pageData.data.title) || 
                  'Page';
                
                // Show breadcrumbs for content pages and folders with content, but not folder landing pages
                if (isContentPage || (!isContentPage && pageData.data.content_json)) {
                  const breadcrumbItems = [];
                  const pathParts = pageData.data.path.split('/').filter(part => part);
                  
                  // Build breadcrumb path - start with Home if not root
                  if (pathParts.length > 0) {
                    breadcrumbItems.push({
                      title: 'Home',
                      href: '/',
                      isLast: false
                    });
                  }

                  // Add each path segment
                  for (let i = 1; i <= pathParts.length; i++) {
                    const currentPath = '/' + pathParts.slice(0, i).join('/');
                    const isLast = i === pathParts.length;
                    
                    const navNode = findNodeByPath(navigationStructure, currentPath);
                    if (navNode) {
                      breadcrumbItems.push({
                        title: navNode.title,
                        href: currentPath,
                        isLast
                      });
                    }
                  }

                  return (
                    <>
                      {/* Breadcrumb navigation - only for content pages */}
                      {breadcrumbItems.length > 1 && (
                        <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-2">
                          {breadcrumbItems.map((item, index) => (
                            <div key={index} className="flex items-center">
                              {index > 0 && <span className="h-4 w-4 mx-2">‣</span>}
                              {item.isLast ? (
                                <span className="text-foreground font-medium">
                                  {item.title}
                                </span>
                              ) : (
                                <Link 
                                  to={item.href}
                                  className="hover:text-foreground transition-colors"
                                >
                                  {item.title}
                                </Link>
                              )}
                            </div>
                          ))}
                        </nav>
                      )}
                      <h1 className="text-3xl font-bold text-foreground">{displayTitle}</h1>
                    </>
                  );
                }
                
                // For folders, show hidden breadcrumb to preserve spacing
                return (
                  <>
                    {/* Hidden breadcrumb for consistent spacing */}
                    <nav className="flex items-center space-x-1 text-sm text-muted-foreground mb-2 invisible">
                      <div className="flex items-center">
                        <span className="text-foreground font-medium">Hidden</span>
                      </div>
                    </nav>
                    <h1 className="text-3xl font-bold text-foreground">{displayTitle}</h1>
                  </>
                );
              })()}

              {/* Content Area */}
              {pageData.type === 'content' ? (
                <div className="bg-card rounded-lg border border-border p-8 relative">
                  <HierarchicalContentDisplay 
                    content={HierarchyParser.sectionsToMarkup(pageData.data.content_json || [])}
                    onSectionClick={handleContentNodeClick}
                  />
                </div>
              ) : pageData.data.content_json ? (
                <div className="bg-card rounded-lg border border-border p-8 relative">
                  <HierarchicalContentDisplay 
                    content={HierarchyParser.sectionsToMarkup(pageData.data.content_json || [])}
                    onSectionClick={handleContentNodeClick}
                  />
                </div>
              ) : (
                <FolderLandingPage
                  folder={pageData.data}
                  children={pageData.children}
                  documents={allContentNodes}
                  onCreateDocument={() => {
                    setEditorData({
                      type: 'document',
                      content: '',
                    });
                  }}
                />
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">Content not found</p>
            </div>
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