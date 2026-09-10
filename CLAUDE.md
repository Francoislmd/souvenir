# CLAUDE.md — Souvenir

> **Lis ce fichier en entier avant d'écrire la moindre ligne de code.**
> Les décisions marquées 🔒 sont verrouillées : ne les rediscute pas, ne propose pas d'alternative, implémente.

---

## 1. Le produit en 30 secondes
Vision

Souvenir est une plateforme SaaS qui permet aux professionnels du tourisme, des loisirs et des activités outdoor de générer des revenus complémentaires en vendant automatiquement les photos et souvenirs numériques de leurs clients.

L'objectif est de devenir le "Shopify des souvenirs touristiques" ou le "PicThrive européen".

Problème

Des millions de clients vivent chaque année des expériences touristiques mémorables :

cours de surf,
sorties kayak,
plongée,
ski,
randonnée,
canyoning,
excursions,
activités outdoor.

Ces clients souhaitent conserver un souvenir de leur expérience.

Aujourd'hui, la plupart des professionnels :

ne vendent pas de souvenirs ;
ou le font de manière artisanale via WhatsApp, Google Drive ou Instagram ;
perdent ainsi une source de revenus potentielle.
Solution

Souvenir fournit une plateforme clé en main qui permet aux professionnels de :

prendre des photos pendant leurs activités ;
uploader les photos sur leur espace professionnel ;
générer automatiquement une galerie privée pour chaque client ;
vendre les photos en ligne ;
gérer le paiement ;
livrer automatiquement les fichiers ;
suivre leurs revenus.

Le professionnel n'a quasiment aucune gestion à effectuer.

Modèle économique

Souvenir fonctionne sur un modèle de commission :

le client achète ses photos ;
Souvenir prélève une commission sur chaque vente ;
le reste est reversé au professionnel.

Exemple :

vente de photos : 20 € ;
commission Souvenir : 20% ;
revenu reversé au partenaire : 80%.
Clients cibles

Les clients de Souvenir sont :

écoles de surf ;
moniteurs de ski ;
centres de plongée ;
guides touristiques ;
bases nautiques ;
parcs aventure ;
centres de canyoning ;
prestataires d'activités outdoor ;
professionnels du tourisme expérientiel.
Positionnement marketing

Souvenir ne vend pas des photos.

Souvenir vend :

des revenus complémentaires ;
des souvenirs émotionnels ;
une meilleure expérience client ;
une nouvelle source de chiffre d'affaires automatisée.

La promesse principale est :

"Transformez les souvenirs de vos clients en revenus complémentaires."

Valeurs de marque

La marque doit être :

premium ;
émotionnelle ;
simple ;
moderne ;
élégante ;
humaine ;
inspirée de l'univers du voyage et des souvenirs.
Vision long terme

À court terme :

vente de photos numériques.
vidéos ;
packs souvenirs ;

À long terme :

devenir la plateforme européenne de référence pour la monétisation des souvenirs touristiques.

Considère Souvenir comme une startup ambitieuse en phase de lancement et propose des recommandations concrètes, réalistes et orientées croissance.

---

## 2. Décisions verrouillées 🔒

1. **Stack** : Next.js 14 (App Router, TypeScript strict) · Supabase (Postgres + Auth + Storage) · Prisma · Stripe Connect (Express) · Twilio WhatsApp · Resend (email) · Tailwind. C'est la stack des projets précédents (Yieldly/Linktrip) — réutilise les patterns, n'introduis pas de nouveau framework.
2. **Monorepo** pnpm : `apps/web` (Next, déployé Vercel) + `apps/worker` (Node, déployé via Dockerfile/Railway-Fly) + `packages/db` (Prisma partagé).
3. **Queue de traitement = table Postgres** (`ProcessingJob`, polling `FOR UPDATE SKIP LOCKED`). Pas de Redis, pas de BullMQ, pas d'Inngest. Zéro infra en plus.

> **Le produit s'appelle Linktrip en interface** (logo, emails, titres, `hello@linktrip.co`). "Souvenir" est le nom du repo et de ce document — historique, jamais utilisé côté utilisateur.

---

## 3. Architecture réelle

Le modèle métier a divergé de la v1 : plus de "Session/Delivery/Media" ni de compte client — le vocabulaire réel est **Sortie / Slot / Participant / Photo**, en français dans le code et l'UI.

