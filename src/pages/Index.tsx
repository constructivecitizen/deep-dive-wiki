import { useState } from "react";
import { WikiLayout } from "@/components/WikiLayout";
import { HierarchicalContent } from "@/components/HierarchicalContent";
import { EditModeToggle } from "@/components/EditModeToggle";
import { FilterPanel } from "@/components/FilterPanel";
import { DocumentEditor } from "@/components/DocumentEditor";
import { NodeManagement } from "@/components/NodeManagement";
import { sampleContent } from "@/data/sampleDocument";
import { ContentNode } from "@/components/HierarchicalContent";

const Index = () => {
  const [editMode, setEditMode] = useState(false);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [content, setContent] = useState<ContentNode[]>([sampleContent]);
  const [filteredContent, setFilteredContent] = useState<ContentNode[]>([sampleContent]);

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
    <WikiLayout>
      <div className="flex items-center gap-4 mb-6">
        <EditModeToggle 
          onToggle={setEditMode}
          onDocumentEdit={() => setShowDocumentEditor(true)}
        />
        <NodeManagement 
          nodes={content}
          onNodesChange={(nodes) => {
            setContent(nodes);
            setFilteredContent(nodes);
          }}
        />
      </div>
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
            <HierarchicalContent 
              key={node.id || index}
              node={node} 
              showTags={false} 
              editMode={editMode}
              onNodeUpdate={handleNodeUpdate}
            />
          ))}
        </div>
      </div>
    </WikiLayout>
  );
};

export default Index;
