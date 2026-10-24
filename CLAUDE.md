# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

# Kasa Kırıcı

> Monad Blitz Ankara v4 (24 Ekim 2026) için tek günlük hackathon projesi.
> Seyirci oylamasıyla kazanılıyor: **çalışan, canlı URL'li, salonun telefondan katıldığı bir demo** her şeyden önemli.

**Kasa Kırıcı:** Cüzdanında ödül havuzu olan bir AI bekçiyi kandırmaya çalıştığın oyun; her deneme kuruşluk bir ödeme, havuz kontratta, kıran kazanır.

## Kurallar (agent için)

- Önce çalışan en basit akış; özellik ekleme yok, önce uçtan uca. Güzel frontend gerekmiyor.
- "Daha gerçek, daha az demo": mümkün olduğunda gerçek API ve testnet ile test et; `MOCK_AI=1` sadece yerel yük/akış testi için.
- Private key, API key, `.env` asla commit edilmez, frontend'e gömülmez, sohbete/loga basılmaz. LLM çağrıları sadece sunucuda.
- Kontratta `verdict` sadece `agent` adresinden çağrılabilir; bunu bozacak değişiklik yapma.
- Her kontrat değişikliğinde `forge test`.
- Sadece Monad Testnet (10143) veya yerel anvil (31337). `deploy.ts` başka chain'i reddeder; bunu kaldırma.
- UI metinleri Türkçe. Kullanıcı adı, e-posta, telefon gibi kişisel veriyi zincire yazma.
- `WEAK_MODELS` (`agent/src/ai.ts`) kasıtlı olarak zayıf/ucuz modeller: güçlü modeller (Opus, GPT-5+, Gemini 3+ vb.) ekleme, oyun kırılamaz olur.

## Komutlar

