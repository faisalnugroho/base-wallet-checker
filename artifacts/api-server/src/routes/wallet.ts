import { Router, type IRouter, type Request, type Response } from "express";
import {
  CheckWalletBody,
  CheckWalletResponse,
  GetEligibilityCriteriaResponse,
  GetRecentChecksQueryParams,
  GetRecentChecksResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const BLOCKSCOUT_BASE = "https://base.blockscout.com/api";

const ELIGIBILITY = {
  contract_count: 5,
  tx_count: 10,
  active_months: 3,
  native_volume_eth: 0.01,
} as const;

interface EtherscanTx {
  hash?: string;
  timeStamp?: string;
  from?: string;
  to?: string;
  value?: string;
  gasUsed?: string;
  gasPrice?: string;
  isError?: string;
  input?: string;
}

interface RecentCheckRecord {
  address: string;
  score: number;
  tier: string;
  eligible: boolean;
  checked_at: string;
}

const recentChecks: RecentCheckRecord[] = [];
const RECENT_LIMIT = 50;

function recordCheck(c: RecentCheckRecord) {
  recentChecks.unshift(c);
  if (recentChecks.length > RECENT_LIMIT) recentChecks.length = RECENT_LIMIT;
}

const isValidAddress = (a: string) => /^0x[a-fA-F0-9]{40}$/.test(a.trim());

async function blockscoutCall(
  params: Record<string, string>,
): Promise<unknown> {
  const url = new URL(BLOCKSCOUT_BASE);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Blockscout HTTP ${res.status}`);
  const data = (await res.json()) as {
    status?: string;
    message?: string;
    result?: unknown;
  };

  if (data.status === "0") {
    if (
      typeof data.result === "string" &&
      /rate limit|max rate/i.test(data.result)
    ) {
      throw new Error(`RATE_LIMIT: ${data.result}`);
    }
    if (data.message === "No transactions found") return [];
    if (Array.isArray(data.result)) return data.result;
  }
  return data.result;
}

function computeTier(score: number): RecentCheckRecord["tier"] {
  if (score >= 900) return "diamond";
  if (score >= 750) return "platinum";
  if (score >= 550) return "gold";
  if (score >= 350) return "silver";
  if (score >= 150) return "bronze";
  return "unranked";
}

function computeScore(stats: {
  tx_count: number;
  contract_count: number;
  active_months: number;
  active_days: number;
  native_volume_eth: number;
  gasfee_eth: number;
}): number {
  const cap = (n: number, max: number) => Math.min(n / max, 1);
  const txScore = cap(stats.tx_count, 200) * 220;
  const contractScore = cap(stats.contract_count, 30) * 220;
  const monthsScore = cap(stats.active_months, 12) * 200;
  const daysScore = cap(stats.active_days, 120) * 140;
  const volumeScore = cap(stats.native_volume_eth, 5) * 140;
  const gasScore = cap(stats.gasfee_eth, 0.5) * 80;
  const total = Math.round(
    txScore +
      contractScore +
      monthsScore +
      daysScore +
      volumeScore +
      gasScore,
  );
  return Math.max(0, Math.min(1000, total));
}

router.post("/wallet/check", async (req: Request, res: Response) => {
  const parsed = CheckWalletBody.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Invalid request body" });
  }
  const address = parsed.data.address.trim().toLowerCase();
  if (!isValidAddress(address)) {
    return res
      .status(400)
      .json({ error: "Invalid address. Must be 0x + 40 hex chars." });
  }

  try {
    const [balanceRes, txsRes, internalRes] = await Promise.all([
      blockscoutCall({
        module: "account",
        action: "balance",
        address,
        tag: "latest",
      }),
      blockscoutCall({
        module: "account",
        action: "txlist",
        address,
        startblock: "0",
        endblock: "99999999",
        sort: "asc",
      }),
      blockscoutCall({
        module: "account",
        action: "txlistinternal",
        address,
        sort: "asc",
      }),
    ]);

    const balanceWei =
      typeof balanceRes === "string" || typeof balanceRes === "number"
        ? String(balanceRes)
        : "0";
    const txs: EtherscanTx[] = Array.isArray(txsRes)
      ? (txsRes as EtherscanTx[])
      : [];
    const internal: EtherscanTx[] = Array.isArray(internalRes)
      ? (internalRes as EtherscanTx[])
      : [];

    const successful = txs.filter((t) => t.isError === "0");

    const contractSet = new Set<string>();
    for (const t of successful) {
      if (t.input && t.input !== "0x" && t.to) {
        contractSet.add(t.to.toLowerCase());
      }
    }

    const allTimestamped = [...txs, ...internal];
    const monthsSet = new Set<string>();
    const daysSet = new Set<string>();
    for (const t of allTimestamped) {
      const ts = parseInt(t.timeStamp ?? "", 10);
      if (!Number.isFinite(ts)) continue;
      const d = new Date(ts * 1000);
      const y = d.getUTCFullYear();
      const m = String(d.getUTCMonth() + 1).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      monthsSet.add(`${y}-${m}`);
      daysSet.add(`${y}-${m}-${day}`);
    }

    let nativeVolumeEth = 0;
    let gasFeeEth = 0;
    for (const t of successful) {
      if (t.from?.toLowerCase() === address) {
        const v = Number(t.value ?? "0") / 1e18;
        if (Number.isFinite(v)) nativeVolumeEth += v;
      }
      const fee =
        (Number(t.gasUsed ?? "0") * Number(t.gasPrice ?? "0")) / 1e18;
      if (Number.isFinite(fee)) gasFeeEth += fee;
    }

    const firstTx = txs[0];
    const lastTx = txs[txs.length - 1];
    const firstActivity = firstTx?.timeStamp
      ? new Date(parseInt(firstTx.timeStamp, 10) * 1000).toISOString()
      : null;
    const lastActivity = lastTx?.timeStamp
      ? new Date(parseInt(lastTx.timeStamp, 10) * 1000).toISOString()
      : null;

    const tx_count = successful.length;
    const contract_count = contractSet.size;
    const active_months = monthsSet.size;
    const active_days = daysSet.size;
    const balanceNum = Number(balanceWei);
    const current_balance_eth = Number.isFinite(balanceNum)
      ? balanceNum / 1e18
      : 0;

    const eligible =
      contract_count >= ELIGIBILITY.contract_count &&
      tx_count >= ELIGIBILITY.tx_count &&
      active_months >= ELIGIBILITY.active_months &&
      nativeVolumeEth >= ELIGIBILITY.native_volume_eth;

    const score = computeScore({
      tx_count,
      contract_count,
      active_months,
      active_days,
      native_volume_eth: nativeVolumeEth,
      gasfee_eth: gasFeeEth,
    });
    const tier = computeTier(score);

    const payload = {
      address,
      eligible,
      tx_count,
      contract_count,
      active_months,
      active_days,
      native_volume_eth: nativeVolumeEth,
      gasfee_eth: gasFeeEth,
      current_balance_eth,
      first_activity: firstActivity,
      last_activity: lastActivity,
      score,
      tier,
    };

    const validated = CheckWalletResponse.parse(payload);

    recordCheck({
      address,
      score: validated.score,
      tier: validated.tier,
      eligible: validated.eligible,
      checked_at: new Date().toISOString(),
    });

    return res.json(validated);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    req.log.error({ err: msg, address }, "wallet check failed");
    if (msg.startsWith("RATE_LIMIT")) {
      return res
        .status(429)
        .json({ error: "Rate limited by Base explorer. Try again shortly." });
    }
    return res
      .status(500)
      .json({ error: `Failed to fetch wallet data: ${msg}` });
  }
});

router.get("/wallet/criteria", (_req, res) => {
  const data = GetEligibilityCriteriaResponse.parse(ELIGIBILITY);
  res.json(data);
});

router.get("/wallet/leaderboard", (req, res) => {
  const parsed = GetRecentChecksQueryParams.safeParse(req.query);
  const limit = parsed.success ? parsed.data.limit : 10;
  const items = recentChecks.slice(0, limit);
  const data = GetRecentChecksResponse.parse({ items });
  res.json(data);
});

export default router;
