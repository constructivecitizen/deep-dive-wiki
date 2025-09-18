import { DocumentStructure } from "@/components/DocumentSidebar";
import { ContentNode } from "@/components/HierarchicalContent";

// Sample document structure for sidebar navigation
export const documentStructure: DocumentStructure[] = [
  {
    id: "getting-started",
    title: "Getting Started",
    type: "folder",
    path: "/getting-started",
    children: [
      {
        id: "intro",
        title: "Introduction",
        type: "document",
        path: "/getting-started/intro"
      },
      {
        id: "setup",
        title: "Initial Setup",
        type: "document", 
        path: "/getting-started/setup"
      }
    ]
  },
  {
    id: "knowledge-management",
    title: "Knowledge Management",
    type: "folder",
    path: "/knowledge-management",
    children: [
      {
        id: "hierarchy-systems",
        title: "Hierarchy Systems", 
        type: "document",
        path: "/hierarchy-systems"
      },
      {
        id: "tagging-strategies",
        title: "Tagging Strategies",
        type: "document",
        path: "/tagging-strategies"
      }
    ]
  },
  {
    id: "advanced-topics",
    title: "Advanced Topics",
    type: "folder",
    path: "/advanced-topics",
    children: [
      {
        id: "deep-structures",
        title: "Deep Structures",
        type: "document",
        path: "/deep-structures"
      }
    ]
  }
];

// Sample hierarchical content with deep nesting
export const sampleContent: ContentNode = {
  id: "hierarchy-systems-root",
  content: "Hierarchy Systems are fundamental organizational structures that help manage complex information through nested relationships.",
  tags: ["systems", "organization", "fundamentals"],
  depth: 0,
  path: "/hierarchy-systems",
  children: [
    {
      id: "hs-1",
      content: "Understanding the basic principles of hierarchical organization is crucial for effective knowledge management.",
      tags: ["principles", "basics"],
      depth: 1,
      children: [
        {
          id: "hs-1-1",
          content: "Tree structures provide a natural way to represent parent-child relationships in information systems.",
          tags: ["tree-structure", "relationships"],
          depth: 2,
          path: "/hierarchy-systems/tree-structures",
          children: [
            {
              id: "hs-1-1-1",
              content: "Each node in a tree can have multiple children but only one parent, creating a clear hierarchical flow.",
              tags: ["nodes", "parent-child", "flow"],
              depth: 3,
              children: [
                {
                  id: "hs-1-1-1-1",
                  content: "Root nodes serve as the entry point for the entire hierarchy, establishing the foundational context.",
                  tags: ["root", "foundation", "context"],
                  depth: 4
                },
                {
                  id: "hs-1-1-1-2",
                  content: "Leaf nodes contain the most specific information and typically represent actionable items or detailed concepts.",
                  tags: ["leaf", "specific", "actionable"],
                  depth: 4
                }
              ]
            },
            {
              id: "hs-1-1-2",
              content: "Balancing tree depth with breadth is essential for usability - too deep becomes unwieldy, too broad becomes overwhelming.",
              tags: ["balance", "usability", "design"],
              depth: 3
            }
          ]
        },
        {
          id: "hs-1-2", 
          content: "Graph-based structures allow for more complex relationships where items can belong to multiple categories.",
          tags: ["graphs", "complex", "categories"],
          depth: 2,
          children: [
            {
              id: "hs-1-2-1",
              content: "Directed acyclic graphs (DAGs) prevent circular references while allowing multiple inheritance paths.",
              tags: ["dag", "inheritance", "references"],
              depth: 3
            }
          ]
        }
      ]
    },
    {
      id: "hs-2",
      content: "Implementation strategies vary based on the complexity and scale of the information being organized.",
      tags: ["implementation", "strategy", "scale"],
      depth: 1,
      children: [
        {
          id: "hs-2-1",
          content: "For small to medium datasets, recursive components provide an elegant solution for rendering hierarchical content.",
          tags: ["recursive", "components", "rendering"],
          depth: 2,
          children: [
            {
              id: "hs-2-1-1",
              content: "React's component model naturally supports recursive rendering through self-referencing components.",
              tags: ["react", "recursive", "self-referencing"],
              depth: 3
            },
            {
              id: "hs-2-1-2",
              content: "State management becomes critical when dealing with expand/collapse functionality across deep hierarchies.",
              tags: ["state", "expand-collapse", "deep"],
              depth: 3,
              children: [
                {
                  id: "hs-2-1-2-1",
                  content: "Local state works well for simple cases but global state management may be needed for complex filtering.",
                  tags: ["local-state", "global-state", "filtering"],
                  depth: 4
                }
              ]
            }
          ]
        },
        {
          id: "hs-2-2",
          content: "Large datasets require virtualization techniques to maintain performance when rendering thousands of hierarchical items.",
          tags: ["virtualization", "performance", "large-datasets"],
          depth: 2
        }
      ]
    }
  ]
};