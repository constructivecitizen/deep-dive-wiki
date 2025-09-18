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
import { toast } from "sonner";
import { renderMarkdown } from "@/lib/markdownRenderer";

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
          
          {/* Section title */}
          <h1 className="text-3xl font-bold text-foreground">{sectionTitle}</h1>

          <div className="bg-card rounded-lg border border-border p-8">
            <div 
              className="prose prose-slate dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ 
                __html: renderMarkdown(sectionContent) 
              }}
            />
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
            // For now, we'll show a message that editing individual sections isn't supported
            toast.info("Please edit the full document from the parent page");
            setShowDocumentEditor(false);
          }}
          onClose={() => setShowDocumentEditor(false)}
        />
      )}
    </>
  );
};

export default NodePage;