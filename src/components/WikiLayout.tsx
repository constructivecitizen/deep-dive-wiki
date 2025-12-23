import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { HybridNavigationSidebar } from "./HybridNavigationSidebar";
import { SearchOverlay } from "./SearchOverlay";
import { NavigationNode, WikiDocument } from "@/services/contentService";
import { NavigationContextValue } from "@/hooks/useNavigationState";
import CompandioProductLogo from "@/assets/Compandio-Product-logo.png";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, LogOut } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/useAuth";

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
  
  // Centralized navigation state
  navigation: NavigationContextValue;
  
  expandDepth?: number;
  expandMode?: 'depth' | 'mixed';
  onExpandDepthChange?: (depth: number) => void;
  showDescriptions?: 'on' | 'off' | 'mixed';
  onShowDescriptionsChange?: (mode: 'on' | 'off') => void;
  onCollapseAll?: () => void;
  sidebarCollapseKey?: number;
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
  navigation,
  expandDepth,
  expandMode,
  onExpandDepthChange,
  showDescriptions,
  onShowDescriptionsChange,
  onCollapseAll,
  sidebarCollapseKey
}: WikiLayoutProps) => {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const sidebarContent = (
    <>
      <header className="shrink-0">
        <div className="py-3">
          <div className="flex items-center justify-between">
            <div className="pl-3 overflow-hidden">
              <img 
                src={CompandioProductLogo} 
                alt="Compandio Product Management" 
                className="h-[56px] w-auto"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleSignOut}
              className="mr-2 text-muted-foreground hover:text-foreground"
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
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
            navigate(path);
            if (isMobile) setIsMobileSidebarOpen(false);
          }}
          setShowEditor={setShowEditor}
          currentPath={currentPath}
          onSectionNavigate={(sectionTitle) => {
            onSectionNavigate?.(sectionTitle);
            if (isMobile) setIsMobileSidebarOpen(false);
          }}
          navigation={navigation}
          expandDepth={expandDepth}
          expandMode={expandMode}
          onExpandDepthChange={onExpandDepthChange}
          showDescriptions={showDescriptions}
          onShowDescriptionsChange={onShowDescriptionsChange}
          onSearchOpen={() => setIsSearchOpen(true)}
          onCollapseAll={onCollapseAll}
          sidebarCollapseKey={sidebarCollapseKey}
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
            <main className="px-8 py-8 max-w-4xl mx-auto">
              {children}
            </main>
          </ScrollArea>
        </div>
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
