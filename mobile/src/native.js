import { CapacitorHttp } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Clipboard } from "@capacitor/clipboard";
import { Haptics, ImpactStyle } from "@capacitor/haptics";
import { Preferences } from "@capacitor/preferences";
import { Share } from "@capacitor/share";

const API = __COAX_API__;
const SAFE = __COAX_SAFE__;

window.COAX_ORIGIN = API;
window.COAX_HOST = new URL(API).host;

if (SAFE) {
  document.documentElement.dataset.flavor = "safe";
  if (!["practice", "agent"].includes(localStorage.getItem("coax-mode"))) localStorage.setItem("coax-mode", "practice");
  localStorage.setItem("kasa-mode", "burner");
  if (/^#(open|wallet)$/.test(location.hash)) history.replaceState(null, "", location.pathname + location.search);
}

// /api/* sunucuya native HTTP ile gider (WebView'da CORS yok).
const webFetch = window.fetch.bind(window);
const jsonResponse = (body, status = 200) => new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
window.fetch = async (input, init = {}) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
  if (!url.startsWith("/api/")) return webFetch(input, init);
  if (SAFE && url.startsWith("/api/drip")) return jsonResponse({ ok: false, reason: "Bu sürümde kapalı." });
  const r = await CapacitorHttp.request({
    url: API + url,
    method: (init.method || "GET").toUpperCase(),
    headers: { "Content-Type": "application/json" },
    data: init.body ? JSON.parse(init.body) : undefined,
    responseType: "text",
  });
  return jsonResponse(r.data, r.status);
};

const define = (name, value) => Object.defineProperty(navigator, name, { value, configurable: true });
define("vibrate", (ms) => { Haptics.impact({ style: Number(ms) > 20 ? ImpactStyle.Medium : ImpactStyle.Light }).catch(() => {}); return true; });
define("share", (d = {}) => Share.share({ title: d.title, text: d.text, url: d.url }).then(() => {}));
define("clipboard", { writeText: (t) => Clipboard.write({ string: String(t) }) });

document.addEventListener("click", (e) => {
  const a = e.target instanceof Element && e.target.closest("a[href]");
  if (!a || a.target !== "_blank") return;
  const u = new URL(a.href, location.href);
  if (!u.protocol.startsWith("http") || u.host === location.host) return;
  e.preventDefault();
  Browser.open({ url: u.href });
}, true);

// Otomatik cüzdan ve profil localStorage'da; iOS WebView verisini silebilir, Preferences'a da yazılır.
const KEEP = (k) => /^(kasa|coax)-/.test(k);
const setItem = Storage.prototype.setItem;
const removeItem = Storage.prototype.removeItem;
const ready = (async () => {
  const saved = {};
  for (const key of (await Preferences.keys()).keys) saved[key] = (await Preferences.get({ key })).value;
  if (saved["kasa-burner"] && saved["kasa-burner"] !== localStorage.getItem("kasa-burner")) {
    for (const [k, v] of Object.entries(saved)) if (KEEP(k) && v != null) setItem.call(localStorage, k, v);
    location.reload();
    return new Promise(() => {});
  }
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (KEEP(key)) await Preferences.set({ key, value: localStorage.getItem(key) });
  }
})().catch((e) => console.warn("Preferences:", e));
Storage.prototype.setItem = function (k, v) {
  setItem.call(this, k, v);
  if (this === localStorage && KEEP(k)) ready.then(() => Preferences.set({ key: k, value: String(v) }));
};
Storage.prototype.removeItem = function (k) {
  removeItem.call(this, k);
  if (this === localStorage && KEEP(k)) ready.then(() => Preferences.remove({ key: k }));
};
