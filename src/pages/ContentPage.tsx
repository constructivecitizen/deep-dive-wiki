import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { WikiLayout } from "@/components/WikiLayout";
import { ContentService, ContentNode, NavigationNode } from "@/services/contentService";
import { HierarchicalContent } from "@/components/HierarchicalContent";
import { SimpleActionMenu } from "@/components/SimpleActionMenu";
import { SimpleFilterPanel } from "@/components/SimpleFilterPanel";
import { SimpleNavigationModal } from "@/components/SimpleNavigationModal";
import { HybridNavigationSidebar } from "@/components/HybridNavigationSidebar";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { TagManager } from "@/lib/tagManager";
import { DocumentEditor } from "@/components/DocumentEditor";
import { SectionEditor } from "@/components/SectionEditor";
import { SectionView } from "@/components/SectionView";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { replaceSectionContent } from "@/lib/sectionExtractor";

const ContentPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { pathname } = location;
  const [content, setContent] = useState<ContentNode | null>(null);
  const [navigationStructure, setNavigationStructure] = useState<NavigationNode[]>([]);
  const [allContentNodes, setAllContentNodes] = useState<ContentNode[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editingSection, setEditingSection] = useState<{
    content: string;
    title: string;
    level: number;
    position: number;
    parentPath: string;
  } | null>(null);
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
    setEditingSection(sectionData);
  };

  const handleSectionView = (sectionData: {
    content: string;
    title: string;
    level: number;
    parentPath: string;
  }) => {
    console.log('handleSectionView called with:', sectionData.title);
    setViewingSection(sectionData);
  };

  // Debug logging
  console.log('ContentPage render: viewingSection exists:', !!viewingSection, viewingSection?.title);

  const fetchData = async () => {
    const structure = await ContentService.getNavigationStructure();
    setNavigationStructure(structure);
    const allNodes = await ContentService.getAllContentNodes();
    setAllContentNodes(allNodes);
    setFilteredContent(allNodes);
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
      setLoading(true);
      
      // Get current path
      const currentPath = location.pathname;
      
      // Check if this is a section route
      const sectionMatch = currentPath.match(/^\/node\/(.+)$/);
      if (sectionMatch) {
        // Handle section view - find parent document and extract section
        const allNodes = await ContentService.getAllContentNodes();
        setAllContentNodes(allNodes);
        setFilteredContent(allNodes);
        
        // For now, set content to null for section routes - we'll handle this in the render
        setContent(null);
        setActiveSectionId(sectionMatch[1]);
      } else {
        // Load content for regular paths
        const contentData = await ContentService.getContentByPath(currentPath);
        setContent(contentData);
        
        // Load all content nodes for sidebar
        const allNodes = await ContentService.getAllContentNodes();
        setAllContentNodes(allNodes);
        setFilteredContent(allNodes);
        setActiveSectionId(undefined);
      }
      
      setLoading(false);
    };

    loadContent();
  }, [location.pathname]);

  // Set up real-time subscription for content updates
  useEffect(() => {
    const channel = supabase
      .channel('content-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_nodes'
        },
        async () => {
          setIsRefreshing(true);
          
          // Refresh all data to ensure sidebar and content are in sync
          const structure = await ContentService.getNavigationStructure();
          setNavigationStructure(structure);
          const allNodes = await ContentService.getAllContentNodes();
          setAllContentNodes(allNodes);
          setFilteredContent(allNodes);
          
          // Refresh current content if we're viewing a specific path
          if (location.pathname !== '/') {
            const updatedContent = await ContentService.getContentByPath(location.pathname);
            if (updatedContent) {
              setContent(updatedContent);
            }
          }
          
          setIsRefreshing(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
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
          customSidebar={
            <HybridNavigationSidebar 
              structure={navigationStructure} 
              contentNodes={allContentNodes}
              onSectionEdit={handleSectionEdit}
              onSectionView={handleSectionView}
              activeSectionId={activeSectionId}
              currentPath={location.pathname}
              onStructureUpdate={fetchData}
            />
          }
        >
        <div className="space-y-6">
          {viewingSection ? (
            <SectionView 
              sectionData={viewingSection}
              onEdit={() => {
                setEditingSection({
                  content: viewingSection.content,
                  title: viewingSection.title,
                  level: viewingSection.level,
                  position: 0, // Will be determined when editing
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
            {isRefreshing && (
              <div className="absolute top-2 right-2 opacity-60">
                <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  Updating...
                </div>
              </div>
            )}
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

      <SectionEditor 
        sectionData={editingSection}
        onSave={async (updatedContent: string, title: string) => {
          if (editingSection && content) {
            // Find the document section to replace
            const documentSection = {
              id: `section-${editingSection.position}`,
              level: editingSection.level,
              title: editingSection.title,
              tags: [],
              children: []
            };
            
            // Replace the section content in the full document
            const updatedFullContent = replaceSectionContent(
              content.content || '',
              documentSection,
              updatedContent,
              title
            );
            
            // Save the updated document
            const success = await ContentService.saveDocumentContent(
              editingSection.parentPath, 
              [], 
              updatedFullContent
            );
            
            if (success) {
              toast.success("Section updated successfully");
              // Refresh the content
              const contentData = await ContentService.getContentByPath(location.pathname);
              setContent(contentData);
            } else {
              toast.error("Failed to update section");
            }
          }
          setEditingSection(null);
        }}
        onClose={() => setEditingSection(null)}
      />
    </>
  );
};

export default ContentPage;