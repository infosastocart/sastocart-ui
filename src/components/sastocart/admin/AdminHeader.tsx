import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const AdminHeader = () => {
  const today = new Date().toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="h-16 px-6 border-b border-stone-200 bg-white flex items-center justify-between sticky top-0 z-20 shadow-sm">
      <div className="flex items-center text-sm font-medium text-stone-500">
        {today}
      </div>

      <div className="flex items-center gap-6">
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
          <Input
            type="search"
            placeholder="Search stock, order, etc."
            className="pl-9 bg-stone-50 border-stone-200 focus-visible:ring-orange-500 rounded-full h-9"
          />
        </div>
      </div>
    </header>
  );
};

