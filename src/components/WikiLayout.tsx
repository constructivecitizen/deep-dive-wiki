import React, { useState } from "react";
import { HybridNavigationSidebar } from "./HybridNavigationSidebar";
import { SearchOverlay } from "./SearchOverlay";
import { NavigationNode, WikiDocument } from "@/services/contentService";
import BetterProdLogoB from "@/assets/BetterProd-logo-3A-3.png";
import BetterProdLogoText from "@/assets/BetterProd-logo-3B.png";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  onSectionNavigate?: (sectionTitle: string) => void;
  activeSectionId?: string | null;
  activeDocumentPath?: string | null;
  setActiveSectionId?: (id: string | null) => void;
  expandDepth?: number;
  expandMode?: 'depth' | 'mixed';
  onExpandDepthChange?: (depth: number) => void;
  showDescriptions?: 'on' | 'off' | 'mixed';
  onShowDescriptionsChange?: (mode: 'on' | 'off') => void;
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
  currentPath,
  onSectionNavigate,
  activeSectionId,
  activeDocumentPath,
  setActiveSectionId,
  expandDepth,
  expandMode,
  onExpandDepthChange,
  showDescriptions,
  onShowDescriptionsChange
}: WikiLayoutProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const sidebarContent = (
    <>
      <header className="border-b border-sidebar-border section-bg-1 shrink-0">
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
                  className="h-10 w-auto mt-2"
                />
              </div>
            </div>
          </div>
        </div>
      </header>
      
      <div className="flex-1 h-0 overflow-y-auto overflow-x-hidden">
        <HybridNavigationSidebar 
          structure={navigationStructure} 
          contentNodes={contentNodes}
          onStructureUpdate={onStructureUpdate || (() => {})}
          onNavigationClick={(navId, path) => {
            onNavigationClick?.(navId, path);
            if (isMobile) setIsMobileSidebarOpen(false);
          }}
          setShowEditor={setShowEditor}
          currentPath={currentPath}
          onSectionNavigate={(sectionTitle) => {
            onSectionNavigate?.(sectionTitle);
            if (isMobile) setIsMobileSidebarOpen(false);
          }}
          activeSectionId={activeSectionId}
          activeDocumentPath={activeDocumentPath}
          setActiveSectionId={setActiveSectionId}
          expandDepth={expandDepth}
          expandMode={expandMode}
          onExpandDepthChange={onExpandDepthChange}
          showDescriptions={showDescriptions}
          onShowDescriptionsChange={onShowDescriptionsChange}
          onSearchOpen={() => setIsSearchOpen(true)}
        />
      </div>
    </>
  );

  // Mobile layout with Sheet
  if (isMobile) {
    return (
      <div className="h-screen w-full bg-background">
        {isSearchOpen && (
          <SearchOverlay onClose={() => setIsSearchOpen(false)} />
        )}
        
        <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
          <SheetContent side="left" className="w-[280px] p-0 bg-sidebar">
            <aside className="h-full flex flex-col">
              {sidebarContent}
            </aside>
          </SheetContent>
        </Sheet>
        
        <div className="h-full relative">
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-40"
            onClick={() => setIsMobileSidebarOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          
          <ScrollArea className="h-full">
            <main className="pl-16 pr-4 py-8 max-w-4xl">
              {children}
            </main>
          </ScrollArea>
        </div>
      </div>
    );
  }

  // Desktop layout with resizable panels
  return (
    <ResizablePanelGroup 
      id="wiki-layout-persistent"
      direction="horizontal" 
      className="h-screen w-full bg-background"
    >
      <ResizablePanel id="sidebar-panel" defaultSize={20} minSize={15} maxSize={40}>
        <aside className="h-screen border-r border-sidebar-border flex flex-col bg-sidebar">
          {sidebarContent}
        </aside>
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      <ResizablePanel id="main-panel" defaultSize={80}>
        <div className="h-screen relative">
          {isSearchOpen && (
            <SearchOverlay onClose={() => setIsSearchOpen(false)} />
          )}
          <ScrollArea className="h-full">
            <main className="pl-20 pr-6 py-8 max-w-4xl">
              {children}
            </main>
          </ScrollArea>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
