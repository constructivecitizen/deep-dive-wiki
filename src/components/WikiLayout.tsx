import { HybridNavigationSidebar } from "./HybridNavigationSidebar";
import { NavigationNode, WikiDocument } from "@/services/contentService";
import BetterProdLogo from "@/assets/BetterProd-logo.png";

interface WikiLayoutProps {
  children: React.ReactNode;
  navigationStructure?: NavigationNode[];
  contentNodes?: WikiDocument[];
  onContentNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
  onStructureUpdate?: () => void;
  actionMenu?: React.ReactNode;
  onNavigationClick?: (navId: string, path: string) => void;
}

export const WikiLayout = ({ 
  children, 
  navigationStructure = [], 
  contentNodes = [],
  onContentNodeClick,
  activeNodeId,
  onStructureUpdate,
  actionMenu,
  onNavigationClick
}: WikiLayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center" style={{ paddingLeft: 'calc(20rem + 1.5rem)' }}>
              <img 
                src={BetterProdLogo} 
                alt="BetterProd" 
                className="h-8 w-auto"
              />
            </div>
            {actionMenu && (
              <div className="flex items-center pr-6">
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