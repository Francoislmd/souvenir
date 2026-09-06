#!/usr/bin/env bash
# Recopie vers Vercel (production) les variables Supabase de .env.local, puis
# redéploie. Écrit le 31/08/2026, après la migration vers un nouveau projet
# Supabase : les valeurs vivent déjà en local, les retaper à la main dans
# l'interface web est long et source d'erreurs.
#
#   bash apps/web/scripts/sync-vercel-env.sh
#
# Rien ne s'affiche à l'écran : les valeurs passent par un tube, pas par
# l'historique du terminal.
set -euo pipefail
# Les variables se lisent dans apps/web/.env.local, mais le déploiement doit
# partir de la RACINE du dépôt : le projet Vercel a "apps/web" en Root
# Directory, donc lancer `vercel --prod` depuis apps/web lui fait chercher
# apps/web/apps/web et échouer.
WEB="$(cd "$(dirname "$0")/.." && pwd)"
RACINE="$(cd "$WEB/../.." && pwd)"
cd "$RACINE"

VARS=(NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY DATABASE_URL DIRECT_URL)

command -v vercel >/dev/null || { echo "La CLI vercel est introuvable. Installe-la (npm i -g vercel) ou remplace 'vercel' par 'npx vercel' dans ce script."; exit 1; }
[ -f "$WEB/.env.local" ] || { echo "apps/web/.env.local introuvable."; exit 1; }

for V in "${VARS[@]}"; do
  VAL=$(grep -E "^$V=" "$WEB/.env.local" | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//')
  if [ -z "$VAL" ] || [[ "$VAL" == *REMPLACER* ]]; then
    echo "✗ $V est vide ou encore à remplacer dans .env.local — j'arrête."
    exit 1
  fi
  vercel env rm "$V" production --yes >/dev/null 2>&1 || true
  printf '%s' "$VAL" | vercel env add "$V" production >/dev/null
  echo "✓ $V (${#VAL} caractères)"
done

echo
echo "Variables à jour. Déploiement en production…"
vercel --prod
