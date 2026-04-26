import { useGetEligibilityCriteria } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ShieldCheck } from "lucide-react";
import { motion } from "framer-motion";

export function CriteriaPanel() {
  const { data: criteria, isLoading, error } = useGetEligibilityCriteria();

  if (isLoading) {
    return (
      <Card className="p-6 bg-card/30 backdrop-blur-md border-border/40 rounded-3xl flex flex-col gap-4">
        <Skeleton className="h-8 w-1/2" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>
      </Card>
    );
  }

  if (error || !criteria) {
    return null;
  }

  const items = [
    { label: "Transactions", value: `>= ${criteria.tx_count}` },
    { label: "Contracts Interacted", value: `>= ${criteria.contract_count}` },
    { label: "Active Months", value: `>= ${criteria.active_months}` },
    { label: "Native Volume", value: `>= ${criteria.native_volume_eth} ETH` },
  ];

  return (
    <Card className="p-6 bg-card/30 backdrop-blur-md border-border/40 rounded-3xl flex flex-col gap-6 h-full">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/20 rounded-lg text-primary">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-display font-semibold">Eligibility Criteria</h3>
      </div>
      
      <p className="text-sm text-muted-foreground leading-relaxed">
        To qualify for the Top 2.5M Base wallets, an address must meet ALL of the following minimum thresholds based on historical activity on the Base network.
      </p>

      <ul className="flex flex-col gap-3">
        {items.map((item, i) => (
          <motion.li 
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="flex items-center justify-between p-3 rounded-xl bg-black/20 border border-white/5"
          >
            <span className="text-muted-foreground font-medium">{item.label}</span>
            <span className="font-mono font-bold text-foreground bg-primary/10 px-2 py-1 rounded text-primary">{item.value}</span>
          </motion.li>
        ))}
      </ul>
    </Card>
  );
}