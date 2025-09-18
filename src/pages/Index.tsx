import { useState } from "react";
import { WikiLayout } from "@/components/WikiLayout";
import { HierarchicalContent } from "@/components/HierarchicalContent";
import { EditModeToggle } from "@/components/EditModeToggle";
import { sampleContent } from "@/data/sampleDocument";

const Index = () => {
  const [editMode, setEditMode] = useState(false);
  const [content, setContent] = useState(sampleContent);

  const handleNodeUpdate = (updatedNode: any) => {
    // In a real app, this would update the data source
    console.log("Node updated:", updatedNode);
  };

  return (
    <WikiLayout>
      <EditModeToggle onToggle={setEditMode} />
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Hierarchy Systems</h1>
          <p className="text-lg text-muted-foreground">
            Learn about organizational structures and information management through hierarchical systems.
          </p>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <HierarchicalContent 
            node={content} 
            showTags={false} 
            editMode={editMode}
            onNodeUpdate={handleNodeUpdate}
          />
        </div>
      </div>
    </WikiLayout>
  );
};

export default Index;
