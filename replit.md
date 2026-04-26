# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifacts

- `api-server` (Express, kind=api, mounted at `/api`) — exposes `/healthz`, `POST /wallet/check`, `GET /wallet/criteria`, `GET /wallet/leaderboard`. The wallet routes pull live Base (chainId 8453) data from the free Blockscout V1-compatible API at `https://base.blockscout.com/api` (3 parallel calls: balance, txlist, txlistinternal), compute a 0–1000 composite score and tier (unranked/bronze/silver/gold/platinum/diamond), and apply eligibility rules (contract_count ≥ 5, tx_count ≥ 10, active_months ≥ 3, native_volume_eth ≥ 0.01). Recent checks live in an in-memory ring buffer (no DB).
- `base-wallet-score` (React + Vite, kind=web, preview path `/`) — single-page Base wallet scoring app. Stack: wouter, framer-motion, shadcn/ui, react-hook-form + zod, @workspace/api-client-react hooks. Components: `wallet-form`, `dashboard` (animated CountUp stats + Warpcast share), `criteria-panel`, `activity-feed`, `layout`. Brand: dark navy (#0a0f1e-ish) with Base blue (#0052FF) accents; methodology credit to @nvthaovn in the layout. Forces dark mode; results cached in localStorage for 5 minutes per address.
- `mockup-sandbox` (Vite design surface, kind=design, mounted at `/__mockup`) — Replit-provided component preview server.

## Notes on data source

The Base Wallet Score backend originally targeted Etherscan V2 (`https://api.etherscan.io/v2/api?chainid=8453`) but Etherscan's free plan returns "Free API access is not supported for this chain" for Base. We switched to Blockscout's hosted Base instance, which is free, requires no key, and is Etherscan-API-compatible. The `ETHERSCAN_API_KEY` secret is currently unused but kept for future fallback if a paid plan is added.
