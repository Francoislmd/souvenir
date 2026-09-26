#!/usr/bin/env bash
# Recopie vers Vercel (production) les variables de .env.local, puis redéploie.
#
#   bash apps/web/scripts/sync-vercel-env.sh                 # tout
#   bash apps/web/scripts/sync-vercel-env.sh STRIPE_SECRET_KEY STRIPE_WEBHOOK_SECRET
#
# Sans argument : toutes les variables de l'app (Supabase, Stripe, Twilio,
# Resend, R2, cron, Sentry, GTM). Avec des noms : seulement celles-là
# (utilisé par set-stripe-keys.sh).
#
# Deux variables ne viennent PAS de .env.local : les adresses publiques. En
# local, NEXT_PUBLIC_APP_URL pointe sur localhost ou un tunnel, et
# NEXT_PUBLIC_STORE_URL est vide ; en production elles valent linktrip.co et
# store.linktrip.co. Elles servent aussi à enregistrer Apple Pay sur le compte
# Stripe de chaque opérateur (lib/payment-domains.ts) : sans STORE_URL,
# store.linktrip.co n'est jamais enregistré et le bouton Apple Pay n'apparaît
# pas dans les boutiques.
#
# Tout est vérifié AVANT d'écrire quoi que ce soit dans Vercel : une variable
# requise vide arrête le script sans rien toucher.
#
# Rien ne s'affiche à l'écran : les valeurs passent par un tube, pas par
# l'historique du terminal.
set -euo pipefail
# Le déploiement part de la RACINE du dépôt : le projet Vercel a "apps/web"
# en Root Directory, lancer `vercel --prod` depuis apps/web échoue.
WEB="$(cd "$(dirname "$0")/.." && pwd)"
RACINE="$(cd "$WEB/../.." && pwd)"
cd "$RACINE"

PROD_APP_URL="https://linktrip.co"
PROD_STORE_URL="https://store.linktrip.co"

REQUIRED=(
  DATABASE_URL DIRECT_URL NEXT_PUBLIC_SUPABASE_URL NEXT_PUBLIC_SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY
  STRIPE_SECRET_KEY NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET STRIPE_CONNECT_WEBHOOK_SECRET
  TWILIO_ACCOUNT_SID TWILIO_AUTH_TOKEN TWILIO_WHATSAPP_FROM TWILIO_SMS_FROM
  RESEND_API_KEY RESEND_FROM_EMAIL
  CRON_SECRET
  R2_ACCOUNT_ID R2_ACCESS_KEY_ID R2_SECRET_ACCESS_KEY R2_BUCKET_ORIGINALS R2_BUCKET_PREVIEWS R2_PREVIEWS_PUBLIC_URL
)
# Poussées si renseignées, ignorées sinon (l'app démarre sans).
OPTIONAL=(
  NEXT_PUBLIC_SENTRY_DSN SENTRY_ORG SENTRY_PROJECT SENTRY_AUTH_TOKEN
  NEXT_PUBLIC_GTM_ID STORAGE_QUOTA_GB NEXT_PUBLIC_MAX_VIDEO_MB
)
FIXED=(NEXT_PUBLIC_APP_URL NEXT_PUBLIC_STORE_URL)

command -v vercel >/dev/null || { echo "La CLI vercel est introuvable. Installe-la (npm i -g vercel) ou remplace 'vercel' par 'npx vercel' dans ce script."; exit 1; }
[ -f "$WEB/.env.local" ] || { echo "apps/web/.env.local introuvable."; exit 1; }

valeur() {
  case "$1" in
    NEXT_PUBLIC_APP_URL) printf '%s' "$PROD_APP_URL"; return ;;
    NEXT_PUBLIC_STORE_URL) printf '%s' "$PROD_STORE_URL"; return ;;
  esac
  { grep -E "^$1=" "$WEB/.env.local" || true; } | head -1 | cut -d= -f2- | sed -e 's/^"//' -e 's/"$//'
}

if [ "$#" -gt 0 ]; then
  VARS=("$@"); OPTS=()
else
  VARS=("${REQUIRED[@]}" "${FIXED[@]}"); OPTS=("${OPTIONAL[@]}")
fi

# 1. Vérification complète, sans rien écrire.
MANQUE=0
for V in "${VARS[@]}"; do
  VAL=$(valeur "$V")
  if [ -z "$VAL" ] || [[ "$VAL" == *REMPLACER* ]]; then
    echo "✗ $V est vide ou encore à remplacer dans .env.local"; MANQUE=1
  fi
done
[ "$MANQUE" = 0 ] || { echo; echo "Rien n'a été écrit dans Vercel."; exit 1; }

# L'expéditeur de test de Resend n'envoie qu'au propriétaire du compte : en
# production, tous les e-mails aux clients seraient refusés.
if [[ " ${VARS[*]} " == *" RESEND_FROM_EMAIL "* ]] && [[ "$(valeur RESEND_FROM_EMAIL)" == *resend.dev* ]]; then
  echo "✗ RESEND_FROM_EMAIL est l'adresse de test de Resend (resend.dev). Mets une adresse du domaine"
  echo "  vérifié, par exemple : RESEND_FROM_EMAIL=\"Linktrip <hello@linktrip.co>\""
  echo "Rien n'a été écrit dans Vercel."
  exit 1
fi

SK=$(valeur STRIPE_SECRET_KEY)
if [[ " ${VARS[*]} " == *" STRIPE_SECRET_KEY "* ]] && [[ "$SK" == sk_test_* ]]; then
  echo "⚠ La clé Stripe de .env.local est une clé de TEST : la production n'encaissera rien de réel."
  printf "Continuer quand même ? [o/N] "
  read -r OK </dev/tty
  [[ "$OK" == [oO]* ]] || { echo "Rien n'a été écrit dans Vercel."; exit 1; }
fi

# 2. Écriture.
pousser() {
  local V="$1" VAL="$2"
  vercel env rm "$V" production --yes >/dev/null 2>&1 || true
  printf '%s' "$VAL" | vercel env add "$V" production >/dev/null
  echo "✓ $V (${#VAL} caractères)"
}
for V in "${VARS[@]}"; do pousser "$V" "$(valeur "$V")"; done
for V in "${OPTS[@]}"; do
  VAL=$(valeur "$V")
  if [ -n "$VAL" ]; then pousser "$V" "$VAL"; else echo "· $V vide, laissée telle quelle dans Vercel"; fi
done

echo
echo "Variables à jour. Déploiement en production…"
vercel --prod