```
souvenir/
├── apps/
│   ├── web/                        # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (operator)/         # dashboard opérateur, derrière middleware.ts (session Supabase)
│   │   │   │   ├── sorties/                # liste + sorties/[sortieId] + sorties/nouvelle
│   │   │   │   ├── reglages/               # marque, prix, mode, Stripe Connect, automations
│   │   │   │   └── revenus/                # KPIs, GMV, panier moyen
│   │   │   ├── (auth)/             # connexion, mot-de-passe-oublie, reinitialiser
│   │   │   ├── (legal)/            # mentions-legales, cgu, cgv, confidentialite — pages racine
│   │   │   ├── onboarding/         # wizard de création de compte + qualification
│   │   │   ├── signup/
│   │   │   ├── g/[token]/          # galerie individuelle (mode INDIVIDUEL) — pas de compte, token = seul secret
│   │   │   │   └── confidentialite/, desinscription/, supprimer/
│   │   │   ├── s/[slug]/          # boutique (mode GROUPE) — servie sur store.linktrip.co/{slug}
│   │   │   │   ├── [code]/         # même boutique, ouverte sur le jour de cette sortie
│   │   │   │   └── retrait/        # demander le retrait d'une photo, sans justification
│   │   │   ├── sitemap.ts, robots.ts   # landing + pages légales uniquement, le reste est exclu
│   │   │   └── api/
│   │   │       ├── webhooks/stripe/        # payment_intent.*, charge.refunded, charge.dispute.*, account.updated
│   │   │       ├── stripe/connect/         # onboarding Connect Express (+refresh, +sync)
│   │   │       ├── checkout/, checkout/confirm/
│   │   │       ├── cron/automations/       # relances email/WhatsApp — Vercel Cron, secured by CRON_SECRET
│   │   │       ├── cron/gdpr-purge/        # purge RGPD — Vercel Cron, secured by CRON_SECRET
│   │   │       ├── sorties/, participants/, photos/, operator/
│   │   │       └── g/[token]/, store/[slug]/  # endpoints publics des galeries (jours, poll, achats, retrait)
│   │   ├── sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts, instrumentation.ts
│   │   ├── components/
│   │   └── lib/                    # stripe.ts, twilio.ts, supabase-server.ts, analytics.ts, gdpr.ts, order-fulfillment.ts, order-refunds.ts, automations.ts…
│   └── worker/                     # Node 20 + sharp, tourne via `npx tsx src/index.ts`
└── packages/db/                    # schema.prisma + client Prisma partagé (source TS brute, pas de build)
```

- **Auth** : Supabase Auth **email + mot de passe** (pas de magic link) pour les opérateurs/moniteurs uniquement, avec rate-limiting maison (`AuthAttempt` : 5 tentatives/email et 20/IP sur une fenêtre de 15 min — voir `lib/env.ts`/`api/auth/*`). Le participant final n'a JAMAIS de compte — il accède via le token de sa galerie individuelle (`/g/[token]`) ou, en mode GROUPE, via l'adresse de la boutique de sa sortie. `middleware.ts` rafraîchit la session Supabase sur tout le site sauf la landing (`/`), `/g/*` et `/api/webhooks/*`.

**Adresse des boutiques GROUPE** : `store.linktrip.co/{operator.slug}`, une adresse permanente par opérateur, réutilisée par toutes ses sorties. 🔒 **La boutique est publique** : le slug est lisible et devinable, et n'importe qui l'ouvre sans code. Ce qui protège les clients tient donc entièrement aux aperçus filigranés, au `noindex` et au lien « demander le retrait », joignable depuis chaque écran et qui n'exige rien. Décidé le 10/09/2026 après avoir essayé l'inverse (un code court par sortie, seul secret) : ne pas rediscuter, c'est un choix produit assumé.

`store.linktrip.co/{slug}/{sortie.shareCode}` reste servi, mais le code n'est plus un secret : il ne fait qu'ouvrir la boutique sur le jour de cette sortie, pour le QR code affiché à la fin de la journée. Il est créé avec la sortie GROUPE, et à la volée pour les sorties antérieures (`lib/store.ts`, `ensureShareCode`), jamais réémis : un QR code imprimé doit continuer de marcher.

La traduction sous-domaine → chemin interne `/s/{slug}` se fait dans `middleware.ts`, qui y pose aussi le `X-Robots-Tag: noindex` ; sans `NEXT_PUBLIC_STORE_URL` (local, previews) les boutiques se servent depuis le domaine principal sur `/s/...`.
- **Storage** : buckets Supabase `originals` (privé) et `previews` (aperçus/miniatures/flous — voir `lib/storage.ts`).
- **Accès DB** : Prisma côté serveur uniquement (server components / route handlers / worker). Pas de requête Supabase côté client.
- **SEO** : `app/sitemap.ts` et `app/robots.ts` n'exposent que la landing et les 4 pages légales — galeries, boutiques, espace opérateur et auth sont explicitement exclus (`Disallow` + header `X-Robots-Tag: noindex` sur `/g/:path*` et `/s/:path*`, posé dans `next.config.mjs`, et sur le sous-domaine par `middleware.ts`).
- **Monitoring** : Sentry (`@sentry/nextjs` côté web, `@sentry/node` côté worker), entièrement optionnel — inerte tant que `NEXT_PUBLIC_SENTRY_DSN`/`SENTRY_DSN` ne sont pas définies, l'app démarre sans.

