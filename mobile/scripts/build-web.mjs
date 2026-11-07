// agent/public → www: viem yerelden, /api/* coaxer.xyz'e, native köprü enjekte edilir.
// COAX_FLAVOR=safe: App Store sürümü (ücretli deneme, kasa açma ve cüzdan yok; sadece Pratik + Ajan).
import { build } from "esbuild";
import { cp, readFile, rm, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const here = (p) => fileURLToPath(new URL(p, import.meta.url));
const API = (process.env.COAX_API_URL || "https://coaxer.xyz").replace(/\/$/, "");
const SAFE = process.env.COAX_FLAVOR === "safe";
const OUT = here("../www/");

await rm(OUT, { recursive: true, force: true });
await cp(here("../../agent/public/"), OUT, { recursive: true, filter: (p) => !p.endsWith("screen.html") });

const common = { bundle: true, minify: true, target: "safari15", logLevel: "warning" };
await build({ ...common, entryPoints: [here("../src/viem.js"), here("../src/viem-accounts.js")], format: "esm", splitting: true, outdir: `${OUT}vendor` });
await build({ ...common, entryPoints: [here("../src/native.js")], format: "iife", outfile: `${OUT}native.js`, define: { __COAX_API__: JSON.stringify(API), __COAX_SAFE__: String(SAFE) } });

const CSS = `
header { padding-top: env(safe-area-inset-top); }
nav.tabs { padding-bottom: env(safe-area-inset-bottom); }
body.play { padding-top: calc(18px + env(safe-area-inset-top)); padding-bottom: calc(28px + env(safe-area-inset-bottom)); }
html[data-flavor="safe"] :is(nav.tabs [data-tab="open"], nav.tabs [data-tab="wallet"], #open, #wallet, #balChip, #addrChip, [data-go="open"],
  .modes [data-mode="hard"], .feechip, #assetBal, .steps, .card:has(.wallet-row), #wdbox) { display: none !important; }
html[data-flavor="safe"] nav.tabs, html[data-flavor="safe"] .modes { grid-template-columns: repeat(2, 1fr); }
`;

for (const name of ["index.html", "play.html"]) {
  let s = await readFile(OUT + name, "utf8");
  const sub = (re, to) => {
    if (!re.test(s)) throw new Error(`${name}: ${re} bulunamadı`);
    s = s.replace(new RegExp(re.source, "g"), to);
  };
  sub(/"https:\/\/esm\.sh\/viem@[\d.]+\/accounts"/, `"/vendor/viem-accounts.js"`);
  sub(/"https:\/\/esm\.sh\/viem@[\d.]+"/, `"/vendor/viem.js"`);
  sub(/\blocation\.origin\b/, "COAX_ORIGIN");
  sub(/\blocation\.host\b/, "COAX_HOST");
  sub(/width=device-width, initial-scale=1"/, `width=device-width, initial-scale=1, viewport-fit=cover"`);
  if (s.includes("/qr.svg")) s = s.replace(/(["`])\/qr\.svg/g, `$1${API}/qr.svg`);
  s = s.replace(/location\.protocol === "https:"/g, "true");
  if (name === "play.html") s = s.replace("<body>", `<body class="play">`);
  s = s.replace("</head>", `<style>${CSS}</style>\n<script src="/native.js"></script>\n</head>`);
  await writeFile(OUT + name, s);
}
console.log(`www hazır · ${SAFE ? "App Store (safe)" : "tam"} sürüm · API ${API}`);
