# Coaxer iOS (Capacitor)

`agent/public` oyuncu sayfalarını (Keşfet/Profil + oyun) iOS uygulaması olarak paketler. Sunucu kodu değişmez: uygulama `/api/*` isteklerini native HTTP ile `https://coaxer.xyz`'e yollar.

`scripts/build-web.mjs`, `agent/public` → `www`: viem'i yerel paketler (esm.sh yok), `native.js` köprüsünü enjekte eder (haptik, paylaş, pano, dış linkler Safari görünümünde, otomatik cüzdan anahtarı Preferences'a da yazılır). `screen.html` uygulamada yok.

## Sürümler

| Komut | Sürüm | Kimin için |
|---|---|---|
| `npm run sync` | Tam: Pratik + Zor + Ajan, kasa aç, cüzdan | TestFlight (iç test) |
| `npm run sync:safe` | App Store: sadece Pratik + Ajan; ücretli deneme, kasa açma, cüzdan ve musluk yok | App Store incelemesi |

`COAX_API_URL=http://192.168.x.x:3000 npm run sync` ile yerel agent'a bağlanır.

## Derleme (macOS, Xcode 26+)

```sh
cd mobile
npm install
npm run sync        # ya da sync:safe
npm run open        # Xcode → Signing & Capabilities'te Team seç → Run
```

Simülatör, komut satırı:

```sh
xcodebuild -project ios/App/App.xcodeproj -scheme App -sdk iphonesimulator -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath ios/DerivedData build
```

İkon/splash `assets/`'ten üretilir: `npm run assets`. Bundle ID `xyz.coaxer.app` (`capacitor.config.json` + Xcode).
