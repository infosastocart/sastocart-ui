import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Admin from "./pages/Admin.tsx";
import NotFound from "./pages/NotFound.tsx";
import Product from "./pages/Product.tsx";
import MyOrders from "./pages/MyOrders.tsx";
import MyProfile from "./pages/MyProfile.tsx";
import Blog from "./pages/Blog.tsx";
import BlogPost from "./pages/BlogPost.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import TermsOfService from "./pages/TermsOfService.tsx";

import ClerkTest from "./pages/ClerkTest.tsx";
import { AdminGuard } from "./components/sastocart/AdminGuard.tsx";
import { UserGuard } from "./components/sastocart/UserGuard.tsx";
import { CartProvider } from "./hooks/use-cart.tsx";

import { useState, useEffect } from "react";
import { Header } from "./components/sastocart/Header.tsx";
import { UserSidebar } from "./components/sastocart/UserSidebar.tsx";
import { Footer } from "./components/sastocart/Footer.tsx";
import { useUser } from "@clerk/clerk-react";
import { useLocation, useNavigate } from "react-router-dom";

const queryClient = new QueryClient();

const AdminRedirect = () => {
  const { user, isLoaded } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoaded && user) {
      const userEmail = user.primaryEmailAddress?.emailAddress;
      const isSuperAdmin = userEmail === 'info.sastocart@gmail.com';
      const metadataRole = user.publicMetadata?.role as string | undefined;
      const isAdmin = isSuperAdmin || metadataRole === 'subadmin';

      // If admin accesses the storefront root, redirect to admin dashboard
      // Admin.tsx handles the dynamic routing to the first allowed module based on permissions
      if (isAdmin && location.pathname === "/") {
        navigate("/admin", { replace: true });
      }
    }
  }, [isLoaded, user, location.pathname, navigate]);

  return null;
};


const AppContent = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const isAdminRoute = location.pathname.startsWith("/admin");

  return (
    <div className="flex flex-col min-h-screen">
      {!isAdminRoute && <Header onMenuClick={() => setSidebarOpen(true)} />}
      {!isAdminRoute && <UserSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />}
      
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:id" element={<BlogPost />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/product/:id" element={<Product />} />
          <Route 
            path="/my-orders" 
            element={
              <UserGuard>
                <MyOrders />
              </UserGuard>
            } 
          />
          <Route 
            path="/my-profile" 
            element={
              <UserGuard>
                <MyProfile />
              </UserGuard>
            } 
          />
          <Route 
            path="/admin" 
            element={<Navigate to="/admin/dashboard" replace />} 
          />
          <Route 
            path="/admin/:tab" 
            element={
              <AdminGuard>
                <Admin />
              </AdminGuard>
            } 
          />

          <Route path="/clerk-test" element={<ClerkTest />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {!isAdminRoute && <Footer />}
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AdminRedirect />
            <AppContent />
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
