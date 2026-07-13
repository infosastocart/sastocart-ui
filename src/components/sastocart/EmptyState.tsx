import { PackageSearch } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-accent">
        <PackageSearch className="h-10 w-10 text-primary" />
      </div>
      <h2 className="text-xl font-semibold text-foreground">Item not available</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        We couldn't find anything matching your search. Try a different keyword.
      </p>
    </div>
  );
};
