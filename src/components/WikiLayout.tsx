import { EditableNavigationSidebar } from "./EditableNavigationSidebar";
import { NavigationNode, ContentNode } from "@/services/contentService";

interface WikiLayoutProps {
  children: React.ReactNode;
  navigationStructure?: NavigationNode[];
  contentNodes?: ContentNode[];
  onContentNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
  currentPath?: string;
  onStructureUpdate?: () => void;
}

export const WikiLayout = ({ 
  children, 
  navigationStructure = [], 
  contentNodes = [],
  onContentNodeClick,
  activeNodeId,
  currentPath,
  onStructureUpdate
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
          <EditableNavigationSidebar 
            structure={navigationStructure} 
            contentNodes={contentNodes}
            onContentNodeClick={onContentNodeClick}
            activeNodeId={activeNodeId}
            currentPath={currentPath}
            onStructureUpdate={onStructureUpdate || (() => {})}
          />
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