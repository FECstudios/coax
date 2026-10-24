// AI bekçi sunucusu: zinciri izler → bekçi LLM cevap verir → jev karar verir → verdict tx.
// Aynı süreç oyuncu (/) ve büyük ekran (/screen.html) sayfalarını, musluğu, /api/state'i ve /api/restart'ı sunar.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize } from "node:path";
import QRCode from "qrcode";
import { encodeFunctionData, formatEther, isAddress, type Hex, type TransactionReceipt } from "viem";
import { askGuard, judgeWithJev, pickGuardModel } from "./ai.ts";
import { abi, account, cfg, deployData, DEPLOYMENT_PATH, makeClients, pickScenario, ROOT, scenarioByHash, type Deployment } from "./config.ts";

if (!existsSync(DEPLOYMENT_PATH)) throw new Error("deployment.json yok: önce `npm run deploy`");
const { chain, publicClient, walletClient } = await makeClients();
if (!cfg.mockAi && !cfg.aiKey) throw new Error("HACKCLUB_API_KEY eksik (ya da MOCK_AI=1)");

// ---------- tur durumu (zincirden türetilir; /api/restart yeni Round ile değiştirir) ----------

type Attempt = {
  id: number;
  player: Hex;
  message: string;
  paid: string;
  tx: Hex;
  status: "pending" | "rejected" | "approved" | "skipped";
  reply?: string;
};

type Round = Awaited<ReturnType<typeof loadRound>>;

async function loadRound(dep: Deployment) {
  if (chain.id !== dep.chainId) throw new Error(`RPC chain ${chain.id}, deployment chain ${dep.chainId}`);
  const read = <T>(functionName: string) => publicClient.readContract({ address: dep.address, abi, functionName }) as Promise<T>;
  const [onchainAgent, onchainHash, endTime, fee] = await Promise.all([
    read<Hex>("agent"),
    read<Hex>("promptHash"),
    read<bigint>("endTime"),
    read<bigint>("fee"),
  ]);
  if (onchainAgent.toLowerCase() !== account.address.toLowerCase()) throw new Error("bu anahtar kontratın agent'ı değil");
  const scenario = scenarioByHash(onchainHash);
  if (!scenario) throw new Error("kontrattaki promptHash hiçbir scenarios/*.txt ile uyuşmuyor (dosya değişmiş olabilir) → yeniden deploy");
  const model = await pickGuardModel(dep.address);
  console.log(`kontrat ${dep.address} chain ${chain.id} | senaryo ${scenario.id} | bekçi modeli ${model}${cfg.mockAi ? " (MOCK)" : ""}`);
  console.log(`süre ${Number(endTime) - Number((await publicClient.getBlock()).timestamp)}s kaldı | jev eşiği ${cfg.jevThreshold}`);
  return {
    dep,
    endTime,
    model,
    scenario,
    attempts: new Map<number, Attempt>(),
    game: {
      fee,
      pool: 0n,
      cracked: false,
      winner: null as Hex | null,
      prize: 0n,
      byTimeout: false,
      winningId: null as number | null,
    },
    synced: BigInt(dep.deployBlock) - 1n,
    backfilled: false,
    finishing: false,
    judgeQueue: [] as number[],
    inflight: new Set<number>(),
    activeJudges: 0,
    dripped: new Set<string>(),
  };
}

let R: Round = await loadRound(JSON.parse(readFileSync(DEPLOYMENT_PATH, "utf8")));

// Yerel saate güvenme (bu laptop zincirden 3 saat ileriydi): zaman = zincir saati, 10 sn'de bir düzeltilir.
let clockOffset = 0;
let clockAt = 0;
const chainNow = () => Math.floor(Date.now() / 1000 + clockOffset);
async function syncClock() {
  if (Date.now() - clockAt < 10_000) return;
  const b = await publicClient.getBlock();
  clockOffset = Number(b.timestamp) - Date.now() / 1000;
  clockAt = Date.now();
}

