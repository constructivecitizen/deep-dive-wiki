import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { WikiLayout } from "@/components/WikiLayout";
import { ContentService, NavigationNode, WikiDocument } from "@/services/contentService";
import { HierarchicalContent } from "@/components/HierarchicalContent";
import { SimpleActionMenu } from "@/components/SimpleActionMenu";
import { SimpleFilterPanel } from "@/components/SimpleFilterPanel";
import { SimpleNavigationModal } from "@/components/SimpleNavigationModal";
import { HybridNavigationSidebar } from "@/components/HybridNavigationSidebar";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { TagManager } from "@/lib/tagManager";
import { UnifiedEditor, EditorData } from "@/components/UnifiedEditor";
import { SectionView } from "@/components/SectionView";
import { toast } from "sonner";
import { replaceSectionContent } from "@/lib/sectionExtractor";
import { HierarchyParser } from "@/lib/hierarchyParser";

const ContentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const [content, setContent] = useState<WikiDocument | null>(null);
  const [navigationStructure, setNavigationStructure] = useState<NavigationNode[]>([]);
  const [allContentNodes, setAllContentNodes] = useState<WikiDocument[]>([]);
  const [filteredContent, setFilteredContent] = useState<WikiDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [editorData, setEditorData] = useState<EditorData | null>(null);
  const [viewingSection, setViewingSection] = useState<{
    content: string;
    title: string;
    level: number;
    parentPath: string;
  } | null>(null);

  const handleSectionEdit = (sectionData: {
    content: string;
    title: string;
    level: number;
    position: number;
    parentPath: string;
  }) => {
    setEditorData({
      type: 'section',
      content: sectionData.content,
      title: sectionData.title,
      level: sectionData.level,
      position: sectionData.position,
      parentPath: sectionData.parentPath
    });
  };

  const handleSectionView = (sectionData: {
    content: string;
    title: string;
    level: number;
    parentPath: string;
  }) => {
    console.log('🔍 SIDEBAR DEBUG: handleSectionView called with:', {
      title: sectionData.title,
      level: sectionData.level,
      parentPath: sectionData.parentPath,
      currentPath: location.pathname
    });
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

  // Load content when route changes
  useEffect(() => {
    const loadContent = async () => {
      console.log('🔄 ROUTE DEBUG: Route changed to:', location.pathname);
      setLoading(true);
      
      // Clear section view when navigating to a new path
      console.log('🧹 ROUTE DEBUG: Clearing viewingSection state');
      setViewingSection(null);
      
      // Get current path
      const currentPath = location.pathname;
      
      // Load content for regular paths
      const contentData = await ContentService.getContentByPath(currentPath);
      setContent(contentData);
      
      // Load all content nodes for sidebar
      const allNodes = await ContentService.getAllContentNodes();
      setAllContentNodes(allNodes);
      setFilteredContent(allNodes);
      
      setLoading(false);
    };

    loadContent();
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

  const handleNodeUpdate = (updatedNode: ContentNode) => {
    // Update local state optimistically
    setAllContentNodes(prevNodes => 
      prevNodes.map(node => 
        node.id === updatedNode.id ? updatedNode : node
      )
    );
    
    // TODO: Implement database update
    console.log('Update node:', updatedNode.id, updatedNode);
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

  // If no content found for this route, show 404-like message with better fallback
  if (!content) {
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
              editMode={editMode}
              onToggleEdit={() => setEditMode(!editMode)}
              onToggleDocumentEditor={() => setEditorData({
                type: 'document',
                content: content?.content || '',
              })}
              onToggleFilter={() => setShowFilterPanel(!showFilterPanel)}
            />
          }
          customSidebar={
            <HybridNavigationSidebar 
              structure={navigationStructure} 
              contentNodes={allContentNodes}
              onSectionEdit={handleSectionEdit}
              onSectionView={handleSectionView}
              currentPath={location.pathname}
              onStructureUpdate={refreshAllData}
            />
          }
        >
        <div className="space-y-6">
          {(() => {
            console.log('🖼️ RENDER DEBUG: viewingSection state:', viewingSection ? `Section: ${viewingSection.title}` : 'null');
            return null;
          })()}
          {viewingSection ? (
            <SectionView 
              sectionData={viewingSection}
              onEdit={() => {
                setEditorData({
                  type: 'section',
                  content: viewingSection.content,
                  title: viewingSection.title,
                  level: viewingSection.level,
                  parentPath: viewingSection.parentPath
                });
                setViewingSection(null);
              }}
              onBack={() => setViewingSection(null)}
            />
          ) : content ? (
            <>
            {/* Breadcrumb and Title */}
            {(() => {
            const breadcrumbItems = [];
            const pathParts = content.path.split('/').filter(part => part);
            
            // Helper function to find navigation node by path
            const findNodeByPath = (nodes: NavigationNode[], targetPath: string): NavigationNode | null => {
              for (const node of nodes) {
                if (node.path === targetPath) return node;
                const found = findNodeByPath(node.children || [], targetPath);
                if (found) return found;
              }
              return null;
            };

            // Always start with Home
            breadcrumbItems.push({
              title: 'Home',
              href: '/',
              isLast: pathParts.length === 0
            });

            // Build breadcrumb path for each segment
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

            // Get the current folder/page title
            const currentNavNode = findNodeByPath(navigationStructure, content.path);
            const displayTitle = currentNavNode ? currentNavNode.title : content.title;
            
            return (
              <>
                {/* Breadcrumb navigation */}
                {breadcrumbItems.length > 1 && (
                  <nav className="flex items-center space-x-1 text-sm text-muted-foreground">
                    {breadcrumbItems.map((item, index) => (
                      <div key={index} className="flex items-center">
                        {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
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
                
                {/* Page title - use folder title when available */}
                <h1 className="text-3xl font-bold text-foreground">{displayTitle}</h1>
              </>
            );
          })()}

            <div className="bg-card rounded-lg border border-border p-8 relative">
              <HierarchicalContentDisplay 
                content={content.content} 
                onSectionClick={handleContentNodeClick}
                activeNodeId={activeNodeId}
              />

            {content.children && content.children.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-semibold text-foreground mb-4">Subsections</h2>
                <div className="grid gap-4 md:grid-cols-2">
                  {content.children.map((child) => (
                    <div key={child.id} className="border border-border rounded-lg p-4 hover:bg-accent/10 transition-colors">
                      <h3 className="font-medium text-foreground mb-2">{child.title}</h3>
                      {child.content && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {child.content.replace(/[#*`]/g, '').substring(0, 100)}...
                        </p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {child.tags?.slice(0, 2).map((tag) => (
                            <span key={tag} className="px-2 py-1 bg-secondary text-secondary-foreground rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                        <button 
                          onClick={() => navigate(child.path)}
                          className="text-xs text-primary hover:underline"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
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
        onSave={async (content: string, title?: string) => {
          if (editorData?.type === 'section') {
            // Handle section save
            const currentPath = location.pathname;
            const currentContent = await ContentService.getDocumentByPath(currentPath);
            if (currentContent && editorData.parentPath) {
              // Find the section and replace its content
              const updatedContent = replaceSectionContent(
                currentContent.content, 
                {
                  id: `section-${editorData.level}-${title}`,
                  level: editorData.level || 1,
                  title: title || editorData.title || '',
                  tags: [],
                  children: []
                },
                content,
                title
              );
              
              const parsed = HierarchyParser.parseMarkup(updatedContent);
              const success = await ContentService.saveDocumentContent(currentPath, []);
              
              if (success) {
                toast.success("Section saved successfully");
                await refreshAllData();
              } else {
                toast.error("Failed to save section");
              }
            }
          } else {
            // Handle document save
            const currentPath = location.pathname;
            const parsed = HierarchyParser.parseMarkup(content);
            const success = await ContentService.saveDocumentContent(currentPath, []);
            
            if (success) {
              toast.success("Document saved successfully");
              await refreshAllData();
            } else {
              toast.error("Failed to save document");
            }
          }
        }}
        onClose={() => setEditorData(null)}
      />
    </>
  );
};

export default ContentPage;