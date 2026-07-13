import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="text-center">
        <h1 className="mb-4 text-6xl font-black text-brand-black">404</h1>
        <p className="mb-6 text-xl text-muted-foreground font-bold">Oops! This page doesn't exist.</p>
        <a href="/" className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-8 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
