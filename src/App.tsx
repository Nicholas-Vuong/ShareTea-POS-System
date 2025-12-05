import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import AuthCallback from "./pages/AuthCallback";
import Cashier from "./pages/Cashier";
import Kiosk from "./pages/Kiosk";
import Kitchen from "./pages/Kitchen";
import MenuBoards from "./pages/MenuBoards";
import Manager from "./pages/Manager";
import Customer from "./pages/Customer";
import NotFound from "./pages/NotFound";
import Unauthorized from "./pages/Unauthorized";
import { ProtectedRoute } from "./components/ProtectedRoute";

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
          <Route path="/auth/callback" element={<AuthCallback />} />
          <Route
            path="/cashier"
            element={
              <ProtectedRoute allowedRoles={['cashier']} allowManagerOverride>
                <Cashier />
              </ProtectedRoute>
            }
          />
          <Route path="/kiosk" element={<Kiosk />} />
          <Route
            path="/customer"
            element={
              <ProtectedRoute allowedRoles={['customer']} allowManagerOverride>
                <Customer />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kitchen"
            element={
              <ProtectedRoute allowedRoles={['barista']} allowManagerOverride>
                <Kitchen />
              </ProtectedRoute>
            }
          />
          <Route path="/menu-boards" element={<MenuBoards />} />
          <Route
            path="/manager"
            element={
              <ProtectedRoute allowedRoles={['manager']}>
                <Manager />
              </ProtectedRoute>
            }
          />
          <Route path="/unauthorized" element={<Unauthorized />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