async function sync(r: Round) {
  const head = await publicClient.getBlockNumber({ cacheTime: 0 }); // viem varsayılanı 4s önbellek
  let changed = false;
  while (r.synced < head) {
    const to = r.synced + cfg.logChunk < head ? r.synced + cfg.logChunk : head;
    const logs = await publicClient.getContractEvents({ address: r.dep.address, abi, fromBlock: r.synced + 1n, toBlock: to });
    for (const log of logs) apply(r, log as any);
    changed ||= logs.length > 0;
    r.synced = to;
  }
  if (changed || !r.backfilled) r.game.pool = await publicClient.getBalance({ address: r.dep.address });
  if (!r.backfilled) {
    r.backfilled = true;
    for (const a of r.attempts.values()) if (a.status === "pending") enqueueJudge(r, a.id);
    console.log(`geçmiş tarandı: ${r.attempts.size} deneme`);
  }
}

function apply(r: Round, log: { eventName: string; args: any; transactionHash: Hex }) {
  const a = log.args;
  const g = r.game;
  if (log.eventName === "Attempt") {
    const id = Number(a.id);
    r.attempts.set(id, { id, player: a.player, message: a.message, paid: formatEther(a.paid), tx: log.transactionHash, status: "pending" });
    g.fee = a.newFee;
    console.log(`#${id} ${a.player.slice(0, 8)}: ${a.message.slice(0, 80)}`);
    if (r.backfilled) enqueueJudge(r, id);
  } else if (log.eventName === "Verdict") {
    const at = r.attempts.get(Number(a.id));
    if (!at) return;
    at.status = a.approved ? "approved" : "rejected";
    at.reply = a.reply;
    if (a.approved && !g.cracked && g.winningId === null) g.winningId = at.id;
  } else if (log.eventName === "Cracked") {
    g.cracked = true;
    g.winner = a.winner;
    g.prize = a.prize;
    g.byTimeout = a.byTimeout;
    console.log(`KASA ${a.byTimeout ? "SÜRE DOLDU, havuz bizde" : "KIRILDI"} → ${a.winner} ${formatEther(a.prize)} MON`);
  }
}

// ---------- agent tx kuyruğu: tek sıra, yerel nonce, receipt beklemeden ----------

type Task = {
  prio: number; // küçük önce
  order: number;
  label: string;
  to?: Hex; // yoksa kontrat deploy
  data?: Hex;
  value?: bigint;
  skip?: () => boolean;
  resolve: (hash: Hex | null) => void;
  onReceipt?: (r: TransactionReceipt) => void;
};
const txQueue: Task[] = [];
let txBusy = false;
let nonce: number | undefined;
let fees: { at: number; v: { maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } } | undefined;
let taskOrder = 0;

function sendTx(t: Omit<Task, "resolve">): Promise<Hex | null> {
  return new Promise((resolve) => {
    txQueue.push({ ...t, resolve });
    void pumpTx();
  });
}

async function pumpTx() {
  if (txBusy) return;
  txBusy = true;
  while (txQueue.length) {
    txQueue.sort((a, b) => a.prio - b.prio || a.order - b.order);
    const t = txQueue.shift()!;
    if (t.skip?.()) {
      t.resolve(null);
      continue;
    }
    t.resolve(await sendOne(t));
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
      // Monad gas LİMİTİ üzerinden keser: tahmin ne ise o, şişirme yok.
      const gas = await publicClient.estimateGas({ account, to: t.to, data: t.data, value: t.value });
      const hash = await walletClient.sendTransaction({ to: t.to, data: t.data, value: t.value, gas, nonce, ...fees.v });
      nonce++;
      publicClient
        .waitForTransactionReceipt({ hash })
        .then((r) => {
          if (r.status !== "success") console.warn(`tx revert: ${t.label} ${hash}`);
          t.onReceipt?.(r);
        })
        .catch((e) => console.warn(`receipt yok: ${t.label}`, e.shortMessage ?? e.message));
      return hash;
    } catch (e: any) {
      nonce = undefined;
      const msg = e.shortMessage ?? e.message;
      console.warn(`tx hata (${t.label}, deneme ${i + 1}/3): ${msg}`);
      if (/gecersiz|henuz degil|oyun bitti|bekleme suresi/.test(String(e.message))) return null; // kontrat reddi, tekrar deneme anlamsız
    }
  }
  return null;
}

