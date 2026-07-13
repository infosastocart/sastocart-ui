import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { query } from "@/lib/db";
import { useUser } from "@clerk/clerk-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { PackageCheck, Loader2, ChevronRight, ChevronLeft, MapPin, User, Phone, Mail, CreditCard } from "lucide-react";
import { Product } from "@/pages/Product";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { CartItem } from "@/hooks/use-cart";

interface CheckoutModalProps {
  product?: Product | null;
  items?: CartItem[] | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export const CheckoutModal = ({
  product,
  items,
  open,
  onOpenChange,
  onSuccess,
}: CheckoutModalProps) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [fullName, setFullName] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const { user } = useUser();

  useEffect(() => {
    if (open && step === 2) {
      const fetchUserData = async () => {
        if (user) {
          setEmail(user.primaryEmailAddress?.emailAddress || "");
          
          // Fetch saved addresses
          const result = await query("SELECT * FROM user_addresses WHERE user_id = $1 ORDER BY is_default DESC", [user.id]);
          const addresses = result.rows;
          
          if (addresses && addresses.length > 0) {
            setSavedAddresses(addresses);
            const defaultAddr = addresses.find(a => a.is_default) || addresses[0];
            setSelectedAddressId(defaultAddr.id);
            setShippingAddress(defaultAddr.full_address || defaultAddr.address_line1);
            setCity(defaultAddr.city);
            if (defaultAddr.phone) setPhone(defaultAddr.phone);
          } else {
            setSelectedAddressId("new");
          }
        }
      };
      fetchUserData();
    }
  }, [open, step]);

  // Reset step when modal closes
  useEffect(() => {
    if (!open) {
      setStep(1);
      setFullName("");
      setShippingAddress("");
      setCity("");
      setSelectedAddressId("");
    }
  }, [open]);

  const SHIPPING_FEE = 150;
  const checkoutItems = items || (product ? [{ ...product, quantity: 1 }] : []);
  const subtotal = checkoutItems?.reduce((sum, item) => sum + (item?.price || 0) * (item?.quantity || 1), 0) || 0;
  const finalTotal = subtotal + SHIPPING_FEE;

