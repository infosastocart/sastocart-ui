import { cn } from "@/lib/utils";

interface FilterChipsProps {
  categories: readonly string[];
  active: string;
  onChange: (category: string) => void;
}

export const FilterChips = ({ categories, active, onChange }: FilterChipsProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
      {categories.map((cat) => {
        const isActive = cat === active;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "border border-border bg-background text-foreground hover:border-primary/50"
            )}
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
};