// ---------- yargılama: LLM'ler paralel, verdict tx'leri sırayla ----------

function enqueueJudge(r: Round, id: number) {
  if (r.inflight.has(id)) return;
  r.inflight.add(id);
  r.judgeQueue.push(id);
  drainJudges(r);
}

function drainJudges(r: Round) {
  while (r.activeJudges < cfg.concurrency && r.judgeQueue.length) {
    const id = r.judgeQueue.shift()!;
    r.activeJudges++;
    judge(r, id)
      .catch((e) => console.error(`#${id} yargılama hatası`, e))
      .finally(() => {
        r.activeJudges--;
        drainJudges(r);
      });
  }
}

async function retry<T>(fn: () => Promise<T>, label: string): Promise<T> {
  for (let i = 0; ; i++) {
    try {
      return await fn();
    } catch (e) {
      if (i >= 2) throw e;
      console.warn(`${label} hata, tekrar (${i + 1}/2): ${(e as Error).message}`);
    }
  }
}

async function judge(r: Round, id: number) {
  const a = r.attempts.get(id)!;
  if (r.game.cracked) return void (a.status = "skipped"); // kasa gitti, gas harcama
  let reply: string;
  let approved = false;
  try {
    reply = await retry(() => askGuard(r.model, r.scenario.text, a.message), `#${id} bekçi`);
    const score = await retry(() => judgeWithJev(a.message, reply), `#${id} jev`);
    approved = score >= cfg.jevThreshold;
    console.log(`#${id} jev=${score.toFixed(3)} ${approved ? "AÇILDI" : "red"} | ${reply.slice(0, 100).replace(/\s+/g, " ")}`);
  } catch (e) {
    console.warn(`#${id} vazgeçildi: ${(e as Error).message}`);
    reply = "Bekçi şu an uyuyor, tekrar dene.";
  }
  reply = [...reply].slice(0, 280).join("");
  await sendTx({
    prio: approved ? 1 : 2,
    order: id,
    label: `verdict #${id}`,
    to: r.dep.address,
    data: encodeFunctionData({ abi, functionName: "verdict", args: [BigInt(id), approved, reply] }),
    skip: () => {
      if (!r.game.cracked) return false;
      if (a.status === "pending") a.status = "skipped";
      return true;
    },
  });
}

// ---------- süre dolunca finish() → havuz agent'a ----------

function maybeFinish(r: Round) {
  if (!r.backfilled || r.game.cracked || r.finishing) return;
  const now = BigInt(chainNow());
  if (now < r.endTime + 2n) return;
  const busy = r.judgeQueue.length > 0 || r.activeJudges > 0 || txQueue.length > 0;
  const allJudged = [...r.attempts.values()].every((a) => a.status !== "pending");
  // Bekleyen yargılar önce (kontrat bize FINISH_GRACE=60s tanıyor); takılırsa 45s sonra yine de bitir.
  if ((busy || !allJudged) && now < r.endTime + 45n) return;
  r.finishing = true;
  void sendTx({
    prio: 0,
    order: taskOrder++,
    label: "finish",
    to: r.dep.address,
    data: encodeFunctionData({ abi, functionName: "finish" }),
    onReceipt: (rc) => rc.status !== "success" && (r.finishing = false),
  }).then((h) => h || (r.finishing = false));
}

// ---------- yeni tur (restart) ----------

