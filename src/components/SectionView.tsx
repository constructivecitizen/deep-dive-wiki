import { Button } from "@/components/ui/button";
import { ArrowLeft, Edit } from "lucide-react";
import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";

interface SectionViewProps {
  sectionData: {
    content: string;
    title: string;
    level: number;
    parentPath: string;
  };
  onEdit: () => void;
  onBack: () => void;
}

export const SectionView: React.FC<SectionViewProps> = ({ 
  sectionData, 
  onEdit, 
  onBack 
}) => {
  return (
    <div className="space-y-6">
      {/* Header with navigation and actions */}
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
            <p className="text-sm text-muted-foreground">Level {sectionData.level} section</p>
          </div>
        </div>
        <Button 
          onClick={onEdit}
          className="flex items-center gap-2"
        >
          <Edit className="h-4 w-4" />
          Edit Section
        </Button>
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