
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import RoleDashboard from "./pages/RoleDashboard";
import NotFound from "./pages/NotFound";
import BHDashboardLayout from "./components/bh/BHDashboardLayout";
import BHDashboard from "./pages/BHDashboard";
import NewVisit from "./pages/NewVisit";
import MyVisits from "./pages/MyVisits";
import ZHDashboardLayout from "./components/zh/ZHDashboardLayout";
import ZHDashboard from "./pages/ZHDashboard";
import ZHBranchMapping from "./pages/ZHBranchMapping";
import ZHBHRManagement from "./pages/ZHBHRManagement";

const queryClient = new QueryClient();

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/auth" element={<Auth />} />
    <Route path="/dashboard" element={<Dashboard />} />
    <Route path="/admin/dashboard" element={<AdminDashboard />} />
    
    {/* BH routes with layout */}
    <Route path="/bh" element={<BHDashboardLayout />}>
      <Route path="dashboard" element={<BHDashboard />} />
      <Route path="new-visit" element={<NewVisit />} />
      <Route path="my-visits" element={<MyVisits />} />
    </Route>
    
    {/* ZH routes with layout */}
    <Route path="/zh" element={<ZHDashboardLayout />}>
      <Route path="dashboard" element={<ZHDashboard />} />
      <Route path="branch-mapping" element={<ZHBranchMapping />} />
      <Route path="bhr-management" element={<ZHBHRManagement />} />
    </Route>
    
    <Route path="/:role/dashboard" element={<RoleDashboard />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