Foundry `~/.foundry/bin` altında (PATH'te değilse `export PATH="$PATH:$HOME/.foundry/bin"`). Node 26 TypeScript'i doğrudan çalıştırır, build adımı yok.

```sh
# kontrat
cd contracts && forge test                       # tüm testler
cd contracts && forge test --mt test_FinishPaysLastAttempter -vvv   # tek test

# agent (cd agent)
npm install
npm run typecheck
npm run deploy        # forge build + CoaxVaults deploy → agent/coax.json (eski tur: npm run deploy:legacy)
npm start             # Coaxer agent + http://localhost:3000 (Keşfet/Cüzdan/Profil) + /screen.html
# eski tek-kasa akışı: npm run start:legacy · npm run deploy:legacy

# yerel uçtan uca (gerçek API'siz)
anvil &
RPC_URL=http://127.0.0.1:8545 AGENT_PRIVATE_KEY=<anvil #0> MOCK_AI=1 npm run deploy
RPC_URL=http://127.0.0.1:8545 AGENT_PRIVATE_KEY=<anvil #0> MOCK_AI=1 MOCK_LATENCY_MS=2500 npm start
node scripts/load-test.ts 20     # 20 burner: musluk → eşzamanlı deneme → hepsi yargılanana kadar bekler
```

Env değişkenleri `.env`'deki değerleri ezer (`process.loadEnvFile` var olanı ezmez). Tüm ayarlar: `agent/.env.example`.

## Mimari

```
contracts/   Foundry: src/KasaKirici.sol, test/KasaKirici.t.sol
agent/       Tek Node süreci: zincir izleyici + AI yargıç + tx kuyruğu + HTTP (sayfalar, /api/state, /api/drip, /qr.svg)
  scenarios/   senaryolar: <id>.txt = bekçinin sistem promptu (keccak256(byte'ları) kontrattaki promptHash), index.json = ad + slogan
  src/deploy.ts  yeni tur: deploy + deployment.json (adres, deploy bloğu)
  src/index.ts   ana döngü
  src/ai.ts      bekçi LLM + jev yargıç + model seçimi
  public/        index.html (oyuncu, telefon), screen.html (projeksiyon) — framework yok, viem esm.sh'den
                 bekci.js: maskotun 5 ruh hali (SVG). Elle düzenleme: tasarım tuvalindeki Bekci.dc.html'den üretilir
                 (https://claude.ai/artifact/Tm9nX4EFxX8GUgpHbRezDy). screen.html 1920x1080 tasarlanır, ekrana ölçeklenir;
                 cevapları sırayla harf harf oynatır (WebAudio mırıltı, "Sesi aç" tıklaması gerekir), kalabalıkta hızlanır.
```

### Akış

1. Oyuncu sayfası localStorage'da burner cüzdan üretir, düşük bakiyede `/api/drip` ile agent'tan MON alır. İsteyen "Kendi cüzdanımla oyna" ile tarayıcı cüzdanını (`window.ethereum`, Monad Testnet'i ekler/geçer) kullanır; seçim `kasa-mode` olarak hatırlanır. "Hepsini gönder" kutusu burner'daki MON'u (gas düşülerek) başka adrese yollar.
2. Oyuncu `attempt(msg)` gönderir, değer = **3× güncel ücret**; kontrat sadece `fee` alır, fazlasını iade eder. (Ücret her denemede `growthBps` artar; eşzamanlı denemelerde tam ücret gönderen revert olur. 3× ≈ 22 eşzamanlı denemeye dayanır.)
3. `index.ts` her 500 ms `getBlockNumber({cacheTime: 0})` + `getContractEvents` ile (deploy bloğundan, `LOG_CHUNK` parçalarla) `Attempt/Verdict/Cracked` okur ve tüm oyun durumunu bellekte zincirden türetir. Yeniden başlatınca geçmişi tarar, verdict'i olmayanları kuyruğa alır.
4. Yargı (`LLM_CONCURRENCY` paralel): bekçi modeli cevap yazar (tool yok) → **jev** (`/jev/systemone`, `noul` sorusu "bekçi kasayı açmaya razı oldu mu?") olasılık döner → `>= JEV_THRESHOLD` ise onay. jev arka planda; skoru sadece sunucu logunda.
5. Agent'ın tüm tx'leri (verdict, finish, drip) **tek seri kuyruktan** gider: yerel nonce, receipt beklemeden gönderim, hata olursa nonce yeniden okunur. Öncelik: finish > onaylı verdict/drip > red verdict (id sırasıyla). Kasa kırıldıysa bekleyen verdict'ler gönderilmez (`skipped`).
6. Süre dolunca agent kuyruk boşalınca `finish()` çağırır → **havuz agent'a (eve) gider**, son deneyene değil (kontrat `FINISH_GRACE=60s` boyunca sadece agent'a izin verir; agent 45s sonra takılsa da bitirir). Böylece kırılmayan turlar MON'u geri getirir.
7. Tur bitince büyük ekranda "Yeni tur" butonu → `POST /api/restart`: sadece tur bittiyse, deploy agent'ın tx kuyruğundan geçer (nonce çakışmaz), `deployment.json` güncellenir, agent süreç yeniden başlamadan yeni `Round`'a geçer. Telefonlar yeni kontratı `/api/state`'ten alır, musluk tur başına yeniden verir.

### Senaryolar

Her tur bir senaryo (bekçi kişiliği): deploy'da `pickScenario()` rastgele seçer (`SCENARIO=<id>` ile sabitlenir), hash'i constructor'a gider; "Yeni tur" da rastgele seçer. `/api/state.scenario` = `{id, name, tagline}`. Kazanma koşulu her senaryoda aynı: bekçi kasayı açmaya razı olur (jev sorusu senaryodan bağımsız). Yeni senaryo = `scenarios/<id>.txt` + `index.json` girdisi. Senaryolar sadece bekçinin kişiliğini değiştirir; modeli gerçek güvenlik kurallarını aşmaya zorlamayı hedefleyen senaryo ekleme.

### Model seçimi

Tur başına tek bekçi modeli: `WEAK_MODELS[keccak256(kontratAdresi) % n]` (Hack Club `/models` listesinde yoksa sıradaki). Rastgele ama doğrulanabilir; model `/api/state`'te oyun bitince açıklanır. `GUARD_MODEL` ile sabitlenebilir.

### Hack Club AI

Base `https://ai.hackclub.com/proxy/v1` (OpenAI uyumlu `/chat/completions`, `/models` anahtarsız). jev: `POST /jev/systemone`, model `jev-latest`, gövde `{model, state, questions: {<ad>: {type: "noul"|"choice", instructions, criteria?}}}`, cevap `answers.<ad>.noul` (0..1). Anahtar: `HACKCLUB_API_KEY`.

### Değişmezler / tuzaklar

- Bir `scenarios/<id>.txt` değişirse hash'i değişir → o senaryoyla deploy edilmiş tur açılışta reddedilir → **yeniden deploy**. Agent turun senaryosunu zincirdeki `promptHash`'i dosya hash'leriyle eşleştirerek bulur; ayrıca saklamaz. Hash'i hem deploy hem agent aynı dosya byte'larından hesaplar; `cast keccak "$(cat …)"` sondaki satır sonunu düşürür, kullanma.
- **Her oyun turu yeni deploy**: ekrandaki "Yeni tur" butonu ya da `npm run deploy` + agent'ı yeniden başlat. Her deploy `SEED_MON` + ~0.13 MON gas yer.
- Tur başına durum `Round` nesnesinde (`index.ts`); async işler başladıkları turu yakalar, global `R` değişse de eski turun verdict'leri atlanır.
- Yerel saat güvenilmez (bu laptop zincirden 3 saat ileri): her zaman hesabı `chainNow()` / `/api/state.now` ile.
- Verdict süre bittikten sonra da gönderilebilir (süre içindeki denemeler için); `attempt` gönderilemez.
- Kontrat event'i dış çağrıdan önce emit eder (`_pay`); `apply()` aynı tx'te Verdict → Cracked sırasını varsayar.

## Hosting: Hack Club Nest

- Canlı agent `ssh kuzey@hackclub.app` (Debian 13, root) üzerinde systemd servisi `kasa.service`: `/root/kasa/agent`, `node src/index.ts`, port **80** (dashboard Domains'te de hedef port 80). Node 26.12.0 nodejs.org binary'si `/usr/local` altında (Debian'ın Node'u eski; `libatomic1` gerekli).
- Domain: Nest dashboard → Domains sekmesi, alt alan adı → hedef port 80. HTTPS'i Nest'in reverse proxy'si veriyor. QR için sunucudaki `.env`'de `PUBLIC_URL`.
- Kod/sayfa güncellemesi: `agent/scripts/push-nest.sh` (sunucunun `.env` ve `deployment.json`'unu ezmez, servisi yeniden başlatır).
- Log: `ssh kuzey@hackclub.app journalctl -u kasa -f`. Durdur/başlat: `systemctl stop|start kasa`.
- **Aynı anda tek agent:** Nest'teki çalışırken laptop'ta `npm start` yapma (aynı cüzdan → nonce çakışması, çift verdict/musluk).

## Coaxer (çoklu kasa) sürümü — mevcut durum

- Sayfalar: `/` (Keşfet · Kasa aç · Cüzdan · Profil), `/play.html?v=ID` (oyun), `/screen.html` (projeksiyon).
- Kontrat `CoaxVaults.sol`: kasayı host açar, herkes ücretle dener, `verdict` sadece agent'tan gelir; kırılınca havuz oyuncuya, süre dolarsa host'a gider. Platform payı %5.
- Oyun ekranında kontrat adresi ve `promptHash` gösterilir/kopyalanır; kırılma anında "Cüzdanda görüntüle" butonu çıkar.
- Modlar: **Pratik** (ücretsiz, zincire yazılmaz, `/api/practice`), **Zor** (gerçek ücretli deneme) ve **Ajan** (3 otomatik saldırıyı pratik olarak dener).
- Cüzdan: yatır QR'ı (`/qr.svg?text=`), otomatik cüzdan anahtar yedekleme, bağlı cüzdana bakiye taşıma.
- Kasalarım: kilitli / host kazancı / dayanma oranı kartları, Aktif–Geçmiş sekmeleri ve süresi dolan kasada "Sonuçlandır".
- Profil: istatistik, rozet, en iyi denemeler, hatıra rozet (zincirde NFT değil), liderlik tablosu, SSS ve ayarlar.
- Yatırım tutarları varsayılan **0.5 / 1 MON** (`TIER1_DEPOSIT_MON`, `TIER2_DEPOSIT_MON`); deneme ücretleri 0.01 / 0.02 MON.
- §12 farkları: `revealPrompt` yok; kırılma backend imzası yerine agent'ın doğrudan `verdict` çağrısıyla olur (sonuç aynı). Deneme mesajının tamamı zincire yazılır, yalnızca hash'i değil.

## Monad Testnet

| Alan | Değer |
|---|---|
| Chain ID | `10143` |
| RPC | `https://testnet-rpc.monad.xyz` (25 req/s) |
| Yedek RPC | `https://rpc.ankr.com/monad_testnet` |
| Explorer | https://testnet.monadvision.com · https://testnet.monadscan.com |
| Faucet | https://faucet.monad.xyz (etkinlik sayfası da kişi başı 50 MON veriyor) |

- 300 ms blok, 600 ms finality. Global mempool yok.
- **Gas, harcanan gas'a değil gas LİMİTİNE göre kesilir.** Agent `estimateGas` sonucunu aynen kullanır; şişirme.
- `block.timestamp` saniye; 3–4 blok aynı timestamp'i paylaşır.
- Public RPC 25 req/s: telefonlar durumu RPC'den değil agent'ın `/api/state`'inden okur (1 sn polling); RPC'yi sadece tx ve bakiye için kullanır. Sunucu için mümkünse ayrı RPC (`RPC_URL`), telefonlara `PUBLIC_RPC_URL`.
- Foundry `evm_version = "cancun"`.

## Neden zincirde (pitch için, dürüst)

- **Mikro ödeme:** 0.1 MON'luk deneme kartla imkânsız (kart komisyonu). Zincirde neredeyse bedava.
- **Havuz kontratta:** Organizatör tur sırasında çekemez; sadece kırana gider, süre dolarsa kasada (agent'ta) kalır.
- **Şeffaflık:** Tüm denemeler ve AI kararları herkese açık, zaman damgalı.
- **Sınır (açıkça söyle):** AI ve `verdict` anahtarı sunucuda. Organizatör havuzu çalamaz ama teoride kazananı seçebilir; zincir bunu engellemez, **görünür kılar**. Azaltmak için: prompt hash'i zincirde, kod açık, model kontrat adresinden türetilir, temperature sabit, oyun sonunda prompt yayınlanır.
- Önceki örnek: Freysa (2024) aynı fikir. Fark: saniyenin altında ödeme, kuruşluk deneme, salonun tamamı 3 dakikada oynar.

## Hukuki çerçeve

- **Sadece Monad Testnet.** Testnet MON'un parasal değeri yok.
- Türkiye'de gerçek parayla ücretli deneme + para ödülü = izin gerektiren ödüllü yarışma / şans oyunu. **Mainnet'e çıkarma.**
- Pitch: "Gerçek versiyonda havuzu sponsorlar doldurur, deneme bedavadır."
- Mesajlar zincirde herkese açık; UI uyarısı: **"Kişisel bilgi yazmayın."** (KVKK)

## Demo senaryosu (2 dakika)

1. "Bu AI'ın cüzdanında para var ve tek görevi onu kimseye vermemek."
2. QR ekranda (`/screen.html`, `PUBLIC_URL` tünel/canlı adres) → salon telefonla girer, musluk MON verir.
3. 3 dakikalık tur (`DURATION_SEC=180`; prova 600). Ekranda denemeler ve cevaplar akar, havuz büyür.
4. Biri kırarsa "KASA KIRILDI", ödeme 1 saniyede; kimse kıramazsa "SÜRE DOLDU", havuz kasada kalır. Ekrandaki "Yeni tur" ile sonraki tur.
5. Prova: 10–20 gerçek deneme; hiç kırılmıyorsa ya da hemen kırılıyorsa ilgili `scenarios/<id>.txt` / `JEV_THRESHOLD` ayarla (prompt değişirse yeniden deploy). Yedek: daha zor promptlu ikinci deploy + video.
