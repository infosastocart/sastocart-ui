import { useEffect, useState } from "react";
import { Menu, Search, Home, LayoutDashboard } from "lucide-react";
import { Input } from "@/components/ui/input";
import { CartSheet } from "./CartSheet";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import { NotificationBell } from "./NotificationBell";
import { toast } from "sonner";
import { SignInButton, UserButton, useUser } from "@clerk/clerk-react";

interface HeaderProps {
  search?: string;
  onSearchChange?: (v: string) => void;
  onMenuClick?: () => void;
}

export const Header = ({ search: initialSearch = "", onSearchChange, onMenuClick }: HeaderProps) => {
  const { user, isLoaded } = useUser();
  const [localSearch, setLocalSearch] = useState(initialSearch);
  const navigate = useNavigate();
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
  const isAdmin = user?.primaryEmailAddress?.emailAddress === adminEmail;

  useEffect(() => {
    setLocalSearch(initialSearch);
  }, [initialSearch]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (localSearch.trim()) {
      navigate(`/?search=${encodeURIComponent(localSearch.trim())}`);
    } else {
      navigate('/');
    }
  };

  const today = new Date().toLocaleDateString(undefined, { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="flex flex-col">
      {/* Utility Bar */}
      <div className="bg-[#f8f9fa] border-b border-gray-200 py-2">
        <div className="container flex justify-end">
          <p className="text-[10px] md:text-xs font-medium text-muted-foreground uppercase tracking-widest">
            {today}
          </p>
        </div>
      </div>

      <header className="sticky top-0 z-30 bg-primary shadow-lg">
        <div className="container flex h-16 items-center gap-4">
          <Link to={isAdmin ? "/admin" : "/"} className="shrink-0 text-xl font-black tracking-tight flex items-center">
            <span className="text-white">Sasto</span>
            <span className="text-black">Cart</span>
          </Link>

          <form 
            onSubmit={handleSearchSubmit}
            className="relative mx-auto flex w-full max-w-xl items-center"
          >
            <button 
              type="submit" 
              aria-label="Search"
              className="absolute left-3 h-4 w-4 text-muted-foreground hover:text-primary transition-colors"
            >
              <Search className="h-4 w-4" />
            </button>
            <Input
              type="search"
              value={localSearch}
              onChange={(e) => {
                setLocalSearch(e.target.value);
                if (onSearchChange) onSearchChange(e.target.value);
              }}
              placeholder="Search products..."
              aria-label="Search products"
              className="h-10 rounded-full border-none bg-white text-brand-black pl-10 pr-4 focus-visible:ring-2 focus-visible:ring-orange-300 transition-all shadow-inner"
            />
          </form>

          <div className="flex items-center gap-2 md:gap-4">
            {!isAdmin && (
              <Link 
                to="/" 
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30 group shadow-sm"
                title="Home"
              >
                <Home className="h-5 w-5 transition-transform group-hover:scale-110" />
              </Link>
            )}

            {isAdmin && (
              <Link 
                to="/admin" 
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30 group shadow-sm"
                title="Admin Dashboard"
              >
                <LayoutDashboard className="h-5 w-5 transition-transform group-hover:scale-110" />
              </Link>
            )}
            
            {user && <NotificationBell />}

            <CartSheet />

            {/* Clerk UI Integration */}
            {isLoaded && user ? (
              <UserButton 
                appearance={{
                  elements: {
                    userButtonAvatarBox: "w-10 h-10 shadow-sm border-2 border-white/20",
                  }
                }}
              />
            ) : (
              <SignInButton mode="modal">
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden rounded-full sm:flex text-white hover:bg-white/10 font-bold"
                >
                  Login
                </Button>
              </SignInButton>
            )}

            <button
              onClick={onMenuClick}
              aria-label="Open menu"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30 shadow-sm sm:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            
            {!user && isLoaded && (
              <div className="sm:hidden flex items-center justify-center">
                <SignInButton mode="modal">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30 shadow-sm"
                  >
                    <UserButton />
                  </Button>
                </SignInButton>
              </div>
            )}
          </div>
        </div>
      </header>
    </div>
  );
};
