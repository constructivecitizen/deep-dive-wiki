import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { WikiLayout } from "@/components/WikiLayout";
import { ContentService, ContentNode, NavigationNode } from "@/services/contentService";
import { HierarchicalContent } from "@/components/HierarchicalContent";
import { SimpleActionMenu } from "@/components/SimpleActionMenu";
import { SimpleFilterPanel } from "@/components/SimpleFilterPanel";
import { SimpleNavigationModal } from "@/components/SimpleNavigationModal";
import { DocumentSidebar } from "@/components/DocumentSidebar";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { TagManager } from "@/lib/tagManager";
import { DocumentEditor } from "@/components/DocumentEditor";
import { toast } from "sonner";

const ContentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentNode | null>(null);
  const [navigationStructure, setNavigationStructure] = useState<NavigationNode[]>([]);
  const [allContentNodes, setAllContentNodes] = useState<ContentNode[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);

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
      setLoading(true);
      
      // Get current path
      const currentPath = location.pathname;
      
      // Load content for this path
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
              setShowDocumentEditor(true);
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
              onToggleDocumentEditor={() => setShowDocumentEditor(!showDocumentEditor)}
              onToggleFilter={() => setShowFilterPanel(!showFilterPanel)}
            />
          }
          // Replace the standard sidebar with document-based sidebar
          customSidebar={content ? (
            <DocumentSidebar 
              content={content.content}
              onSectionClick={handleContentNodeClick}
              activeSectionId={activeNodeId}
            />
          ) : undefined}
        >
        <div className="space-y-6">
          {/* Extract the last breadcrumb item as page title */}
          {(() => {
            const breadcrumbItems = [];
            const pathParts = content.path.split('/').filter(part => part);
            
            // Build breadcrumb path
            for (let i = 0; i <= pathParts.length; i++) {
              const currentPath = '/' + pathParts.slice(0, i).join('/');
              const isLast = i === pathParts.length;
              
              if (i === 0) {
                breadcrumbItems.push({
                  title: 'Home',
                  href: '/',
                  isLast: false
                });
              } else {
                // Find navigation node for this path
                const findNodeByPath = (nodes: NavigationNode[], targetPath: string): NavigationNode | null => {
                  for (const node of nodes) {
                    if (node.path === targetPath) return node;
                    const found = findNodeByPath(node.children || [], targetPath);
                    if (found) return found;
                  }
                  return null;
                };
                
                const navNode = findNodeByPath(navigationStructure, currentPath);
                if (navNode && !isLast) {
                  breadcrumbItems.push({
                    title: navNode.title,
                    href: currentPath,
                    isLast: false
                  });
                }
              }
            }
            
            return (
              <>
                {/* Breadcrumb without the last item */}
                {breadcrumbItems.length > 0 && (
                  <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
                    {breadcrumbItems.map((item, index) => (
                      <div key={index} className="flex items-center">
                        {index > 0 && <ChevronRight className="h-4 w-4 mx-2" />}
                        <Link 
                          to={item.href}
                          className="hover:text-foreground transition-colors"
                        >
                          {item.title}
                        </Link>
                      </div>
                    ))}
                  </nav>
                )}
                
                {/* Page title - larger and prominent */}
                <h1 className="text-3xl font-bold text-foreground">{content.title}</h1>
              </>
            );
          })()}

          <div className="bg-card rounded-lg border border-border p-8">
            <HierarchicalContentDisplay 
              content={content.content} 
              onSectionClick={handleContentNodeClick}
              activeSectionId={activeNodeId}
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
        </div>
      </WikiLayout>

      <SimpleFilterPanel 
        isOpen={showFilterPanel}
        onClose={() => setShowFilterPanel(false)}
        onFilter={handleFilter}
        allTags={TagManager.getAllTags(allContentNodes)}
      />

      {showDocumentEditor && (
        <DocumentEditor 
          initialContent={
            content ? [{
              id: content.id,
              content: content.content || '',
              tags: content.tags || [],
              depth: 0,
              children: content.children || []
            }] : []
          }
          onSave={async (nodes, originalMarkup) => {
            console.log('ContentPage onSave called with nodes:', nodes);
            console.log('Original markup:', originalMarkup);
            const currentPath = location.pathname;
            console.log('Saving to path:', currentPath);
            
            // If we have original markup, save that directly
            if (originalMarkup) {
              console.log('Using original markup for save');
              const success = await ContentService.saveDocumentContent(currentPath, nodes, originalMarkup);
              console.log('Save result:', success);
              if (success) {
                toast.success("Content saved successfully");
                // Refresh the content
                const contentData = await ContentService.getContentByPath(currentPath);
                setContent(contentData);
              } else {
                toast.error("Failed to save content");
              }
            } else {
              // Fallback to old method
              const success = await ContentService.saveDocumentContent(currentPath, nodes);
              console.log('Save result:', success);
              if (success) {
                toast.success("Content saved successfully");
                const contentData = await ContentService.getContentByPath(currentPath);
                setContent(contentData);
              } else {
                toast.error("Failed to save content");
              }
            }
            setShowDocumentEditor(false);
          }}
          onClose={() => setShowDocumentEditor(false)}
        />
      )}
    </>
  );
};

export default ContentPage;