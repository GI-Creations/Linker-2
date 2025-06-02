
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import KnowledgeBases from "./pages/KnowledgeBases";
import KnowledgeBaseDetail from "./pages/KnowledgeBaseDetail";
import Tools from "./pages/Tools";
import Dial from "./pages/inbox";
import NotFound from "./pages/NotFound";
import FloatingNewChat from "./components/FloatingNewChat";

const queryClient = new QueryClient();

const AppContent = () => {
  const location = useLocation();

  const handleGlobalNewChat = (query: string) => {
    // If not on chat page, navigate there
    if (location.pathname !== '/chat') {
      window.location.href = '/chat';
    }

    // Set the query in localStorage to be picked up by Dial component
    localStorage.setItem('pendingChatQuery', query);
  };

  return (
    <>
      <Routes>

        <Route path="/chat" element={<Dial />} />
        <Route path="/knowledge-bases" element={<KnowledgeBases />} />

      </Routes>

      {/* Global Floating New Chat - visible on all pages except chat */}
      {location.pathname !== '/chat' && (
        <FloatingNewChat onNewChat={handleGlobalNewChat} />
      )}
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
