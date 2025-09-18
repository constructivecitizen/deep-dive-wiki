import { useState } from "react";
import { WikiLayout } from "@/components/WikiLayout";
import { HierarchicalContent } from "@/components/HierarchicalContent";
import { FilterPanel } from "@/components/FilterPanel";
import { DocumentEditor } from "@/components/DocumentEditor";
import { ActionMenu } from "@/components/ActionMenu";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";
import { NavigationManagerModal } from "@/components/NavigationManagerModal";
import { sampleContent, documentStructure } from "@/data/sampleDocument";
import { ContentNode } from "@/components/HierarchicalContent";
import { DocumentStructure } from "@/components/DocumentSidebar";

const Index = () => {
  const [editMode, setEditMode] = useState(false);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [content, setContent] = useState<ContentNode[]>([sampleContent]);
  const [filteredContent, setFilteredContent] = useState<ContentNode[]>([sampleContent]);
  const [navigationStructure, setNavigationStructure] = useState<DocumentStructure[]>(documentStructure);
  const [activeNodeId, setActiveNodeId] = useState<string | undefined>();

  const handleNodeUpdate = (updatedNode: any) => {
    // In a real app, this would update the data source
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

  const handleContentNodeClick = (nodeId: string) => {
    setActiveNodeId(nodeId);
    // Scroll to the node in the main content area
    const element = document.getElementById(`content-node-${nodeId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'center' });
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
        currentPath="/"
        navigationStructure={navigationStructure}
        pageTitle="Hierarchy Systems"
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
          <h1 className="text-3xl font-bold text-foreground">Hierarchy Systems</h1>
          <p className="text-lg text-muted-foreground">
            Learn about organizational structures and information management through hierarchical systems.
          </p>
        </div>
        
        <div className="prose prose-lg max-w-none">
          {filteredContent.map((node, index) => (
            <div key={node.id || index} id={`content-node-${node.id}`}>
              <HierarchicalContent 
                node={node} 
                showTags={false} 
                editMode={editMode}
                onNodeUpdate={handleNodeUpdate}
              />
            </div>
          ))}
        </div>
      </div>
    </WikiLayout>
  );
};

export default Index;
