import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Cashier from "./pages/Cashier";
import Kiosk from "./pages/Kiosk";
import Kitchen from "./pages/Kitchen";
import MenuBoards from "./pages/MenuBoards";
import Manager from "./pages/Manager";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route path="/cashier" element={<Cashier />} />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route path="/kitchen" element={<Kitchen />} />
          <Route path="/menu-boards" element={<MenuBoards />} />
          <Route path="/manager" element={<Manager />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
