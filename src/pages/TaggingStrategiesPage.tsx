import { useState } from "react";
import { WikiLayout } from "@/components/WikiLayout";
import { HierarchicalContent } from "@/components/HierarchicalContent";
import { EditModeToggle } from "@/components/EditModeToggle";
import { FilterPanel } from "@/components/FilterPanel";
import { DocumentEditor } from "@/components/DocumentEditor";
import { NavigationManager } from "@/components/NavigationManager";
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
      children: [
        {
          id: "semantic-tags",
          content: "Semantic tags describe the meaning or subject matter of content, such as 'machine-learning' or 'user-interface'.",
          tags: ["semantic", "meaning", "subject"],
          depth: 2
        },
        {
          id: "functional-tags", 
          content: "Functional tags indicate the purpose or use of content, like 'tutorial', 'reference', or 'troubleshooting'.",
          tags: ["functional", "purpose", "use-case"],
          depth: 2
        },
        {
          id: "temporal-tags",
          content: "Temporal tags help organize content by time relevance, such as 'current', 'deprecated', or 'future-planning'.",
          tags: ["temporal", "time", "relevance"],
          depth: 2
        }
      ]
    },
    {
      id: "filtering-mechanisms",
      content: "Effective filtering mechanisms allow users to quickly narrow down content based on their current needs and interests.",
      tags: ["filtering", "search", "discovery"],
      depth: 1,
      children: [
        {
          id: "inclusive-filtering",
          content: "Inclusive filtering shows content that matches ANY of the selected tags, broadening the result set.",
          tags: ["inclusive", "any", "broad"],
          depth: 2
        },
        {
          id: "exclusive-filtering", 
          content: "Exclusive filtering shows content that matches ALL selected tags, providing more precise results.",
          tags: ["exclusive", "all", "precise"],
          depth: 2
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
    <WikiLayout navigationStructure={navigationStructure}>
      <div className="flex items-center gap-4 mb-6">
        <EditModeToggle 
          onToggle={setEditMode}
          onDocumentEdit={() => setShowDocumentEditor(true)}
        />
        <NavigationManager 
          structure={navigationStructure}
          onStructureChange={setNavigationStructure}
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
          <h1 className="text-3xl font-bold text-foreground">Tagging Strategies</h1>
          <p className="text-lg text-muted-foreground">
            Learn effective approaches to organizing and filtering knowledge through strategic tagging.
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

export default TaggingStrategiesPage;