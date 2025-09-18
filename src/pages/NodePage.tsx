import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WikiLayout } from "@/components/WikiLayout";
import { ContentService, ContentNode, NavigationNode } from "@/services/contentService";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { SimpleActionMenu } from "@/components/SimpleActionMenu";
import { SimpleFilterPanel } from "@/components/SimpleFilterPanel";
import { HybridNavigationSidebar } from "@/components/HybridNavigationSidebar";
import { TagManager } from "@/lib/tagManager";
import { DocumentEditor } from "@/components/DocumentEditor";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { renderMarkdown } from "@/lib/markdownRenderer";
import { supabase } from "@/integrations/supabase/client";

interface NodePageParams {
  sectionId: string;
  [key: string]: string | undefined;
}

const NodePage = () => {
  const params = useParams<NodePageParams>();
  const navigate = useNavigate();
  const [content, setContent] = useState<ContentNode | null>(null);
  const [sectionContent, setSectionContent] = useState<string>("");
  const [sectionTitle, setSectionTitle] = useState<string>("");
  const [navigationStructure, setNavigationStructure] = useState<NavigationNode[]>([]);
  const [allContentNodes, setAllContentNodes] = useState<ContentNode[]>([]);
  const [filteredContent, setFilteredContent] = useState<ContentNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [editMode, setEditMode] = useState(false);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [activeNodeId, setActiveNodeId] = useState<string | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string>();
  const [parentPath, setParentPath] = useState<string>("/");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const { sectionId } = params;

  const handleSectionClick = (sectionId: string, folderPath: string) => {
    setActiveSectionId(sectionId);
  };

  const fetchData = async () => {
    const structure = await ContentService.getNavigationStructure();
    setNavigationStructure(structure);
    const allNodes = await ContentService.getAllContentNodes();
    setAllContentNodes(allNodes);
    setFilteredContent(allNodes);
  };

  // Extract section content from a document based on sectionId
  const extractSectionContent = (content: string, targetSectionId: string) => {
    const lines = content.split('\n');
    let currentSection = '';
    let sectionTitle = '';
    let capturing = false;
    let sectionDepth = 0;
    let sectionCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headingMatch = line.match(/^(#{1,30})\s*(.+?)(?:\s*\[(.*?)\])?$/);
      
      if (headingMatch) {
        const level = headingMatch[1].length;
        const title = headingMatch[2].trim();
        sectionCount++;
        const currentSectionId = `section-${sectionCount}`;
        
        if (currentSectionId === targetSectionId) {
          capturing = true;
          sectionDepth = level;
          sectionTitle = title;
          currentSection += line + '\n';
        } else if (capturing) {
          // Stop capturing if we hit a section at the same or higher level
          if (level <= sectionDepth) {
            break;
          }
          currentSection += line + '\n';
        }
      } else if (capturing) {
        currentSection += line + '\n';
      }
    }

    return { content: currentSection.trim(), title: sectionTitle };
  };

  useEffect(() => {
    const loadNavigationStructure = async () => {
      const structure = await ContentService.getNavigationStructure();
      setNavigationStructure(structure);
    };
    
    loadNavigationStructure();
  }, []);

  useEffect(() => {
    const loadContent = async () => {
      if (!sectionId) {
        navigate('/');
        return;
      }

      setLoading(true);
      
      // Parse the sectionId to get the source path and section
      // Format: sectionId contains the section number, we need to find which document it belongs to
      // For now, we'll search through all content to find the section
      const allNodes = await ContentService.getAllContentNodes();
      setAllContentNodes(allNodes);
      setFilteredContent(allNodes);

      // Find the content node that contains this section
      let foundContent: ContentNode | null = null;
      let extractedSection = { content: '', title: '' };

      for (const node of allNodes) {
        if (node.content) {
          const section = extractSectionContent(node.content, sectionId);
          if (section.content) {
            foundContent = node;
            extractedSection = section;
            setParentPath(node.path);
            break;
          }
        }
      }

      if (foundContent && extractedSection.content) {
        setContent(foundContent);
        setSectionContent(extractedSection.content);
        setSectionTitle(extractedSection.title);
      } else {
        // Section not found, redirect back
        toast.error("Section not found");
        navigate('/');
        return;
      }
      
      setLoading(false);
    };

    loadContent();
  }, [sectionId, navigate]);

  // Set up real-time subscription for content updates
  useEffect(() => {
    if (!content?.id || !sectionId) return;

    const channel = supabase
      .channel('section-content-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'content_nodes',
          filter: `id=eq.${content.id}`
        },
        async () => {
          setIsRefreshing(true);
          
          // Re-extract the section content from the updated document
          const allNodes = await ContentService.getAllContentNodes();
          setAllContentNodes(allNodes);
          setFilteredContent(allNodes);
          
          let foundContent: ContentNode | null = null;
          let extractedSection = { content: '', title: '' };

          for (const node of allNodes) {
            if (node.content && node.id === content.id) {
              const section = extractSectionContent(node.content, sectionId);
              if (section.content) {
                foundContent = node;
                extractedSection = section;
                break;
              }
            }
          }

          if (foundContent && extractedSection.content) {
            setSectionContent(extractedSection.content);
            setSectionTitle(extractedSection.title);
            setContent(foundContent);
          }
          
          setIsRefreshing(false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [content?.id, sectionId]);

  const handleFilter = (filters: {
    searchTerm: string;
    selectedTags: string[];
    dateRange: { start: Date | null; end: Date | null };
  }) => {
    let filtered = [...allContentNodes];

    if (filters.searchTerm) {
      filtered = TagManager.filterByContent(filtered, filters.searchTerm);
    }

    if (filters.selectedTags.length > 0) {
      filtered = TagManager.filterByTags(filtered, filters.selectedTags);
    }

    setFilteredContent(filtered);
  };

  const handleContentNodeClick = (nodeId: string) => {
    setActiveNodeId(nodeId);
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

  if (!content || !sectionContent) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Section Not Found</h1>
          <p className="text-muted-foreground mb-4">The requested section could not be found.</p>
          <Link 
            to="/"
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <WikiLayout 
        navigationStructure={navigationStructure}
        contentNodes={filteredContent}
        onContentNodeClick={handleContentNodeClick}
        activeNodeId={activeNodeId}
        currentPath={parentPath}
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
            onSectionClick={handleSectionClick}
            activeSectionId={activeSectionId}
            currentPath={parentPath}
            onStructureUpdate={fetchData}
          />
        }
      >
        <div className="space-y-6">
          {/* Back to parent link */}
          <nav className="flex items-center space-x-2 text-sm text-muted-foreground">
            <Link 
              to={parentPath}
              className="flex items-center gap-1 hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
              Back to {content.title}
            </Link>
          </nav>
          
          {/* Section title with edit button */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-foreground">{sectionTitle}</h1>
            <Button
              onClick={() => setShowDocumentEditor(true)}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edit Section
            </Button>
          </div>

          <div className="bg-card rounded-lg border border-border p-8 relative">
            <div 
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(sectionContent) 
              }}
            />
            {/* Update indicator and section info */}
            <div className="absolute top-2 right-2 opacity-60">
              {isRefreshing ? (
                <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded flex items-center gap-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  Updating...
                </div>
              ) : (
                <div className="text-xs text-muted-foreground bg-background/80 px-2 py-1 rounded">
                  Section {sectionId?.replace('section-', '')}
                </div>
              )}
            </div>
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
          initialContent={[{
            id: sectionId || 'temp',
            content: sectionContent,
            tags: [],
            depth: 0,
            children: []
          }]}
          onSave={async (nodes, originalMarkup) => {
            try {
              // Use the original markup if provided, otherwise reconstruct from nodes
              let updatedSectionContent = '';
              
              if (originalMarkup) {
                updatedSectionContent = originalMarkup.trim();
              } else if (nodes.length > 0 && nodes[0].content) {
                updatedSectionContent = nodes[0].content;
              } else {
                toast.error("No content to save");
                return;
              }

              // Update the section in the parent document
              const success = await ContentService.updateSectionInDocument(
                parentPath, 
                sectionId!, 
                updatedSectionContent
              );

              if (success) {
                // Update local state to reflect the changes immediately
                setSectionContent(updatedSectionContent);
                
                // Extract new title from the updated content
                const lines = updatedSectionContent.split('\n');
                const firstLine = lines[0];
                const headingMatch = firstLine.match(/^(#{1,30})\s*(.+?)(?:\s*\[(.*?)\])?$/);
                if (headingMatch) {
                  const newTitle = headingMatch[2].trim();
                  setSectionTitle(newTitle);
                }

                toast.success("Section updated successfully");
                setShowDocumentEditor(false);
                
                // Refresh the parent document data
                const updatedContent = await ContentService.getContentByPath(parentPath);
                if (updatedContent) {
                  setContent(updatedContent);
                }
              } else {
                toast.error("Failed to update section");
              }
            } catch (error) {
              console.error("Error saving section:", error);
              toast.error("An error occurred while saving the section");
            }
          }}
          onClose={() => setShowDocumentEditor(false)}
        />
      )}
    </>
  );
};

export default NodePage;