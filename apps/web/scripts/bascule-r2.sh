#!/usr/bin/env bash
# Bascule du stockage vers Cloudflare R2, de bout en bout, dans le bon ordre.
# Écrit le 21/09/2026. À lancer depuis le Mac, n'importe où dans le dépôt :
#
#   bash apps/web/scripts/bascule-r2.sh
#
# S'arrête à la première erreur. Aucune clé ne s'affiche à l'écran.
# Les buckets, la règle CORS, le domaine media.linktrip.co et l'alerte de
# budget à 1 $ sont déjà en place côté Cloudflare.
set -euo pipefail
WEB="$(cd "$(dirname "$0")/.." && pwd)"
RACINE="$(cd "$WEB/../.." && pwd)"
cd "$RACINE"

etape() { printf '\n\033[1m%s\033[0m\n' "$1"; }
confirmer() { read -r -p "$1 [o/N] " r; [[ "$r" =~ ^[oOyY]$ ]] || { echo "Arrêt demandé."; exit 1; }; }

val() { grep -E "^$1=" "$WEB/.env.local" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'; }
for V in R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_PREVIEWS_PUBLIC_URL; do
  [ -n "$(val $V)" ] || { echo "✗ $V est vide dans apps/web/.env.local"; exit 1; }
done

etape "1/6  Les clés R2 ouvrent bien les deux buckets"
EP="https://$(val R2_ACCOUNT_ID).r2.cloudflarestorage.com"
for B in originals previews; do
  CODE=$(curl -s -o /dev/null -w "%{http_code}" --aws-sigv4 "aws:amz:auto:s3" \
    --user "$(val R2_ACCESS_KEY_ID):$(val R2_SECRET_ACCESS_KEY)" "$EP/$B?list-type=2&max-keys=1")
  if [ "$CODE" = "200" ]; then echo "✓ $B"; else echo "✗ $B répond $CODE : clés fausses, ou pas les droits sur ce bucket."; exit 1; fi
done

etape "2/6  Dépendances (SDK S3) et client Prisma"
pnpm install

etape "3/6  Vérifications"
rm -rf "$WEB/.next/types"
pnpm typecheck
pnpm test

etape "4/6  Base de données : colonnes isVideo, posterKey, durationSec, sizeBytes"
echo "Si Prisma annonce la suppression de ProcessingJob, blurKey, isFreeSample, freeCount : c'est attendu (revue du 12/09)."
pnpm db:push

etape "5/6  Recopie des fichiers de Supabase vers R2"
pnpm --filter @souvenir/web storage:migrate -- --dry-run
confirmer "Lancer la recopie pour de bon ?"
pnpm --filter @souvenir/web storage:migrate

etape "6/6  Variables R2 sur Vercel, puis mise en ligne"
git add pnpm-lock.yaml && git commit -m "Lockfile : SDK S3 pour R2" >/dev/null 2>&1 && echo "✓ lockfile committé" || echo "· lockfile inchangé"
confirmer "Envoyer les variables à Vercel et déployer en production ?"
bash "$WEB/scripts/sync-vercel-env.sh" R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET_ORIGINALS R2_BUCKET_PREVIEWS R2_PREVIEWS_PUBLIC_URL

etape "Terminé. Pense à pousser : git push"
