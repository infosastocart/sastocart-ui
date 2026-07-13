import { useState, useEffect } from "react";
import { query } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Send, Image as ImageIcon, X, Trash2, Calendar } from "lucide-react";
import { format } from "date-fns";

export type BlogPost = {
  id: string;
  title: string;
  description: string;
  image_urls: string[];
  created_at: string;
};

export const ManageBlogs = () => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loadingBlogs, setLoadingBlogs] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchBlogs = async () => {
    setLoadingBlogs(true);
    try {
      const result = await query("SELECT * FROM blogs ORDER BY created_at DESC");
      setBlogs(result.rows || []);
    } catch (error) {
      console.error("Error fetching blogs:", error);
      toast.error("Failed to fetch blogs");
    } finally {
      setLoadingBlogs(false);
    }
  };

  useEffect(() => {
    fetchBlogs();
  }, []);

  const handleDeleteBlog = async (blog: BlogPost) => {
    if (!window.confirm(`Are you sure you want to delete "${blog.title}"?`)) return;

    setDeletingId(blog.id);
    try {
      await query("DELETE FROM blogs WHERE id = $1", [blog.id]);

      toast.success("Blog deleted successfully");
      setBlogs(prev => prev.filter(b => b.id !== blog.id));
    } catch (error) {
      console.error("Error:", error);
      const message = error instanceof Error ? error.message : "An error occurred";
      toast.error(message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      
      if (selectedFiles.length < 3 || selectedFiles.length > 6) {
        toast.error("Please select between 3 and 6 images.");
        return;
      }

      setFiles(selectedFiles);
      
      // Generate previews
      const newPreviews = selectedFiles.map(file => URL.createObjectURL(file));
      setPreviews(newPreviews);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);

    const newPreviews = [...previews];
    newPreviews.splice(index, 1);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || files.length === 0) {
      toast.error("Please fill all fields and select images.");
      return;
    }

    if (files.length < 3 || files.length > 6) {
      toast.error("Minimum 3 and maximum 6 images allowed.");
      return;
    }

    setLoading(true);
    const uploadedUrls: string[] = [];

    try {
      // 1. Upload Images
      toast.loading("Uploading images...", { id: "blog-upload" });
      
      for (const file of files) {
        const base64String = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        uploadedUrls.push(base64String);
      }

      // 2. Insert Blog Post
      toast.loading("Creating blog post...", { id: "blog-upload" });
      
      await query(
        "INSERT INTO blogs (title, description, image_urls) VALUES ($1, $2, $3)",
        [title, description, JSON.stringify(uploadedUrls)]
      );

      toast.success("Blog post published successfully!", { id: "blog-upload" });
      fetchBlogs(); // Refresh the list
      
      // Reset form
      setTitle("");
      setDescription("");
      setFiles([]);
      setPreviews([]);
    } catch (error) {
      console.error("Blog upload error:", error);
      const message = error instanceof Error ? error.message : "Failed to publish blog post";
      toast.error(message, { id: "blog-upload" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border-2 border-brand-black/5 p-8 shadow-sm">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-2">
          <Label htmlFor="blog-title" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Blog Title
          </Label>
          <Input 
            id="blog-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter a catchy title..."
            className="rounded-xl border-muted bg-muted/20 focus:ring-primary h-12 font-medium"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="blog-desc" className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Article Content
          </Label>
          <Textarea 
            id="blog-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Write your article here..."
            className="min-h-[250px] rounded-2xl border-muted bg-muted/20 focus:ring-primary p-6 font-medium leading-relaxed"
            required
          />
        </div>

        <div className="space-y-4">
          <Label className="text-xs font-black uppercase tracking-widest text-muted-foreground">
            Blog Images (Select 3-6)
          </Label>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {previews.map((preview, index) => (
              <div key={index} className="relative aspect-square rounded-xl overflow-hidden border-2 border-brand-black/5 group">
                <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                <button 
                  type="button"
                  onClick={() => removeFile(index)}
                  aria-label="Remove image"
                  className="absolute top-2 right-2 h-6 w-6 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            
            {previews.length < 6 && (
              <label className="aspect-square rounded-xl border-2 border-dashed border-muted hover:border-primary/50 hover:bg-primary/5 transition-all cursor-pointer flex flex-col items-center justify-center gap-2">
                <ImageIcon className="h-6 w-6 text-muted-foreground" />
                <span className="text-[10px] font-black uppercase text-muted-foreground">Add Image</span>
                <input 
                  type="file" 
                  multiple 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  className="hidden" 
                />
              </label>
            )}
          </div>
          <p className="text-[10px] font-bold text-muted-foreground">
            Tip: Select multiple images at once. Min 3, Max 6.
          </p>
        </div>

        <div className="pt-4">
          <Button 
            type="submit" 
            disabled={loading}
            className={`bg-white text-primary border-2 border-primary font-bold py-2 px-6 rounded-md hover:bg-orange-50 transition-colors w-full md:w-auto h-auto ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Publishing...</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>Publish Blog Post</span>
              </>
            )}
          </Button>
        </div>
      </form>

      <div className="mt-20 pt-12 border-t-2 border-brand-black/5">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h3 className="text-xl font-black text-brand-black">Manage Existing Blogs</h3>
            <p className="text-sm text-muted-foreground font-medium mt-1">Review and delete your published stories.</p>
          </div>
          <div className="bg-primary/10 text-primary text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest">
            {blogs.length} Total Posts
          </div>
        </div>

        {loadingBlogs ? (
          <div className="flex flex-col items-center justify-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">Loading articles...</p>
          </div>
        ) : blogs.length === 0 ? (
          <div className="text-center py-20 bg-muted/10 rounded-3xl border-2 border-dashed border-muted">
            <p className="text-muted-foreground font-medium italic">No blogs found. Start by publishing your first story!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <div 
                key={blog.id} 
                className="flex flex-col md:flex-row md:items-center gap-6 p-6 bg-muted/10 rounded-3xl border-2 border-brand-black/5 hover:bg-white hover:shadow-xl hover:shadow-brand-black/5 transition-all duration-300 group"
              >
                <div className="h-20 w-32 rounded-2xl overflow-hidden border-2 border-brand-black/5 shrink-0 bg-white">
                  <img 
                    src={blog.image_urls?.[0] || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop"} 
                    alt={blog.title} 
                    className="h-full w-full object-cover transition-transform group-hover:scale-110 duration-500"
                  />
                </div>
                
                <div className="flex-grow min-w-0">
                  <h4 className="text-lg font-black text-brand-black truncate group-hover:text-primary transition-colors">
                    {blog.title}
                  </h4>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(blog.created_at), "MMM d, yyyy")}
                    </div>
                    <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                    <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                      {blog.image_urls?.length || 0} Images
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteBlog(blog)}
                    disabled={deletingId === blog.id}
                    aria-label={`Delete blog post: ${blog.title}`}
                    className="h-12 w-12 rounded-xl bg-red-50 hover:bg-red-500 hover:text-white text-red-500 transition-all border border-red-100"
                  >
                    {deletingId === blog.id ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Trash2 className="h-5 w-5" />
                    )}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
