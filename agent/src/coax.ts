// Coaxer sunucusu: CoaxVaults kontratındaki tüm kasaları izler → Yakışıklı Güvenlik (LLM) cevap verir →
// jev karar verir → verdict tx. Süresi dolan kasaları settle eder. Canlı tur = agent'ın açtığı kasa.
// Sayfalar: / (Keşfet, Kasa aç, Cüzdan), /play.html?v=ID (oyun), /screen.html (büyük ekran).
import { existsSync, readFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import QRCode from "qrcode";
import { encodeFunctionData, formatUnits, isAddress, keccak256, toHex, type Hex, type TransactionReceipt } from "viem";
import { askGuard, judgeWithJev, pickGuardModel } from "./ai.ts";
import { account, cfg, COAX_PATH, coaxAbi as abi, coaxCfg, makeClients, ROOT, scenarioByHash, scenarios, tokenByAddress, tokens, type CoaxDeployment } from "./config.ts";

if (!existsSync(COAX_PATH)) throw new Error("coax.json yok: önce `node src/coax-deploy.ts`");
const dep: CoaxDeployment = JSON.parse(readFileSync(COAX_PATH, "utf8"));
const { chain, publicClient, walletClient } = await makeClients();
if (chain.id !== dep.chainId) throw new Error("chain uyuşmuyor");
if (!cfg.mockAi && !cfg.aiKey) throw new Error("HACKCLUB_API_KEY eksik (ya da MOCK_AI=1)");
console.log(`CoaxVaults ${dep.address} chain ${chain.id}`);

type Attempt = { id: number; vault: number; player: Hex; message: string; paid: bigint; tx: Hex; block: number; status: "pending" | "rejected" | "approved" | "skipped"; reply?: string };
type Vault = {
  id: number; host: Hex; tier: number; endsAt: number; promptHash: Hex; deposit: bigint; pool: bigint; attempts: number[]; asset: Hex;
  settled: boolean; winner: Hex | null; byTimeout: boolean; prize: bigint; winningId: number | null; model?: string; openedBlock: number; openedTx: Hex; endTx?: Hex; endBlock?: number;
};
const vaults = new Map<number, Vault>();
const attempts = new Map<number, Attempt>();
const tokenOf = (asset: string) => tokenByAddress(asset) ?? tokens[0];
const fee = (asset: string, tier: number) => tokenOf(asset).fees[tier - 1] ?? 0n;
const fmt = (asset: string, raw: bigint, digits = 2) => Number(formatUnits(raw, tokenOf(asset).decimals)).toFixed(digits);
const assetMeta = (asset: string) => { const t = tokenOf(asset); return { asset: t.address, assetSymbol: t.symbol, assetDecimals: t.decimals }; };

// ---------- zaman: yerel saate güvenme, zincir saati ----------
let clockOffset = 0, clockAt = 0;
const chainNow = () => Math.floor(Date.now() / 1000 + clockOffset);
async function syncClock() {
  if (Date.now() - clockAt < 10_000) return;
  const b = await publicClient.getBlock();
  clockOffset = Number(b.timestamp) - Date.now() / 1000;
  clockAt = Date.now();
}
const blockTime = new Map<number, number>();
async function timeOf(block: number) {
  if (!blockTime.has(block)) blockTime.set(block, Number((await publicClient.getBlock({ blockNumber: BigInt(block) })).timestamp));
  return blockTime.get(block)!;
}

// ---------- zincir senkronu ----------
let synced = BigInt(dep.deployBlock) - 1n;
let backfilled = false;
async function sync() {
  const head = await publicClient.getBlockNumber({ cacheTime: 0 });
  while (synced < head) {
    const to = synced + cfg.logChunk < head ? synced + cfg.logChunk : head;
    const logs = await publicClient.getContractEvents({ address: dep.address, abi, fromBlock: synced + 1n, toBlock: to });
    for (const log of logs) await apply(log as any);
    synced = to;
  }
  if (!backfilled) {
    backfilled = true;
    for (const a of attempts.values()) if (a.status === "pending") enqueueJudge(a.id);
    console.log(`geçmiş: ${vaults.size} kasa, ${attempts.size} deneme`);
  }
}

async function apply(log: { eventName: string; args: any; transactionHash: Hex; blockNumber: bigint }) {
  const a = log.args, block = Number(log.blockNumber);
  if (log.eventName === "VaultOpened") {
    const id = Number(a.id);
    vaults.set(id, { id, host: a.host, tier: Number(a.tier), endsAt: Number(a.endsAt), promptHash: a.promptHash, deposit: a.deposit, pool: a.deposit, attempts: [], asset: a.asset, settled: false, winner: null, byTimeout: false, prize: 0n, winningId: null, openedBlock: block, openedTx: log.transactionHash });
    await timeOf(block);
    console.log(`kasa #${id} açıldı (${scenarioByHash(a.promptHash)?.id}, seviye ${a.tier}, ${tokenOf(a.asset).symbol}) host ${a.host.slice(0, 8)}`);
  } else if (log.eventName === "Attempted") {
    const id = Number(a.attemptId), v = vaults.get(Number(a.id));
    if (!v) return;
    attempts.set(id, { id, vault: v.id, player: a.player, message: a.message, paid: a.fee, tx: log.transactionHash, block, status: "pending" });
    v.attempts.push(id);
    v.pool += a.fee - (a.fee * 500n) / 10_000n;
    await timeOf(block);
    console.log(`#${v.id}/${id} ${a.player.slice(0, 8)}: ${a.message.slice(0, 80)}`);
    if (backfilled) enqueueJudge(id);
  } else if (log.eventName === "Verdict") {
    const at = attempts.get(Number(a.attemptId));
    if (!at) return;
    at.status = a.opened ? "approved" : "rejected";
    at.reply = a.reply;
  } else if (log.eventName === "Cracked" || log.eventName === "Settled") {
    const v = vaults.get(Number(a.id));
    if (!v) return;
    v.settled = true;
    v.prize = a.amount;
    v.pool = 0n;
    v.endTx = log.transactionHash;
    v.endBlock = block;
    await timeOf(block);
    if (log.eventName === "Cracked") {
      v.winner = a.winner;
      v.winningId = [...v.attempts].reverse().find((i) => attempts.get(i)?.status === "approved") ?? null;
    } else {
      v.byTimeout = true;
      v.winner = a.host;
    }
    for (const i of v.attempts) { const t = attempts.get(i)!; if (t.status === "pending") t.status = "skipped"; }
    console.log(`kasa #${v.id} ${log.eventName === "Cracked" ? "KIRILDI" : "dayandı"} → ${fmt(v.asset, a.amount, 4)} ${tokenOf(v.asset).symbol}`);
  }
}

// ---------- agent tx kuyruğu (tek sıra, yerel nonce) ----------
type Task = { prio: number; order: number; label: string; to?: Hex; data?: Hex; value?: bigint; skip?: () => boolean; resolve: (h: Hex | null) => void };
const txQueue: Task[] = [];
let txBusy = false, nonce: number | undefined, taskOrder = 0;
let fees: { at: number; v: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } } | undefined;
const sendTx = (t: Omit<Task, "resolve">) => new Promise<Hex | null>((resolve) => { txQueue.push({ ...t, resolve }); void pumpTx(); });
async function pumpTx() {
  if (txBusy) return;
  txBusy = true;
  while (txQueue.length) {
    txQueue.sort((a, b) => a.prio - b.prio || a.order - b.order);
    const t = txQueue.shift()!;
    t.resolve(t.skip?.() ? null : await sendOne(t));
  }
  txBusy = false;
}
async function sendOne(t: Task): Promise<Hex | null> {
  for (let i = 0; i < 3; i++) {
    try {
      nonce ??= await publicClient.getTransactionCount({ address: account.address, blockTag: "pending" });
      if (!fees || Date.now() - fees.at > 5000) {
        const v = await publicClient.estimateFeesPerGas();
        fees = { at: Date.now(), v: { maxFeePerGas: v.maxFeePerGas!, maxPriorityFeePerGas: v.maxPriorityFeePerGas! } };
      }
      const gas = await publicClient.estimateGas({ account, to: t.to, data: t.data, value: t.value }); // Monad: limit üzerinden keser
      const hash = await walletClient.sendTransaction({ to: t.to, data: t.data, value: t.value, gas, nonce, ...fees.v });
      nonce++;
      return hash;
    } catch (e: any) {
      nonce = undefined;
      console.warn(`tx hata (${t.label} ${i + 1}/3): ${e.shortMessage ?? e.message}`);
      if (/gecersiz|henuz degil|kasa kapali|bekleme suresi/.test(String(e.message))) return null;
    }
  }
  return null;
}