  const handleConfirmOrder = async () => {
    if (checkoutItems.length === 0 || !fullName || !shippingAddress || !city) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsProcessing(true);
      if (!user) throw new Error("Not logged in");

      // Save new address if applicable
      if (selectedAddressId === "new") {
        try {
          await query(
            "INSERT INTO user_addresses (user_id, full_address, city, phone, is_default) VALUES ($1, $2, $3, $4, $5)",
            [user.id, shippingAddress, city, phone, savedAddresses.length === 0]
          );
        } catch (err) {
          console.error("Failed to auto-save new address:", err);
        }
      }

      // Ensure user profile exists to satisfy foreign key constraint
      await query(
        "INSERT INTO profiles (id, email, full_name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING",
        [user.id, user.primaryEmailAddress?.emailAddress || "", user.fullName || fullName]
      );

      const orderResult = await query(
        "INSERT INTO orders (user_id, total_price, shipping_address, payment_method, customer_name, customer_phone, status) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id",
        [user.id, finalTotal, `${shippingAddress}, ${city}`, "COD", fullName, phone, "pending"]
      );
      
      const orderId = orderResult.rows[0].id;

      // 2. Insert into order_items table
      for (const item of checkoutItems) {
        await query(
          "INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)",
          [orderId, item.id, item.quantity, item.price]
        );
      }

      // 3. Trigger Email Notification (Commented out as the previous edge function is no longer available)
      // TODO: Implement email sending through an external provider (e.g. Resend, Sendgrid)
      
      toast.success("Order placed successfully!", {
        description: `Order ID: ${orderId.slice(0, 8)}...`,
        icon: <PackageCheck className="h-5 w-5 text-green-500" />,
      });

      onOpenChange(false);
      if (onSuccess) onSuccess();
      navigate("/my-orders");
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error("Failed to place order: " + error.message);
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkoutItems.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-brand-black/20 overflow-hidden p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "h-2 w-full rounded-full transition-all duration-500",
              step === 1 ? "bg-primary" : "bg-primary/20"
            )} />
            <div className={cn(
              "h-2 w-full rounded-full transition-all duration-500",
              step === 2 ? "bg-primary" : "bg-primary/20"
            )} />
          </div>
          <DialogTitle className="text-2xl font-extrabold text-brand-black">
            {step === 1 ? "Order Summary" : "Shipping & Payment"}
          </DialogTitle>
          <DialogDescription>
            {step === 1 ? "Review your selected item before proceeding." : "Enter your delivery details below."}
          </DialogDescription>
        </DialogHeader>

        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {step === 1 ? (
            <div className="space-y-6">
              <div className="space-y-4">
                {(checkoutItems || []).map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border border-brand-black/5 bg-white shadow-sm">
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-border">
                      <img
                        src={item.image_url || "https://placehold.co/400x400/png?text=No+Image"}
                        alt={item.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col justify-center gap-0.5">
                      <h3 className="text-sm font-bold text-brand-black line-clamp-1">{item.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs font-bold px-2 py-0.5 bg-muted rounded uppercase">Qty: {item.quantity}</span>
                        <p className="text-sm font-black text-primary">Rs. {(Number(item.price) * Number(item.quantity)).toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-3 p-4 rounded-xl bg-orange-50/30 border border-primary/10">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-medium text-brand-black">Rs. {Number(subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="text-brand-black font-medium">Rs. {Number(SHIPPING_FEE).toFixed(2)}</span>
                </div>
                <div className="pt-3 border-t border-primary/10 flex justify-between items-center">
                  <span className="text-lg font-bold text-brand-black">Total</span>
                  <span className="text-2xl font-black text-primary">Rs. {Number(finalTotal).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-brand-black font-bold flex items-center gap-2">
                    <User className="h-4 w-4 text-primary" /> Full Name
                  </Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    className="border-brand-black/10 focus:border-primary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-brand-black font-bold flex items-center gap-2 opacity-60">
                      <Mail className="h-4 w-4 text-primary" /> Email
                    </Label>
                    <Input value={email} readOnly className="bg-muted/50 border-brand-black/5 cursor-not-allowed" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-brand-black font-bold flex items-center gap-2">
                      <Phone className="h-4 w-4 text-primary" /> Phone
                    </Label>
                    <Input 
                      value={phone} 
                      onChange={(e) => setPhone(e.target.value)} 
                      placeholder="Enter phone number"
                      required
                      className="border-brand-black/10 focus:border-primary" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="text-brand-black font-bold flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" /> Shipping Address
                  </Label>
                  
                  <div className="space-y-4">
                    {savedAddresses.length > 0 ? (
                      <div className="space-y-4">
                        <Select 
                          value={selectedAddressId} 
                          onValueChange={(val) => {
                            setSelectedAddressId(val);
                            if (val !== "new") {
                              const addr = savedAddresses.find(a => a.id === val);
                              if (addr) {
                                setShippingAddress(addr.full_address || addr.address_line1);
                                setCity(addr.city);
                                if (addr.phone) setPhone(addr.phone);
                              }
                            } else {
                              setShippingAddress("");
                              setCity("");
                            }
                          }}
                        >
                          <SelectTrigger className="border-brand-black/10 rounded-xl h-12 bg-white">
                            <SelectValue placeholder="Select a saved address" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-none shadow-2xl">
                            {savedAddresses.map((addr) => (
                              <SelectItem key={addr.id} value={addr.id} className="py-3">
                                <div className="flex flex-col">
                                  <span className="font-bold text-sm">{addr.full_address || addr.address_line1}</span>
                                  <span className="text-[10px] uppercase text-muted-foreground font-black">{addr.city} {addr.is_default && "• Default"}</span>
                                </div>
                              </SelectItem>
                            ))}
                            <SelectItem value="new" className="py-3 font-bold text-primary italic">
                              + Use a different address
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        {selectedAddressId !== "new" && (
                          <div className="p-4 rounded-xl bg-muted/30 border border-brand-black/5 animate-in fade-in duration-300">
                            <p className="text-xs font-bold text-brand-black">{shippingAddress}</p>
                            <p className="text-[10px] font-black uppercase text-muted-foreground mt-1">{city}</p>
                          </div>
                        )}
                      </div>
                    ) : null}

                    {(selectedAddressId === "new" || savedAddresses.length === 0) && (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Full Address</Label>
                          <Textarea
                            value={shippingAddress}
                            onChange={(e) => setShippingAddress(e.target.value)}
                            placeholder="Street address, P.O. box, building name"
                            required
                            className="min-h-[80px] border-brand-black/10 focus:border-primary rounded-xl resize-none"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">City / District</Label>
                          <Input
                            value={city}
                            onChange={(e) => setCity(e.target.value)}
                            placeholder="e.g. Kathmandu"
                            required
                            className="h-12 border-brand-black/10 focus:border-primary rounded-xl"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-brand-black font-bold flex items-center gap-2 opacity-60">
                    <CreditCard className="h-4 w-4 text-primary" /> Payment Method
                  </Label>
                  <div className="p-3 rounded-lg border border-brand-black/10 bg-muted/30 text-sm font-medium flex items-center justify-between">
                    <span>Cash on Delivery (COD)</span>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded uppercase font-bold tracking-tighter">Selected</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 pt-2 flex flex-col sm:flex-row gap-3">
          {step === 1 ? (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 border-brand-black/10 hover:bg-muted"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold h-11 shadow-lg gap-2 transition-all hover:scale-105 active:scale-95"
              >
                Proceed to Details <ChevronRight className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1 border-brand-black/10 hover:bg-muted gap-2 transition-all hover:scale-105 active:scale-95"
                disabled={isProcessing}
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
              <Button
                onClick={handleConfirmOrder}
                className="flex-1 bg-primary hover:bg-primary-hover text-white font-bold h-11 shadow-lg transition-all hover:scale-105 active:scale-95"
                disabled={isProcessing}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Placing Order...
                  </>
                ) : (
                  "Place Order"
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

// Helper function for conditional class names
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
