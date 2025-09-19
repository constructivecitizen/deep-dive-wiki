import { HierarchicalContentDisplay } from "@/components/HierarchicalContentDisplay";
import { PageBreadcrumb } from "@/components/PageBreadcrumb";

interface SectionViewProps {
  sectionData: {
    content: string;
    title: string;
    level: number;
    parentPath: string;
    sectionHierarchy?: Array<{
      title: string;
      level: number;
    }>;
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
    <div className="space-y-3">
      {/* Breadcrumb navigation */}
      <PageBreadcrumb 
        currentPath={sectionData.parentPath}
        navigationStructure={navigationStructure}
        pageTitle={undefined}
        sectionTitle={sectionData.title}
        sectionHierarchy={sectionData.sectionHierarchy}
        onSectionBack={onBack}
        onSectionNavigate={(sectionTitle) => {
          // Navigate to parent section - for now just go back to document
          onBack();
        }}
      />

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-4xl font-bold text-foreground">{sectionData.title}</h1>
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