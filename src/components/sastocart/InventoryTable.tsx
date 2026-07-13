import { useEffect, useState, useRef } from "react";
import { query } from "@/lib/db";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2, Edit, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { ProductForm } from "./ProductForm";

const EditStockDialog = ({ 
  product, 
  onUpdate, 
  isUpdating 
}: { 
  product: Product; 
  onUpdate: (id: string, stock: number) => Promise<void>; 
  isUpdating: boolean; 
}) => {
  const [open, setOpen] = useState(false);
  const [stockInput, setStockInput] = useState(product.stock.toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onUpdate(product.id, parseInt(stockInput) || 0);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      setOpen(newOpen);
      if (newOpen) setStockInput(product.stock.toString());
    }}>
      <DialogTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-6 w-6 text-muted-foreground hover:text-primary transition-all"
          title="Edit Stock"
        >
          <Edit className="h-3 w-3" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle>Edit Stock</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div className="space-y-2">
            <label htmlFor="stock" className="text-sm font-medium">New Total Stock</label>
            <Input
              id="stock"
              type="number"
              value={stockInput}
              onChange={(e) => setStockInput(e.target.value)}
              min="0"
              required
              className="text-center text-lg font-bold"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={isUpdating}>
              {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

interface Product {
  id: string;
  name: string;
  description: string;
  image_url: string;
  image_urls?: string[];
  category: string;
  price: number;
  stock: number;
  specifications?: Record<string, string>;
}

export const InventoryTable = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingIds, setUpdatingIds] = useState<Set<string>>(new Set());
  const previousProducts = useRef<Product[]>([]);

  const fetchProducts = async () => {
    try {
      const result = await query("SELECT * FROM products ORDER BY created_at DESC");
      setProducts(result.rows || []);
      previousProducts.current = result.rows || [];
    } catch (error: any) {
      toast.error("Failed to fetch products: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();

    const intervalId = setInterval(() => {
      if (updatingIds.size === 0) {
        fetchProducts();
      }
    }, 10000);

    return () => clearInterval(intervalId);
  }, [updatingIds.size]);

  const handleStockUpdate = async (id: string, newStock: number) => {
    const originalProduct = previousProducts.current.find(p => p.id === id);
    if (originalProduct && originalProduct.stock === newStock) return;

    setUpdatingIds(prev => new Set(prev).add(id));
    
    try {
      await query("UPDATE products SET stock = $1 WHERE id = $2", [newStock, id]);

      toast.success("Stock updated", {
        duration: 1500,
        className: "bg-green-50 border-green-200 text-green-800",
      });
      
      // Update local state and previous products reference
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, stock: newStock } : p
      ));
      previousProducts.current = products.map(p => 
        p.id === id ? { ...p, stock: newStock } : p
      );
    } catch (error: any) {
      toast.error("Update failed: " + error.message);
      // Revert local state
      setProducts(prev => prev.map(p => 
        p.id === id ? { ...p, stock: originalProduct?.stock || 0 } : p
      ));
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  const handleDelete = async (id: string, force = false) => {
    try {
      setUpdatingIds(prev => new Set(prev).add(id));
      
      await query("DELETE FROM products WHERE id = $1", [id]);

      toast.success("Product deleted successfully");
      setProducts(prev => prev.filter((p) => p.id !== id));
    } catch (error: any) {
      if (error.message?.toLowerCase().includes("foreign key") || error.message?.toLowerCase().includes("violates")) {
        const proceed = window.confirm(
          "This product is linked to existing order records. Deleting it will also remove it from those order histories. Proceed with Force Delete?"
        );
        
        if (proceed) {
          try {
            await query("DELETE FROM order_items WHERE product_id = $1", [id]);
            await query("DELETE FROM products WHERE id = $1", [id]);
            toast.success("Product and related order links removed");
            setProducts(prev => prev.filter((p) => p.id !== id));
          } catch (retryError: any) {
            console.error("Force deletion error:", retryError);
            toast.error(retryError.message);
          }
          return;
        } else {
          return; // User cancelled
        }
      }
      
      console.error("Deletion error:", error);
      toast.error(error.message);
    } finally {
      setUpdatingIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  };

  if (loading) {
    return <div className="p-8 text-center flex flex-col items-center gap-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Loading inventory...</p>
    </div>;
  }

  return (
    <div className="rounded-xl border border-brand-black/10 bg-white overflow-hidden shadow-sm">
      <Table>
        <TableHeader className="bg-brand-black">
          <TableRow className="hover:bg-brand-black border-brand-black/10">
            <TableHead className="text-white font-bold">ID</TableHead>
            <TableHead className="text-white font-bold">Image</TableHead>
            <TableHead className="text-white font-bold">Name</TableHead>
            <TableHead className="text-white font-bold">Category</TableHead>
            <TableHead className="text-white font-bold text-right">Price</TableHead>
            <TableHead className="text-white font-bold text-center w-[150px]">Stock</TableHead>
            <TableHead className="text-white font-bold text-center">Status</TableHead>
            <TableHead className="text-white font-bold text-center">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                No products found in inventory.
              </TableCell>
            </TableRow>
          ) : (
            products.map((product) => {
              const isUpdating = updatingIds.has(product.id);
              const isLowStock = product.stock > 0 && product.stock < 5;
              const isOutOfStock = product.stock === 0;

              return (
                <TableRow 
                  key={product.id} 
                  className={cn(
                    "border-brand-black/5 transition-all duration-300",
                    isUpdating ? "opacity-50 bg-muted/50" : "hover:bg-orange-50/30",
                    isOutOfStock && "bg-red-50/20"
                  )}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {product.id.substring(0, 8)}...
                  </TableCell>
                  <TableCell>
                    <div className="h-10 w-10 rounded-md border border-border overflow-hidden bg-muted shadow-sm">
                      <img
                        src={product.image_urls?.[0] || product.image_url || "https://placehold.co/400x400/png?text=No+Image"}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="font-semibold text-brand-black">{product.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                      {product.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-right font-bold text-brand-black">
                    Rs. {Number(product.price).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={cn(
                        "font-bold text-lg",
                        isOutOfStock ? "text-red-600" : isLowStock ? "text-orange-500" : "text-brand-black"
                      )}>
                        {product.stock}
                      </span>
                      <EditStockDialog 
                        product={product} 
                        onUpdate={handleStockUpdate} 
                        isUpdating={isUpdating} 
                      />
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {isOutOfStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                        <AlertCircle className="h-3 w-3" />
                        Out of Stock
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                        Low Stock
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 border border-green-200">
                        In Stock
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Edit product"
                            className="h-8 w-8 text-primary border-primary/20 hover:bg-primary/5 hover:text-primary-hover hover:border-primary/40 transition-all"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-2xl font-extrabold text-brand-black flex items-center gap-2">
                              <Edit className="h-6 w-6 text-primary" />
                              Edit Product
                            </DialogTitle>
                          </DialogHeader>
                          <ProductForm 
                            initialData={product} 
                            onSuccess={() => {
                              // Force a refetch after successful edit
                              fetchProducts();
                            }} 
                          />
                        </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            aria-label="Delete product"
                            className="h-8 w-8 text-red-500 border-red-200 hover:bg-red-50 hover:text-red-600 hover:border-red-300 transition-all"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-brand-black/20">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-brand-black">Delete Product</AlertDialogTitle>
                            <AlertDialogDescription>
                              Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-brand-black/10 hover:bg-muted">Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(product.id)}
                              className="bg-red-600 hover:bg-red-700 text-white"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
};
