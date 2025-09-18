import { DocumentSidebar, DocumentStructure } from "./DocumentSidebar";
import { ContentNavigationSidebar } from "./ContentNavigationSidebar";
import { documentStructure } from "@/data/sampleDocument";
import { ContentNode } from "@/components/HierarchicalContent";

interface WikiLayoutProps {
  children: React.ReactNode;
  navigationStructure?: DocumentStructure[];
  contentNodes?: ContentNode[];
  onContentNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
}

export const WikiLayout = ({ 
  children, 
  navigationStructure = documentStructure, 
  contentNodes = [],
  onContentNodeClick,
  activeNodeId
}: WikiLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <h1 className="text-2xl font-bold text-foreground">Document Wiki</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hierarchical knowledge management system
          </p>
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-80px)]">
        <aside className="w-80 flex-shrink-0 border-r border-border">
          {contentNodes.length > 0 ? (
            <ContentNavigationSidebar 
              contentNodes={contentNodes}
              onNodeClick={onContentNodeClick}
              activeNodeId={activeNodeId}
            />
          ) : (
            <DocumentSidebar structure={navigationStructure} />
          )}
        </aside>
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-6 py-8 max-w-4xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};