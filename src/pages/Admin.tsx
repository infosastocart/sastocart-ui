import { useParams, Navigate, useNavigate } from "react-router-dom";
import { AdminSidebar } from "@/components/sastocart/admin/AdminSidebar";
import { AdminHeader } from "@/components/sastocart/admin/AdminHeader";
import { AdminDashboardAnalytics } from "@/components/sastocart/admin/AdminDashboardAnalytics";
import { OrdersTable } from "@/components/sastocart/OrdersTable";
import { AddProductForm } from "@/components/sastocart/AddProductForm";
import { InventoryTable } from "@/components/sastocart/InventoryTable";
import { ManageBlogs } from "@/components/sastocart/ManageBlogs";
import { AdminCustomers } from "@/components/sastocart/admin/AdminCustomers";
import { AdminSettings } from "@/components/sastocart/admin/AdminSettings";
import { AdminTeam } from "@/components/sastocart/admin/AdminTeam";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";
import { useEffect } from "react";

const Admin = () => {
  const { tab = "dashboard" } = useParams<{ tab: string }>();
  const navigate = useNavigate();
  const { role, permissions, isLoading } = useAdminPermissions();

  useEffect(() => {
    if (!isLoading && role !== "superadmin") {
      const isRestrictedTab = !["settings", "help"].includes(tab);
      const hasPermission = permissions.includes(tab);
      
      if (isRestrictedTab && !hasPermission) {
        const firstAvailable = permissions.length > 0 ? permissions[0] : "settings";
        navigate(`/admin/${firstAvailable}`, { replace: true });
      }
    }
  }, [tab, role, permissions, isLoading, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-orange-500 border-t-transparent shadow-lg" />
      </div>
    );
  }

  // Prevent rendering restricted tabs before redirect happens
  if (role !== "superadmin" && !["settings", "help"].includes(tab) && !permissions.includes(tab)) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-stone-50">
      <AdminSidebar activeTab={tab} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AdminHeader />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {tab === "dashboard" && <AdminDashboardAnalytics />}
            
            {tab === "customers" && <AdminCustomers />}
            
            {tab === "orders" && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
                <OrdersTable />
              </div>
            )}
            
            {tab === "products" && (
              <div className="space-y-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 max-w-4xl mx-auto w-full">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-stone-800">
                    <span className="w-2 h-6 bg-orange-500 rounded-full" />
                    Add New Product
                  </h2>
                  <AddProductForm />
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100">
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-stone-800">
                    <span className="w-2 h-6 bg-stone-800 rounded-full" />
                    Product Inventory
                  </h2>
                  <InventoryTable />
                </div>
              </div>
            )}

            {tab === "blog" && (
              <div className="bg-white p-6 rounded-xl shadow-sm border border-stone-100 max-w-4xl mx-auto w-full">
                <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-stone-800">
                  <span className="w-2 h-6 bg-orange-500 rounded-full" />
                  Manage Blogs
                </h2>
                <ManageBlogs />
              </div>
            )}
            
            {tab === "settings" && <AdminSettings />}

            {tab === "team" && <AdminTeam />}
            
            {["help"].includes(tab) && (
              <div className="flex items-center justify-center h-64 bg-white rounded-xl shadow-sm border border-stone-100 text-stone-400">
                This section is under construction.
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Admin;
