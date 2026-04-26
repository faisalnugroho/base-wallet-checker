import { useGetRecentChecks, getGetRecentChecksQueryKey } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Activity } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

const TIER_COLORS: Record<string, string> = {
  unranked: "text-gray-400 bg-gray-400/10",
  bronze: "text-orange-500 bg-orange-500/10",
  silver: "text-slate-300 bg-slate-300/10",
  gold: "text-yellow-400 bg-yellow-400/10",
  platinum: "text-cyan-200 bg-cyan-200/10",
  diamond: "text-blue-400 bg-blue-400/10",
};

export function ActivityFeed() {
  const { data: recent, isLoading } = useGetRecentChecks({ limit: 8 }, { 
    query: { 
      queryKey: getGetRecentChecksQueryKey({ limit: 8 }), 
      refetchInterval: 15000 
    } 
  });

  return (
    <Card className="p-6 bg-card/30 backdrop-blur-md border-border/40 rounded-3xl flex flex-col gap-6 h-full max-h-[500px]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/20 rounded-lg text-primary relative">
            <Activity className="w-5 h-5" />
            <span className="absolute top-0 right-0 w-2 h-2 rounded-full bg-success animate-ping" />
          </div>
          <h3 className="text-xl font-display font-semibold">Live Feed</h3>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 custom-scrollbar">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-5 w-16" />
            </div>
          ))
        ) : !recent?.items?.length ? (
          <div className="text-center text-sm text-muted-foreground py-8">
            No recent activity
          </div>
        ) : (
          <AnimatePresence>
            {recent.items.map((item, i) => (
              <motion.div
                key={`${item.address}-${item.checked_at}`}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.05 }}
                className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5 hover:bg-black/30 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm text-muted-foreground group-hover:text-foreground transition-colors">
                    {item.address.slice(0, 6)}...{item.address.slice(-4)}
                  </div>
                  {item.eligible && (
                    <span className="text-[10px] font-bold uppercase tracking-wider text-success bg-success/10 px-1.5 py-0.5 rounded">
                      Top 2.5M
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  <span className="text-muted-foreground/50 text-xs hidden sm:inline">
                    {formatDistanceToNow(new Date(item.checked_at), { addSuffix: true })}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">
                      {item.score}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${TIER_COLORS[item.tier] || TIER_COLORS.unranked}`}>
                      {item.tier}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
    </Card>
  );
}