// ---------- yargılama: LLM paralel, verdict sırayla ----------
const judgeQueue: number[] = [], inflight = new Set<number>();
let activeJudges = 0;
function enqueueJudge(id: number) {
  if (inflight.has(id)) return;
  inflight.add(id);
  judgeQueue.push(id);
  drainJudges();
}
function drainJudges() {
  while (activeJudges < cfg.concurrency && judgeQueue.length) {
    const id = judgeQueue.shift()!;
    activeJudges++;
    judge(id).catch((e) => console.error(`#${id} hata`, e)).finally(() => { activeJudges--; drainJudges(); });
  }
}
async function retry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let i = 0; ; i++) {
    try { return await fn(); } catch (e) { if (i >= 2) throw e; console.warn(`${label} tekrar: ${(e as Error).message}`); }
  }
}
async function modelFor(v: Vault) {
  // Yüksek seviye sabit, güçlü sayılan model; orta seviye rastgele zayıf model (kasa başına sabit)
  v.model ??= v.tier === 2 ? coaxCfg.tier2Model : await pickGuardModel(keccak256(toHex(`${dep.address}:${v.id}`)));
  return v.model;
}
async function judge(id: number) {
  const a = attempts.get(id)!, v = vaults.get(a.vault)!;
  if (v.settled) return void (a.status = "skipped");
  const scenario = scenarioByHash(v.promptHash);
  let reply: string, opened = false;
  try {
    if (!scenario) throw new Error("bilinmeyen prompt");
    const model = await modelFor(v);
    reply = await retry(() => askGuard(model, scenario.text, a.message), `#${id} model`);
    const score = await retry(() => judgeWithJev(a.message, reply), `#${id} jev`);
    opened = score >= cfg.jevThreshold;
    console.log(`#${v.id}/${id} jev=${score.toFixed(3)} ${opened ? "AÇILDI" : "red"} | ${reply.slice(0, 90).replace(/\s+/g, " ")}`);
  } catch (e) {
    console.warn(`#${id} vazgeçildi: ${(e as Error).message}`);
    reply = "Yakışıklı Güvenlik şu an aynaya bakıyor, tekrar dene.";
  }
  reply = [...reply].slice(0, 280).join("");
  await sendTx({
    prio: opened ? 1 : 2, order: id, label: `verdict #${id}`, to: dep.address,
    data: encodeFunctionData({ abi, functionName: "verdict", args: [BigInt(id), opened, reply] }),
    skip: () => v.settled,
  });
}

