import { HybridNavigationSidebar } from "./HybridNavigationSidebar";
import { NavigationNode, WikiDocument } from "@/services/contentService";
import BetterProdLogoB from "@/assets/BetterProd-logo-3A-3.png";
import BetterProdLogoText from "@/assets/BetterProd-logo-3B.png";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface WikiLayoutProps {
  children: React.ReactNode;
  navigationStructure?: NavigationNode[];
  contentNodes?: WikiDocument[];
  onContentNodeClick?: (nodeId: string) => void;
  activeNodeId?: string;
  onStructureUpdate?: () => void;
  onNavigationClick?: (navId: string, path: string) => void;
  setShowEditor?: (show: boolean) => void;
  currentPath?: string;
}

export const WikiLayout = ({ 
  children, 
  navigationStructure = [], 
  contentNodes = [],
  onContentNodeClick,
  activeNodeId,
  onStructureUpdate,
  onNavigationClick,
  setShowEditor,
  currentPath
}: WikiLayoutProps) => {
  return (
    <div className="min-h-screen bg-background flex h-screen w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full w-full">
        <ResizablePanel defaultSize={20} minSize={15} maxSize={40}>
          <aside className="h-full border-r border-sidebar-border flex flex-col bg-sidebar">
            <header className="border-b border-sidebar-border section-bg-1">
              <div className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center pl-[0.75rem]">
                    <div className="flex items-center">
                      <img 
                        src={BetterProdLogoB} 
                        alt="BetterProd B" 
                        className="h-16 w-auto"
                      />
                      <img 
                        src={BetterProdLogoText} 
                        alt="etterProd" 
                        className="h-10 w-auto"
                      />
                    </div>
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
                currentPath={currentPath}
              />
            </div>
          </aside>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={80}>
          <main className="h-full overflow-y-auto">
            <div className="container mx-auto px-6 py-8 max-w-4xl">
              {children}
            </div>
          </main>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};
