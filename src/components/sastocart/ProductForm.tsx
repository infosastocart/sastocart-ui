import { useState, useEffect } from "react";
import { query } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Upload, X, Image as ImageIcon, Save, Plus, Trash2 } from "lucide-react";

interface ProductFormProps {
  initialData?: {
    id: string;
    name: string;
    description: string;
    price: number;
    category: string;
    stock: number;
    image_urls?: string[];
    specifications?: Record<string, string>;
  };
  onSuccess?: () => void;
}

export const ProductForm = ({ initialData, onSuccess }: ProductFormProps) => {
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState("");
  const [productId, setProductId] = useState(initialData?.id || "");
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [price, setPrice] = useState(initialData?.price.toString() || "");
  const [category, setCategory] = useState(initialData?.category || "");
  const [stock, setStock] = useState(initialData?.stock.toString() || "");
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>(initialData?.image_urls || []);
  const [isDragging, setIsDragging] = useState(false);
  const [existingImages, setExistingImages] = useState<string[]>(initialData?.image_urls || []);
  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(
    initialData?.specifications 
      ? Object.entries(initialData.specifications).map(([key, value]) => ({ key, value }))
      : [{ key: "", value: "" }]
  );

  const isEditing = !!initialData;

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    
    const newFiles = Array.from(files);
    const totalCount = imageFiles.length + existingImages.length + newFiles.length;
    
    if (totalCount > 6) {
      toast.error("Maximum 6 images allowed in total.");
      return;
    }

    setImageFiles(prev => [...prev, ...newFiles]);
    const newPreviews = newFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeImage = (index: number) => {
    // index is in the combined previews array
    const previewUrl = previews[index];
    
    // Check if it's an existing image or a new file
    const existingIndex = existingImages.indexOf(previewUrl);
    if (existingIndex !== -1) {
      setExistingImages(prev => prev.filter((_, i) => i !== existingIndex));
    } else {
      // It's a new file. Find its index in imageFiles.
      // We need to know which of the 'new' previews it is.
      const newPreviewIndex = previews.slice(existingImages.length).indexOf(previewUrl);
      if (newPreviewIndex !== -1) {
        URL.revokeObjectURL(previewUrl);
        setImageFiles(prev => prev.filter((_, i) => i !== newPreviewIndex));
      }
    }
    
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleUploads = async (files: File[]) => {
    const urls = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("upload_preset", "sastocart_products");

      const response = await fetch("https://api.cloudinary.com/v1_1/dlt7ifmcg/image/upload", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload image");
      }

      const data = await response.json();
      urls.push(data.secure_url);
    }
    return urls;
  };

  const totalImages = previews.length;
  const isValid = totalImages >= 3 && totalImages <= 6;
  const validationError = totalImages > 0 && !isValid 
    ? (totalImages < 3 ? "A minimum of 3 images is required." : "A maximum of 6 images is allowed.")
    : "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Submitting payload:', { productId, name, description, price, category, stock, specs });

    if (totalImages < 3) {
      toast.error("A minimum of 3 images is required.");
      return;
    }

    setLoading(true);
    try {
      // 1. Upload new images
      setLoadingText("Uploading images...");
      const newImageUrls = await handleUploads(imageFiles);
      setLoadingText(isEditing ? "Updating Product..." : "Adding Product...");
      
      const finalImageUrls = [...existingImages, ...newImageUrls];
      
      // Convert to Postgres array literal string format
      const pgArrayLiteral = `{${finalImageUrls.map(url => `"${url}"`).join(",")}}`;

      // 2. Convert specs array to object
      const specsObject = specs.reduce((acc, curr) => {
        if (curr.key.trim() && curr.value.trim()) {
          acc[curr.key.trim()] = curr.value.trim();
        }
        return acc;
      }, {} as Record<string, string>);

      const productData = {
        name,
        description,
        price: parseFloat(price),
        category,
        stock: parseInt(stock),
        image_urls: finalImageUrls,
        image_url: finalImageUrls[0] || "",
        specifications: specsObject,
      };

      console.log("Sanitized payload for DB:", productData);

      if (isEditing) {
        await query(
          "UPDATE products SET name = $1, description = $2, price = $3, category = $4, stock = $5, image_urls = $6, image_url = $7, specifications = $8 WHERE id = $9",
          [productData.name, productData.description, productData.price, productData.category, productData.stock, pgArrayLiteral, productData.image_url, JSON.stringify(productData.specifications), initialData?.id]
        );
        toast.success("Product updated successfully!");
      } else {
        await query(
          "INSERT INTO products (id, name, description, price, category, stock, image_urls, image_url, specifications) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)",
          [productId, productData.name, productData.description, productData.price, productData.category, productData.stock, pgArrayLiteral, productData.image_url, JSON.stringify(productData.specifications)]
        );
        toast.success("Product added successfully!");
        // Reset form
        setProductId("");
        setName("");
        setDescription("");
        setPrice("");
        setCategory("");
        setStock("");
        setImageFiles([]);
        previews.forEach(url => {
          if (url.startsWith('blob:')) URL.revokeObjectURL(url);
        });
        setPreviews([]);
        setExistingImages([]);
        setSpecs([{ key: "", value: "" }]);
      }

      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Submission error:", error);
      toast.error(`Submission failed: ${error.message || error}`);
    } finally {
      setLoading(false);
      setLoadingText("");
    }
  };

  return (
    <form 
      onSubmit={handleSubmit} 
      onInvalid={(e) => {
        const target = e.target as HTMLInputElement;
        console.error("Form validation failed for:", target.name || target.id);
        toast.error(`Please fill out the required field: ${target.name || target.id}`);
      }}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="productId" className="text-brand-black font-bold">Product ID (SKU)</Label>
        <Input 
          id="productId" 
          name="Product ID"
          value={productId} 
          onChange={(e) => setProductId(e.target.value)} 
          placeholder="e.g. SKU-12345" 
          className="border-brand-black/10 focus:border-primary"
          required 
          disabled={isEditing}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="name" className="text-brand-black font-bold">Product Name</Label>
        <Input 
          id="name" 
          name="Product Name"
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder="e.g. Wireless Headphones" 
          className="border-brand-black/10 focus:border-primary"
          required 
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-brand-black font-bold">Description</Label>
        <Textarea 
          id="description" 
          name="Description"
          value={description} 
          onChange={(e) => setDescription(e.target.value)} 
          placeholder="Detailed product description..." 
          className="min-h-[100px] border-brand-black/10 focus:border-primary"
          required 
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="price" className="text-brand-black font-bold">Price (Rs.)</Label>
          <Input 
            id="price" 
            name="Price"
            type="number" 
            step="0.01"
            value={price} 
            onChange={(e) => setPrice(e.target.value)} 
            placeholder="0.00" 
            className="border-brand-black/10 focus:border-primary"
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="category" className="text-brand-black font-bold">Category</Label>
          <Input 
            id="category" 
            name="Category"
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            placeholder="e.g. Electronics" 
            className="border-brand-black/10 focus:border-primary"
            required 
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="stock" className="text-brand-black font-bold">Stock (Pieces)</Label>
          <Input 
            id="stock" 
            name="Stock"
            type="number" 
            value={stock} 
            onChange={(e) => setStock(e.target.value)} 
            placeholder="0" 
            className="border-brand-black/10 focus:border-primary"
            required 
          />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-brand-black font-bold">Product Images (3-6 required)</Label>
          <span className={`text-xs font-bold ${isValid ? 'text-green-600' : 'text-primary'}`}>
            {totalImages} / 6 Selected
          </span>
        </div>
        
        <div 
          className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg transition-all cursor-pointer relative ${
            isDragging ? 'border-primary bg-primary/5' : 'border-brand-black/10 hover:border-primary bg-gray-50'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={() => document.getElementById('image-upload')?.click()}
        >
          <div className="space-y-2 text-center">
            <Upload className={`mx-auto h-10 w-10 ${isDragging ? 'text-primary' : 'text-muted-foreground'}`} />
            <div className="flex text-sm text-muted-foreground">
              <label htmlFor="image-upload" className="relative cursor-pointer rounded-md font-bold text-primary hover:text-primary-hover focus-within:outline-none">
                <span>Upload files</span>
                <input 
                  id="image-upload" 
                  name="image-upload" 
                  type="file" 
                  className="sr-only" 
                  accept="image/*"
                  multiple
                  onChange={(e) => handleFileChange(e.target.files)}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
          </div>
        </div>

        {validationError && (
          <p className="text-sm font-bold text-primary animate-pulse">
            {validationError}
          </p>
        )}

        {previews.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
            {previews.map((preview, index) => (
              <div key={preview} className="relative group aspect-square rounded-md overflow-hidden border border-brand-black/10 bg-white shadow-sm">
                {preview ? (
                  <img 
                    src={preview} 
                    alt={`Preview ${index + 1}`} 
                    className="h-full w-full object-cover"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(index);
                  }}
                  aria-label="Remove image"
                  className="absolute top-1 right-1 bg-primary text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="space-y-4 pt-4 border-t border-brand-black/5">
          <div className="flex items-center justify-between">
            <Label className="text-brand-black font-bold">Specifications (Key-Value Pairs)</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSpecs([...specs, { key: "", value: "" }])}
              className="h-8 gap-1 text-xs border-primary text-primary hover:bg-primary/5"
            >
              <Plus className="h-3 w-3" /> Add Row
            </Button>
          </div>
          
          <div className="space-y-3">
            {specs.map((spec, index) => (
              <div key={index} className="flex gap-3 items-start animate-in fade-in slide-in-from-top-1 duration-200">
                <Input
                  placeholder="Key (e.g. Color)"
                  value={spec.key}
                  onChange={(e) => {
                    const newSpecs = [...specs];
                    newSpecs[index].key = e.target.value;
                    setSpecs(newSpecs);
                  }}
                  className="flex-1 border-brand-black/10 focus:border-primary h-9"
                />
                <Input
                  placeholder="Value (e.g. Matte Black)"
                  value={spec.value}
                  onChange={(e) => {
                    const newSpecs = [...specs];
                    newSpecs[index].value = e.target.value;
                    setSpecs(newSpecs);
                  }}
                  className="flex-1 border-brand-black/10 focus:border-primary h-9"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setSpecs(specs.filter((_, i) => i !== index))}
                  disabled={specs.length === 1}
                  className="h-9 w-9 text-muted-foreground hover:text-red-500 hover:bg-red-50 shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Button 
        type="submit" 
        className="w-full bg-primary hover:bg-primary-hover text-white font-bold h-12 shadow-lg transition-all active:scale-95 disabled:bg-gray-300" 
        disabled={loading || !isValid}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            {loadingText || (isEditing ? "Updating Product..." : "Adding Product...")}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            {isEditing ? <Save className="h-5 w-5" /> : <ImageIcon className="h-5 w-5" />}
            {isEditing ? "Update Product" : "Add Product to Inventory"}
          </div>
        )}
      </Button>
    </form>
  );
};