// ---------- süresi dolan kasaları sonuçlandır ----------
const settling = new Set<number>();
function maybeSettle() {
  if (!backfilled) return;
  const now = chainNow();
  for (const v of vaults.values()) {
    if (v.settled || settling.has(v.id) || now < v.endsAt + 2) continue;
    const pending = v.attempts.some((i) => attempts.get(i)?.status === "pending");
    if (pending && now < v.endsAt + 45) continue; // bekleyen yargılar önce (kontrat 60 sn tanıyor)
    settling.add(v.id);
    void sendTx({ prio: 0, order: taskOrder++, label: `settle #${v.id}`, to: dep.address, data: encodeFunctionData({ abi, functionName: "settle", args: [BigInt(v.id)] }) })
      .then((h) => h ? setTimeout(() => settling.delete(v.id), 15_000) : settling.delete(v.id));
  }
}

// ---------- canlı tur: agent'ın açtığı kasa ----------
const liveId = () => [...vaults.values()].filter((v) => v.host.toLowerCase() === account.address.toLowerCase()).at(-1)?.id ?? null;
let restarting = false;
async function restart() {
  const cur = liveId();
  if (restarting) return { ok: false, reason: "zaten başlatılıyor" };
  if (cur !== null && !vaults.get(cur)!.settled) return { ok: false, reason: "tur henüz bitmedi" };
  restarting = true;
  try {
    const s = scenarios[Math.floor(Math.random() * scenarios.length)];
    const hash = await sendTx({
      prio: 0, order: taskOrder++, label: `canlı tur (${s.id})`, to: dep.address, value: coaxCfg.deposits[coaxCfg.liveTier - 1],
      data: encodeFunctionData({ abi, functionName: "openVault", args: [tokens[0].address, coaxCfg.liveTier, BigInt(cfg.durationSec), s.hash] }),
    });
    if (!hash) return { ok: false, reason: "işlem gönderilemedi" };
    await publicClient.waitForTransactionReceipt({ hash });
    for (let i = 0; i < 20 && liveId() === cur; i++) await new Promise((r) => setTimeout(r, 500));
    return { ok: true };
  } finally {
    restarting = false;
  }
}

