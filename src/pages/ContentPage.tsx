import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
// Removed ChevronRight import - using triangular bullet character instead
import { WikiLayout } from "@/components/WikiLayout";
import { ContentService, NavigationNode, WikiDocument } from "@/services/contentService";
// Import removed - using HierarchicalContentDisplay instead
import { SimpleActionMenu } from "@/components/SimpleActionMenu";
import { SimpleFilterPanel } from "@/components/SimpleFilterPanel";
import { SimpleNavigationModal } from "@/components/SimpleNavigationModal";
import { HybridNavigationSidebar } from "@/components/HybridNavigationSidebar";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { TagManager } from "@/lib/tagManager";
import { UnifiedEditor, EditorData } from "@/components/UnifiedEditor";
import { SectionView } from "@/components/SectionView";
import { FolderLandingPage } from "@/components/FolderLandingPage";
import { toast } from "sonner";
import { replaceSectionContent } from "@/lib/sectionExtractor";
import { HierarchyParser } from "@/lib/hierarchyParser";

const ContentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const [content, setContent] = useState<WikiDocument | null>(null);
  const [currentFolder, setCurrentFolder] = useState<NavigationNode | null>(null);
  const [folderChildren, setFolderChildren] = useState<NavigationNode[]>([]);
  const [navigationStructure, setNavigationStructure] = useState<NavigationNode[]>([]);
  const [allContentNodes, setAllContentNodes] = useState<WikiDocument[]>([]);
  const [filteredContent, setFilteredContent] = useState<WikiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [editorData, setEditorData] = useState<EditorData | null>(null);
  const [viewingSection, setViewingSection] = useState<{
    content: string;
    title: string;
    level: number;
    parentPath: string;
  } | null>(null);
  const [currentNavId, setCurrentNavId] = useState<string | null>(null);


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
    
    // Refresh current content if we're viewing a specific path
    if (location.pathname !== '/') {
      const updatedContent = await ContentService.getDocumentByPath(location.pathname);
      if (updatedContent) {
        setContent(updatedContent);
      }
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

  // Load content when route changes or currentNavId changes
  useEffect(() => {
    const loadContent = async () => {
      const currentPath = location.pathname;
      
      // Only show loading for initial page load
      const isInitialLoad = !content && !currentFolder;
      if (isInitialLoad) {
        setLoading(true);
      }
      
      // Force clear ALL states immediately to prevent any stale data
      setViewingSection(null);
      setContent(null);
      setCurrentFolder(null);
      setFolderChildren([]);
      
      // Small delay to ensure state clearing is complete
      await new Promise(resolve => setTimeout(resolve, 10));
      
      // Now try to load the appropriate data type
      const contentData = await ContentService.getDocumentByPath(currentPath);
      
      if (contentData) {
        // We have content document
        setContent(contentData);
        // Ensure folder states remain null
        setCurrentFolder(null);
        setFolderChildren([]);
      } else if (currentPath !== '/') {
        // Try to load as folder
        const folderData = await ContentService.getNavigationNodeByPath(currentPath);
        if (folderData) {
          // We have a folder
          setCurrentFolder(folderData);
          const children = await ContentService.getNavigationNodeChildren(currentPath);
          setFolderChildren(children);
          // Ensure content remains null
          setContent(null);
        }
      }
      
      // Load all content nodes for sidebar if not already loaded
      if (allContentNodes.length === 0) {
        const allNodes = await ContentService.getAllDocuments();
        setAllContentNodes(allNodes);
        setFilteredContent(allNodes);
      }
      
      setLoading(false);
    };

    loadContent();
  }, [location.pathname, currentNavId]);

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
    if (content && content.id === updatedNode.id) {
      setContent(updatedNode);
    }
    
    // TODO: Implement database update
    console.log('Update node:', updatedNode.id, updatedNode);
  };

  const handleNavigationClick = (navId: string, path: string) => {
    setCurrentNavId(navId);
    navigate(path);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  // If no content found for this route, check if it's a folder or show 404
  if (!content && !currentFolder) {
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
          onStructureUpdate={async () => {
            const structure = await ContentService.getNavigationStructure();
            setNavigationStructure(structure);
          }}
          actionMenu={
            <SimpleActionMenu 
              onToggleDocumentEditor={() => setEditorData({
                type: 'document',
                content: HierarchyParser.sectionsToMarkup(content?.content_json || []),
              })}
              onToggleFilter={() => setShowFilterPanel(!showFilterPanel)}
            />
          }
          customSidebar={
            <HybridNavigationSidebar 
              structure={navigationStructure} 
              contentNodes={allContentNodes}
              onSectionView={handleSectionView}
              currentPath={location.pathname}
              onStructureUpdate={refreshAllData}
              onNavigationClick={handleNavigationClick}
              currentNavId={currentNavId}
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
          ) : content || currentFolder ? (
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

              // Get the current folder/page title
              const targetPath = content?.path || currentFolder?.path || location.pathname;
              const currentNavNode = findNodeByPath(navigationStructure, targetPath);
              const displayTitle = currentNavNode?.title || content?.title || currentFolder?.title || 'Page';
              
              // Only show breadcrumbs when viewing content documents (never for folders)
              if (content && !currentFolder) {
                const breadcrumbItems = [];
                const pathParts = content.path.split('/').filter(part => part);
                
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
              
              // For folders, just show the title with no breadcrumbs
              return <h1 className="text-3xl font-bold text-foreground">{displayTitle}</h1>;
            })()}

            {/* Content Area */}
            {content ? (
              <div className="bg-card rounded-lg border border-border p-8 relative">
                <HierarchicalContentDisplay 
                  content={HierarchyParser.sectionsToMarkup(content.content_json || [])}
                  onSectionClick={handleContentNodeClick}
                />
              </div>
            ) : currentFolder?.content_json ? (
              <div className="bg-card rounded-lg border border-border p-8 relative">
                <HierarchicalContentDisplay 
                  content={HierarchyParser.sectionsToMarkup(currentFolder.content_json || [])}
                  onSectionClick={handleContentNodeClick}
                />
              </div>
            ) : currentFolder ? (
              <FolderLandingPage
                folder={currentFolder}
                children={folderChildren}
                documents={allContentNodes}
                onCreateDocument={() => {
                  setEditorData({
                    type: 'document',
                    content: '',
                  });
                }}
              />
            ) : null}
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