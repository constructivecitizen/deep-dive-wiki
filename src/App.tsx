import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ContentPage from "./pages/ContentPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Dynamic content routes - handles all wiki content */}
          <Route path="/" element={<ContentPage />} />
          <Route path="/getting-started" element={<ContentPage />} />
          <Route path="/getting-started/intro" element={<ContentPage />} />
          <Route path="/getting-started/setup" element={<ContentPage />} />
          <Route path="/hierarchy-systems" element={<ContentPage />} />
          <Route path="/tagging-strategies" element={<ContentPage />} />
          <Route path="/knowledge-management" element={<ContentPage />} />
          <Route path="/advanced-topics" element={<ContentPage />} />
          <Route path="/deep-structures" element={<ContentPage />} />
          <Route path="/node/:sectionId" element={<ContentPage />} />
          {/* Catch-all route for 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
