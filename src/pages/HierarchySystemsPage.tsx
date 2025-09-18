import { WikiLayout } from "@/components/WikiLayout";
import { HierarchicalContent } from "@/components/HierarchicalContent";
import { ContentNode } from "@/components/HierarchicalContent";

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
  return (
    <WikiLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Hierarchy Systems - Dedicated View</h1>
          <p className="text-lg text-muted-foreground">
            Complete guide to understanding and implementing hierarchical organizational structures.
          </p>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <HierarchicalContent node={hierarchySystemsContent} />
        </div>
      </div>
    </WikiLayout>
  );
};

export default HierarchySystemsPage;