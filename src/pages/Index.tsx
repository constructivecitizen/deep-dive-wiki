import { WikiLayout } from "@/components/WikiLayout";
import { HierarchicalContent } from "@/components/HierarchicalContent";
import { sampleContent } from "@/data/sampleDocument";

const Index = () => {
  return (
    <WikiLayout>
      <div className="space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">Hierarchy Systems</h1>
          <p className="text-lg text-muted-foreground">
            Learn about organizational structures and information management through hierarchical systems.
          </p>
        </div>
        
        <div className="prose prose-lg max-w-none">
          <HierarchicalContent node={sampleContent} />
        </div>
      </div>
    </WikiLayout>
  );
};

export default Index;
