import React, { useState, useEffect } from "react";
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
  const SIDEBAR_WIDTH_KEY = 'wiki-sidebar-width';
  const [sidebarSize, setSidebarSize] = useState<number>(20);

  // Load saved sidebar width on mount
  useEffect(() => {
    const savedSize = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    if (savedSize) {
      const parsedSize = parseFloat(savedSize);
      if (!isNaN(parsedSize) && parsedSize >= 15 && parsedSize <= 40) {
        setSidebarSize(parsedSize);
      }
    }
  }, []);

  // Save sidebar width when it changes
  const handleLayoutChange = (sizes: number[]) => {
    if (sizes[0]) {
      localStorage.setItem(SIDEBAR_WIDTH_KEY, sizes[0].toString());
      setSidebarSize(sizes[0]);
    }
  };

  return (
    <ResizablePanelGroup 
      direction="horizontal" 
      className="min-h-screen bg-background h-screen w-full"
      onLayout={handleLayoutChange}
    >
      <ResizablePanel defaultSize={sidebarSize} minSize={15} maxSize={40}>
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
  );
};
