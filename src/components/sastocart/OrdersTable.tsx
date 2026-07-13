import { useState, useEffect } from "react";
import { query } from "@/lib/db";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Eye, ShoppingBag, MapPin, User, Phone, Mail, Calendar, CheckCircle2, Clock, Truck, Package, XCircle, Trash2, ExternalLink, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: number;
  products: {
    name: string;
    image_url: string;
  };
}

interface Order {
  id: string;
  created_at: string;
  user_id: string;
  total_price: number;
  status: string;
  shipping_address: string;
  payment_method: string;
  customer_name: string;
  customer_phone: string;
  tracking_url?: string;
  return_reason?: string;
  admin_return_note?: string;
  return_status?: string;
  admin_return_message?: string;
  order_items: OrderItem[];
}

export const OrdersTable = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [returnAction, setReturnAction] = useState<'ACCEPTED' | 'REJECTED' | null>(null);
  const [returnMessage, setReturnMessage] = useState("");
  const [isShippingModalOpen, setIsShippingModalOpen] = useState(false);
  const [shippingData, setShippingData] = useState({
    orderId: "",
    trackingId: "",
    trackingUrl: ""
  });

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const result = await query(`
        SELECT o.*, 
        COALESCE(
          json_agg(
            json_build_object(
              'id', oi.id,
              'product_id', oi.product_id,
              'quantity', oi.quantity,
              'price', oi.price,
              'products', json_build_object('name', p.name, 'image_url', p.image_url)
            )
          ) FILTER (WHERE oi.id IS NOT NULL), '[]'
        ) as order_items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        LEFT JOIN products p ON oi.product_id = p.id
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `);

      setOrders(result.rows || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    // Keep track of the original status in case we need to revert
    const originalOrder = orders.find(o => o.id === orderId);
    if (!originalOrder) return;

    try {
      if (newStatus === "shipped") {
        setShippingData({
          orderId,
          trackingId: originalOrder.tracking_id || "",
          trackingUrl: originalOrder.tracking_url || ""
        });
        setIsShippingModalOpen(true);
        return;
      }

      setUpdatingId(orderId);
      
      await query("UPDATE orders SET status = $1 WHERE id = $2", [newStatus, orderId]);

      // Only update local state if the database write was successful
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
      );
      
      toast.success(`Order status updated to ${newStatus}`, {
        icon: <CheckCircle2 className="h-4 w-4 text-green-500" />,
      });
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error("An unexpected error occurred: " + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleReturnStatusUpdate = async (orderId: string, status: 'ACCEPTED' | 'REJECTED') => {
    if (!returnMessage.trim()) {
      toast.error("Please provide a return message for the customer.");
      return;
    }

    try {
      setUpdatingId(orderId);
      await query(
        "UPDATE orders SET return_status = $1, admin_return_message = $2 WHERE id = $3",
        [status, returnMessage.trim(), orderId]
      );

      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, return_status: status, admin_return_message: returnMessage.trim() } : o));
      if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, return_status: status, admin_return_message: returnMessage.trim() } : null);
      }

      toast.success(`Return ${status.toLowerCase()} successfully`);
      setReturnAction(null);
      setReturnMessage("");
    } catch (error: any) {
      console.error("RETURN ACTION ERROR:", error);
      toast.error(`Failed to update return status: ${error.message}`);
      fetchOrders();
    } finally {
      setUpdatingId(null);
    }
  };

  const confirmShipping = async () => {
    if (!shippingData.trackingId || !shippingData.trackingUrl) {
      toast.error("Please provide both Tracking ID and Tracking Link");
      return;
    }

    try {
      setUpdatingId(shippingData.orderId);
      setIsShippingModalOpen(false);

      await query(
        "UPDATE orders SET status = $1, tracking_id = $2, tracking_url = $3 WHERE id = $4",
        ["shipped", shippingData.trackingId, shippingData.trackingUrl, shippingData.orderId]
      );

      setOrders((prev) =>
        prev.map((o) => (o.id === shippingData.orderId ? { 
          ...o, 
          status: "shipped",
          tracking_id: shippingData.trackingId,
          tracking_url: shippingData.trackingUrl
        } : o))
      );

      toast.success("Order marked as Shipped with tracking info!", {
        icon: <Truck className="h-4 w-4 text-purple-500" />,
      });
    } catch (error: any) {
      console.error("Error updating shipping status:", error);
      toast.error("Failed to update shipping status: " + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (order: Order | string) => {
    if (typeof order !== 'string') {
      if (order.return_status === 'PENDING') return "bg-orange-100 text-orange-700 border-orange-200";
      if (order.return_status === 'ACCEPTED') return "bg-green-100 text-green-700 border-green-200";
      if (order.return_status === 'REJECTED') return "bg-red-100 text-red-700 border-red-200";
    }

    const statusStr = typeof order === 'string' ? order : order.status;
    switch (statusStr?.toLowerCase()) {
      case "pending": return "bg-orange-100 text-orange-700 border-orange-200";
      case "processing": return "bg-blue-100 text-blue-700 border-blue-200";
      case "shipped": return "bg-purple-100 text-purple-700 border-purple-200";
      case "cancelled": return "bg-red-100 text-red-700 border-red-200";
      case "return_requested": return "bg-orange-100 text-orange-700 border-orange-200";
      case "return_approved": return "bg-green-100 text-green-700 border-green-200";
      case "return_declined": return "bg-red-100 text-red-700 border-red-200";
      default: return "bg-gray-100 text-gray-700 border-gray-200";
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!window.confirm("Are you sure you want to permanently delete this order? This action cannot be undone.")) {
      return;
    }

    try {
      setUpdatingId(orderId);
      
      await query("DELETE FROM order_items WHERE order_id = $1", [orderId]);
      await query("DELETE FROM orders WHERE id = $1", [orderId]);

      setOrders((prev) => prev.filter((o) => o.id !== orderId));
      
      toast.success("Order deleted successfully", {
        icon: <Trash2 className="h-4 w-4 text-red-500" />,
      });
    } catch (error: any) {
      console.error("Error deleting order:", error);
      toast.error("Failed to delete order: " + error.message);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusIcon = (order: Order | string) => {
    if (typeof order !== 'string') {
      if (order.return_status === 'PENDING') return <Package className="h-3.5 w-3.5" />;
      if (order.return_status === 'ACCEPTED') return <CheckCircle2 className="h-3.5 w-3.5" />;
      if (order.return_status === 'REJECTED') return <XCircle className="h-3.5 w-3.5" />;
    }

    const statusStr = typeof order === 'string' ? order : order.status;
    switch (statusStr?.toLowerCase()) {
      case "pending": return <Clock className="h-3.5 w-3.5" />;
      case "processing": return <Package className="h-3.5 w-3.5" />;
      case "shipped": return <Truck className="h-3.5 w-3.5" />;
      case "delivered": return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "cancelled": return <XCircle className="h-3.5 w-3.5" />;
      case "return_requested": return <Package className="h-3.5 w-3.5" />;
      case "return_approved": return <CheckCircle2 className="h-3.5 w-3.5" />;
      case "return_declined": return <XCircle className="h-3.5 w-3.5" />;
      default: return null;
    }
  };

  useEffect(() => {
    // 1. Initial fetch
    fetchOrders();

    // 2. Realtime listener replaced with polling
    const intervalId = setInterval(() => {
      fetchOrders();
    }, 10000);

    // 3. Cleanup
    return () => {
      clearInterval(intervalId);
    };
  }, []);

  const openDetails = (order: Order) => {
    setSelectedOrder(order);
    setReturnAction(null);
    setReturnMessage("");
    setIsDetailsOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
        <p className="text-sm font-medium animate-pulse">Loading orders...</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-white p-16 text-center shadow-sm">
        <div className="mx-auto w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mb-4">
          <ShoppingBag className="h-8 w-8 text-muted-foreground opacity-20" />
        </div>
        <h3 className="text-xl font-bold text-brand-black">No orders placed yet</h3>
        <p className="text-muted-foreground mt-2 max-w-xs mx-auto">
          When customers start purchasing from your store, their orders will appear right here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={fetchOrders}
          className="gap-2 text-xs font-bold border-2 hover:bg-primary hover:text-white transition-all rounded-xl"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isLoading && "animate-spin")} />
          Refresh Orders
        </Button>
      </div>
      <div className="rounded-xl border border-border bg-white overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-brand-black">
            <TableRow className="hover:bg-transparent border-none">
              <TableHead className="text-white font-bold h-12">Order ID</TableHead>
              <TableHead className="text-white font-bold h-12">Date</TableHead>
              <TableHead className="text-white font-bold h-12">Customer</TableHead>
              <TableHead className="text-white font-bold h-12">Total</TableHead>
              <TableHead className="text-white font-bold h-12">Status</TableHead>
              <TableHead className="text-white font-bold h-12 text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="hover:bg-orange-50/30 transition-colors">
                <TableCell className="font-mono text-xs text-muted-foreground">
                  {order.id.slice(0, 8)}...
                </TableCell>
                <TableCell className="text-sm text-brand-black">
                  {format(new Date(order.created_at), "MMM d, yyyy")}
                </TableCell>
                <TableCell className="font-bold text-brand-black">
                  {order.customer_name}
                </TableCell>
                <TableCell className="font-black text-primary">
                  Rs. {Number(order.total_price).toFixed(2)}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {updatingId === order.id ? (
                      <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                        <Loader2 className="h-3 w-3 animate-spin text-primary" />
                        Saving...
                      </div>
                    ) : order.return_status && order.return_status !== 'NONE' ? (
                      <div className="space-y-1">
                        <Badge className={cn(
                          "h-8 text-[10px] font-black uppercase px-3 rounded-lg border-2 flex items-center gap-2",
                          getStatusColor(order)
                        )}>
                          {getStatusIcon(order)}
                          {order.return_status === 'PENDING' ? 'Return Requested' :
                           order.return_status === 'ACCEPTED' ? 'Return Accepted' :
                           'Return Rejected'}
                        </Badge>
                      </div>
                    ) : (order.status?.toLowerCase() === "cancelled" || order.status?.toLowerCase() === "canceled") ? (
                      <Badge className={cn(
                        "h-8 text-[10px] font-black uppercase px-3 rounded-lg border-2 flex items-center gap-2",
                        "bg-red-100 text-red-700 border-red-200"
                      )}>
                        <XCircle className="h-3.5 w-3.5" />
                        Cancelled
                      </Badge>
                    ) : order.status?.toLowerCase() === "return_requested" ? (
                      <div className="space-y-1">
                        <Badge className={cn(
                          "h-8 text-[10px] font-black uppercase px-3 rounded-lg border-2 flex items-center gap-2",
                          "bg-orange-100 text-orange-700 border-orange-200"
                        )}>
                          <Package className="h-3.5 w-3.5" />
                          Return Requested
                        </Badge>
                        {order.return_reason && (
                          <p className="text-[10px] text-muted-foreground italic px-1 max-w-[140px] leading-tight">
                            Reason: {order.return_reason}
                          </p>
                        )}
                      </div>
                    ) : ["pending", "processing", "shipped", "delivered"].includes(order.status?.toLowerCase() || "") ? (
                      <Select
                        defaultValue={order.status}
                        onValueChange={(value) => handleStatusUpdate(order.id, value)}
                      >
                        <SelectTrigger className={cn(
                          "w-[140px] h-8 text-xs font-bold border-2 transition-all",
                          getStatusColor(order.status)
                        )}>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(order.status)}
                            <SelectValue />
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending" className="text-xs font-bold text-orange-700">Pending</SelectItem>
                          <SelectItem value="processing" className="text-xs font-bold text-blue-700">Processed</SelectItem>
                          <SelectItem value="shipped" className="text-xs font-bold text-purple-700">Shipped</SelectItem>
                          <SelectItem value="delivered" className="text-xs font-bold text-green-700">Delivered</SelectItem>
                          <SelectItem value="cancelled" className="text-xs font-bold text-red-700">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge className="h-8 text-[10px] font-black uppercase px-3 rounded-lg border-2 bg-gray-200 text-gray-800 border-gray-300 flex items-center gap-2">
                        {order.status}
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDetails(order)}
                      className="hover:bg-primary hover:text-white transition-all gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      View Details
                    </Button>

                    {(order.status?.toLowerCase() === "return_approved" || order.status?.toLowerCase() === "return_declined") && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteOrder(order.id)}
                        disabled={updatingId === order.id}
                        className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-700 transition-colors"
                        title="Delete Order Record"
                      >
                        {updatingId === order.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-brand-black/20">
          <DialogHeader className="p-6 bg-brand-black text-white">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-2xl font-black flex items-center gap-2">
                  <ShoppingBag className="h-6 w-6 text-primary" />
                  Order Details
                </DialogTitle>
                <DialogDescription className="text-gray-400 font-mono text-xs mt-1">
                  ID: {selectedOrder?.id}
                </DialogDescription>
              </div>
              <Badge className="bg-primary hover:bg-primary text-white border-none font-black px-4 py-1">
                {selectedOrder?.status === "processing" ? "PROCESSED" : selectedOrder?.status.toUpperCase()}
              </Badge>
            </div>
          </DialogHeader>

          <ScrollArea className="max-h-[80vh]">
            <div className="p-6 space-y-8">
              {/* Customer & Shipping Section */}
              <div className="grid sm:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <User className="h-4 w-4" /> Customer Info
                  </h4>
                  <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border">
                    <p className="text-lg font-bold text-brand-black">{selectedOrder?.customer_name}</p>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedOrder?.customer_phone}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3.5 w-3.5" />
                      {selectedOrder && format(new Date(selectedOrder.created_at), "PPP p")}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                    <MapPin className="h-4 w-4" /> Shipping Address
                  </h4>
                  <div className="p-4 rounded-xl bg-muted/30 border border-border min-h-[100px]">
                    <p className="text-sm text-brand-black leading-relaxed whitespace-pre-wrap">
                      {selectedOrder?.shipping_address}
                    </p>
                  </div>
                </div>
              </div>

              {/* Items Section */}
              <div className="space-y-4">
                <h4 className="text-sm font-black uppercase tracking-widest text-primary flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4" /> Items Ordered
                </h4>
                <div className="border rounded-xl overflow-hidden bg-white">
                  {selectedOrder?.order_items.map((item, index) => (
                    <div 
                      key={item.id} 
                      className={`flex items-center gap-4 p-4 ${
                        index !== selectedOrder.order_items.length - 1 ? "border-b" : ""
                      }`}
                    >
                      <div className="h-16 w-16 shrink-0 rounded-lg border overflow-hidden bg-muted">
                        <img 
                          src={item.products.image_url || "https://placehold.co/400x400/png?text=No+Image"} 
                          alt={item.products.name} 
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-brand-black line-clamp-1">{item.products.name}</p>
                        <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-black text-brand-black">Rs. {(Number(item.price) * Number(item.quantity)).toFixed(2)}</p>
                        <p className="text-[10px] text-muted-foreground">Rs. {Number(item.price).toFixed(2)} each</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Return Management Section */}
              {selectedOrder?.return_status && selectedOrder.return_status !== 'NONE' && (
                <div className={cn(
                  "p-6 rounded-2xl border-2 space-y-4",
                  selectedOrder.return_status === 'PENDING' ? "bg-orange-50 border-orange-200" :
                  selectedOrder.return_status === 'ACCEPTED' ? "bg-green-50 border-green-200" :
                  "bg-red-50 border-red-200"
                )}>
                  <div className={cn(
                    "font-black uppercase tracking-widest text-xs flex items-center gap-2",
                    selectedOrder.return_status === 'PENDING' ? "text-orange-800" :
                    selectedOrder.return_status === 'ACCEPTED' ? "text-green-800" :
                    "text-red-800"
                  )}>
                    {selectedOrder.return_status === 'PENDING' ? <Package className="h-4 w-4" /> :
                     selectedOrder.return_status === 'ACCEPTED' ? <CheckCircle2 className="h-4 w-4" /> :
                     <XCircle className="h-4 w-4" />}
                    Return {selectedOrder.return_status}
                  </div>

                  <div className="bg-white p-4 rounded-xl border shadow-sm">
                    <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Customer's Reason:</p>
                    <p className="text-sm text-brand-black italic">"{selectedOrder.return_reason || "No reason provided."}"</p>
                  </div>

                  {selectedOrder.return_status === 'PENDING' && (
                    <div className="space-y-4 mt-4">
                      {returnAction ? (
                        <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                          <Label className={cn("text-sm font-bold", returnAction === 'ACCEPTED' ? "text-green-800" : "text-red-800")}>
                            {returnAction === 'ACCEPTED' 
                              ? "Message to Customer (e.g., Return instructions, warehouse address)"
                              : "Reason for Rejection"} <span className="text-red-500">*</span>
                          </Label>
                          <Textarea 
                            value={returnMessage}
                            onChange={(e) => setReturnMessage(e.target.value)}
                            placeholder={returnAction === 'ACCEPTED' 
                              ? "Please pack the item securely and ship it to..."
                              : "Please provide a reason for rejecting this return..."}
                            className={cn(
                              "min-h-[100px]", 
                              returnAction === 'ACCEPTED' 
                                ? "border-green-200 focus-visible:ring-green-500" 
                                : "border-red-200 focus-visible:ring-red-500"
                            )}
                          />
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              onClick={() => { setReturnAction(null); setReturnMessage(""); }}
                              className="flex-1"
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={() => handleReturnStatusUpdate(selectedOrder.id, returnAction)}
                              disabled={updatingId === selectedOrder.id || !returnMessage.trim()}
                              className={cn(
                                "flex-1 text-white", 
                                returnAction === 'ACCEPTED' 
                                  ? "bg-green-600 hover:bg-green-700" 
                                  : "bg-red-600 hover:bg-red-700"
                              )}
                            >
                              {updatingId === selectedOrder.id ? <Loader2 className="h-4 w-4 animate-spin" /> : returnAction === 'ACCEPTED' ? "Confirm Acceptance" : "Confirm Rejection"}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-3">
                          <Button 
                            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-black rounded-xl h-11"
                            onClick={() => setReturnAction('ACCEPTED')}
                            disabled={updatingId === selectedOrder.id}
                          >
                            Accept Return
                          </Button>
                          <Button 
                            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-black rounded-xl h-11"
                            onClick={() => setReturnAction('REJECTED')}
                            disabled={updatingId === selectedOrder.id}
                          >
                            Reject Return
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {(selectedOrder.return_status === 'ACCEPTED' || selectedOrder.return_status === 'REJECTED') && selectedOrder.admin_return_message && (
                    <div className="bg-white p-4 rounded-xl border shadow-sm">
                      <p className="text-xs text-muted-foreground uppercase font-bold mb-1">Admin Message:</p>
                      <p className="text-sm text-brand-black italic">"{selectedOrder.admin_return_message}"</p>
                    </div>
                  )}
                </div>
              )}

              {/* Total Summary */}
              <div className="p-6 rounded-2xl bg-brand-black text-white flex items-center justify-between shadow-xl">
                <div>
                  <p className="text-xs uppercase tracking-tighter text-gray-400 font-bold">Payment Method</p>
                  <p className="text-sm font-black text-primary">{selectedOrder?.payment_method}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs uppercase tracking-tighter text-gray-400 font-bold">Grand Total</p>
                  <p className="text-3xl font-black text-white">Rs. {Number(selectedOrder?.total_price || 0).toFixed(2)}</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Shipping Details Modal */}
      <Dialog open={isShippingModalOpen} onOpenChange={setIsShippingModalOpen}>
        <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden border-brand-black/20">
          <DialogHeader className="p-6 bg-purple-600 text-white">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black">Shipping Details</DialogTitle>
                <DialogDescription className="text-purple-100 text-xs">
                  Enter tracking information to mark as shipped.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="trackingId" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Tracking ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="trackingId"
                  placeholder="e.g. DHL123456789"
                  value={shippingData.trackingId}
                  onChange={(e) => setShippingData({ ...shippingData, trackingId: e.target.value })}
                  className="rounded-xl border-2 focus-visible:ring-purple-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trackingUrl" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                  Tracking Link/URL <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="trackingUrl"
                  placeholder="https://tracking-site.com/..."
                  value={shippingData.trackingUrl}
                  onChange={(e) => setShippingData({ ...shippingData, trackingUrl: e.target.value })}
                  className="rounded-xl border-2 focus-visible:ring-purple-500"
                />
                <p className="text-[10px] text-muted-foreground">
                  The customer will use this link to track their package.
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button 
                variant="outline" 
                className="flex-1 rounded-xl font-bold"
                onClick={() => setIsShippingModalOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black"
                onClick={confirmShipping}
                disabled={updatingId === shippingData.orderId}
              >
                {updatingId === shippingData.orderId ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Confirm Shipment"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
