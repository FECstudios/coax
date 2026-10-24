#!/usr/bin/env bash
# Laptop'taki agent kodunu ve sayfalarını Hack Club Nest'e gönderir, servisi yeniden başlatır.
# Sunucunun kendi .env'i (PUBLIC_URL farklı) ve deployment.json'u (Yeni tur butonu yazar) EZİLMEZ.
# Kullanım: agent/scripts/push-nest.sh
set -euo pipefail
cd "$(dirname "$0")/../.."
HOST="${NEST_HOST:-kuzey@hackclub.app}"
tar -czf - \
  --exclude='agent/node_modules' --exclude='agent/.env' --exclude='agent/deployment.json' \
  agent contracts/out/KasaKirici.sol/KasaKirici.json 2>/dev/null \
  | ssh -o BatchMode=yes "$HOST" 'tar -xzmf - -C /root/kasa && cd /root/kasa/agent && npm ci --silent && systemctl restart kasa.service && sleep 3 && systemctl is-active kasa.service'
