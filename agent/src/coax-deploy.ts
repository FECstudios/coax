// Coaxer çoklu kasa kontratını bir kez deploy eder → agent/coax.json. Kasaları sonra herkes açar.
import { writeFileSync } from "node:fs";
import { formatEther } from "viem";
import { account, COAX_PATH, coaxDeployData, makeClients, type CoaxDeployment } from "./config.ts";

const { chain, publicClient, walletClient } = await makeClients();
if (chain.id !== 10143 && chain.id !== 31337) throw new Error(`Sadece Monad Testnet / anvil. Bulunan: ${chain.id}`);
console.log(`agent ${account.address} bakiye ${formatEther(await publicClient.getBalance({ address: account.address }))} MON`);
const hash = await walletClient.sendTransaction({ data: coaxDeployData() });
const r = await publicClient.waitForTransactionReceipt({ hash });
if (!r.contractAddress) throw new Error("deploy başarısız");
const dep: CoaxDeployment = { address: r.contractAddress, deployBlock: r.blockNumber.toString(), chainId: chain.id, deployedAt: new Date().toISOString() };
writeFileSync(COAX_PATH, JSON.stringify(dep, null, 2) + "\n");
console.log(`CoaxVaults ${dep.address} (blok ${dep.deployBlock})`);
