import { Navigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import { toast } from "sonner";
import { useAdminPermissions } from "@/hooks/useAdminPermissions";

interface AdminGuardProps {
  children: React.ReactNode;
}

export const AdminGuard = ({ children }: AdminGuardProps) => {
  const { isLoaded, user } = useUser();
  const { role: dbRole, isLoading: roleLoading } = useAdminPermissions();

  if (!isLoaded || roleLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const userEmail = user.primaryEmailAddress?.emailAddress;
  const isSuperAdmin = userEmail === 'info.sastocart@gmail.com';
  const metadataRole = user.publicMetadata?.role as string | undefined;

  // Step 2: Enforce Admin Layout Access (Frontend)
  // If not super admin and not subadmin in clerk metadata, redirect
  if (!isSuperAdmin && metadataRole !== 'subadmin' && dbRole !== 'subadmin' && dbRole !== 'superadmin') {
    console.warn("Unauthorized admin access attempt by:", userEmail);
    toast.error("Unauthorized Access", {
      description: "You do not have permission to access the Admin Dashboard."
    });
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};
