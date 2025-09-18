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

const taggingContent: ContentNode = {
  id: "tagging-strategies-root",
  content: "Tagging Strategies for Knowledge Organization",
  tags: ["tagging", "organization", "strategy"],
  depth: 0,
  children: [
    {
      id: "tag-taxonomy",
      content: "Developing a coherent tag taxonomy is essential for consistent categorization across your knowledge base.",
      tags: ["taxonomy", "categorization", "consistency"],
      depth: 1,
      path: "#tag-taxonomy",
      children: [
        {
          id: "semantic-tags",
          content: "Semantic tags describe the meaning or subject matter of content, such as 'machine-learning' or 'user-interface'.",
          tags: ["semantic", "meaning", "subject"],
          depth: 2,
          path: "#semantic-tags"
        },
        {
          id: "functional-tags", 
          content: "Functional tags indicate the purpose or use of content, like 'tutorial', 'reference', or 'troubleshooting'.",
          tags: ["functional", "purpose", "use-case"],
          depth: 2,
          path: "#functional-tags"
        },
        {
          id: "temporal-tags",
          content: "Temporal tags help organize content by time relevance, such as 'current', 'deprecated', or 'future-planning'.",
          tags: ["temporal", "time", "relevance"],
          depth: 2,
          path: "#temporal-tags"
        }
      ]
    },
    {
      id: "filtering-mechanisms",
      content: "Effective filtering mechanisms allow users to quickly narrow down content based on their current needs and interests.",
      tags: ["filtering", "search", "discovery"],
      depth: 1,
      path: "#filtering-mechanisms",
      children: [
        {
          id: "inclusive-filtering",
          content: "Inclusive filtering shows content that matches ANY of the selected tags, broadening the result set.",
          tags: ["inclusive", "any", "broad"],
          depth: 2,
          path: "#inclusive-filtering"
        },
        {
          id: "exclusive-filtering", 
          content: "Exclusive filtering shows content that matches ALL selected tags, providing more precise results.",
          tags: ["exclusive", "all", "precise"],
          depth: 2,
          path: "#exclusive-filtering"
        }
      ]
    }
  ]
};

const TaggingStrategiesPage = () => {
  const [editMode, setEditMode] = useState(false);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [content, setContent] = useState<ContentNode[]>([taggingContent]);
  const [filteredContent, setFilteredContent] = useState<ContentNode[]>([taggingContent]);
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
        currentPath="/tagging-strategies"
        navigationStructure={navigationStructure}
        pageTitle="Tagging Strategies"
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
          <h1 className="text-3xl font-bold text-foreground">Tagging Strategies</h1>
          <p className="text-lg text-muted-foreground">
            Learn effective approaches to organizing and filtering knowledge through strategic tagging.
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

export default TaggingStrategiesPage;