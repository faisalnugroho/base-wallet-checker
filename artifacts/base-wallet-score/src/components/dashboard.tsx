import { motion, useAnimation, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { WalletStats } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Share, Activity, CalendarDays, Coins, CheckCircle2, XCircle } from "lucide-react";
import { SiEthereum } from "react-icons/si";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";

function CountUp({ to, duration = 2, decimals = 0 }: { to: number; duration?: number; decimals?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  const controls = useAnimation();

  useEffect(() => {
    if (inView) {
      let startTime: number;
      let animationFrame: number;

      const animate = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
        
        // Easing function (easeOutExpo)
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        
        setCount(to * easeProgress);

        if (progress < 1) {
          animationFrame = requestAnimationFrame(animate);
        }
      };

      animationFrame = requestAnimationFrame(animate);
      return () => cancelAnimationFrame(animationFrame);
    }
    return undefined;
  }, [inView, to, duration]);

  return <span ref={ref}>{count.toFixed(decimals)}</span>;
}

const TIER_STYLES: Record<string, string> = {
  unranked: "from-gray-500 to-gray-400 text-gray-100",
  bronze: "from-amber-700 to-orange-500 text-orange-50",
  silver: "from-slate-400 to-gray-300 text-slate-50",
  gold: "from-yellow-500 to-amber-300 text-yellow-950",
  platinum: "from-cyan-100 to-white text-slate-900 shadow-[0_0_15px_rgba(255,255,255,0.5)]",
  diamond: "from-cyan-400 to-blue-400 text-white shadow-[0_0_20px_rgba(56,189,248,0.6)]",
};

export function Dashboard({ stats }: { stats: WalletStats }) {
  const tierStyle = TIER_STYLES[stats.tier] || TIER_STYLES.unranked;

  const copyAddress = () => {
    navigator.clipboard.writeText(stats.address);
    toast.success("Address copied to clipboard");
  };

  const shareOnWarpcast = () => {
    const text = stats.eligible 
      ? `✅ My Base wallet scored ${stats.score}/1000 (${stats.tier}) and is in the Top 2.5M! Check yours:`
      : `📊 My Base wallet scored ${stats.score}/1000 — working toward the Top 2.5M. Check yours:`;
    
    const url = new URL("https://warpcast.com/~/compose");
    url.searchParams.set("text", text);
    url.searchParams.set("embeds[]", window.location.origin);
    
    window.open(url.toString(), "_blank");
  };

  const formatEth = (val: number) => {
    if (val < 0.001) return "<0.001";
    return val.toFixed(3);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4 flex flex-col gap-6">
      <Card className="w-full relative overflow-hidden border-border/50 bg-card/40 backdrop-blur-xl shadow-2xl p-8 rounded-3xl">
        {/* Glow effect behind score */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full blur-[100px] opacity-20 pointer-events-none bg-gradient-to-br ${tierStyle}`} />
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-sm text-muted-foreground truncate max-w-[200px] md:max-w-none bg-black/20 px-3 py-1 rounded-md" data-testid="text-address">
                {stats.address.slice(0, 6)}...{stats.address.slice(-4)}
              </span>
              <button onClick={copyAddress} className="text-muted-foreground hover:text-foreground transition-colors p-1" title="Copy address">
                <Copy className="w-4 h-4" />
              </button>
              <a href={`https://basescan.org/address/${stats.address}`} target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-foreground transition-colors p-1" title="View on Basescan">
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            <div>
              <h2 className="text-5xl md:text-7xl font-bold font-display tracking-tight flex items-baseline gap-2">
                <span data-testid="text-score"><CountUp to={stats.score} /></span>
                <span className="text-2xl text-muted-foreground/50 font-medium">/1000</span>
              </h2>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <div className={`px-4 py-1.5 rounded-full font-bold uppercase tracking-widest text-sm bg-gradient-to-r ${tierStyle}`} data-testid="text-tier">
                {stats.tier} Tier
              </div>
              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${stats.eligible ? 'border-success/50 bg-success/10 text-success' : 'border-muted bg-muted/20 text-muted-foreground'}`}>
                {stats.eligible ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {stats.eligible ? 'Top 2.5M Eligible' : 'Not Eligible'}
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full md:w-auto">
            <Button onClick={shareOnWarpcast} size="lg" className="w-full md:w-auto gap-2 bg-[#8a63d2] hover:bg-[#8a63d2]/90 text-white rounded-xl" data-testid="button-share">
              <Share className="w-4 h-4" />
              Share on Warpcast
            </Button>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard title="Transactions" value={stats.tx_count} icon={<Activity className="w-4 h-4" />} />
        <StatCard title="Contracts Used" value={stats.contract_count} icon={<Share className="w-4 h-4" />} />
        <StatCard title="Active Months" value={stats.active_months} icon={<CalendarDays className="w-4 h-4" />} />
        <StatCard title="Volume (ETH)" value={formatEth(stats.native_volume_eth)} icon={<SiEthereum className="w-4 h-4" />} />
        <StatCard title="Gas Spent (ETH)" value={formatEth(stats.gasfee_eth)} icon={<Coins className="w-4 h-4" />} />
        <StatCard title="Balance (ETH)" value={formatEth(stats.current_balance_eth)} icon={<SiEthereum className="w-4 h-4" />} />
        <StatCard title="Active Days" value={stats.active_days} icon={<CalendarDays className="w-4 h-4" />} />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon }: { title: string, value: string | number, icon: React.ReactNode }) {
  return (
    <Card className="bg-card/30 backdrop-blur-md border-border/40 p-5 flex flex-col gap-3 rounded-2xl hover:bg-card/50 transition-colors">
      <div className="flex items-center gap-2 text-muted-foreground font-medium text-sm">
        {icon}
        <span>{title}</span>
      </div>
      <div className="text-2xl font-mono font-semibold text-foreground tracking-tight">
        {typeof value === 'number' ? <CountUp to={value} decimals={Number.isInteger(value) ? 0 : 3} /> : value}
      </div>
    </Card>
  );
}