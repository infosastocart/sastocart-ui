import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { FilterChips } from "@/components/sastocart/FilterChips";
import { ProductCard } from "@/components/sastocart/ProductCard";
import { EmptyState } from "@/components/sastocart/EmptyState";
import { query } from "@/lib/db";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  image_urls?: string[];
  category: string;
  stock: number;
  reviews?: { rating: number }[];
};

const Index = () => {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const query = searchParams.get("search");
    if (query !== null) {
      setSearch(query);
    }
  }, [searchParams]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const result = await query(`
        SELECT 
          p.*, 
          COALESCE(
            (SELECT json_agg(json_build_object('rating', r.rating)) 
             FROM reviews r WHERE r.product_id = p.id),
            '[]'
          ) as reviews 
        FROM products p
      `);
      return result.rows as Product[];
    },
  });

  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category)));
    return ["All", ...unique.sort()];
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      const matchesCat = activeCategory === "All" || p.category === activeCategory;
      const matchesSearch = !q || 
        p.name.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [search, activeCategory, products]);

  const showEmpty = !isLoading && filtered.length === 0;

  return (
    <>
      <main className="container py-6">
        <h1 className="sr-only">Sastocart — shop everyday essentials</h1>

        <FilterChips
          categories={categories}
          active={activeCategory}
          onChange={setActiveCategory}
        />

        {isLoading ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="aspect-square animate-pulse rounded-xl bg-muted" />
            ))}
          </div>
        ) : showEmpty ? (
          <EmptyState />
        ) : (
          <section className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </section>
        )}
      </main>
    </>
  );
};

export default Index;
