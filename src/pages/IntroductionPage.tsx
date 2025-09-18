import { useState } from "react";
import { WikiLayout } from "@/components/WikiLayout";
import { HierarchicalContent } from "@/components/HierarchicalContent";
import { FilterPanel } from "@/components/FilterPanel";
import { DocumentEditor } from "@/components/DocumentEditor";
import { ActionMenu } from "@/components/ActionMenu";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { NavigationManagerModal } from "@/components/NavigationManagerModal";
import { ContentNode } from "@/components/HierarchicalContent";
import { DocumentStructure } from "@/components/DocumentSidebar";
import { documentStructure } from "@/data/sampleDocument";

const introductionContent: ContentNode = {
  id: "introduction-root",
  content: "Introduction to Document Wiki Systems",
  tags: ["introduction", "overview", "concepts"],
  depth: 0,
  children: [
    {
      id: "what-is-wiki",
      content: "A document wiki is a collaborative platform that allows multiple users to create, edit, and organize knowledge in a structured, interconnected format.",
      tags: ["definition", "collaborative", "platform"],
      depth: 1,
      path: "#what-is-wiki",
      children: [
        {
          id: "core-principles",
          content: "Wiki systems are built on principles of open collaboration, version control, linking between concepts, and democratic content creation.",
          tags: ["principles", "collaboration", "version-control"],
          depth: 2,
          path: "#core-principles"
        },
        {
          id: "content-structure",
          content: "Content is organized through hierarchical relationships, cross-references, and semantic tagging to create a rich knowledge network.",
          tags: ["structure", "hierarchy", "network"],
          depth: 2,
          path: "#content-structure"
        }
      ]
    },
    {
      id: "use-cases",
      content: "Document wikis excel in scenarios requiring collaborative documentation, knowledge bases, project documentation, and institutional memory preservation.",
      tags: ["use-cases", "documentation", "knowledge-base"],
      depth: 1,
      path: "#use-cases",
      children: [
        {
          id: "team-collaboration",
          content: "Teams use wikis to maintain shared understanding, document processes, and preserve decision-making context across projects.",
          tags: ["teams", "processes", "decisions"],
          depth: 2,
          path: "#team-collaboration"
        },
        {
          id: "knowledge-management",
          content: "Organizations leverage wikis to capture tacit knowledge, create learning resources, and facilitate knowledge transfer.",
          tags: ["organizations", "learning", "transfer"],
          depth: 2,
          path: "#knowledge-management"
        }
      ]
    }
  ]
};

const IntroductionPage = () => {
  const [editMode, setEditMode] = useState(false);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [content, setContent] = useState<ContentNode[]>([introductionContent]);
  const [filteredContent, setFilteredContent] = useState<ContentNode[]>([introductionContent]);
  const [navigationStructure, setNavigationStructure] = useState<DocumentStructure[]>(documentStructure);
  const [activeNodeId, setActiveNodeId] = useState<string | undefined>();
  const [selectedNodeContent, setSelectedNodeContent] = useState<ContentNode | null>(null);

  const handleNodeUpdate = (updatedNode: any) => {
    console.log("Node updated:", updatedNode);
  };

  const handleDocumentSave = (nodes: ContentNode[]) => {
    setContent(nodes);
    setFilteredContent(nodes);
    setShowDocumentEditor(false);
  };

  const handleFilterChange = (filtered: ContentNode[]) => {
    setFilteredContent(filtered);
  };

  const findNodeById = (nodes: ContentNode[], nodeId: string): ContentNode | null => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return node;
      }
      if (node.children) {
        const found = findNodeById(node.children, nodeId);
        if (found) return found;
      }
    }
    return null;
  };

  const handleContentNodeClick = (nodeId: string) => {
    setActiveNodeId(nodeId);
    const foundNode = findNodeById(content, nodeId);
    if (foundNode) {
      setSelectedNodeContent(foundNode);
    }
  };

  if (showDocumentEditor) {
    return (
      <DocumentEditor
        initialContent={content}
        onSave={handleDocumentSave}
        onClose={() => setShowDocumentEditor(false)}
      />
    );
  }

  return (
    <WikiLayout 
      navigationStructure={navigationStructure}
      contentNodes={content}
      onContentNodeClick={handleContentNodeClick}
      activeNodeId={activeNodeId}
    >
      <div className="flex justify-end mb-6">
        <ActionMenu
          editMode={editMode}
          onToggleEdit={setEditMode}
          onDocumentEdit={() => setShowDocumentEditor(true)}
          onToggleFilter={() => setShowFilterPanel(!showFilterPanel)}
          navigationStructure={navigationStructure}
          onStructureChange={setNavigationStructure}
        />
      </div>
      
      <PageBreadcrumb
        currentPath="/getting-started/intro"
        navigationStructure={navigationStructure}
        pageTitle="Introduction"
      />
      
      <NavigationManagerModal
        structure={navigationStructure}
        onStructureChange={setNavigationStructure}
      />
      
      <FilterPanel
        allNodes={content}
        onFilterChange={handleFilterChange}
        isOpen={showFilterPanel}
        onToggle={() => setShowFilterPanel(!showFilterPanel)}
      />
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Introduction</h1>
          <p className="text-lg text-muted-foreground">
            Understanding the fundamentals of document wiki systems and collaborative knowledge management.
          </p>
        </div>
        
        <div className="prose prose-lg max-w-none">
          {selectedNodeContent ? (
            <div>
              <div className="mb-4">
                <button
                  onClick={() => setSelectedNodeContent(null)}
                  className="text-sm text-primary hover:text-primary-hover underline"
                >
                  ← Back to full content
                </button>
              </div>
              <div key={selectedNodeContent.id} id={`content-node-${selectedNodeContent.id}`}>
                <HierarchicalContent 
                  node={selectedNodeContent} 
                  showTags={false} 
                  editMode={editMode}
                  onNodeUpdate={handleNodeUpdate}
                  onDedicatedPageClick={handleContentNodeClick}
                />
              </div>
            </div>
          ) : (
            filteredContent.map((node, index) => (
              <div key={node.id || index} id={`content-node-${node.id}`}>
                <HierarchicalContent 
                  node={node} 
                  showTags={false} 
                  editMode={editMode}
                  onNodeUpdate={handleNodeUpdate}
                  onDedicatedPageClick={handleContentNodeClick}
                />
              </div>
            ))
          )}
        </div>
      </div>
    </WikiLayout>
  );
};

export default IntroductionPage;