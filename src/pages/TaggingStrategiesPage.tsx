import { WikiLayout } from "@/components/WikiLayout";
import { HierarchicalContent } from "@/components/HierarchicalContent";
import { ContentNode } from "@/components/HierarchicalContent";

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
  return (
    <WikiLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Tagging Strategies</h1>
          <p className="text-lg text-muted-foreground">
            Learn effective approaches to organizing and filtering knowledge through strategic tagging.
          </p>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <HierarchicalContent node={taggingContent} showTags={false} />
        </div>
      </div>
    </WikiLayout>
  );
};

export default TaggingStrategiesPage;