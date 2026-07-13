import { useState, useEffect } from "react";
import { query } from "@/lib/db";
import { useAuth } from "@clerk/clerk-react";
import { format, addDays } from "date-fns";
import { Loader2, ShoppingBag, Package, Truck, CheckCircle2, Clock, XCircle, ArrowRight, ExternalLink, Star } from "lucide-react";
import { ReviewModal } from "@/components/sastocart/ReviewModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image_url: string;
  };
  product_id: string;
  is_rated?: boolean;
}

interface Order {
  id: string;
  created_at: string;
  updated_at?: string;
  total_price: number;
  status: string;
  tracking_id?: string;
  tracking_url?: string;
  return_reason?: string;
  admin_return_note?: string;
  return_status?: string;
  admin_return_message?: string;
  order_items: OrderItem[];
}

const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedOrderItem, setSelectedOrderItem] = useState<{
    productId: string;
    productName: string;
    orderItemId: string;
  } | null>(null);

  const { userId } = useAuth();

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      if (!userId) return;

      const result = await query(`
        SELECT 
          o.*,
          COALESCE(
            (SELECT json_agg(
              json_build_object(
                'id', oi.id,
                'quantity', oi.quantity,
                'price', oi.price,
                'product_id', oi.product_id,
                'is_rated', oi.is_rated,
                'products', (SELECT json_build_object('name', p.name, 'image_url', p.image_url) FROM products p WHERE p.id = oi.product_id)
              )
            ) FROM order_items oi WHERE oi.order_id = o.id),
            '[]'
          ) as order_items
        FROM orders o
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC
      `, [userId]);

      setOrders(result.rows as Order[]);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Failed to load orders. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    const isConfirmed = window.confirm("Are you sure you want to cancel this order? This action cannot be undone.");
    if (!isConfirmed) {
      return; // Stop the function completely if they click 'Cancel'
    }

    // B. Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));

    try {
      // C. Database Call
      const result = await query(
        "UPDATE orders SET status = 'cancelled' WHERE id = $1 RETURNING *",
        [orderId]
      );

      // D. Error Reversion
      if (result.rowCount === 0) {
        throw new Error("Order not found or update failed");
      }

      // E. Success
      toast.success("Order cancelled successfully");
    } catch (error: any) {
      console.error("CANCEL ERROR:", error);
      toast.error("Failed to cancel order: " + (error.message || "Unknown error"));
      fetchOrders(); // Revert
    }
  };

  const handleReturnOrder = async (orderId: string) => {
    const reason = window.prompt("Please explain why you are returning this item. Note: Shipping charges will not be refunded.");
    
    if (reason === null) return; // User clicked Cancel
    
    if (reason.trim() === '') {
      toast.error("A return reason is required to process your request.");
      return;
    }

    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, return_status: 'PENDING', return_reason: reason } : o));

    try {
      const result = await query(
        "UPDATE orders SET return_status = 'PENDING', return_reason = $1 WHERE id = $2 RETURNING *",
        [reason, orderId]
      );

      if (result.rowCount === 0) {
        throw new Error("Order not found or update failed");
      }

      toast.success("Return requested. Support will contact you soon.");
    } catch (error: any) {
      console.error("RETURN ERROR:", error);
      toast.error("Failed to request return: " + (error.message || "Unknown error"));
      fetchOrders(); // Revert
    }
  };

  const isWithinReturnWindow = (updatedAt?: string) => {
    if (!updatedAt) return true; // Default to true if timestamp missing
    const deliveryDate = new Date(updatedAt);
    const now = new Date();
    const diffInTime = now.getTime() - deliveryDate.getTime();
    const diffInDays = diffInTime / (1000 * 3600 * 24);
    return diffInDays <= 5;
  };

  useEffect(() => {
    if (!userId) return;

    // 1. Fetch initial orders
    fetchOrders();

    // 2. Poll for updates every 10 seconds since Neon lacks client realtime out-of-the-box
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [userId]);

  const getStatusNote = (order: Order) => {
    if (order.return_status === 'PENDING') return "Return initiated. Support will contact you.";
    if (order.return_status === 'ACCEPTED') return "Return Request Accepted.";
    if (order.return_status === 'REJECTED') return "Return Request Rejected.";
    
    switch (order.status?.toLowerCase() || "") {
      case "pending": return "Your order will be processed soon.";
      case "processing": return "Your order is processed and will be shipped sooner.";
      case "shipped": return "To be delivered soon.";
      case "delivered": return "Delivered successfully.";
      case "cancelled": return "Cancelled by customer";
      case "return_requested": return "Return initiated. Support will contact you.";
      case "return_approved": return "Return Request Approved.";
      case "return_declined": return "Return Request Declined.";
      default: return "";
    }
  };

  const getStatusColor = (order: Order) => {
    if (order.return_status === 'PENDING') return "bg-orange-100 text-orange-700 border-orange-200";
    if (order.return_status === 'ACCEPTED') return "bg-green-100 text-green-700 border-green-200";
    if (order.return_status === 'REJECTED') return "bg-red-100 text-red-700 border-red-200";

    switch (order.status?.toLowerCase() || "") {
      case "pending": return "bg-orange-100 text-orange-700 border-orange-200";
      case "processing": return "bg-blue-100 text-blue-700 border-blue-200";
      case "shipped": return "bg-purple-100 text-purple-700 border-purple-200";
      case "delivered": return "bg-green-100 text-green-700 border-green-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      case "return_requested": return "bg-orange-100 text-orange-700 border-orange-200";
      case "return_approved": return "bg-green-100 text-green-700 border-green-200";
      case "return_declined": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const getStatusIcon = (order: Order) => {
    if (order.return_status === 'PENDING') return <Package className="h-5 w-5 text-amber-500" />;
    if (order.return_status === 'ACCEPTED') return <CheckCircle2 className="h-5 w-5 text-green-500" />;
    if (order.return_status === 'REJECTED') return <XCircle className="h-5 w-5 text-red-500" />;

    switch (order.status?.toLowerCase() || "") {
      case "pending": return <Clock className="h-5 w-5 text-orange-500" />;
      case "processing": return <Package className="h-5 w-5 text-blue-500" />;
      case "shipped": return <Truck className="h-5 w-5 text-purple-500" />;
      case "delivered": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "cancelled": return <XCircle className="h-5 w-5 text-red-500" />;
      case "return_requested": return <Package className="h-5 w-5 text-amber-500" />;
      case "return_approved": return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "return_declined": return <XCircle className="h-5 w-5 text-red-500" />;
      default: return null;
    }
  };

  const getDeliveryWindow = (createdAt: string) => {
    const date = new Date(createdAt);
    const min = format(addDays(date, 2), "MMM d");
    const max = format(addDays(date, 5), "MMM d");
    return `${min} - ${max}`;
  };

  return (
    <div className="bg-muted/30">
      <main className="container py-12 max-w-4xl">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-black text-brand-black tracking-tight">My Orders</h1>
            <p className="text-muted-foreground mt-2">Track your purchases and order history.</p>
          </div>
          <div className="h-14 w-14 bg-primary/10 rounded-2xl flex items-center justify-center">
            <ShoppingBag className="h-7 w-7 text-primary" />
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-sm font-bold text-muted-foreground animate-pulse">Fetching your orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-brand-black/5 p-16 text-center shadow-sm">
            <div className="mx-auto w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mb-6">
              <ShoppingBag className="h-10 w-10 text-muted-foreground opacity-30" />
            </div>
            <h3 className="text-2xl font-black text-brand-black">No orders yet</h3>
            <p className="text-muted-foreground mt-3 max-w-xs mx-auto text-lg leading-relaxed">
              Looks like you haven't made a purchase yet. Explore our products and place your first order!
            </p>
            <Link to="/">
              <Button className="mt-8 bg-primary hover:bg-primary/90 text-white font-black px-8 py-6 rounded-2xl text-lg group">
                Start Shopping
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {orders.map((order) => (
              <div 
                key={order.id} 
                className="bg-white rounded-3xl border-2 border-brand-black/5 p-6 md:p-8 shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 border-b border-brand-black/5 pb-8">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground mb-2">
                      <span className="bg-muted px-2 py-0.5 rounded">ID: {order.id.slice(0, 8)}</span>
                      <span>•</span>
                      <span>{format(new Date(order.created_at), "MMM d, yyyy")}</span>
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(order)}
                        <Badge variant="outline" className={cn(
                          "font-black px-3 py-0.5 rounded-full capitalize text-[10px]",
                          getStatusColor(order)
                        )}>
                          {order.return_status === "PENDING" ? "Return Requested" : 
                           order.return_status === "ACCEPTED" ? "Return Accepted" : 
                           order.return_status === "REJECTED" ? "Return Rejected" : 
                           order.status?.toLowerCase() === "processing" ? "Processed" : 
                           order.status?.toLowerCase() === "cancelled" ? "Cancelled by customer" : 
                           order.status?.toLowerCase() === "return_requested" ? "Return Requested" : 
                           order.status?.toLowerCase() === "return_approved" ? "Return Approved" : 
                           order.status?.toLowerCase() === "return_declined" ? "Return Declined" : 
                           (order?.status || "Unknown")}
                        </Badge>
                      </div>

                      {order.return_status === 'ACCEPTED' && order.admin_return_message && (
                        <div className="mt-2 p-3 bg-gray-50 border-l-4 rounded-md text-sm border-green-500">
                          <p className="font-bold text-brand-black mb-1">Message from Support:</p>
                          <p className="text-muted-foreground italic leading-snug">{order.admin_return_message}</p>
                        </div>
                      )}
                      
                      {order.return_status === 'REJECTED' && order.admin_return_message && (
                        <div className="mt-2 p-3 bg-gray-50 border-l-4 rounded-md text-sm border-red-500">
                          <p className="font-bold text-brand-black mb-1">Message from Support:</p>
                          <p className="text-muted-foreground italic leading-snug">{order.admin_return_message}</p>
                        </div>
                      )}

                      {!order.return_status && order.admin_return_note && (order.status?.toLowerCase() === 'return_approved' || order.status?.toLowerCase() === 'return_declined') && (
                        <div className={cn(
                          "mt-2 p-3 bg-gray-50 border-l-4 rounded-md text-sm",
                          order.status?.toLowerCase() === 'return_approved' ? "border-green-500" : "border-red-500"
                        )}>
                          <p className="font-bold text-brand-black mb-1">Message from Support:</p>
                          <p className="text-muted-foreground italic leading-snug">{order.admin_return_note}</p>
                        </div>
                      )}
                      <h3 className="text-xl font-black text-brand-black leading-tight">
                        {getStatusNote(order)}
                      </h3>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-4">
                    <div className="flex gap-2">
                      {(order.status?.toLowerCase() === "pending" || order.status?.toLowerCase() === "processing") ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleCancelOrder(order.id)}
                          className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold rounded-xl h-10 px-4"
                        >
                          Cancel Order
                        </Button>
                      ) : order.status?.toLowerCase() === "delivered" && order.return_status === "NONE" ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleReturnOrder(order.id)}
                          className="border-brand-black/20 text-brand-black hover:bg-gray-50 font-bold rounded-xl h-10 px-4"
                        >
                          Return Order
                        </Button>
                      ) : null}
                    </div>

                    <div className="text-right">
                      <p className="text-xs uppercase tracking-widest text-muted-foreground font-black mb-1">Total</p>
                      <p className="text-2xl font-black text-primary">Rs. {Number(order?.total_price || 0).toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-8 items-end">
                  <div className="space-y-4">
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-black">
                      {(order?.status || "").toLowerCase() === "delivered" ? "Rate Your Items" : "Items"}
                    </p>
                    
                    <div className="space-y-3">
                      {order.order_items?.map((item) => (
                        <Link 
                          key={item.id}
                          to={`/product/${item.product_id}`}
                          className="flex items-center justify-between gap-4 p-3 rounded-2xl hover:bg-gray-50 transition-all -mx-2 group/item border border-transparent hover:border-brand-black/5"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-14 w-14 rounded-xl overflow-hidden border bg-white shadow-sm flex-shrink-0 group-hover/item:shadow-md transition-all">
                              <img 
                                src={item.products?.image_url || "https://placehold.co/400x400/png?text=No+Image"} 
                                alt={item.products?.name || "Product"} 
                                className="h-full w-full object-cover transition-transform group-hover/item:scale-110"
                              />
                            </div>
                            <div className="space-y-1">
                              <p className="text-sm font-bold text-brand-black line-clamp-1 group-hover/item:text-primary transition-colors">
                                {item.products?.name || "Unknown Product"}
                              </p>
                              <div className="flex items-center gap-3">
                                <p className="text-xs font-medium text-muted-foreground">
                                  Qty: <span className="text-brand-black font-bold">{item.quantity}</span>
                                </p>
                                <span className="text-muted-foreground/30">•</span>
                                <p className="text-xs font-bold text-primary">
                                  Rs. {Number(item.price || 0).toFixed(2)}
                                </p>
                              </div>
                              {(order?.status || "").toLowerCase() === "delivered" && item.is_rated !== true && (
                                <p className="text-[10px] text-primary font-black uppercase tracking-tighter animate-pulse">
                                  ⭐ Rate & Earn 5 Points
                                </p>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-3">
                            {(order?.status || "").toLowerCase() === "delivered" && (
                              item.is_rated === true ? (
                                <Badge className="bg-green-100 text-green-700 border-green-200 text-[10px] font-black uppercase whitespace-nowrap">
                                  Rated
                                </Badge>
                              ) : (
                                <Button 
                                  size="sm"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    if (!item.product_id || !item.id) {
                                      toast.error("Missing item information. Please refresh.");
                                      return;
                                    }
                                    setSelectedOrderItem({
                                      productId: item.product_id,
                                      productName: item.products?.name || "Product",
                                      orderItemId: item.id
                                    });
                                    setReviewModalOpen(true);
                                  }}
                                  className="bg-brand-black hover:bg-primary text-white font-bold rounded-xl text-[10px] px-3 h-8 shadow-sm transition-all hover:scale-105"
                                >
                                  Rate
                                </Button>
                              )
                            )}
                            <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover/item:opacity-100 transition-all translate-x-[-10px] group-hover/item:translate-x-0" />
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>

                  {["pending", "processing", "shipped"].includes((order?.status || "").toLowerCase()) && (
                    <div className="bg-muted/50 p-6 rounded-2xl border border-brand-black/5">
                      {(order?.status || "").toLowerCase() === "shipped" && order?.tracking_id ? (
                        <div className="space-y-3">
                          <p className="text-[10px] uppercase tracking-tighter text-purple-600 font-black mb-1">Tracking Information</p>
                          <div className="flex flex-col gap-3">
                            <div className="bg-purple-50 border border-purple-100 p-3 rounded-xl">
                              <p className="text-xs font-bold text-purple-700">Tracking ID: <span className="font-black">{order?.tracking_id}</span></p>
                            </div>
                            <a 
                              href={order?.tracking_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="w-full"
                            >
                              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl gap-2 h-10">
                                <ExternalLink className="h-4 w-4" />
                                Track Package
                              </Button>
                            </a>
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="text-[10px] uppercase tracking-tighter text-muted-foreground font-black mb-1">Estimated Delivery</p>
                          <p className="text-lg font-black text-brand-black">{getDeliveryWindow(order?.created_at || "")}</p>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {(order?.status || "").toLowerCase() === "delivered" && (order?.order_items || []).some(i => i.is_rated !== true) && (
                  <div className="mt-6 bg-primary/5 border border-primary/10 p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-2xl shadow-lg shadow-primary/20 shrink-0">
                        ⭐
                      </div>
                      <p className="text-sm font-bold text-brand-black">
                        <span className="text-primary font-black uppercase tracking-widest text-[10px] block mb-1">Permanent Offer</span>
                        Rate this product and earn 5 Reward Points! <span className="text-muted-foreground font-medium">(Points never expire. Collect 100 points to unlock a special discount).</span>
                      </p>
                    </div>
                    {(() => {
                      const firstUnrated = (order?.order_items || []).find(i => i.is_rated !== true);
                      if (!firstUnrated) return null;
                      return (
                        <Button 
                          onClick={() => {
                            setSelectedOrderItem({
                              productId: firstUnrated.product_id,
                              productName: firstUnrated.products?.name || "Product",
                              orderItemId: firstUnrated.id
                            });
                            setReviewModalOpen(true);
                          }}
                          className="w-full md:w-auto bg-primary hover:bg-orange-600 text-white font-black px-8 py-6 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 whitespace-nowrap"
                        >
                          Rate Product
                        </Button>
                      );
                    })()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      <ReviewModal 
        open={reviewModalOpen}
        onOpenChange={setReviewModalOpen}
        productId={selectedOrderItem?.productId || ""}
        productName={selectedOrderItem?.productName || ""}
        orderItemId={selectedOrderItem?.orderItemId}
        onSuccess={() => fetchOrders()}
      />
    </div>
  );
};

export default MyOrders;
