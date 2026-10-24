import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { createPublicClient, createWalletClient, defineChain, encodeDeployData, http, keccak256, parseEther, parseUnits, zeroAddress, type Hex } from "viem";
import { privateKeyToAccount } from "viem/accounts";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
if (existsSync(join(ROOT, ".env"))) process.loadEnvFile(join(ROOT, ".env"));

const env = (name: string, fallback?: string): string => {
  const v = process.env[name] || fallback; // boş değer = ayarlanmamış
  if (v === undefined || v === "") throw new Error(`${name} eksik (.env)`);
  return v;
};

export const cfg = {
  rpcUrl: env("RPC_URL", "https://testnet-rpc.monad.xyz"),
  // Telefonların kullanacağı RPC (sunucu özel bir RPC kullanıyorsa bile oyuncular public olanı kullanabilir)
  publicRpcUrl: env("PUBLIC_RPC_URL", process.env.RPC_URL || "https://testnet-rpc.monad.xyz"),
  explorerTx: env("EXPLORER_TX_URL", "https://testnet.monadvision.com/tx/"),
  privateKey: env("AGENT_PRIVATE_KEY") as Hex,

  aiBase: env("AI_BASE_URL", "https://ai.hackclub.com/proxy/v1"),
  aiKey: process.env.HACKCLUB_API_KEY ?? "",
  mockAi: process.env.MOCK_AI === "1",
  mockLatencyMs: Number(env("MOCK_LATENCY_MS", "0")),
  guardModel: process.env.GUARD_MODEL || undefined, // boşsa zayıf model havuzundan seçilir
  temperature: Number(env("GUARD_TEMPERATURE", "0.7")),
  jevModel: env("JEV_MODEL", "jev-latest"),
  jevThreshold: Number(env("JEV_THRESHOLD", "0.8")),
  concurrency: Number(env("LLM_CONCURRENCY", "8")),

  // deploy
  durationSec: BigInt(Math.min(365 * 86400, Math.max(600, Number(env("DURATION_SEC", "600"))))),
  initialFee: parseEther(env("INITIAL_FEE_MON", "0.1")),
  growthBps: BigInt(env("GROWTH_BPS", "500")),
  seed: parseEther(env("SEED_MON", "1")),

  // musluk: burner cüzdanlara ilk girişte MON
  drip: parseEther(env("DRIP_MON", "2")),
  dripMax: Number(env("DRIP_MAX_WALLETS", "200")),

  port: Number(env("PORT", "3000")),
  publicUrl: process.env.PUBLIC_URL || undefined,
  logChunk: BigInt(env("LOG_CHUNK", "100")),
};

export const SCENARIOS_DIR = join(ROOT, "scenarios");
export const DEPLOYMENT_PATH = process.env.DEPLOYMENT_FILE || join(ROOT, "deployment.json"); // yerel testler canlı turu ezmesin diye
const ARTIFACT_PATH = join(ROOT, "..", "contracts", "out", "KasaKirici.sol", "KasaKirici.json");

/// Senaryolar: scenarios/<id>.txt = bekçinin sistem promptu, scenarios/index.json = ad ve slogan.
/// Kontrata yazılan hash ile LLM'e giden prompt aynı dosya byte'larından gelir; agent turun
/// senaryosunu zincirdeki promptHash'ten bulur.
export type Scenario = { id: string; name: string; tagline: string; text: string; hash: Hex };
const scenarioMeta = JSON.parse(readFileSync(join(SCENARIOS_DIR, "index.json"), "utf8")) as Record<string, { name: string; tagline: string }>;
export const scenarios: Scenario[] = Object.entries(scenarioMeta).map(([id, meta]) => {
  const bytes = readFileSync(join(SCENARIOS_DIR, `${id}.txt`));
  return { id, ...meta, text: bytes.toString("utf8"), hash: keccak256(bytes) };
});
export const scenarioByHash = (hash: Hex) => scenarios.find((s) => s.hash.toLowerCase() === hash.toLowerCase());

/// Yeni tur için senaryo: SCENARIO ile sabitlenebilir, yoksa rastgele (hash deploy'da zincire yazılır).
export function pickScenario(): Scenario {
  const fixed = process.env.SCENARIO;
  if (fixed) {
    const s = scenarios.find((x) => x.id === fixed);
    if (!s) throw new Error(`SCENARIO=${fixed} yok. Var olanlar: ${scenarios.map((x) => x.id).join(", ")}`);
    return s;
  }
  return scenarios[Math.floor(Math.random() * scenarios.length)];
}

export const artifact = JSON.parse(readFileSync(ARTIFACT_PATH, "utf8")) as {
  abi: any[];
  bytecode: { object: Hex };
};
export const abi = artifact.abi;

export const account = privateKeyToAccount(cfg.privateKey);

