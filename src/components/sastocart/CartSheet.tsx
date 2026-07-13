import { ShoppingCart, Trash2, Plus, Minus, PackageCheck, AlertCircle } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet";
import { useCart } from "@/hooks/use-cart";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useUser, useClerk } from "@clerk/clerk-react";
import { toast } from "sonner";
import { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckoutModal } from "@/components/sastocart/CheckoutModal";

export const CartSheet = () => {
  const navigate = useNavigate();
  const { items, totalItems, totalPrice, updateQuantity, removeFromCart, clearCart, isCartOpen, setIsCartOpen } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const [searchParams, setSearchParams] = useSearchParams();

  const hasOutOfStockItems = items.some(item => item.stock <= 0);

  const handleCheckout = async () => {
    if (hasOutOfStockItems) {
      toast.error("Please remove out-of-stock items before checking out.");
      return;
    }
    
    if (!user) {
      setSearchParams({ checkout: "true" });
      openSignIn();
      return;
    }

    // Instead of inserting here, we open the details modal
    setIsCartOpen(false);
    setCheckoutModalOpen(true);
  };

  return (
    <Sheet open={isCartOpen} onOpenChange={setIsCartOpen}>
      <SheetTrigger asChild>
        <button 
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30 group shadow-sm"
          aria-label="Open shopping cart"
        >
          <ShoppingCart className="h-5 w-5 transition-transform group-hover:scale-110" />
          {totalItems > 0 && (
            <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-primary shadow-sm ring-2 ring-primary animate-in zoom-in">
              {totalItems}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col sm:max-w-md">
        <SheetHeader className="space-y-2.5 pr-6">
          <SheetTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Your Cart ({totalItems})
          </SheetTitle>
        </SheetHeader>
        <Separator className="my-4" />
        
        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-muted">
              <ShoppingCart className="h-10 w-10 text-muted-foreground opacity-20" />
            </div>
            <div className="space-y-1">
              <p className="text-lg font-semibold">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">Add some items to start shopping!</p>
            </div>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1 -mx-6 px-6">
              <div className="flex flex-col gap-5">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border border-border bg-muted">
                      <img
                        src={item.image_url || "https://placehold.co/400x400/png?text=No+Image"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-between py-0.5">
                      <div className="flex justify-between gap-2">
                        <div>
                          <h4 className={`text-sm font-medium line-clamp-1 ${item.stock <= 0 ? 'text-muted-foreground line-through' : ''}`}>{item.name}</h4>
                          <p className="text-xs text-muted-foreground">{item.category}</p>
                          {item.stock <= 0 && (
                            <div className="flex items-center gap-1.5 mt-1 text-red-500 font-black uppercase text-[10px] tracking-tighter">
                              <AlertCircle className="h-3 w-3" />
                              Out of Stock
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-bold text-primary">Rs. {(Number(item.price) * Number(item.quantity)).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 rounded-lg border border-border p-1">
                          <button
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted transition-colors"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-4 text-center text-xs font-medium">{item.quantity}</span>
                          <button
                            onClick={() => item.stock > item.quantity && updateQuantity(item.id, item.quantity + 1)}
                            disabled={item.stock <= item.quantity}
                            className={`flex h-6 w-6 items-center justify-center rounded transition-colors ${
                              item.stock <= item.quantity ? 'opacity-20 cursor-not-allowed' : 'hover:bg-muted'
                            }`}
                            aria-label="Increase quantity"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
                        >
                          <Trash2 className="h-3 w-3" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <SheetFooter className="mt-auto block pt-6">
              <div className="space-y-4">
                <Separator />
                <div className="space-y-1.5">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-brand-black">Rs. {Number(totalPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="font-medium text-brand-black">Rs. 150.00</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span className="text-primary">Rs. {(Number(totalPrice) + 150).toFixed(2)}</span>
                  </div>
                </div>
                <Button 
                  className={`w-full h-12 text-base font-bold shadow-lg transition-all ${
                    hasOutOfStockItems ? 'bg-muted text-muted-foreground cursor-not-allowed grayscale' : ''
                  }`}
                  onClick={handleCheckout}
                  disabled={isCheckingOut || hasOutOfStockItems}
                >
                  {isCheckingOut ? "Processing..." : hasOutOfStockItems ? "Remove Unavailable Items" : "Place Order"}
                </Button>
                <p className="text-center text-[10px] text-muted-foreground">
                  By confirming, you agree to our Terms of Service and Privacy Policy.
                </p>
              </div>
            </SheetFooter>
          </>
        )}
      </SheetContent>
      <CheckoutModal 
        items={items}
        open={checkoutModalOpen}
        onOpenChange={setCheckoutModalOpen}
        onSuccess={() => clearCart()}
      />
    </Sheet>
  );
};
