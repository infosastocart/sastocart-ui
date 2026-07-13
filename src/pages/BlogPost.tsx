import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router-dom";
import { query } from "@/lib/db";
import { Loader2, Calendar, ArrowLeft, BookOpen } from "lucide-react";
import { format } from "date-fns";

export type BlogPost = {
  id: string;
  title: string;
  description: string;
  image_urls: string[];
  created_at: string;
};

const BlogPost = () => {
  const { id } = useParams<{ id: string }>();

  const { data: post, isLoading, error } = useQuery({
    queryKey: ["blog", id],
    queryFn: async () => {
      const result = await query("SELECT * FROM blogs WHERE id = $1", [id]);
      if (result.rows.length === 0) throw new Error("Post not found");
      return result.rows[0] as BlogPost;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
        <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">
          Loading Story...
        </p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="container py-20 text-center">
        <h2 className="text-2xl font-black text-brand-black">Post not found</h2>
        <Link to="/blog" className="text-primary hover:underline mt-4 inline-block font-bold">
          ← Back to Blogs
        </Link>
      </div>
    );
  }

  const heroImage = post.image_urls?.[0] || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop";
  const remainingImages = post.image_urls?.slice(1) || [];

  return (
    <div className="bg-white min-h-screen">
      <div className="container py-8">
        <Link 
          to="/blog" 
          className="inline-flex items-center gap-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors mb-12 group"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          Back to Blogs
        </Link>

        <article className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 text-primary font-black uppercase tracking-widest text-xs mb-6">
            <BookOpen className="h-4 w-4" />
            <span>Sastocart Stories</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-brand-black tracking-tight mb-8 leading-[1.1]">
            {post.title}
          </h1>

          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground mb-12 pb-8 border-b border-brand-black/5">
            <Calendar className="h-4 w-4 text-primary" />
            {format(new Date(post.created_at), "MMMM d, yyyy")}
          </div>

          <div className="aspect-[21/9] w-full rounded-3xl overflow-hidden mb-16 shadow-2xl shadow-brand-black/10 border-2 border-brand-black/5">
            <img 
              src={heroImage} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>

          <div className="max-w-3xl mx-auto">
            <div className="text-lg md:text-xl text-brand-black/80 leading-relaxed whitespace-pre-wrap font-medium">
              {post.description}
            </div>
          </div>

          {remainingImages.length > 0 && (
            <div className="mt-20 pt-20 border-t border-brand-black/5">
              <h3 className="text-2xl font-black text-brand-black mb-10 uppercase tracking-tight">Article Gallery</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {remainingImages.map((url, index) => (
                  <div key={index} className="aspect-square rounded-3xl overflow-hidden border-2 border-brand-black/5 hover:scale-[1.02] transition-transform duration-500">
                    <img 
                      src={url} 
                      alt={`${post.title} gallery ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default BlogPost;
