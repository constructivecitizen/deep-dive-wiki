import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import HierarchySystemsPage from "./pages/HierarchySystemsPage";
import TaggingStrategiesPage from "./pages/TaggingStrategiesPage";
import GettingStartedPage from "./pages/GettingStartedPage";
import IntroductionPage from "./pages/IntroductionPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/hierarchy-systems" element={<HierarchySystemsPage />} />
          <Route path="/tagging-strategies" element={<TaggingStrategiesPage />} />
          <Route path="/getting-started" element={<GettingStartedPage />} />
          <Route path="/getting-started/intro" element={<IntroductionPage />} />
          <Route path="/getting-started/setup" element={<GettingStartedPage />} />
          <Route path="/knowledge-management" element={<Index />} />
          <Route path="/advanced-topics" element={<Index />} />
          <Route path="/deep-structures" element={<Index />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
