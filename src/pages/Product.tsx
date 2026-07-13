import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { query } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { ChevronLeft, ShoppingCart, Loader2, Image as ImageIcon, Info, Star, MessageSquare, Plus } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Badge } from "@/components/ui/badge";
import { useAuth, useClerk } from "@clerk/clerk-react";
import { CheckoutModal } from "@/components/sastocart/CheckoutModal";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ReviewModal } from "@/components/sastocart/ReviewModal";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { format } from "date-fns";

export type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_url: string;
  image_urls?: string[];
  category: string;
  stock: number;
  specifications?: Record<string, string>;
};

export type Review = {
  id: string;
  product_id: string;
  user_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
};

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const specsRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();
  const { userId, isLoaded } = useAuth();
  const clerk = useClerk();

  useEffect(() => {
    if (isLoaded) {
      const isCheckout = searchParams.get("checkout") === "true";
      if (isCheckout) {
        if (userId) {
          setCheckoutOpen(true);
          // Clean up URL
          searchParams.delete("checkout");
          setSearchParams(searchParams);
        } else {
          clerk.openSignIn();
        }
      }
    }
  }, [searchParams, setSearchParams, isLoaded, userId, clerk]);

  const { data: product, isLoading, error } = useQuery({
    queryKey: ["product", id],
    queryFn: async () => {
      const result = await query("SELECT * FROM products WHERE id = $1", [id]);
      if (result.rows.length === 0) throw new Error("Product not found");
      return result.rows[0] as Product;
    },
    enabled: !!id,
  });

  const { data: reviews = [], refetch: refetchReviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => {
      const result = await query("SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC", [id]);
      return result.rows as Review[];
    },
    enabled: !!id,
  });

  const safeReviews = reviews || [];
  const avgRating = safeReviews.length > 0 
    ? safeReviews.reduce((sum, r) => sum + (r?.rating || 0), 0) / safeReviews.length 
    : 0;

  // Derived array of images for the gallery
  const allImages = product ? (
    product.image_urls && product.image_urls.length > 0 
      ? product.image_urls 
      : [product.image_url].filter(Boolean)
  ) : [];

  // Set initial image when product loads
  useEffect(() => {
    if (allImages.length > 0 && !selectedImage) {
      setSelectedImage(allImages[0]);
    }
  }, [allImages, selectedImage]);

  const handleBuyNow = () => {
    if (!product) return;

    if (!userId) {
      setSearchParams({ checkout: "true" });
      clerk.openSignIn();
    } else {
      setCheckoutOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
        <h1 className="text-4xl font-extrabold text-brand-black">Product Not Found</h1>
        <p className="text-muted-foreground">The product you are looking for does not exist or has been removed.</p>
        <Button onClick={() => navigate("/")} className="mt-4">
          Back to Products
        </Button>
      </div>
    );
  }

  return (
    <>
      <main className="container py-8 md:py-12">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="mb-8 gap-2 border-primary text-primary hover:bg-primary hover:text-white"
        >
          <ChevronLeft className="h-4 w-4" />
          Back to Products
        </Button>

        <div className="grid gap-10 lg:grid-cols-[450px,1fr] items-start">
          {/* Left Column: Image Gallery */}
          <div className="flex flex-col gap-4 w-full max-w-md mx-auto lg:mx-0">
            <div className="overflow-hidden rounded-2xl border-2 border-brand-black bg-white shadow-xl aspect-square relative group max-h-[450px]">
              <img
                src={selectedImage || product.image_url || "https://placehold.co/400x400/png?text=No+Image"}
                alt={product.name}
                className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            
            {allImages.length > 1 && (
              <div className="grid grid-cols-6 gap-2">
                {allImages.map((url, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(url)}
                    className={cn(
                      "aspect-square rounded-lg overflow-hidden border-4 transition-all duration-200",
                      selectedImage === url 
                        ? "border-primary shadow-md scale-105" 
                        : "border-transparent hover:border-primary/20 grayscale hover:grayscale-0"
                    )}
                  >
                    <img src={url || "https://placehold.co/400x400/png?text=No+Image"} alt={`Gallery image ${idx + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Details */}
          <div className="flex flex-col gap-6 py-4">
            <div className="space-y-4">
              <Badge variant="secondary" className="px-3 py-1 text-xs uppercase tracking-wider">
                {product.category}
              </Badge>
              <h1 className="text-3xl font-extrabold tracking-tight text-brand-black md:text-5xl">
                {product.name}
              </h1>
              <p className="text-3xl font-bold text-primary md:text-4xl">
                Rs. {Number(product.price).toFixed(2)}
              </p>
              
              <div className="flex flex-wrap gap-2 pt-2">
                {product.stock <= 0 ? (
                  <Badge variant="destructive" className="bg-red-500 hover:bg-red-600 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-md">
                    Out of Stock
                  </Badge>
                ) : product.stock < 5 ? (
                  <Badge className="bg-orange-100 text-orange-700 border-orange-200 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-sm">
                    Low Stock: Only {product.stock} left!
                  </Badge>
                ) : (
                  <Badge className="bg-green-50 text-green-700 border-green-100 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-sm">
                    In Stock
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-bold text-brand-black flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" /> Highlights
              </h3>
              <div className="relative">
                <p className="leading-relaxed text-muted-foreground line-clamp-3">
                  {product.description || "No description available for this product."}
                </p>
                {product.description && product.description.length > 150 && (
                  <button 
                    onClick={() => specsRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="text-primary font-bold text-sm mt-1 hover:underline flex items-center gap-1"
                  >
                    Read More & View Full Specs
                  </button>
                )}
              </div>
            </div>

            <div className="mt-auto pt-8 flex flex-col gap-4 sm:flex-row">
              <Button
                onClick={handleBuyNow}
                size="lg"
                disabled={product.stock <= 0}
                className={`h-14 flex-1 gap-3 text-lg font-bold shadow-lg transition-all hover:scale-105 active:scale-95 ${
                  product.stock <= 0 ? 'bg-muted text-muted-foreground cursor-not-allowed grayscale' : ''
                }`}
              >
                {product.stock <= 0 ? 'Unavailable' : 'Buy Now'}
              </Button>
              <Button
                onClick={() => product.stock > 0 && addToCart(product)}
                size="lg"
                variant="outline"
                disabled={product.stock <= 0}
                className={`h-14 flex-1 gap-3 border-primary text-lg font-bold text-primary shadow-sm transition-all hover:scale-105 active:scale-95 ${
                  product.stock <= 0 ? 'border-muted text-muted-foreground cursor-not-allowed opacity-50' : ''
                }`}
              >
                {product.stock <= 0 ? 'Out of Stock' : (
                  <>
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </>
                )}
              </Button>
            </div>
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Free shipping on all orders over Rs. 50. 30-day money-back guarantee.
            </p>
          </div>
        </div>

        {/* Specifications Section */}
        {product.specifications && Object.keys(product.specifications).length > 0 && (
          <div ref={specsRef} className="mt-16 pt-16 border-t border-brand-black/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-3xl font-black text-brand-black mb-8 flex items-center gap-3">
              <div className="h-8 w-2 bg-primary rounded-full" />
              Specifications
            </h2>
            
            <div className="overflow-hidden rounded-2xl border border-brand-black/10 bg-white shadow-sm max-w-3xl">
              <table className="w-full text-sm">
                <tbody>
                  {Object.entries(product.specifications).map(([key, value], idx) => (
                    <tr 
                      key={key} 
                      className={cn(
                        "transition-colors",
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                      )}
                    >
                      <td className="py-4 px-6 font-medium text-muted-foreground w-1/3 border-r border-brand-black/5">
                        {key}
                      </td>
                      <td className="py-4 px-6 font-bold text-brand-black">
                        {value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Reviews Section */}
        <div className="mt-16 pt-16 border-t border-brand-black/5 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <h2 className="text-3xl font-black text-brand-black mb-2 flex items-center gap-3">
                <div className="h-8 w-2 bg-primary rounded-full" />
                Customer Reviews
              </h2>
              <p className="text-muted-foreground">See what our customers have to say about this product.</p>
            </div>
            <Button
              onClick={() => {
                if (!userId) {
                  clerk.openSignIn();
                } else {
                  setReviewModalOpen(true);
                }
              }}
              className="bg-brand-black hover:bg-brand-black/90 text-white font-bold gap-2 h-12 px-6"
            >
              <MessageSquare className="h-5 w-5 text-primary" />
              Write a Review
            </Button>
          </div>

          <div className="grid gap-12 lg:grid-cols-[300px,1fr]">
            {/* Review Summary */}
            <div className="space-y-6">
              <div className="p-8 rounded-3xl bg-orange-50/50 border border-primary/10 text-center">
                <p className="text-6xl font-black text-brand-black mb-2">{Number(avgRating).toFixed(1)}</p>
                <div className="flex justify-center gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      className={cn(
                        "h-6 w-6", 
                        i < Math.round(avgRating) ? "fill-primary text-primary" : "text-muted-foreground"
                      )} 
                    />
                  ))}
                </div>
                <p className="text-sm font-bold text-muted-foreground">{reviews.length} Ratings</p>
              </div>

              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = reviews.filter(r => r.rating === star).length;
                  const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-3 text-sm">
                      <span className="w-3 font-bold">{star}</span>
                      <Star className="h-3 w-3 fill-primary text-primary" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <style>{`.progress-bar-${star} { width: ${percentage}%; }`}</style>
                        <div className={`h-full bg-primary transition-all duration-1000 progress-bar-${star}`} />
                      </div>
                      <span className="w-8 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Review List */}
            <div className="space-y-6">
              {reviews.length === 0 ? (
                <div className="text-center py-12 rounded-3xl border-2 border-dashed border-brand-black/5 bg-gray-50/30">
                  <MessageSquare className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No reviews yet. Be the first to review!</p>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review.id} className="p-6 rounded-2xl bg-white border border-brand-black/5 shadow-sm hover:shadow-md transition-all">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-primary">
                          {review.user_name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-brand-black">{review.user_name}</p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={cn(
                                  "h-3 w-3", 
                                  i < review.rating ? "fill-primary text-primary" : "text-muted-foreground"
                                )} 
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </span>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{review.comment}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <ReviewModal 
        open={reviewModalOpen} 
        onOpenChange={setReviewModalOpen}
        productId={id || ""}
        productName={product.name}
        onSuccess={() => refetchReviews()}
      />
      <CheckoutModal 
        product={product} 
        open={checkoutOpen} 
        onOpenChange={setCheckoutOpen} 
      />
    </>
  );
};

export default ProductPage;
