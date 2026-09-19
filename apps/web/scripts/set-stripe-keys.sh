#!/usr/bin/env bash
# Branche Linktrip sur son compte Stripe : demande les quatre clés sans les
# afficher, les écrit dans apps/web/.env.local, puis (après confirmation) les
# recopie dans Vercel production et redéploie.
#
#   bash apps/web/scripts/set-stripe-keys.sh
#
# Les valeurs ne passent ni par l'écran, ni par l'historique du terminal, ni
# par le chat : colle-les quand le script les demande (rien ne s'affiche,
# c'est normal), puis Entrée.
set -euo pipefail
WEB="$(cd "$(dirname "$0")/.." && pwd)"
ENVFILE="$WEB/.env.local"
[ -f "$ENVFILE" ] || { echo "apps/web/.env.local introuvable."; exit 1; }

ask() {
  local name="$1" prefix="$2" label="$3" val=""
  while true; do
    printf '%s (%s…) : ' "$label" "$prefix" >&2
    IFS= read -rs val; echo >&2
    val="$(printf '%s' "$val" | tr -d '[:space:]')"
    case "$val" in
      "$prefix"*) printf '%s' "$val"; return 0 ;;
      *) echo "  ✗ doit commencer par $prefix, recommence." >&2 ;;
    esac
  done
}

SK=$(ask STRIPE_SECRET_KEY "sk_" "Clé secrète")
PK=$(ask NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY "pk_" "Clé publiable")
WH=$(ask STRIPE_WEBHOOK_SECRET "whsec_" "Secret du webhook « Votre compte »")
WC=$(ask STRIPE_CONNECT_WEBHOOK_SECRET "whsec_" "Secret du webhook « Comptes connectés »")

mode_of() { case "$1" in *_live_*) echo live ;; *_test_*) echo test ;; *) echo "?" ;; esac; }
if [ "$(mode_of "$SK")" != "$(mode_of "$PK")" ]; then
  echo "✗ La clé secrète est en $(mode_of "$SK") et la clé publiable en $(mode_of "$PK") : elles doivent venir du même mode. Rien n'a été écrit."
  exit 1
fi
[ "$WH" = "$WC" ] && { echo "✗ Les deux secrets de webhook sont identiques : il en faut un par endpoint. Rien n'a été écrit."; exit 1; }

cp "$ENVFILE" "$ENVFILE.avant-stripe"
python3 - "$ENVFILE" "$SK" "$PK" "$WH" "$WC" <<'PY'
import sys, re
path, *vals = sys.argv[1:]
names = ["STRIPE_SECRET_KEY", "NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY", "STRIPE_WEBHOOK_SECRET", "STRIPE_CONNECT_WEBHOOK_SECRET"]
lines = open(path, encoding="utf-8").read().splitlines()
for name, val in zip(names, vals):
    pat = re.compile(rf"^\s*#?\s*{name}=")
    idx = [i for i, l in enumerate(lines) if pat.match(l)]
    if idx:
        lines[idx[0]] = f"{name}={val}"
        for i in reversed(idx[1:]):
            del lines[i]
    else:
        lines.append(f"{name}={val}")
open(path, "w", encoding="utf-8").write("\n".join(lines) + "\n")
PY
echo "✓ .env.local mis à jour (mode $(mode_of "$SK")). Ancienne version : apps/web/.env.local.avant-stripe"

printf 'Recopier ces 4 variables dans Vercel production et redéployer ? [o/N] '
read -r OK
if [ "$OK" = "o" ] || [ "$OK" = "O" ]; then
  bash "$WEB/scripts/sync-vercel-env.sh" STRIPE_SECRET_KEY NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET STRIPE_CONNECT_WEBHOOK_SECRET
else
  echo "Vercel non touché. Pour le faire plus tard :"
  echo "bash apps/web/scripts/sync-vercel-env.sh STRIPE_SECRET_KEY NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY STRIPE_WEBHOOK_SECRET STRIPE_CONNECT_WEBHOOK_SECRET"
fi
