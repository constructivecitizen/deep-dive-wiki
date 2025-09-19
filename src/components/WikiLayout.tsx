import { HybridNavigationSidebar } from "./HybridNavigationSidebar";
import { NavigationNode, WikiDocument } from "@/services/contentService";

interface WikiLayoutProps {
  children: React.ReactNode;
  navigationStructure?: NavigationNode[];
  contentNodes?: WikiDocument[];
  onContentNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
  currentPath?: string;
  onStructureUpdate?: () => void;
  actionMenu?: React.ReactNode;
  onSectionView?: (sectionData: { content: string; title: string; level: number; parentPath: string }) => void;
  onNavigationClick?: (navId: string, path: string) => void;
}

export const WikiLayout = ({ 
  children, 
  navigationStructure = [], 
  contentNodes = [],
  onContentNodeClick,
  activeNodeId,
  currentPath,
  onStructureUpdate,
  actionMenu,
  onSectionView,
  onNavigationClick
}: WikiLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Document Wiki</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Hierarchical knowledge management system
              </p>
            </div>
            {actionMenu && (
              <div className="flex items-center">
                {actionMenu}
              </div>
            )}
          </div>
        </div>
      </header>
      
      <div className="flex h-[calc(100vh-80px)]">
        <aside className="w-80 flex-shrink-0 border-r border-border overflow-y-auto">
          <HybridNavigationSidebar 
            structure={navigationStructure} 
            contentNodes={contentNodes}
            onSectionView={onSectionView}
            currentPath={currentPath}
            onStructureUpdate={onStructureUpdate || (() => {})}
            onNavigationClick={onNavigationClick}
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