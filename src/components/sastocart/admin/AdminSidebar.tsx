import { cn } from "@/lib/utils";
import { 
  LayoutDashboard, 
  ClipboardList, 
  Package, 
  Users, 
  FileText,
  HelpCircle, 
  Settings,
  Shield
} from "lucide-react";
import { Link } from "react-router-dom";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";

interface AdminSidebarProps {
  activeTab: string;
}

export const AdminSidebar = ({ activeTab }: AdminSidebarProps) => {
  const { role, permissions } = useAdminPermissions();

  const mainNavItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, requiredPermission: "dashboard" },
    { id: "orders", label: "Orders", icon: ClipboardList, requiredPermission: "orders" },
    { id: "products", label: "Products", icon: Package, requiredPermission: "products" },
    { id: "customers", label: "Customers", icon: Users, requiredPermission: "customers" },
    { id: "blog", label: "Blog", icon: FileText, requiredPermission: "blog" },
  ];

  const bottomNavItems = [
    { id: "help", label: "Help", icon: HelpCircle },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (role === "superadmin") {
    bottomNavItems.unshift({ id: "team", label: "Team Management", icon: Shield });
  }

  // Filter main nav items based on permissions
  const filteredMainNavItems = mainNavItems.filter(item => {
    if (!item.requiredPermission) return true;
    if (role === "superadmin") return true;
    return permissions.includes(item.requiredPermission);
  });

  return (
    <aside className="w-64 flex-shrink-0 bg-slate-900 text-slate-300 flex flex-col h-screen sticky top-0 left-0 border-r border-slate-800">
      <div className="p-6">
        <Link to="/admin/dashboard" className="shrink-0 text-2xl font-black tracking-tight flex items-center gap-1">
          <span className="text-orange-500">Sasto</span>
          <span className="text-white">Cart</span>
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
        {filteredMainNavItems.map((item) => (
          <Link
            key={item.id}
            to={`/admin/${item.id}`}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === item.id 
                ? "bg-orange-500/10 text-orange-500" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-orange-500" : "text-slate-400")} />
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-1">
        {bottomNavItems.map((item) => (
          <Link
            key={item.id}
            to={`/admin/${item.id}`}
            className={cn(
              "flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
              activeTab === item.id 
                ? "bg-orange-500/10 text-orange-500" 
                : "hover:bg-slate-800 hover:text-white"
            )}
          >
            <item.icon className={cn("w-5 h-5", activeTab === item.id ? "text-orange-500" : "text-slate-400")} />
            {item.label}
          </Link>
        ))}
      </div>
    </aside>
  );
};
