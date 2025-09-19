import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";

interface SectionViewProps {
  sectionData: {
    content: string;
    title: string;
    level: number;
    parentPath: string;
  };
  onBack: () => void;
  navigationStructure?: any[];
}

export const SectionView: React.FC<SectionViewProps> = ({ 
  sectionData, 
  onBack,
  navigationStructure = []
}) => {
  return (
    <div className="space-y-6">
      {/* Breadcrumb navigation */}
      <PageBreadcrumb 
        currentPath={sectionData.parentPath}
        navigationStructure={navigationStructure}
        pageTitle={sectionData.title}
      />

      {/* Header with navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Document
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{sectionData.title}</h1>
          </div>
        </div>
      </div>

      {/* Section content */}
      <div className="bg-card rounded-lg border border-border p-8">
        <HierarchicalContentDisplay 
          content={sectionData.content}
          onSectionClick={() => {}}
        />
      </div>
    </div>
  );
};