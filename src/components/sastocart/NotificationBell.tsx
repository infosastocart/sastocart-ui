import { useEffect, useState } from "react";
import { Bell } from "lucide-react";
import { useUser } from "@clerk/clerk-react";
import { query } from "@/lib/db";
import { formatDistanceToNow } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  action_link: string;
  created_at: string;
}

export const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();

  const { user } = useUser();

  const fetchNotifications = async () => {
    if (!user) return;

    try {
      const result = await query("SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC", [user.id]);
      setNotifications(result.rows || []);
      setUnreadCount((result.rows || []).filter((n) => !n.is_read).length);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  useEffect(() => {
    fetchNotifications();

    const intervalId = setInterval(() => {
      fetchNotifications();
    }, 10000);

    return () => clearInterval(intervalId);
  }, [user]);

  const handleNotificationClick = async (notif: Notification) => {
    if (!notif.is_read) {
      try {
        await query("UPDATE notifications SET is_read = true WHERE id = $1", [notif.id]);
        setNotifications((current) =>
          current.map((n) => (n.id === notif.id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((count) => Math.max(0, count - 1));
      } catch (err) {
        console.error("Failed to mark notification as read", err);
      }
    }

    if (notif.action_link) {
      navigate(notif.action_link);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className="relative flex h-10 w-10 items-center justify-center rounded-full bg-white/20 text-white transition-all duration-200 hover:bg-white/30 group shadow-sm"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 transition-transform group-hover:scale-110" />
          {unreadCount > 0 && (
            <span className="absolute right-2 top-2 flex h-3 w-3">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex h-3 w-3 rounded-full bg-red-500"></span>
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 overflow-hidden rounded-2xl shadow-2xl border-brand-black/5" align="end">
        <div className="bg-primary p-4 text-white">
          <h3 className="font-black text-lg">Notifications</h3>
          <p className="text-[10px] uppercase tracking-widest opacity-80">
            {unreadCount} Unread Messages
          </p>
        </div>
        <div className="max-h-[400px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-10 w-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-bold">No notifications yet</p>
            </div>
          ) : (
            notifications.map((notif) => (
              <button
                key={notif.id}
                onClick={() => handleNotificationClick(notif)}
                className={cn(
                  "w-full text-left p-4 border-b border-brand-black/5 transition-colors hover:bg-muted/50",
                  !notif.is_read ? "bg-orange-50/50" : "bg-white"
                )}
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn(
                      "text-sm font-bold",
                      !notif.is_read ? "text-primary" : "text-brand-black"
                    )}>
                      {notif.title}
                    </p>
                    {!notif.is_read && (
                      <span className="h-2 w-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {notif.message}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60 mt-1 font-medium">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
        {notifications.length > 0 && (
          <div className="p-3 bg-muted/30 text-center border-t border-brand-black/5">
            <button 
              onClick={() => {
                // Future: Mark all as read
              }}
              className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
            >
              Recent Notifications
            </button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
