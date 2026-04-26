import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { useState } from "react";
import { WalletForm } from "@/components/wallet-form";
import { Dashboard } from "@/components/dashboard";
import { CriteriaPanel } from "@/components/criteria-panel";
import { ActivityFeed } from "@/components/activity-feed";
import { Layout } from "@/components/layout";
import type { WalletStats } from "@workspace/api-client-react";

export default function Home() {
  const [stats, setStats] = useState<WalletStats | null>(null);

  // We could use wouter search params to read ?address=... but for a simple mini-app, 
  // keeping the result in state is fine unless deep linking is explicitly required.
  // The brief mentions caching in localStorage, which we'll handle in the form component.

  return (
    <Layout>
      <div className="flex flex-col gap-12 pb-24">
        {/* Hero Section */}
        <section className="flex flex-col items-center justify-center text-center space-y-6 pt-12 md:pt-24 px-4">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-3 bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full text-sm font-medium"
          >
            <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
            Top 2.5M Base Wallets
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-4xl md:text-6xl font-bold tracking-tight max-w-2xl text-transparent bg-clip-text bg-gradient-to-br from-white to-white/70"
          >
            Base Wallet Score
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg text-muted-foreground max-w-xl"
          >
            Check your on-chain activity, calculate your composite score, and see if you qualify for the eligibility criteria.
          </motion.p>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full max-w-md mt-4"
          >
            <WalletForm onStatsReceived={setStats} />
          </motion.div>
        </section>

        {/* Dashboard Section */}
        {stats ? (
          <motion.section
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
          >
            <Dashboard stats={stats} />
          </motion.section>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="text-center text-muted-foreground italic py-12"
          >
            Paste your 0x address above to calculate your score.
          </motion.div>
        )}

        {/* Info & Activity Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-5xl mx-auto px-4 mt-8">
          <CriteriaPanel />
          <ActivityFeed />
        </section>
      </div>
    </Layout>
  );
}