// ---------- musluk ----------
const dripped = new Set<string>();
async function drip(address: string) {
  if (cfg.drip === 0n) return { ok: false, reason: "musluk kapalı" };
  if (!isAddress(address)) return { ok: false, reason: "geçersiz adres" };
  const key = address.toLowerCase();
  if (dripped.has(key)) return { ok: false, reason: "zaten aldın" };
  if (dripped.size >= cfg.dripMax) return { ok: false, reason: "musluk kurudu" };
  if ((await publicClient.getBalance({ address })) >= cfg.drip / 2n) return { ok: false, reason: "bakiyen yeterli" };
  dripped.add(key);
  const hash = await sendTx({ prio: 1, order: taskOrder++, label: `drip ${key.slice(0, 8)}`, to: address, value: cfg.drip });
  if (!hash) dripped.delete(key);
  return hash ? { ok: true, hash } : { ok: false, reason: "gönderilemedi" };
}

// ---------- API ----------
const common = () => ({
  contract: dep.address, chainId: chain.id, rpcUrl: cfg.publicRpcUrl, explorerTx: cfg.explorerTx, now: chainNow(),
  assets: tokens.map((t) => ({
    address: t.address, symbol: t.symbol, decimals: t.decimals,
    tiers: { 1: { deposit: t.deposits[0].toString(), fee: t.fees[0].toString() }, 2: { deposit: t.deposits[1].toString(), fee: t.fees[1].toString() } },
  })),
});
const scen = (h: Hex) => { const s = scenarioByHash(h); return s ? { id: s.id, name: s.name, tagline: s.tagline } : null; };
function vaultSummary(v: Vault) {
  return {
    id: v.id, host: v.host, tier: v.tier, endsAt: v.endsAt, scenario: scen(v.promptHash), promptHash: v.promptHash,
    ...assetMeta(v.asset),
    deposit: v.deposit.toString(), pool: v.pool.toString(), fee: fee(v.asset, v.tier).toString(), attempts: v.attempts.length,
    settled: v.settled, winner: v.winner, byTimeout: v.byTimeout, prize: v.prize.toString(), live: v.host.toLowerCase() === account.address.toLowerCase(),
    openedAt: blockTime.get(v.openedBlock) ?? null, openedTx: v.openedTx, endTx: v.endTx ?? null,
  };
}
function vaultsApi() {
  const now = chainNow(), day = now - 86400;
  const list = [...vaults.values()].reverse();
  const recent = list.filter((v) => v.settled && v.endBlock).sort((a, b) => b.endBlock! - a.endBlock!).slice(0, 15)
    .map((v) => ({ vault: v.id, kind: v.byTimeout ? "held" : "cracked", who: v.winner, ...assetMeta(v.asset), amount: v.prize.toString(), time: blockTime.get(v.endBlock!) ?? null, tx: v.endTx }));
  const tvl: Record<string, string> = {};
  for (const t of tokens) tvl[t.symbol] = list.filter((v) => !v.settled && v.asset.toLowerCase() === t.address.toLowerCase()).reduce((s, v) => s + v.pool, 0n).toString();
  return {
    ...common(), liveId: liveId(),
    tiers: { 1: { deposit: coaxCfg.deposits[0].toString(), fee: coaxCfg.fees[0].toString() }, 2: { deposit: coaxCfg.deposits[1].toString(), fee: coaxCfg.fees[1].toString() } },
    scenarios: scenarios.map((s) => ({ id: s.id, name: s.name, tagline: s.tagline, hash: s.hash })),
    stats: {
      tvl,
      active: list.filter((v) => !v.settled && v.endsAt > now).length,
      attempts24h: [...attempts.values()].filter((a) => (blockTime.get(a.block) ?? 0) > day).length,
      cracked24h: list.filter((v) => v.settled && !v.byTimeout && (blockTime.get(v.endBlock!) ?? 0) > day).length,
    },
    vaults: list.slice(0, 100).map(vaultSummary),
    events: recent,
  };
}
function stateApi(id: number | null) {
  const v = id === null ? null : vaults.get(id);
  if (!v) return { ...common(), vaultId: null, restarting };
  return {
    ...common(), vaultId: v.id, host: v.host, tier: v.tier, scenario: scen(v.promptHash), promptHash: v.promptHash,
    ...assetMeta(v.asset), native: v.asset === tokens[0].address,
    endTime: v.endsAt, fee: fee(v.asset, v.tier).toString(), pool: (v.settled ? v.prize : v.pool).toString(), total: v.attempts.length,
    cracked: v.settled, byTimeout: v.byTimeout, winner: v.winner, prize: v.prize.toString(), winningId: v.winningId,
    model: v.settled ? v.model ?? null : null, restarting, live: v.host.toLowerCase() === account.address.toLowerCase(),
    attempts: [...v.attempts].reverse().slice(0, 150).map((i) => attempts.get(i)!),
  };
}
function accountApi(addr: string) {
  const me = addr.toLowerCase(), rows: any[] = [];
  const zero = () => Object.fromEntries(tokens.map((t) => [t.symbol, "0"]));
  if (!isAddress(addr)) return { ...common(), locked: zero(), history: [], hosted: [], myAttempts: [], hostEarnings: zero(), hostedSettled: 0, hostedHeld: 0 };
  const myAttempts = [...attempts.values()].filter((a) => a.player.toLowerCase() === me)
    .sort((a, b) => (blockTime.get(b.block) ?? 0) - (blockTime.get(a.block) ?? 0))
    .map((a) => {
      const v = vaults.get(a.vault);
      return { ...a, ...assetMeta(v?.asset ?? tokens[0].address), time: blockTime.get(a.block) ?? null, vaultPrize: v?.prize.toString() ?? "0" };
    });
  for (const a of myAttempts) rows.push({ kind: "attempt", vault: a.vault, ...assetMeta(a.asset), amount: `-${fmt(a.asset, a.paid, 6)}`, status: a.status, time: a.time, tx: a.tx });
  const hosted = [...vaults.values()].filter((v) => v.host.toLowerCase() === me).reverse();
  const hostEarnings = zero();
  let hostedSettled = 0, hostedHeld = 0;
  for (const v of hosted) {
    if (v.settled) {
      hostedSettled++;
      if (v.byTimeout) {
        hostedHeld++;
        const sym = tokenOf(v.asset).symbol;
        hostEarnings[sym] = (BigInt(hostEarnings[sym]) + v.prize).toString();
      }
    }
  }
  for (const v of vaults.values()) {
    if (v.host.toLowerCase() === me) rows.push({ kind: "deposit", vault: v.id, ...assetMeta(v.asset), amount: `-${fmt(v.asset, v.deposit, 6)}`, status: v.settled ? "done" : "locked", time: blockTime.get(v.openedBlock) ?? null, tx: v.openedTx });
    if (v.settled && v.winner?.toLowerCase() === me && v.endTx) rows.push({ kind: v.byTimeout ? "hostReturn" : "prize", vault: v.id, ...assetMeta(v.asset), amount: `+${fmt(v.asset, v.prize, 6)}`, status: "done", time: blockTime.get(v.endBlock!) ?? null, tx: v.endTx });
  }
  rows.sort((a, b) => (b.time ?? 0) - (a.time ?? 0));
  const locked = zero();
  for (const v of hosted) if (!v.settled) { const sym = tokenOf(v.asset).symbol; locked[sym] = (BigInt(locked[sym]) + v.pool).toString(); }
  return {
    ...common(), locked, history: rows.slice(0, 200), hosted: hosted.map(vaultSummary),
    myAttempts: myAttempts.slice(0, 200).map(({ id, vault, message, reply, status, time, tx, paid, vaultPrize, asset, assetSymbol, assetDecimals }) => ({ id, vault, message, reply: reply ?? null, status, time, tx, paid, vaultPrize, asset, assetSymbol, assetDecimals })),
    hostEarnings, hostedSettled, hostedHeld,
  };
}