export async function makeClients() {
  const probe = createPublicClient({ transport: http(cfg.rpcUrl) });
  const chainId = await probe.getChainId();
  const chain = defineChain({
    id: chainId,
    name: chainId === 10143 ? "Monad Testnet" : `chain-${chainId}`,
    nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 },
    rpcUrls: { default: { http: [cfg.rpcUrl] } },
  });
  const publicClient = createPublicClient({ chain, transport: http(cfg.rpcUrl) });
  const walletClient = createWalletClient({ chain, account, transport: http(cfg.rpcUrl) });
  return { chain, publicClient, walletClient };
}

/// Yeni tur kontratının deploy verisi (CLI deploy ve /api/restart aynı argümanları kullanır).
export const deployData = (scenario: Scenario) =>
  encodeDeployData({
    abi,
    bytecode: artifact.bytecode.object,
    args: [account.address, scenario.hash, cfg.durationSec, cfg.initialFee, cfg.growthBps],
  });

export type Deployment = { address: Hex; deployBlock: string; chainId: number; promptHash: Hex; scenario?: string; deployedAt: string };

// ---------- Coaxer: çoklu kasa kontratı ----------
export const COAX_PATH = process.env.COAX_FILE || join(ROOT, "coax.json");
const coaxArtifact = JSON.parse(readFileSync(join(ROOT, "..", "contracts", "out", "CoaxVaults.sol", "CoaxVaults.json"), "utf8")) as { abi: any[]; bytecode: { object: Hex } };
export const coaxAbi = coaxArtifact.abi;

/// Kasa varlıkları: MON (native) + testnette resmi olarak bulunan ERC-20'ler.
/// Adresler .env ile override edilebilir; ana chain'e geçerken mutlaka değiştir.
export type TokenCfg = {
  symbol: string;
  address: Hex;
  decimals: number;
  deposits: bigint[];
  fees: bigint[];
};

/// Seviye sayısı sabit 5: env ile TIER1_... TIER5_... override edilebilir.
const LEVELS = 5;
const levels = (base: string, defaults: string[], decimals: number): bigint[] =>
  Array.from({ length: LEVELS }, (_, i) => parseUnits(env(`${base}_${i + 1}`, defaults[i]), decimals));

const tokenCfg = (symbol: string, address: Hex, decimals: number, key: string, defaults: { deposits: string[]; fees: string[] }): TokenCfg => ({
  symbol,
  address,
  decimals,
  deposits: levels(`TIER_DEPOSIT_${key}`, defaults.deposits, decimals),
  fees: levels(`TIER_FEE_${key}`, defaults.fees, decimals),
});

export const tokens: TokenCfg[] = [
  tokenCfg("MON", zeroAddress, 18, "MON", {
    deposits: ["0.5", "1", "2", "5", "10"],
    fees: ["0.01", "0.02", "0.04", "0.08", "0.15"],
  }),
  tokenCfg("USDC", env("USDC_ADDRESS", "0x534b2f3A21130d7a60830c2Df862319e593943A3") as Hex, 6, "USDC", {
    deposits: ["1", "2", "5", "10", "25"],
    fees: ["0.02", "0.04", "0.08", "0.15", "0.3"],
  }),
  tokenCfg("WETH", env("WETH_ADDRESS", "0x45477f4709771331db81944A5E20eF95Bc7BA2D7") as Hex, 18, "WETH", {
    deposits: ["0.0005", "0.001", "0.002", "0.005", "0.01"],
    fees: ["0.00001", "0.00002", "0.00004", "0.00008", "0.00015"],
  }),
  tokenCfg("WMON", env("WMON_ADDRESS", "0xFb8bf4c1CC7a94c73D209a149eA2AbEa852BC541") as Hex, 18, "WMON", {
    deposits: ["0.5", "1", "2", "5", "10"],
    fees: ["0.01", "0.02", "0.04", "0.08", "0.15"],
  }),
];
export const tokenByAddress = (a: string) => tokens.find((t) => t.address.toLowerCase() === a.toLowerCase());

export const coaxCfg = {
  // MON için eski env isimleri korunuyor; tüm varlıklar `tokens` içinde.
  deposits: tokens[0].deposits,
  fees: tokens[0].fees,
  tokens,
  liveTier: Number(env("LIVE_TIER", "1")),
  tier2Model: env("TIER2_MODEL", "google/gemma-3-12b-it"),
};
export const coaxDeployData = () =>
  encodeDeployData({
    abi: coaxAbi,
    bytecode: coaxArtifact.bytecode.object,
    args: [
      account.address,
      tokens.map((t) => t.address),
      tokens.flatMap((t) => t.deposits),
      tokens.flatMap((t) => t.fees),
      scenarios.map((s) => s.hash),
    ],
  });
export type CoaxDeployment = { address: Hex; deployBlock: string; chainId: number; deployedAt: string };
