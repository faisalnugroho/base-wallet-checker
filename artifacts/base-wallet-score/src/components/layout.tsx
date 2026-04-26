import { ReactNode } from "react";
import { Link } from "wouter";
import { ShieldCheck } from "lucide-react";

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[100dvh] flex flex-col w-full relative overflow-x-hidden selection:bg-primary/30">
      <header className="w-full border-b border-border/40 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-5xl mx-auto flex items-center justify-between h-16 px-4">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20 group-hover:bg-primary/20 transition-colors">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <span className="font-display font-semibold text-lg tracking-tight">Base Score</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center w-full">
        {children}
      </main>

      <footer className="w-full border-t border-border/40 bg-background/50 py-8 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
          <p>
            Methodology credited to{" "}
            <a 
              href="https://x.com/nvthaovn" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:text-primary/80 transition-colors hover:underline"
            >
              @nvthaovn's Base Analytics Dashboard on Dune
            </a>
          </p>
          <p className="text-xs opacity-60">Not affiliated with Base or Coinbase. Data may be delayed.</p>
        </div>
      </footer>
    </div>
  );
}