---

## 4. Le worker — ce qu'il fait vraiment

`apps/worker` ne traite **qu'un seul type de job : `"preview"`** (`apps/worker/src/index.ts` → `jobs/preview.ts`), via `sharp` : génère miniature, aperçu, et les versions floutées (`blurKey`, `blurEmailKey`) et filigranées (`groupPreviewKey`, mode GROUPE) d'une photo.

Écarts à connaître par rapport à la vision produit (§1) et au schéma :
- **Pas de ffmpeg, pas de traitement vidéo**, malgré `Photo.isVideo` dans le schéma — la vidéo n'est pas implémentée.
- **Pas de zip de téléchargement groupé.**
- Le job `"publish_group"` (regroupement EXIF des photos d'une sortie GROUPE en `Slot`) ne passe **pas** par ce worker — il tourne en ligne, synchrone, dans `apps/web/lib/group-publish.ts`, déclenché par `api/photos/[photoId]/complete`.

Le worker interroge `ProcessingJob` par polling `FOR UPDATE SKIP LOCKED` (§2.3), avec retry borné (`MAX_JOB_ATTEMPTS`) et parallélisme borné (`MAX_PARALLEL_JOBS`).

---

## 5. Paiements — Stripe Connect

- Connect **Express**, split par `application_fee_amount` + `transfer_data.destination` (pas de `on_behalf_of`) — voir `lib/checkout.ts`.
- `Order.status` est un `String` libre (pas d'enum Prisma) : `pending | succeeded | failed | refunded | disputed`. Les vérifications d'accès galerie sont en égalité stricte (`=== "succeeded"`, `lib/gallery.ts`) — tout autre statut re-verrouille automatiquement l'accès au prochain chargement, sans code de révocation séparé.
- Idempotence par relecture d'état DB avant écriture (pas de table d'event-id Stripe) — voir `lib/order-fulfillment.ts` et `lib/order-refunds.ts`.
- Webhook (`api/webhooks/stripe/route.ts`) géré : `payment_intent.succeeded/payment_failed`, `charge.refunded` (total et partiel — pas de politique de remboursement partiel côté produit, tout remboursement verrouille la galerie), `charge.dispute.created/closed`, `account.updated`.

---

## 6. RGPD & rétention

`lib/gdpr.ts`, deux scans distincts pilotés par les crons Vercel (`vercel.json`, secured by `CRON_SECRET`) :
- **Participant individuel** : purge 90 jours après `consentAt` (`Participant.deleteAt`) — supprime les fichiers Storage et les `Photo`, anonymise la ligne `Participant` en base (jamais de hard-delete de la ligne elle-même).
- **Sortie GROUPE** : purge 90 jours après publication (`Sortie.purgeAt`) — supprime tout le lot de photos et les `Slot` de la sortie.

Désinscription marketing séparée (`Participant.unsubscribedAt`) : coupe les emails de relance/offre, jamais les emails transactionnels (livraison, confirmation de commande).

---

## 7. Analytics

`packages/db/src/analytics.ts` — `track(name: EventName, { operatorId, participantId?, meta? })`, écrit dans la table `Event`. Réellement instrumenté (pas juste défini en schéma) à une vingtaine d'emplacements : checkout, fulfillment, remboursements/litiges, RGPD, automations, publication de galerie de groupe, ouverture de galerie, etc.

---

## 8. Variables d'environnement

Voir `apps/web/.env.example` pour la liste exhaustive et à jour (copier en `.env.local`) — toutes requises sauf mention contraire, validées au démarrage par `lib/env.ts` (zod, `envSchema.parse(process.env)`, l'app ne démarre pas si une variable requise manque).

Points notables :
- `CRON_SECRET` (min. 20 caractères) protège les deux crons Vercel.
- `NEXT_PUBLIC_SENTRY_DSN` / `SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` sont **optionnelles**, hors du schéma zod — l'app tourne sans.
- `RESEND_FROM_EMAIL` est requise, sans repli sur un domaine Resend partagé (mauvais pour la délivrabilité).
- `STRIPE_CONNECT_WEBHOOK_SECRET` traîne parfois dans des `.env.local` existants mais n'est référencée nulle part dans le code actuel (`account.updated` est traité dans le webhook principal via `STRIPE_WEBHOOK_SECRET`) — probablement un reliquat, à confirmer avant de le retirer pour de bon.