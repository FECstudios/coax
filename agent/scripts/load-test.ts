// Yerel yük testi: N burner cüzdan musluktan MON alır, aynı anda deneme gönderir.
// Kullanım: node scripts/load-test.ts [N=15] [http://localhost:3000]
import { createPublicClient, createWalletClient, defineChain, http, parseAbi } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";

const N = Number(process.argv[2] ?? 15);
const BASE = process.argv[3] ?? "http://localhost:3000";
const S = await (await fetch(`${BASE}/api/state`)).json();
const chain = defineChain({ id: S.chainId, name: "x", nativeCurrency: { name: "MON", symbol: "MON", decimals: 18 }, rpcUrls: { default: { http: [S.rpcUrl] } } });
const pub = createPublicClient({ chain, transport: http() });
const abi = parseAbi(["function attempt(string message) payable returns (uint256)", "function fee() view returns (uint256)"]);

const players = Array.from({ length: N }, () => privateKeyToAccount(generatePrivateKey()));
const t0 = Date.now();
const drips = await Promise.all(
  players.map(async (p) => (await fetch(`${BASE}/api/drip`, { method: "POST", body: JSON.stringify({ address: p.address }) })).json()),
);
console.log(`musluk: ${drips.filter((d) => d.ok).length}/${N} ok (${Date.now() - t0} ms)`, drips.find((d) => !d.ok) ?? "");
await Promise.all(drips.filter((d) => d.ok).map((d) => pub.waitForTransactionReceipt({ hash: d.hash })));

const t1 = Date.now();
const results = await Promise.allSettled(
  players.map(async (p, i) => {
    const wallet = createWalletClient({ chain, account: p, transport: http() });
    const fee = await pub.readContract({ address: S.contract, abi, functionName: "fee" });
    return wallet.writeContract({ address: S.contract, abi, functionName: "attempt", args: [`yük testi ${i}`], value: fee * 3n });
  }),
);
console.log(`denemeler: ${results.filter((r) => r.status === "fulfilled").length}/${N} gönderildi (${Date.now() - t1} ms)`);
for (const r of results) if (r.status === "rejected") console.log("  ", (r.reason as any).shortMessage);

for (;;) {
  const s = await (await fetch(`${BASE}/api/state`)).json();
  const pending = s.attempts.filter((a: any) => a.status === "pending").length;
  if (s.total >= N && !pending) {
    console.log(`hepsi yargılandı: ${Date.now() - t1} ms, toplam ${s.total}`);
    break;
  }
  await new Promise((r) => setTimeout(r, 200));
}