let restarting = false;
async function restart(): Promise<{ ok: boolean; reason?: string; contract?: Hex }> {
  if (restarting) return { ok: false, reason: "zaten başlatılıyor" };
  if (!R.game.cracked) return { ok: false, reason: "tur henüz bitmedi" };
  restarting = true;
  try {
    let receipt: TransactionReceipt | undefined;
    const scenario = pickScenario();
    const hash = await sendTx({ prio: 0, order: taskOrder++, label: `yeni tur deploy (${scenario.id})`, data: deployData(scenario), value: cfg.seed });
    if (hash) receipt = await publicClient.waitForTransactionReceipt({ hash });
    if (!receipt?.contractAddress || receipt.status !== "success") return { ok: false, reason: "deploy başarısız" };
    const dep: Deployment = {
      address: receipt.contractAddress,
      deployBlock: receipt.blockNumber.toString(),
      chainId: chain.id,
      promptHash: scenario.hash,
      scenario: scenario.id,
      deployedAt: new Date().toISOString(),
    };
    writeFileSync(DEPLOYMENT_PATH, JSON.stringify(dep, null, 2) + "\n");
    R = await loadRound(dep);
    return { ok: true, contract: dep.address };
  } finally {
    restarting = false;
  }
}

// ---------- musluk ----------

async function drip(address: string): Promise<{ ok: boolean; reason?: string; hash?: Hex }> {
  const r = R;
  if (cfg.drip === 0n) return { ok: false, reason: "musluk kapalı" };
  if (!isAddress(address)) return { ok: false, reason: "geçersiz adres" };
  const key = address.toLowerCase();
  if (r.dripped.has(key)) return { ok: false, reason: "bu tur zaten aldın" };
  if (r.dripped.size >= cfg.dripMax) return { ok: false, reason: "musluk kurudu" };
  const bal = await publicClient.getBalance({ address });
  if (bal >= cfg.drip / 2n) return { ok: false, reason: "bakiyen yeterli" };
  r.dripped.add(key);
  const hash = await sendTx({ prio: 1, order: taskOrder++, label: `drip ${key.slice(0, 8)}`, to: address, value: cfg.drip });
  if (!hash) r.dripped.delete(key);
  return hash ? { ok: true, hash } : { ok: false, reason: "gönderilemedi" };
}

// ---------- HTTP ----------

const PUBLIC_DIR = join(ROOT, "public");
const MIME: Record<string, string> = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css" };

function state() {
  const r = R;
  const g = r.game;
  return {
    contract: r.dep.address,
    chainId: chain.id,
    rpcUrl: cfg.publicRpcUrl,
    explorerTx: cfg.explorerTx,
    promptHash: r.scenario.hash,
    scenario: { id: r.scenario.id, name: r.scenario.name, tagline: r.scenario.tagline }, // sayfalar tur başında gösterir
    endTime: Number(r.endTime),
    now: chainNow(), // sayfalar geri sayımı bununla yapar, kendi saatleriyle değil
    fee: g.fee.toString(),
    pool: g.pool.toString(),
    total: r.attempts.size,
    cracked: g.cracked,
    byTimeout: g.byTimeout,
    winner: g.winner,
    prize: g.prize.toString(),
    winningId: g.winningId,
    model: g.cracked ? r.model : null, // model tur bitince açıklanır
    restarting,
    attempts: [...r.attempts.values()].reverse().slice(0, 150),
  };
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? "/", "http://x");
  const json = (code: number, body: unknown) => {
    res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" });
    res.end(JSON.stringify(body));
  };
  try {
    if (url.pathname === "/api/state") return json(200, state());
    if (url.pathname === "/api/drip" && req.method === "POST") {
      let body = "";
      for await (const chunk of req) body += chunk;
      return json(200, await drip(String(JSON.parse(body || "{}").address ?? "")));
    }
    if (url.pathname === "/api/restart" && req.method === "POST") return json(200, await restart());
    if (url.pathname === "/qr.svg") {
      const target = cfg.publicUrl ?? `http://${req.headers.host}/`;
      res.writeHead(200, { "Content-Type": "image/svg+xml" });
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
});
server.listen(cfg.port, () => console.log(`http://localhost:${cfg.port}  (büyük ekran: /screen.html)`));

// ---------- döngü ----------

for (;;) {
  const r = R;
  try {
    await syncClock();
    await sync(r);
    maybeFinish(r);
  } catch (e: any) {
    console.warn("sync hata:", e.shortMessage ?? e.message);
  }
  await new Promise((res) => setTimeout(res, 500));
}
