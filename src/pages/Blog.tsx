import { useQuery } from "@tanstack/react-query";
import { query } from "@/lib/db";
import { Loader2, Calendar, ArrowRight, BookOpen } from "lucide-react";
import { format } from "date-fns";
import { Link } from "react-router-dom";

export type BlogPost = {
  id: string;
  title: string;
  description: string;
  image_urls: string[];
  created_at: string;
};

const Blog = () => {
  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blogs"],
    queryFn: async () => {
      const result = await query("SELECT * FROM blogs ORDER BY created_at DESC");
      return result.rows as BlogPost[];
    },
  });

  return (
    <div className="bg-muted/30">
      <main className="container py-12 md:py-20">
        <div className="max-w-3xl mb-16">
          <div className="flex items-center gap-3 text-primary font-black uppercase tracking-widest text-xs mb-4">
            <BookOpen className="h-4 w-4" />
            <span>Sastocart Stories</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-brand-black tracking-tight mb-6">
            Insights, Trends & <span className="text-primary">E-commerce Tips</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Stay updated with the latest from the world of Sastocart. Discover shopping guides, 
            lifestyle hacks, and behind-the-scenes stories.
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-sm font-bold text-muted-foreground animate-pulse uppercase tracking-widest">
              Fetching latest stories...
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="bg-white rounded-3xl border-2 border-brand-black/5 p-16 text-center shadow-sm">
            <h3 className="text-2xl font-black text-brand-black">No blog posts yet</h3>
            <p className="text-muted-foreground mt-3 max-w-xs mx-auto text-lg leading-relaxed">
              We're currently writing some amazing stories for you. Please check back later!
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-12">
            {posts.map((post) => (
              <article 
                key={post.id} 
                className="group flex flex-col bg-white rounded-3xl overflow-hidden border-2 border-brand-black/5 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-2"
              >
                <div className="aspect-[16/10] overflow-hidden relative">
                  <img 
                    src={post.image_urls?.[0] || "https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=2070&auto=format&fit=crop"} 
                    alt={post.title} 
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur-md text-brand-black text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm">
                      Articles
                    </span>
                  </div>
                </div>
                
                <div className="p-8 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground mb-4">
                    <Calendar className="h-3 w-3 text-primary" />
                    {format(new Date(post.created_at), "MMMM d, yyyy")}
                  </div>
                  
                  <h2 className="text-2xl font-black text-brand-black leading-tight mb-4 group-hover:text-primary transition-colors">
                    {post.title}
                  </h2>
                  
                  <p className="text-muted-foreground leading-relaxed line-clamp-3 mb-8">
                    {post.description}
                  </p>
                  
                  <div className="mt-auto">
                    <Link 
                      to={`/blog/${post.id}`}
                      className="flex items-center gap-2 text-sm font-black text-brand-black group/btn hover:text-primary transition-colors"
                    >
                      Read Full Article
                      <ArrowRight className="h-4 w-4 transition-transform group-hover/btn:translate-x-1" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Blog;