function leaderboardApi() {
  type Row = { address: string; attempts: number; cracked: number; prizes: Record<string, bigint>; hosted: number; held: number };
  const map = new Map<string, Row>();
  const get = (a: string) => {
    const k = a.toLowerCase();
    if (!map.has(k)) map.set(k, { address: k, attempts: 0, cracked: 0, prizes: Object.fromEntries(tokens.map((t) => [t.symbol, 0n])), hosted: 0, held: 0 });
    return map.get(k)!;
  };
  for (const a of attempts.values()) {
    const r = get(a.player);
    r.attempts++;
    if (a.status === "approved") r.cracked++;
  }
  for (const v of vaults.values()) {
    const h = get(v.host);
    h.hosted++;
    if (v.settled && v.byTimeout) h.held++;
    if (v.settled && v.winner && !v.byTimeout) { const sym = tokenOf(v.asset).symbol; get(v.winner).prizes[sym] += v.prize; }
  }
  return {
    ...common(),
    top: [...map.values()].sort((a, b) => b.cracked - a.cracked || b.attempts - a.attempts).slice(0, 20)
      .map((r) => ({ address: r.address, attempts: r.attempts, cracked: r.cracked, prizes: Object.fromEntries(Object.entries(r.prizes).map(([k, v]) => [k, v.toString()])), hosted: r.hosted, held: r.held })),
  };
}

