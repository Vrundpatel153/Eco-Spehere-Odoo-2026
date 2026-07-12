import { useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { useStore } from "@/store/useStore";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, CheckCheck, BellOff } from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type FilterKey = "all" | "unread" | "compliance" | "approval" | "policy" | "badge";

const TYPE_DOT: Record<string, string> = {
  compliance: "bg-destructive",
  approval: "bg-[#3b82f6]",
  policy: "bg-[#f59e0b]",
  badge: "bg-[#f97316]",
};

const TYPE_BADGE: Record<string, string> = {
  compliance: "bg-destructive/20 text-destructive border-destructive/30",
  approval: "bg-[#3b82f6]/20 text-[#3b82f6] border-[#3b82f6]/30",
  policy: "bg-[#f59e0b]/20 text-[#f59e0b] border-[#f59e0b]/30",
  badge: "bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30",
};

export default function Notifications() {
  const { data: notifications, update } = useStore<any>("esg_notifications");
  const [filter, setFilter] = useState<FilterKey>("all");

  const unreadCount = notifications.filter((n: any) => !n.read).length;

  const filtered = [...notifications]
    .filter((n: any) => {
      if (filter === "unread") return !n.read;
      if (filter === "all") return true;
      return n.type === filter;
    })
    .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const markRead = (id: string) => update(id, { read: true });

  const markAllRead = () => {
    notifications.filter((n: any) => !n.read).forEach((n: any) => update(n.id, { read: true }));
    toast({ title: "All notifications marked as read" });
  };

  const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "unread", label: `Unread (${unreadCount})` },
    { key: "compliance", label: "Compliance" },
    { key: "approval", label: "Approvals" },
    { key: "policy", label: "Policy" },
    { key: "badge", label: "Badges" },
  ];

  return (
    <Layout>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}` : "You're all caught up!"}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={markAllRead} className="gap-2">
            <CheckCheck className="w-4 h-4" /> Mark All Read
          </Button>
        )}
      </div>

      <div className="flex gap-2 flex-wrap mb-6">
        {FILTERS.map((f) => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? "default" : "outline"}
            onClick={() => setFilter(f.key)}
            className={filter === f.key ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
          >
            {f.label}
          </Button>
        ))}
      </div>

      <Card className="bg-card border-card-border">
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <BellOff className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">
                {filter === "unread" ? "You're all caught up! 🎉" : "No notifications"}
              </h3>
              <p className="text-sm text-muted-foreground">
                {filter === "unread" ? "No unread notifications." : `No ${filter} notifications found.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((n: any, i: number) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className={cn(
                    "flex items-start gap-4 p-4 transition-colors",
                    !n.read ? "bg-primary/5 hover:bg-primary/8" : "hover:bg-secondary/30"
                  )}
                >
                  <div className="pt-1.5 shrink-0">
                    <div className={cn("w-2.5 h-2.5 rounded-full", n.read ? "bg-muted" : (TYPE_DOT[n.type] || "bg-primary"))} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <Badge variant="outline" className={cn("text-[10px] px-2 py-0 h-5 capitalize", TYPE_BADGE[n.type] || "bg-secondary text-secondary-foreground")}>
                        {n.type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(n.createdAt).toLocaleDateString(undefined, {
                          year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-foreground">{n.message}</p>
                  </div>
                  {!n.read && (
                    <Button
                      variant="ghost" size="icon"
                      className="shrink-0 h-8 w-8 text-muted-foreground hover:text-primary"
                      onClick={() => markRead(n.id)}
                      title="Mark as read"
                    >
                      <Check className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </Layout>
  );
}
