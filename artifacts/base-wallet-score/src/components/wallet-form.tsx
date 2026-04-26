import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  useCheckWallet,
  getGetRecentChecksQueryKey,
  type WalletStats,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";

import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

const formSchema = z.object({
  address: z
    .string()
    .min(42, "Address must be 42 characters")
    .max(42, "Address must be 42 characters")
    .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid Ethereum address format"),
});

interface WalletFormProps {
  onStatsReceived: (stats: WalletStats) => void;
}

export function WalletForm({ onStatsReceived }: WalletFormProps) {
  const queryClient = useQueryClient();
  const checkWallet = useCheckWallet();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
    },
  });

  const checkCacheAndSubmit = async (values: z.infer<typeof formSchema>) => {
    const addr = values.address.toLowerCase();
    
    // Check localStorage cache (5 min TTL)
    try {
      const cached = localStorage.getItem(`wallet_score_${addr}`);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 5 * 60 * 1000) {
          onStatsReceived(data);
          toast.success("Loaded from cache");
          return;
        }
      }
    } catch (e) {
      // ignore cache errors
    }

    setIsLoading(true);
    
    checkWallet.mutate(
      { data: { address: addr } },
      {
        onSuccess: (stats) => {
          // Cache the result
          localStorage.setItem(
            `wallet_score_${addr}`,
            JSON.stringify({ data: stats, timestamp: Date.now() })
          );
          
          onStatsReceived(stats);
          
          // Invalidate recent checks to update feed
          queryClient.invalidateQueries({
            queryKey: getGetRecentChecksQueryKey({ limit: 8 }),
          });
        },
        onError: (err) => {
          const message =
            err?.data?.error || err?.message || "Failed to check wallet. Try again.";
          toast.error(message);
        },
        onSettled: () => {
          setIsLoading(false);
        }
      }
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(checkCacheAndSubmit)} className="relative w-full">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <div className="relative flex items-center group">
                <Search className="absolute left-4 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                <FormControl>
                  <Input
                    placeholder="0x..."
                    className="pl-12 pr-32 h-14 bg-card/50 backdrop-blur-sm border-border/50 text-lg font-mono shadow-2xl rounded-2xl focus-visible:ring-primary/30"
                    data-testid="input-wallet-address"
                    {...field}
                  />
                </FormControl>
                <div className="absolute right-2 flex items-center gap-2">
                  {isLoading ? (
                    <Button disabled size="sm" className="h-10 px-4 rounded-xl">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </Button>
                  ) : (
                    <Button type="submit" size="sm" className="h-10 px-6 rounded-xl font-semibold" data-testid="button-check-wallet">
                      Check
                    </Button>
                  )}
                </div>
              </div>
              <FormMessage className="text-left mt-2 ml-2" />
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}