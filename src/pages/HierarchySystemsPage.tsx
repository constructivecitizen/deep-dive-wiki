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

// Dedicated page content for hierarchy systems
const hierarchySystemsContent: ContentNode = {
  id: "hierarchy-systems-dedicated",
  content: "Hierarchy Systems: Comprehensive Guide to Organizational Structures",
  tags: ["guide", "comprehensive", "structures"],
  depth: 0,
  children: [
    {
      id: "intro-section",
      content: "Introduction to Hierarchical Organization",
      tags: ["introduction", "overview"],
      depth: 1,
      children: [
        {
          id: "definition",
          content: "A hierarchy is a system of organization wherein people or groups are ranked one above the other according to status or authority.",
          tags: ["definition", "authority", "status"],
          depth: 2
        },
        {
          id: "benefits",
          content: "Hierarchical structures provide clear chains of command, efficient decision-making processes, and well-defined responsibilities.",
          tags: ["benefits", "decision-making", "responsibility"],
          depth: 2,
          children: [
            {
              id: "efficiency",
              content: "Efficiency gains come from specialized roles and clear reporting structures that reduce confusion and overlap.",
              tags: ["efficiency", "specialization", "reporting"],
              depth: 3
            },
            {
              id: "scalability",
              content: "Hierarchies naturally scale as organizations grow, providing frameworks for managing increasing complexity.",
              tags: ["scalability", "growth", "complexity"],
              depth: 3
            }
          ]
        }
      ]
    },
    {
      id: "implementation-best-practices",
      content: "Best Practices for Implementation",
      tags: ["best-practices", "implementation"],
      depth: 1,
      children: [
        {
          id: "depth-management",
          content: "Managing hierarchy depth is crucial - aim for 5-7 levels maximum to maintain clarity and efficiency.",
          tags: ["depth", "levels", "clarity"],
          depth: 2
        },
        {
          id: "span-of-control",
          content: "Each manager should typically oversee 3-8 direct reports, balancing oversight with autonomy.",
          tags: ["span-control", "management", "autonomy"],
          depth: 2
        }
      ]
    }
  ]
};

const HierarchySystemsPage = () => {
  const [editMode, setEditMode] = useState(false);
  const [showDocumentEditor, setShowDocumentEditor] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [content, setContent] = useState<ContentNode[]>([hierarchySystemsContent]);
  const [filteredContent, setFilteredContent] = useState<ContentNode[]>([hierarchySystemsContent]);
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
        currentPath="/hierarchy-systems"
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
          <h1 className="text-3xl font-bold text-foreground">Hierarchy Systems - Dedicated View</h1>
          <p className="text-lg text-muted-foreground">
            Complete guide to understanding and implementing hierarchical organizational structures.
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

export default HierarchySystemsPage;