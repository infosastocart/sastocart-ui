import { RedirectToSignIn, useAuth } from "@clerk/clerk-react";

interface UserGuardProps {
  children: React.ReactNode;
}

export const UserGuard = ({ children }: UserGuardProps) => {
  const { isLoaded, userId } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent shadow-lg" />
      </div>
    );
  }

  if (!userId) {
    return <RedirectToSignIn />;
  }

  return <>{children}</>;
};
