import { Product } from "@/pages/Index";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Eye } from "lucide-react";
import { Link } from "react-router-dom";

interface ProductCardProps {
  product: Product;
}

export const ProductCard = ({ product }: ProductCardProps) => {
  const { addToCart } = useCart();
  const reviews = product?.reviews || [];
  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 
    ? reviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / totalReviews 
    : 0;

  return (
    <Link 
      to={`/product/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-border bg-card transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl hover:border-primary/20"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image_urls?.[0] || product.image_url || "https://placehold.co/400x400/png?text=No+Image"}
          alt={product.name}
          loading="lazy"
          width={512}
          height={512}
          className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${product.stock <= 0 ? 'grayscale opacity-60' : ''}`}
        />
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.stock <= 0 ? (
            <span className="bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-tighter">Out of Stock</span>
          ) : product.stock < 5 ? (
            <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded shadow-lg uppercase tracking-tighter">Only {product.stock} left!</span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-1 p-4">
        <div className="flex flex-col gap-0.5">
          <h3 className="text-sm font-medium text-foreground line-clamp-1 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          {totalReviews > 0 && (
            <div className="flex items-center gap-1 mt-0.5">
              <span className="text-primary text-[10px]">⭐</span>
              <span className="text-[10px] font-bold text-foreground">{Number(avgRating).toFixed(1)}</span>
              <span className="text-[10px] text-muted-foreground">({totalReviews})</span>
            </div>
          )}
          <p className="text-xs text-muted-foreground">{product.category}</p>
        </div>
        <div className="mt-2 flex items-center justify-between">
          <p className="text-lg font-bold text-primary">Rs. {Number(product.price).toFixed(2)}</p>
          <Button 
            size="sm" 
            variant="ghost" 
            disabled={product.stock <= 0}
            className={`h-9 w-9 rounded-full p-0 transition-all ${
              product.stock <= 0 
                ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' 
                : 'text-primary hover:bg-primary hover:text-white'
            }`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (product.stock > 0) {
                addToCart(product);
              }
            }}
            aria-label={product.stock <= 0 ? 'Out of Stock' : `Add ${product.name} to cart`}
          >
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Link>
  );
};
