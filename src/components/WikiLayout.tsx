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
  onNavigationClick?: (navId: string, path: string) => void;
  setShowEditor?: (show: boolean) => void;
}

export const WikiLayout = ({ 
  children, 
  navigationStructure = [], 
  contentNodes = [],
  onContentNodeClick,
  activeNodeId,
  onStructureUpdate,
  onNavigationClick,
  setShowEditor
}: WikiLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex h-screen">
      <aside className="w-80 flex-shrink-0 border-r border-border flex flex-col">
        <header className="border-b border-border bg-card">
          <div className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center pl-[0.75rem]">
                <img 
                  src={BetterProdLogo} 
                  alt="BetterProd" 
                  className="h-16 w-auto"
                />
              </div>
            </div>
          </div>
        </header>
        
        <div className="flex-1 overflow-y-auto">
          <HybridNavigationSidebar 
            structure={navigationStructure} 
            contentNodes={contentNodes}
            onStructureUpdate={onStructureUpdate || (() => {})}
            onNavigationClick={onNavigationClick}
            setShowEditor={setShowEditor}
          />
        </div>
      </aside>
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto px-6 py-8 max-w-4xl">
          {children}
        </div>
      </main>
    </div>
  );
};