// Pratik modu: ücretsiz, zincire yazılmaz. Mesaj aynı bekçiye gider, jev kararı döner.
const practiceHits = new Map<string, { n: number; at: number }>();
async function practice(vaultId: number, message: string, ip: string) {
  if (!Number.isInteger(vaultId)) return { ok: false, reason: "geçersiz kasa" };
  const v = vaults.get(vaultId);
  if (!v) return { ok: false, reason: "kasa bulunamadı" };
  const msg = message.trim();
  const len = Buffer.byteLength(msg, "utf8");
  if (!len || len > 500) return { ok: false, reason: "mesaj 1-500 byte olmalı" };
  const now = Date.now(), hit = practiceHits.get(ip);
  if (hit && now - hit.at < 60_000 && hit.n >= 6) return { ok: false, reason: "dakikada en fazla 6 pratik denemesi" };
  practiceHits.set(ip, !hit || now - hit.at >= 60_000 ? { n: 1, at: now } : { n: hit.n + 1, at: hit.at });
  const scenario = scenarioByHash(v.promptHash);
  if (!scenario) return { ok: false, reason: "bilinmeyen prompt" };
  const model = await modelFor(v);
  const reply = await askGuard(model, scenario.text, msg);
  const score = await judgeWithJev(msg, reply);
  return { ok: true, reply: [...reply].slice(0, 280).join(""), opened: score >= cfg.jevThreshold, score, model, free: true };
}

const PUBLIC_DIR = join(ROOT, "public");
const MIME: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };
createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  const json = (code: number, body: unknown) => { res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(body, (_, x) => (typeof x === "bigint" ? x.toString() : x))); };
  try {
    if (url.pathname === "/api/vaults") return json(200, vaultsApi());
    if (url.pathname === "/api/state") { const v = url.searchParams.get("v"); return json(200, stateApi(v === null || v === "" ? liveId() : Number(v))); }
    if (url.pathname === "/api/account") return json(200, accountApi(String(url.searchParams.get("a") ?? "")));
    if (url.pathname === "/api/leaderboard") return json(200, leaderboardApi());
    if (url.pathname === "/api/drip" && req.method === "POST") {
      let body = "";
      for await (const c of req) body += c;
      return json(200, await drip(String(JSON.parse(body || "{}").address ?? "")));
    }
    if (url.pathname === "/api/practice" && req.method === "POST") {
      let body = "";
      for await (const c of req) body += c;
      const b = JSON.parse(body || "{}");
      const ip = String(req.headers["x-forwarded-for"] ?? req.socket.remoteAddress ?? "?").split(",")[0].trim();
      try { return json(200, await practice(Number(b.vault), String(b.message ?? ""), ip)); }
      catch (e) { return json(200, { ok: false, reason: (e as Error).message }); }
    }
    if (url.pathname === "/api/restart" && req.method === "POST") return json(200, await restart());
    if (url.pathname === "/qr.svg") {
      const base = cfg.publicUrl ?? `http://${req.headers.host}/`;
      const text = url.searchParams.get("text");
      const target = text && text.length <= 300 ? text : new URL(`play.html?v=${liveId() ?? ""}`, base).toString();
      res.writeHead(200, { "Content-Type": "image/svg+xml", "Cache-Control": "no-store" });
      return res.end(await QRCode.toString(target, { type: "svg", margin: 1 }));
    }
    const file = normalize(join(PUBLIC_DIR, url.pathname === "/" ? "index.html" : url.pathname));
    if (!file.startsWith(PUBLIC_DIR) || !existsSync(file)) return json(404, { error: "yok" });
    res.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  } catch (e) {
    console.error(e);
    json(500, { error: (e as Error).message });
  }
}).listen(cfg.port, () => console.log(`http://localhost:${cfg.port}`));

for (;;) {
  try {
    await syncClock();
    await sync();
    maybeSettle();
  } catch (e: any) {
    console.warn("sync hata:", e.shortMessage ?? e.message);
  }
  await new Promise((r) => setTimeout(r, 500));
}
