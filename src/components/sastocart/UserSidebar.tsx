import { useState, useEffect } from "react";
import { LogOut, User as UserIcon, LayoutDashboard, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useUser, useClerk } from "@clerk/clerk-react";
import { query } from "@/lib/db";
import { Link } from "react-router-dom";
import { toast } from "sonner";

interface UserSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UserSidebar = ({ open, onOpenChange }: UserSidebarProps) => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const [displayName, setDisplayName] = useState<string>("");
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = user?.primaryEmailAddress?.emailAddress === adminEmail;

  const handleLogout = async () => {
    try {
      await signOut();
      toast.success("Logged out successfully");
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  useEffect(() => {
    const fetchProfileName = async () => {
      if (!user?.id) return;
      
      setDisplayName(user.fullName || user.primaryEmailAddress?.emailAddress || "");

      try {
        const result = await query("SELECT full_name FROM profiles WHERE id = $1", [user.id]);
        if (result.rows[0]?.full_name) {
          setDisplayName(result.rows[0].full_name);
        }
      } catch (err) {
        console.error("Error fetching profile name:", err);
      }
    };

    if (open && user) {
      fetchProfileName();
    }
  }, [open, user]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle className="text-left">Account</SheetTitle>
        </SheetHeader>
        
        {!isLoaded ? (
          <div className="mt-4 flex items-center gap-3 px-3">
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
            <div className="flex flex-col gap-2">
              <div className="h-4 w-32 rounded bg-muted animate-pulse" />
              <div className="h-3 w-24 rounded bg-muted animate-pulse" />
            </div>
          </div>
        ) : user ? (
          <div className="mt-4 flex items-center gap-3 px-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted overflow-hidden">
              {user.imageUrl ? <img src={user.imageUrl} alt="Avatar" className="w-full h-full object-cover" /> : <UserIcon className="h-5 w-5 text-muted-foreground" />}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-foreground truncate w-44 capitalize">
                {displayName}
              </span>
              <span className="text-xs text-muted-foreground">
                {user.primaryEmailAddress?.emailAddress}
              </span>
            </div>
          </div>
        ) : null}

        <nav className="mt-6 flex flex-col gap-1">

          <Link 
            to="/my-profile"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <UserIcon className="h-4 w-4" />
            My Profile
          </Link>

          <Link 
            to="/my-orders"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
          >
            <ShoppingBag className="h-4 w-4" />
            My Orders
          </Link>

          {isAdmin && (
            <Link 
              to="/admin"
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin Dashboard
            </Link>
          )}

          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </nav>
      </SheetContent>
    </Sheet>
  );
};
