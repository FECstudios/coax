// Yeni oyun turu: kontratı deploy eder, agent/deployment.json yazar. Agent ve sayfalar adresi buradan okur.
import { writeFileSync } from "node:fs";
import { formatEther } from "viem";
import { account, cfg, deployData, DEPLOYMENT_PATH, makeClients, pickScenario, type Deployment } from "./config.ts";

const { chain, publicClient, walletClient } = await makeClients();

if (chain.id !== 10143 && chain.id !== 31337) {
  throw new Error(`Sadece Monad Testnet (10143) veya yerel anvil (31337). Bulunan: ${chain.id}`);
}

const balance = await publicClient.getBalance({ address: account.address });
console.log(`agent ${account.address} bakiye ${formatEther(balance)} MON, chain ${chain.id}`);

const scenario = pickScenario();
const hash = await walletClient.sendTransaction({ data: deployData(scenario), value: cfg.seed });
const receipt = await publicClient.waitForTransactionReceipt({ hash });
if (!receipt.contractAddress) throw new Error("deploy başarısız");

const dep: Deployment = {
  address: receipt.contractAddress,
  deployBlock: receipt.blockNumber.toString(),
  chainId: chain.id,
  promptHash: scenario.hash,
  scenario: scenario.id,
  deployedAt: new Date().toISOString(),
};
writeFileSync(DEPLOYMENT_PATH, JSON.stringify(dep, null, 2) + "\n");
console.log(`KasaKirici ${dep.address} (blok ${dep.deployBlock}), süre ${cfg.durationSec}s, tohum ${formatEther(cfg.seed)} MON`);
console.log(`senaryo ${scenario.id} (${scenario.name}) | promptHash ${scenario.hash}`);
