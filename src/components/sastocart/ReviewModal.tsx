import { useState } from "react";
import { query } from "@/lib/db";
import { useUser } from "@clerk/clerk-react";
import { Button } from "@/components/ui/button";
import { Star, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productName: string;
  orderItemId?: string; // Optional: if coming from an order
  onSuccess?: () => void;
}

export const ReviewModal = ({ 
  open, 
  onOpenChange, 
  productId, 
  productName,
  orderItemId,
  onSuccess 
}: ReviewModalProps) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { user } = useUser();

  const handleSubmit = async () => {
    if (!comment.trim()) {
      toast.error("Please write a comment.");
      return;
    }

    try {
      setSubmitting(true);
      if (!user) throw new Error("Not logged in");

      const userId = user.id;
      const userName = user.fullName || user.primaryEmailAddress?.emailAddress?.split("@")[0] || "Customer";

      // 1. Insert Review
      await query(
        "INSERT INTO reviews (product_id, user_id, user_name, rating, comment) VALUES ($1, $2, $3, $4, $5)",
        [productId, userId, userName, rating, comment.trim()]
      );

      // 2. If coming from an order, update order_item and upsert rewards
      if (orderItemId) {
        // Update order_item
        await query("UPDATE order_items SET is_rated = true WHERE id = $1", [orderItemId]);

        // Upsert Rewards
        const rewardResult = await query("SELECT points FROM user_rewards WHERE user_id = $1", [userId]);
        const currentPoints = rewardResult.rows[0]?.points || 0;
        const newPoints = currentPoints + 5;

        await query(
          "INSERT INTO user_rewards (user_id, points) VALUES ($1, $2) ON CONFLICT (user_id) DO UPDATE SET points = EXCLUDED.points",
          [userId, newPoints]
        );

        toast.success("Review published! +5 Reward Points added to your wallet.", {
          icon: <div className="h-6 w-6 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold">⭐</div>
        });
      } else {
        toast.success("Thank you for your review!");
      }

      onOpenChange(false);
      setComment("");
      setRating(5);
      if (onSuccess) onSuccess();
    } catch (error: any) {
      console.error("Review Submission Error:", error);
      toast.error(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[450px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-black flex items-center gap-2 text-brand-black">
            <Star className="h-6 w-6 text-primary fill-primary" />
            Write a Review
          </DialogTitle>
          <DialogDescription>
            Share your experience with <strong>{productName}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {orderItemId && (
            <div className="bg-orange-50 border border-orange-100 p-4 rounded-2xl flex items-center gap-3">
              <div className="h-10 w-10 bg-primary text-white rounded-xl flex items-center justify-center font-black text-lg shadow-sm">
                ⭐
              </div>
              <div>
                <p className="text-xs font-black text-orange-800 uppercase tracking-widest">Incentive Reward</p>
                <p className="text-sm font-bold text-orange-700">Earn 5 Reward Points for this review!</p>
              </div>
            </div>
          )}

          <div className="space-y-2 text-center">
            <p className="text-sm font-bold text-brand-black">Your Rating</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setRating(s)}
                  aria-label={`Rate ${s} stars`}
                  className="p-1 transition-transform hover:scale-110 active:scale-95"
                >
                  <Star 
                    className={cn(
                      "h-8 w-8 transition-colors",
                      s <= rating ? "fill-primary text-primary" : "text-muted-foreground/30 hover:text-primary/50"
                    )} 
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-bold text-brand-black">Your Feedback</label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="What did you like or dislike about this product?"
              className="w-full min-h-[120px] p-4 rounded-xl border border-brand-black/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all"
              required
            />
          </div>
        </div>

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 rounded-xl font-bold"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 bg-primary hover:bg-primary/90 text-white font-black shadow-lg shadow-primary/20 rounded-xl"
          >
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : "Submit Review"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
