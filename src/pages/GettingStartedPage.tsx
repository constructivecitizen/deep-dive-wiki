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

const gettingStartedContent: ContentNode = {
  id: "getting-started-root",
  content: "Getting Started with the Document Wiki System",
  tags: ["getting-started", "introduction", "basics"],
  depth: 0,
  children: [
    {
      id: "introduction",
      content: "Welcome to the Document Wiki System. This comprehensive knowledge management platform helps you organize, navigate, and discover information through hierarchical structures and intelligent tagging systems.",
      tags: ["welcome", "overview", "introduction"],
      depth: 1,
      path: "#introduction",
      children: [
        {
          id: "key-features",
          content: "The system provides hierarchical content organization, advanced filtering capabilities, real-time editing, and intuitive navigation tools.",
          tags: ["features", "capabilities", "tools"],
          depth: 2,
          path: "#key-features"
        },
        {
          id: "benefits",
          content: "Benefits include improved knowledge discovery, consistent organization, collaborative editing, and scalable information architecture.",
          tags: ["benefits", "advantages", "value"],
          depth: 2,
          path: "#benefits"
        }
      ]
    },
    {
      id: "initial-setup",
      content: "Setting up your knowledge base involves planning your information architecture, defining your tagging strategy, and configuring user access controls.",
      tags: ["setup", "configuration", "planning"],
      depth: 1,
      path: "#initial-setup",
      children: [
        {
          id: "planning-structure",
          content: "Start by mapping out your main content categories and understanding how information flows within your organization.",
          tags: ["planning", "structure", "categories"],
          depth: 2,
          path: "#planning-structure"
        },
        {
          id: "user-roles",
          content: "Define different user roles such as editors, contributors, and viewers, each with appropriate permissions for content management.",
          tags: ["users", "roles", "permissions"],
          depth: 2,
          path: "#user-roles"
        }
      ]
    }
  ]
};

const GettingStartedPage = () => {
  const [editMode, setEditMode] = useState(false);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [content, setContent] = useState<ContentNode[]>([gettingStartedContent]);
  const [filteredContent, setFilteredContent] = useState<ContentNode[]>([gettingStartedContent]);
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
        currentPath="/getting-started"
        navigationStructure={navigationStructure}
        pageTitle="Getting Started"
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
          <h1 className="text-3xl font-bold text-foreground">Getting Started</h1>
          <p className="text-lg text-muted-foreground">
            Learn the basics of using the Document Wiki System for effective knowledge management.
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

export default GettingStartedPage;