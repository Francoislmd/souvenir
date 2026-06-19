# CLAUDE.md — Souvenir

> **Lis ce fichier en entier avant d'écrire la moindre ligne de code.**
> Les décisions marquées 🔒 sont verrouillées : ne les rediscute pas, ne propose pas d'alternative, implémente.

---

## 1. Le produit en 30 secondes

**Souvenir** est un outil marketing pour opérateurs d'activités outdoor (parapente, canyoning, rafting, nautique) qui transforme chaque session en trois résultats concrets :

1. **Revenus supplémentaires** : les photos/vidéos sont livrées automatiquement dans une galerie brandée. En mode Boutique, le client achète le pack HD (prix opérateur, défaut 29 €) — split automatique **80 % opérateur / 20 % Souvenir**.
2. **Visibilité organique** : en mode Marketing, les médias sont offerts en échange d'un avis Google, d'un partage Instagram tagué et d'un email (avec consentement). Chaque client devient ambassadeur.
3. **Zéro gestion** : envoi automatique (email + SMS), paiement intégré, consentements RGPD horodatés. Le moniteur fait 3 taps, Souvenir s'occupe du reste.

La photo/vidéo est le **moyen**, pas la fin. Si une feature ne sert ni les revenus, ni la visibilité, ni l'automatisation → elle est hors scope.

Utilisateurs :
- **Opérateur** (gérant d'école) : configure, encaisse, lit le dashboard.
- **Moniteur** : sur le terrain, smartphone, réseau pourri, gants. Chaque action doit tenir en ≤ 3 taps.
- **Client final** ("Léa") : vient de vivre un moment fort, veut sa vidéo MAINTENANT. Zéro création de compte, zéro app à installer.

---

## 2. Décisions verrouillées 🔒

1. **Stack** : Next.js 14 (App Router, TypeScript strict) · Supabase (Postgres + Auth + Storage) · Prisma · Stripe Connect (Express) · Twilio WhatsApp · Tailwind. C'est la stack des projets précédents (Yieldly/Linktrip) — réutilise les patterns, n'introduis pas de nouveau framework.
2. **Monorepo** pnpm : `apps/web` (Next, déployé Vercel) + `apps/worker` (Node + ffmpeg, déployé Railway/Fly) + `packages/db` (Prisma partagé).
3. **Queue de traitement = table Postgres** (`processing_jobs`, polling `FOR UPDATE SKIP LOCKED`). Pas de Redis, pas de BullMQ, pas d'Inngest. Zéro infra en plus.
4. **Scan QR → galerie directe.** Le QR encode l'URL `/g/[token]` (pas un `wa.me`). La 1ère ouverture de la galerie = le claim (`status=CLAIMED`, `claimedAt`). WhatsApp devient un **opt-in optionnel** dans la galerie (`wa.me` pré-rempli, voir §7) qui capte `clientPhone` + `whatsappOptInAt`. Pas de templates HSM à faire valider pour le MVP, pas d'envoi sortant à froid.
5. **Pas de montage automatique (reel) dans le MVP.** Les médias sont livrés tels que capturés (+ watermark sur les aperçus). Le reel = Phase 2.
6. **Pas d'app native.** Web mobile-first + PWA installable pour le moniteur.
7. **FR uniquement.** Tutoiement chaleureux partout (client final ET opérateur — milieu outdoor décontracté).
8. **Un seul produit par session pour le MVP** (le vol biplace). Le multi-activités existe en base mais pas en UI.

---

## 3. Architecture

```
souvenir/
├── apps/
│   ├── web/                  # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (operator)/   # dashboard opérateur (auth Supabase)
│   │   │   │   ├── dashboard/        # KPIs : attach, GMV, panier
│   │   │   │   ├── sessions/         # rotations du jour, upload
│   │   │   │   ├── settings/         # marque, prix, mode, Stripe
│   │   │   ├── g/[token]/    # galerie client (publique, brandée)
│   │   │   ├── api/
│   │   │   │   ├── webhooks/twilio/  # messages WhatsApp entrants
│   │   │   │   ├── webhooks/stripe/  # paiements + Connect
│   │   │   │   ├── uploads/          # création signed upload URLs
│   │   ├── components/
│   │   └── lib/              # stripe.ts, twilio.ts, supabase.ts, analytics.ts
│   └── worker/               # Node 20 + ffmpeg : preview, watermark, thumbs, zip
└── packages/db/              # schema.prisma + client partagé
```

- **Auth** : Supabase Auth (email magic link) pour les opérateurs/moniteurs uniquement. Le client final n'a JAMAIS de compte — il accède via token de galerie.
- **Storage** : 2 buckets Supabase. `originals` (privé, accès worker + signed URLs post-achat) ; `previews` (public non-listable : thumbs + basse-déf watermarkées).
- **Accès DB** : Prisma côté serveur uniquement (server components / route handlers / worker). Pas de requête Supabase côté client.

---

## 4. Modèle de données (Prisma, version condensée)

```prisma
model Operator {
  id              String   @id @default(cuid())
  name            String                    // "Vol Passion Annecy"
  slug            String   @unique
  logoUrl         String?
  brandColor      String   @default("#2E6BFF")
  stripeAccountId String?                   // Connect Express
  packPriceCents  Int      @default(2900)
  feePercent      Int      @default(20)     // part Souvenir
  defaultMode     Mode     @default(BOUTIQUE)
  googleReviewUrl String?
  instagramHandle String?
  whatsappNumber  String?                   // numéro Twilio dédié ou partagé
  users           User[]
  sessions        Session[]
}

enum Mode { BOUTIQUE MARKETING }

model User {            // opérateur ou moniteur
  id         String   @id @default(cuid())
  email      String   @unique
  role       Role     @default(MONITEUR)
  operatorId String
}
enum Role { ADMIN MONITEUR }

model Session {          // une rotation / un créneau
  id         String   @id @default(cuid())
  operatorId String
  date       DateTime @default(now())
  label      String?                        // "Rotation 14h"
  mode       Mode                           // copié de l'operator, modifiable
  deliveries Delivery[]
}

model Delivery {         // = un client final et son lot de médias
  id           String   @id @default(cuid())
  sessionId    String
  code         String   @unique             // "X7K2P9" — affiché au moniteur
  token        String   @unique             // URL galerie /g/[token]
  clientName   String?
  clientPhone  String?                      // capté au 1er message WhatsApp
  clientEmail  String?
  consentImage Boolean  @default(false)     // droit à l'image (réutilisation com)
  consentEmail Boolean  @default(false)
  status       DeliveryStatus @default(CREATED)
  claimedAt    DateTime?
  media        Media[]
  order        Order?
  events       Event[]
}
enum DeliveryStatus { CREATED CLAIMED DELIVERED PURCHASED }

model Media {
  id          String   @id @default(cuid())
  deliveryId  String
  kind        MediaKind                     // PHOTO | VIDEO
  originalKey String
  previewKey  String?
  thumbKey    String?
  status      MediaStatus @default(UPLOADED) // UPLOADED → PROCESSING → READY | FAILED
  durationSec Int?
  sizeBytes   Int?
}
enum MediaKind { PHOTO VIDEO }
enum MediaStatus { UPLOADED PROCESSING READY FAILED }

model Order {
  id              String  @id @default(cuid())
  deliveryId      String  @unique
  amountCents     Int
  feeCents        Int
  stripePaymentId String  @unique
  status          String                     // succeeded | refunded
  createdAt       DateTime @default(now())
}

model ProcessingJob {
  id        String   @id @default(cuid())
  mediaId   String
  kind      String                           // "preview" | "zip"
  status    String   @default("pending")     // pending | running | done | failed
  attempts  Int      @default(0)
  lockedAt  DateTime?
  createdAt DateTime @default(now())
}

model Event {           // source de vérité analytics — voir §10
  id         String   @id @default(cuid())
  deliveryId String?
  operatorId String
  name       String                          // cf. taxonomie §10
  meta       Json?
  createdAt  DateTime @default(now())
}
```

---

## 5. Les 4 flux critiques

### Flux A — Onboarding opérateur (une fois)
1. Magic link Supabase → création `Operator` + `User ADMIN`.
2. Wizard 3 écrans : marque (nom, logo, couleur) → prix du pack & mode par défaut → **Stripe Connect Express onboarding** (redirect, puis webhook `account.updated` pour activer).
3. Tant que Stripe n'est pas actif : bandeau "Tu peux livrer, mais pas encaisser".

### Flux B — Le moniteur sur le terrain (le flux à soigner le plus)
1. Ouvre la PWA → bouton géant **"+ Nouvelle livraison"** (crée Session du jour si absente + Delivery avec `code`).
2. Sélectionne les médias depuis la pellicule (input multi, photos + vidéos). **Upload résumable** (tus / uppy → signed URLs Supabase), file d'attente locale persistée (IndexedDB) : si le réseau coupe, ça repart tout seul. Indicateur clair par fichier.
3. Écran final = **QR plein écran** vers `/g/[token]` + le code en gros en dessous (fallback : `<host>/g/X7K2P9`, si l'appareil photo du client rame). Le moniteur montre l'écran, le client scanne, terminé.
4. Chaque upload terminé crée les `ProcessingJob`. La galerie affiche les médias au fur et à mesure qu'ils passent READY (pas de blocage global).

### Flux C — Le client final
1. Scan → **la galerie `/g/[token]` s'ouvre directement** (résolue par `token` OU `code`, lien court `<host>/g/X7K2P9`). La 1ère ouverture enregistre `status=CLAIMED`, `claimedAt=now()` et vaut consentement implicite (`consentImage=true`, modifiable dans la galerie).
2. **Galerie `/g/[token]`** (brandée opérateur, ultra légère) :
   - Hero = 1er média + légende ("Quel vol 🤩 · Vol biplace · {date} · N souvenirs"), grille pour le reste.
   - Mode **Boutique** : thumbs + previews watermarkés en basse déf, lecture vidéo 720p max, CTA sticky "Débloquer le pack HD — 29 €" → Stripe Checkout → retour : galerie déverrouillée, téléchargements HD + bouton "Tout recevoir en zip".
   - Mode **Marketing** : tout déverrouillé. CTAs : ⭐ avis Google (lien direct), "Reçois tout par email" (capture + consentement), partage avec @tag pré-rempli.
   - Carte **opt-in WhatsApp** (optionnelle, tous modes) : "Recevoir sur WhatsApp" → `wa.me/<numéro>?text=SOUV-X7K2P9` → webhook Twilio enregistre `clientPhone` + `whatsappOptInAt`, répond avec le lien de la galerie.
3. Le message avis part **uniquement si** le client a fait l'opt-in WhatsApp ET (mode Marketing, ou achat effectué) : "Si le vol t'a plu, 30 secondes pour aider {école} : {lien avis}", dans la fenêtre de session 24 h ouverte par `whatsappOptInAt`. **Un seul message, jamais de relance** (MVP).

### Flux D — Paiement (Stripe Connect)
- Checkout Session en **destination charge** : `transfer_data.destination = operator.stripeAccountId`, `application_fee_amount = amount * feePercent / 100`.
- Webhook `checkout.session.completed` → crée `Order`, passe `Delivery → PURCHASED`, déverrouille, log l'event, déclenche le job `zip`.
- Remboursement = manuel via Stripe Dashboard pour le MVP (pas d'UI).

---

## 6. Pipeline vidéo (apps/worker)

- Worker Node 20 + ffmpeg statique. Boucle : poll `ProcessingJob` pending (SKIP LOCKED), 2 jobs en parallèle max.
- **Photo** : thumb 480px + preview 1280px avec watermark (logo opérateur en bas à droite, opacité 60 %) → bucket `previews`.
- **Vidéo** : thumb (frame à 2 s) + preview 720p / CRF 28 / watermark / audio AAC 96k. L'original reste intact dans `originals`.
- **Zip** : à l'achat, assemble les originaux dans `originals/zips/{deliveryId}.zip`, servi en signed URL 7 jours.
- Échec → retry ×3 avec backoff, puis `FAILED` + visible dans l'UI moniteur ("réessayer").
- Garde-fous : refuse > 4 Go ou > 15 min par fichier. Rétention originaux : 90 jours (cron de purge — Phase 2, mais prévois la colonne).

---

## 7. WhatsApp (Twilio) — opt-in optionnel

- WhatsApp n'est plus le point d'entrée (voir §2.4) : c'est un **opt-in optionnel** depuis la galerie, via `wa.me` pré-rempli. Le client **initie** la conversation → on est en session 24 h : réponses libres, pas de template à faire approuver.
- Dev local : Twilio Sandbox WhatsApp. Prod : numéro WhatsApp Business via Twilio (numéro partagé Souvenir, le nom de l'école dans le corps des messages).
- Webhook entrant : vérifie la signature Twilio (`X-Twilio-Signature`) — refuse sinon.
- Parse tolérant : extrais `SOUV-?([A-Z0-9]{6})` n'importe où dans le message. Code inconnu → "Hmm, ce code ne correspond à rien. Vérifie avec ton moniteur 🙂". Code valide → enregistre `clientPhone` + `whatsappOptInAt`, répond avec le lien `/g/[token]`.
- Le message avis (Flux C.3) part **dans la session 24 h** ouverte par `whatsappOptInAt` — si la fenêtre est fermée, on ne l'envoie pas (MVP : tant pis, log l'event `review_window_missed`).

---

## 8. Design system — "pro SaaS" sobre (v2, voir Décisions en bas de fichier)

```css
--canvas:#F7F8FA; --surface:#FFFFFF; --border:#E5E7EB; --border-strong:#D1D5DB;
--ink:#0F172A; --ink-2:#475569; --muted:#94A3B8;
--accent:#2563EB; --accent-hover:#1D4ED8; --accent-tint:#EFF4FF;
--success:#16A34A; --success-tint:#EAF7EE;
--warning:#D97706; --warning-tint:#FEF6EC;
--danger:#DC2626;  --danger-tint:#FDECEC;
rounded-card: 14px (cards/sections) ; rounded-control: 10px (boutons/inputs/badges) ; shadow-card: ombre neutre subtile
```
- Police unique : **Inter** (400–800), classe `font-sans`. Pas de fonte display séparée.
- La **galerie client** reste white-label : `--accent`/`--accent-tint` sont surchargées inline par `operator.brandColor` (Souvenir s'efface : juste "via Souvenir" discret en footer).
- Le **dashboard opérateur** utilise l'accent Souvenir (`--accent: #2563EB`).
- Mobile-first partout. Le flux moniteur doit être utilisable au soleil, à une main : gros taps ≥ 48px, contrastes forts.

---

## 9. Copy (ton)

Tutoiement, chaleureux, direct, zéro jargon. Le client vient de vivre un grand moment : le produit sourit, sans en faire trop. Erreurs : toujours dire quoi faire ("Le réseau a coupé — tes fichiers repartiront tout seuls, laisse l'écran ouvert."). Jamais de "Une erreur est survenue".

---

## 10. Analytics

Helper unique `track(name, {operatorId, deliveryId?, meta})` → table `Event`. Taxonomie (exhaustive, n'en invente pas d'autres sans les documenter ici) :

`delivery_created` · `media_uploaded` · `media_ready` · `qr_displayed` · `wa_message_received` (= claim) · `gallery_opened` · `preview_played` · `checkout_started` · `purchase_succeeded` · `zip_downloaded` · `review_link_clicked` · `email_captured` · `ig_share_clicked` · `review_window_missed`

Dashboard opérateur (et vue admin Souvenir agrégée) :
- **Attach rate** = purchases / claims (affiché en premier — indicateur clé de la valeur Boutique)
- Funnel : créées → claimées → ouvertes → checkout → payées
- GMV, panier moyen, part opérateur / part Souvenir, délai médian upload→claim

---

## 11. RGPD & droit à l'image

- Consentements horodatés sur `Delivery` (image, email). Le client peut refuser le droit à l'image dans la galerie → flag à false, l'opérateur le voit.
- Page `/g/[token]/confidentialite` : qui voit quoi, durée de rétention (90 j), contact suppression.
- Suppression : route admin qui purge médias + données d'une Delivery (hard delete storage + DB).
- Aucune donnée client final dans les logs. Téléphones stockés au format E.164, jamais affichés en entier dans le dashboard (…89 12).

---

## 12. Conventions & commandes

- TypeScript `strict`, Zod sur toutes les entrées (API routes, webhooks, forms). Pas de `any`.
- Server Components par défaut ; `"use client"` uniquement si nécessaire (upload, player, QR).
- Pas de lib UI externe (pas de shadcn) : Tailwind + composants maison, le design system est simple.
- Secrets : `.env.local` jamais commité. Clés Stripe/Twilio **test** par défaut ; un seul fichier `lib/env.ts` validé par Zod au boot.
- Commandes attendues à la racine : `pnpm dev` (web) · `pnpm worker` · `pnpm db:push` · `pnpm db:studio` · `pnpm lint` · `pnpm typecheck`. **Lance lint + typecheck avant de considérer une tâche finie.**
- Tests : uniquement sur la logique critique — matching code WhatsApp, calcul des fees, transitions de statut Delivery. Pas de tests UI au MVP.
- Commits : `feat:`, `fix:`, `chore:` courts, en anglais.

---

## 13. Phasage

**v0.1 — Lancement (objectif : utilisable par une école en réel)**
Onboarding opérateur + Stripe Connect · flux moniteur complet (upload résumable + QR) · webhook WhatsApp + galerie deux modes · checkout + déverrouillage + zip · worker preview/watermark · dashboard attach/funnel · RGPD de base.

**v0.2 — après les 2 premières semaines de terrain**
Message avis différé intelligent · multi-moniteurs avec rôles · upload depuis desktop (cartes SD) · purge 90 j · retours terrain des premières écoles.

**v1 — après validation des résultats**
Reel vertical auto (templates ffmpeg) · mode Marketing complet (tag IG auto, exports email) · intégrations résa (Yoplanning, Guidap) → pré-remplissage clients · pricing dynamique des packs (moteur yield) · multi-activités en UI.

**Hors scope définitif (ne propose pas)** : app native, marketplace B2C, abonnements client final, IA de sélection des meilleures photos, multi-langue, multi-devises.

---

## 14. Critères de qualité

- [ ] Un moniteur crée une livraison, uploade 10 photos + 1 vidéo de 2 min en 4G moyenne, montre le QR : **< 90 s de manipulation**.
- [ ] Le client scanne le QR et voit sa galerie **< 2 min** après la fin d'upload (previews prêtes).
- [ ] Achat test bout-en-bout : Checkout → galerie HD + zip → split 80/20 visible dans Stripe.
- [ ] Coupure réseau pendant l'upload → reprise automatique sans perte.
- [ ] Le dashboard affiche un attach rate juste sur des données de test connues.
- [ ] `pnpm lint && pnpm typecheck` verts ; secrets hors repo.

---

## 15. Variables d'environnement

```
DATABASE_URL=               # Supabase Postgres (pooled)
DIRECT_URL=                 # Supabase Postgres (direct, pour Prisma migrate)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=  # worker + signed URLs
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_CONNECT_WEBHOOK_SECRET=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_WHATSAPP_FROM=       # ex: whatsapp:+14155238886 (sandbox en dev)
NEXT_PUBLIC_APP_URL=        # https://app.souvenir... (ou http://localhost:3000)
```

---

*Dernière mise à jour : 19 juin 2026. Si tu prends une décision d'architecture non couverte ici, documente-la en bas de ce fichier dans une section `## Décisions prises en cours de route` avant d'implémenter.*

---

## Décisions prises en cours de route

- **`Operator.stripeOnboarded: Boolean @default(false)`** ajouté au schéma (non listé en §4). Mis à jour par le webhook `account.updated` (`charges_enabled && payouts_enabled`). Sert à afficher le bandeau "Tu peux livrer, mais pas encaisser" du Flux A.

- **Parcours simplifié "scan → galerie directe"** (amende 🔒 §2.4, Flux B/C en §5, §7) : le QR/lien encode désormais `/g/[token]` (résolu par `token` OU `code` uppercased, pour le lien court affiché sous le QR). WhatsApp n'est plus le point d'entrée — c'est un opt-in optionnel proposé dans la galerie.
  - **`Delivery.whatsappOptInAt: DateTime?`** ajouté au schéma (non listé en §4, entre `claimedAt` et `reviewSentAt`). Posé par le webhook Twilio quand le client clique "Recevoir sur WhatsApp" et envoie son code.
  - **Claim = 1ère ouverture de `/g/[token]`** : passe `Delivery.status` à `CLAIMED` et fixe `claimedAt`, plutôt que le 1er message WhatsApp. Vaut aussi consentement implicite (`consentImage=true`), modifiable via le toggle dans la galerie.
  - Le webhook Twilio entrant ne sert plus qu'à l'opt-in : il enregistre `clientPhone` + `whatsappOptInAt` sur le code matché, répond avec le lien `/g/[token]` ("Voilà ta galerie, tu la retrouveras toujours ici 👇").
  - `maybeSendReviewMessage` n'envoie le message avis QUE si `whatsappOptInAt` est posé (sinon aucun numéro à contacter) ET (mode Marketing OU `status=PURCHASED`), dans la fenêtre 24 h ouverte par `whatsappOptInAt`.
  - **Sémantique des events** : `gallery_opened` (1ère occurrence par delivery) ≡ ancien `wa_message_received`/claim. `wa_message_received` ne marque plus que l'opt-in WhatsApp optionnel. Le funnel dashboard (`getFunnel`) fusionne donc "Récupérées" et "Ouvertes" en une seule étape "Ouvertes" (basée sur `claimedAt`).

- **Refonte complète du design system (§8, v2)** : remplacement de la palette gradient bleu/violet + fontes Unbounded/Hanken Grotesk par un design "pro SaaS" neutre (slate + accent bleu unique `#2563EB`, fonte Inter, cartes plates `rounded-card`/`rounded-control`, `shadow-card`). Tokens CSS dans `app/globals.css`, mappés dans `tailwind.config.ts`. Toutes les pages/composants (dashboard, sessions, settings, auth/onboarding, landing, galerie client, confidentialité, flux moniteur) ont été réécrits avec ces tokens. Le mécanisme white-label de la galerie (`--accent`/`--accent-tint` surchargés par `operator.brandColor`) est conservé à l'identique.

- **Auth opérateur : email + mot de passe classique** (amende §3, qui mentionnait "email magic link"). Le magic link (`signInWithOtp`) tapait trop souvent le rate-limit email de Supabase en dev. Remplacé par :
  - `/login` : `signInWithPassword`.
  - `/signup` : `signUp` (+ confirmation email si activée côté Supabase ; sinon session immédiate → `/onboarding`).
  - `/forgot-password` → `resetPasswordForEmail` (lien vers `/auth/callback?next=/auth/reset-password`).
  - `/auth/reset-password` : `updateUser({password})`, nécessite la session posée par `/auth/callback`.
  - `/auth/callback` accepte désormais un paramètre `next` (sinon comportement inchangé : redirige vers `/dashboard` si `User` Prisma existe, sinon `/onboarding`).
  - Pour éviter le rate-limit en dev/pilote, désactiver "Confirm email" dans Supabase (Authentication → Providers → Email) ou configurer un SMTP custom (Resend, etc.).

- **Envoi direct email + SMS au moment de l'upload** (amende §2.4/§7 : ajout d'un canal d'envoi sortant immédiat, en plus du QR et de l'opt-in WhatsApp).
  - Sur l'écran d'upload (`/sessions/[deliveryId]`), le moniteur renseigne désormais `clientName`/`clientEmail`/`clientPhone` du destinataire (composant `DeliverySendForm`) et clique "Envoyer les photos" — déclenche `POST /api/deliveries/[deliveryId]/send`.
  - Cette route appelle `sendDeliveryNotifications()` (`lib/send-delivery.ts`) qui envoie, en parallèle :
    - un **email brandé** via **Resend** (`lib/email.ts`, `RESEND_API_KEY`/`RESEND_FROM_EMAIL`), template HTML avec logo/couleur de l'opérateur + message + CTA vers `/g/[token]` ;
    - un **SMS via Twilio** (`sendSms()` dans `lib/twilio.ts`, nouveau numéro `TWILIO_SMS_FROM`, distinct du numéro WhatsApp sandbox) avec le même message + lien.
    - Contrairement à l'opt-in WhatsApp (§7), cet envoi est **sortant et immédiat** — c'est pour ça qu'on passe par SMS (pas de template Meta à faire valider) plutôt que par WhatsApp. WhatsApp reste un opt-in optionnel (`wa.me`) dans la galerie, inchangé.
  - **`Operator.deliveryMessageTemplate String?`** ajouté au schéma : message personnalisable par l'opérateur (réglages → section "Message envoyé au client"), variables `{clientName}` / `{operatorName}`, rendu via `renderDeliveryMessage()` (`lib/message-templates.ts`, partagé client/serveur). Défaut : `DEFAULT_DELIVERY_MESSAGE`.
  - **`Delivery.sentAt: DateTime?`** ajouté au schéma : posé quand au moins un canal (email ou SMS) part avec succès.
  - **Nouvel event `delivery_sent`** ajouté à la taxonomie §10, `meta: {channel: "email" | "sms"}`.
  - Le QR reste affiché en secours (`/sessions/[deliveryId]/qr`, plus de formulaire de contact dessus — la saisie se fait désormais en amont sur l'écran d'upload).
  - **"Relances" (rappels programmés)** : demandées par l'opérateur mais pas implémentées dans cette passe (nécessiterait une tâche planifiée, hors scope MVP actuel — cf. §5 Flux C.3 "jamais de relance (MVP)"). Si besoin en v0.2, prévoir un `ProcessingJob`-like de type "relance" pollé par le worker.

- **Suppression de l'opt-in WhatsApp de la galerie + refonte visuelle email/galerie** (amende §5 Flux C.2/C.3 et §7) : sur retour terrain, le canal WhatsApp dans `/g/[token]` faisait doublon avec l'envoi direct email/SMS (ci-dessus) et alourdissait la page.
  - `components/gallery/WhatsAppOptIn.tsx` supprimé, plus d'appel à `buildWaLink` dans `app/g/[token]/page.tsx` ; `lib/twilio.ts` ne contient plus `buildWaLink` (mort).
  - **Conséquence** : `clientPhone`/`whatsappOptInAt` ne sont plus capturables depuis la galerie (le webhook Twilio `app/api/webhooks/twilio/route.ts` et `maybeSendReviewMessage` dans `lib/reviews.ts` restent en place mais ce chemin est désormais inatteignable depuis l'UI — le message avis post-achat (Flux C.3) part donc concrètement seulement si `clientPhone` a été saisi côté moniteur via `DeliverySendForm` ET le client répond sur WhatsApp de lui-même). Pas de nettoyage supplémentaire fait dans cette passe ; à revisiter si Flux C.3 doit être retravaillé.
  - **Refonte `lib/email.ts`** (`renderDeliveryEmailHtml`) : email entièrement réécrit — bandeau d'en-tête en dégradé `operator.brandColor`, logo/initiales sur cercle blanc en chevauchement, titre + message + CTA, rangée de 3 bénéfices (HD, zip, lien permanent), footer "via Souvenir". Script `pnpm test:email` (`scripts/send-test-email.ts`) génère un aperçu réel via Resend avec des données de démo.
  - **Refonte `app/g/[token]/page.tsx`** : dégradé décoratif `operator.brandColor` en haut de page, hero avec badge stats (nb photos/vidéos), cartes CTA (cadeau/débloqué/pack HD) restylées avec icônes en cercle et dégradés tint, section "Et ensuite ?" réduite au seul `ConsentToggle` (sans titre de section). `components/gallery/MediaTile.tsx` : grille de filigrane corrigée à 6 spans (au lieu de 9) pour matcher la grille CSS 3×2, classe morte `wm-light` retirée.

- **Refonte galerie en mise en page "story" (cover plein cadre + feuille de contenu) + ajustements de la cover** (amende §5 Flux C.2, §8) : `app/g/[token]/page.tsx` réécrit en cover `aspect-[4/5] max-h-[70vh]` (hero plein cadre, `OperatorHeader` flottant en glass-pill, dégradé bas + titre personnalisé `Le vol de {clientName} 🤩`), suivie d'une feuille de contenu `rounded-t-[28px] -mt-5` qui chevauche la cover (grille restante, CTAs, consentement, footer). `MediaGrid`/`MediaTile` resserrés (`gap-1.5`), `MediaTile` accepte un prop `rounded` (le hero passe `rounded-none`).
  - **`Operator.location: String?`** ajouté au schéma (non listé en §4) : lieu affiché dans le badge de la cover (`Vol biplace · {location} · {date}`), réglable dans `/settings` (`SettingsForm.tsx`, section "Marque").
  - Le badge nombre de photos/vidéos utilise désormais des icônes SVG (appareil photo / caméra, style cohérent avec le cadenas du filigrane) au lieu d'emojis, fusionnées dans un seul pill avec séparateur.
  - `CheckoutButton` : pill flottant centré "Débloquer mes souvenirs" + chip prix (remplace l'ancien bandeau pleine largeur "Débloquer le pack HD" puis "Débloquer en HD" — wording jugé pas assez vendeur / trop "HD").
  - `.wm-blurred` réduit à `blur(5px)`/`scale(1.04)` (cf. §8) — le verrou reste un badge circulaire translucide minimal (decision précédente confirmée, ne pas proposer de retirer le flou).

- **Paiement embarqué (Stripe Embedded Checkout)** (amende §5 Flux D : la galerie ne redirige plus vers la page Stripe hébergée) : `POST /api/checkout` crée la session avec `ui_mode: "embedded"` + `return_url` (au lieu de `success_url`/`cancel_url`) et renvoie `{ clientSecret }` au lieu de `{ url }`.
  - `CheckoutButton` récupère le `clientSecret`, puis ouvre `CheckoutSheet` (nouveau composant) : feuille modale qui glisse depuis le bas (plein écran mobile, carte centrée en desktop), contenant `<EmbeddedCheckout />` (`@stripe/react-stripe-js` + `@stripe/stripe-js`, nouvelles deps). À la fin du paiement, Stripe redirige la page entière vers `return_url` (`/g/[token]?purchase=success&session_id=...`), géré comme avant par `fulfillCheckoutSession`.
  - `lib/stripe-client.ts` (nouveau) : exporte `stripePromise` (`loadStripe(NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)`, ou `null` si la clé n'est pas configurée — le bouton affiche alors le message "paiement pas encore activé").
  - **`NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`** ajoutée à `lib/env.ts` (optionnelle) et `.env.example` : clé publique Stripe (`pk_test_…`), à renseigner dans `apps/web/.env.local` pour activer le paiement embarqué.
  - Animation `checkout-sheet-in` (slide-up) ajoutée dans `globals.css`.

- **Rebrand "Souvenir" — identité "photo instantanée" (v4)** (amende §8 : remplace la palette "pro SaaS" bleu/slate par une identité de marque propre, distincte du thème white-label opérateur ; v4 remplace une première tentative sable/montagne/Fraunces jugée trop fade) :
  - **Nouvelle palette** (`app/globals.css` `:root`) : `--canvas:#FAF7F4` (papier crème), `--border:#ECE4DC`, `--ink:#1F1B17`, `--ink-2:#6E6259`, `--muted:#A89C90` — tons chauds.
  - **`--brand`/`--brand-hover`/`--brand-tint` (`#FF6F3C`/`#E8572A`/`#FFEEE3`)** + **`--brand-gradient`** (`linear-gradient(135deg, #FFC857 0%, #FF6F3C 55%, #F0386B 100%)`, signature "coucher de soleil") : couleur/dégradé de marque Souvenir **fixes**, indépendants de `--accent`. `--accent`/`--accent-hover`/`--accent-tint` par défaut valent `--brand` (tangerine) — accent du dashboard opérateur et de la landing. `--brand`/`--brand-gradient` sont utilisés pour le pictogramme Souvenir dans le badge "via Souvenir" (footer galerie/confidentialité).
  - **Typographie** : ajout de **Bricolage Grotesque** (`next/font/google`, var `--font-bricolage`, poids 600/700/800) comme police d'affichage (`font-display` dans `tailwind.config.ts`), en `font-extrabold` sur tous les titres h1 (dashboard, settings, sessions, auth/onboarding, landing, hero galerie, confidentialité) pour une identité plus affirmée — Inter reste la police de l'UI/du corps (`font-sans`, inchangé).
  - **`components/brand/Logo.tsx`** (réécrit, `"use client"` car `useId()`) : pictogramme `LogoMark` = carte "photo instantanée" inclinée (cadre crème `#FFFBF6`, cliché au `--brand-gradient`, `rotate(-8deg)`) + `Logo` (mark + wordmark "Souvenir" en `font-display font-extrabold`). Remplace tous les anciens badges/pictogrammes dans la sidebar opérateur, le header mobile, les pages auth/onboarding, la landing et les footers "via Souvenir" de la galerie/confidentialité.
  - **`app/icon.svg`** (réécrit) : favicon Next.js (convention `app/icon.*`), même pictogramme que `LogoMark`.
  - **Landing (`app/page.tsx`, réécrite)** : halo en `--brand-gradient`, titre h1 `font-extrabold` avec dernière ligne en texte degradé (`backgroundClip: text`), cartes "polaroid" illustratives (`PolaroidCard`) en `rotate` variés à droite du hero.
  - La palette de confettis `UnlockCelebration.tsx` = `["#FF6F3C", "#FFC857", "#F0386B", "#16A34A"]` (tons du `--brand-gradient` + vert succès).

- **Refonte de la galerie client en feed type Instagram + couleur de marque galerie fixe** (amende §5 Flux C.2, §8 white-label : la galerie n'est plus personnalisable par couleur opérateur) :
  - **Feed "profil"** : `app/g/[token]/page.tsx` réécrit — l'ancienne cover plein cadre est remplacée par `GalleryHeader` (avatar opérateur cerclé + nom/lieu/date + titre + compteur photos/vidéos, façon en-tête de profil Instagram) suivi de `MediaFeed` : grille serrée 3 colonnes (`gap-0.5`, carrés) de **tous** les médias (plus de split hero/rest). Tap sur une tuile ouvre `MediaLightbox` (plein écran, swipe horizontal/flèches, compteur, pastilles, son activé pour la vidéo, overlay de verrou inchangé pour le Boutique non acheté).
  - **`components/gallery/GridVideo.tsx`** (nouveau) : vidéo de la grille en autoplay muet en boucle (`IntersectionObserver`, joue seulement si visible à ≥60 %), façon Reels. `MediaTile.tsx` réécrit en bouton carré ouvrant la lightbox (`onOpen`), badge ▶ sur les tuiles vidéo. Anciens `MediaGrid.tsx`/`OperatorHeader.tsx`/`VideoCell.tsx` supprimés.
  - **CTAs restylés en "action cards"** (`components/gallery/ActionCard.tsx`, nouveau : `actionCardClass` + `ActionCardContent` icône-cercle + label) : "Tout télécharger" (zip) et "Laisser un avis" (Google) deviennent des cartes carrées icône+label côte à côte (mode débloqué) ; en mode Marketing, `MarketingCtas.tsx` utilise les mêmes action cards pour avis Google + partage Instagram (le bouton "Partager en story" en pleine largeur est supprimé, fusionné dans la carte "Partager"). `ReviewLink.tsx` prend désormais `children` (au lieu de `label`) pour s'adapter à ces deux usages.
  - **Couleur de marque galerie fixe (`#4F46E5`, bleu indigo Souvenir)** : `apps/web/lib/brand.ts` exporte `CLIENT_BRAND_COLOR = "#4F46E5"`, utilisé pour `--accent`/`--accent-tint` dans `app/g/[token]/page.tsx` et `confidentialite/page.tsx`. C'est le même bleu que `--brand` du dashboard — une seule identité Souvenir cohérente partout. **`Operator.brandColor` supprimé du schéma Prisma** — l'opérateur ne peut plus personnaliser la couleur de sa galerie. *(La valeur a d'abord été `#F0386B` rose/framboise, puis changée en `#4F46E5` bleu sur demande explicite — ne pas revenir au rose.)*

- **"+ Nouvelle livraison" devient un choix de modalité, avec import groupé trié manuellement** (amende Flux B §5 : le moniteur peut désormais traiter toute une rotation en un coup plutôt qu'un client à la fois) :
  - **`Delivery.title: String?`** ajouté au schéma : titre custom de la galerie, en override du calcul par défaut. `lib/message-templates.ts` exporte `defaultGalleryTitle(clientName)` (= `"Le vol de {prénom} 🤩"` ou `"Quel vol 🤩"` si pas de prénom), utilisé comme valeur réactive par défaut tant que l'opérateur n'a pas tapé dans le champ ("titre touché"). `app/g/[token]/page.tsx` : `heroTitle = delivery.title ?? defaultGalleryTitle(delivery.clientName ?? "")`. `DeliverySendForm` a un nouveau champ "Titre de la galerie" et `/api/deliveries/[deliveryId]/send` persiste `title`.
  - **Nouveau modèle `ImportBatch`** (zone de transit) : `id, sessionId, status ("uploading"|"sorted"|"done"), createdAt`, relation `Session.importBatches`. `Media.deliveryId`/`Media.delivery` sont devenus optionnels, ajout de `Media.importBatchId`/`Media.importBatch` (`onDelete: Cascade`) — un média appartient soit à une `Delivery`, soit (temporairement) à un `ImportBatch`.
  - **`lib/delivery-code.ts`** (`generateUniqueCode`) et **`lib/session.ts`** (`getOrCreateTodaySession`) extraits de `app/api/deliveries/route.ts` pour être partagés avec le flux d'import.
  - **`/api/uploads`** généralisé : body zod accepte soit `deliveryId` soit `batchId` (exactement un des deux) ; `lib/idb.ts` généralise la queue IndexedDB (`UploadItem.ownerId`/`ownerType: "delivery"|"batch"`, index `by-owner`, DB version 2) et `UploadQueue` prend désormais `ownerType`/`ownerId`.
  - **Nouveau composant `components/NewDeliverySheet.tsx`** (remplace `NewDeliveryButton`) : bottom sheet avec deux choix — **"Une personne"** (`POST /api/deliveries` → `/sessions/[deliveryId]`, comportement inchangé) et **"Plusieurs personnes"** (`POST /api/import-batches` → `/sessions/import/[batchId]`).
  - **Nouveau flux `/sessions/import/[batchId]`** (`components/import/ImportWizard.tsx`, wizard 3 étapes en state local) :
    1. **Upload** : `UploadQueue ownerType="batch"`, upload de tout le lot de la rotation en une fois.
    2. **Préparation** : poll `GET /api/import-batches/[batchId]/media` jusqu'à ce que tous les médias soient `READY`/`FAILED`, puis `POST /api/import-batches/[batchId]/sort` (qui renvoie toujours un unique groupe `"Toutes les photos"` contenant tous les médias `READY`, et passe `ImportBatch.status` à `"sorted"`).
    3. **Validation par groupe** (`components/import/FolderCard.tsx`) : grille de miniatures par groupe, bouton "⋯" par miniature → déplacer vers un autre groupe / nouveau dossier (pas de drag-and-drop), champs `clientName`/`clientEmail`/`clientPhone`/`title` par groupe. L'opérateur répartit lui-même les photos entre les groupes (un seul groupe par défaut, "+ Nouveau dossier" pour en créer d'autres). "Envoyer à tout le monde" → `POST /api/import-batches/[batchId]/finalize` (crée une `Delivery` par groupe non-vide avec coordonnées, réassigne les médias, déclenche `sendDeliveryNotifications`).

- **Refonte "façon Alan/Swile/Lodgify" (§8, v5) + couleur de marque Souvenir passée à un bleu indigo** (amende v4 : la palette "coucher de soleil" tangerine/rose est remplacée par un bleu, sur demande explicite — fond crème inchangé, mais identité de marque plus "pro SaaS confiant") :
  - **`--brand`/`--brand-hover`/`--brand-tint`** = `#4F46E5`/`#4338CA`/`#EEF2FF` (indigo). **`--brand-gradient`** = `linear-gradient(135deg, #7DD3FC 0%, #3B82F6 55%, #4F46E5 100%)` (ciel → bleu → indigo), remplace le dégradé "coucher de soleil". `--accent`/`--accent-hover`/`--accent-tint` (par défaut = brand, dashboard opérateur + landing) suivent la même palette. `LogoMark` (`components/brand/Logo.tsx`), `app/icon.svg` et la palette confettis (`UnlockCelebration.tsx`) repris avec ces teintes. `CLIENT_BRAND_COLOR` (`lib/brand.ts`, rose framboise `#F0386B` de la galerie client) **inchangé** — reste une identité séparée, volontairement distincte du bleu Souvenir.
  - **Radii globaux augmentés** (`tailwind.config.ts`) : `rounded-card` 14px → 20px, `rounded-control` 10px → 12px — look plus "soft SaaS".
  - **Nouvelles primitives** : `components/ui/Button.tsx` (`Button`/`ButtonLink`, pilules `rounded-full`, variants `primary`/`accent`/`secondary`/`outline-light`/`ghost`, tailles `sm`/`md`/`lg`) et `components/ui/Input.tsx` (`inputClass` partagé) — à utiliser pour tout nouveau bouton/input plutôt que de réécrire les classes Tailwind à la main.
  - **`components/auth/AuthLayout.tsx`** (nouveau) : wrapper commun login/signup/forgot-password/reset-password (halo `--brand-gradient` flou + carte centrée `rounded-card`/`shadow-card`). `app/onboarding/page.tsx` reprend le même habillage en `max-w-md`.
  - **Landing (`app/page.tsx`, réécrite v2)** : nav pilule flottante sticky (`components/marketing/Nav.tsx`, fond `nav-pill` translucide + blur, cf. `.nav-pill` dans `globals.css`), hero XXL (`text-7xl` en desktop) avec dernière ligne en `--brand-gradient` + mockup téléphone (`components/marketing/PhoneMockup.tsx`, grille de tuiles dégradées façon galerie + CTA "Débloquer mes souvenirs"), section "Comment ça marche" (3 `StepCard`), section "Pourquoi Souvenir" (4 `FeatureCard` à icônes SVG inline dans des cercles teintés), bande CTA finale `bg-ink text-canvas` avec halo `--brand-gradient`.
  - **Nav opérateur** (`components/operator/Sidebar.tsx` + `components/BottomNav.tsx`) : items en pilule `rounded-full` avec icônes SVG (`components/operator/nav-icons.tsx` : Dashboard/Sessions/Réglages), état actif `bg-accent-tint text-accent`.

- **CTAs multi-plateformes d'avis + partage Instagram dans la galerie client** (ajout §5 Flux C.2, §10) :
  - **Nouveaux champs `Operator`** : `trustpilotUrl String?`, `tripadvisorUrl String?`, `instagramPostCaption String?` (caption Instagram personnalisable, variables `{instagramHandle}` / `{operatorName}`). Réglables dans `/settings` section "Avis & réseaux".
  - **`lib/message-templates.ts`** : `DEFAULT_INSTAGRAM_CAPTION`, `renderInstagramCaption()`, `extractHashtags()` (extrait les `#tags` de la caption, max 6).
  - **`components/gallery/ReviewSection.tsx`** (nouveau) : liste de plateformes avec logos de marque natifs (Google G coloré, étoile Trustpilot verte `#00B67A`, cercles TripAdvisor `#34E0A1`), header "⭐ Tu as aimé l'expérience ?", chevron par ligne. Remplace les anciennes action cards Google seul.
  - **`components/gallery/InstagramShareSection.tsx`** (nouveau, remplace `InstagramShareButton`) : carte bordée accent (bleu Souvenir), icône Instagram dans cercle accent, pill `@handle` + pills hashtags, bouton "Partager sur Instagram" plein accent. **Branding Souvenir uniquement** — pas de gradient Instagram.
  - **`components/gallery/GalleryHeader.tsx`** : anneau avatar en `--accent` (bleu Souvenir), badge `@handle` pill borduré accent (lien vers profil IG), hashtag pills en `accent-tint`. Stats photos/vidéos alignées à droite, façon profil.
  - **`ReviewLink.tsx`** : prop `platform: "google" | "trustpilot" | "tripadvisor"` transmis dans `meta` de l'event `review_link_clicked` pour analytics fins.
  - Galerie Boutique débloquée : bannière succès + lien "Tout télécharger (.zip)" intégré dans la carte, puis `ReviewSection`, puis `InstagramShareSection`.
  - Galerie Marketing : `InstagramShareSection` en premier, puis `ReviewSection`, puis formulaire email.
  - **Design gallery inspiré profil social** mais branding Souvenir strict — ne pas mettre de dégradé Instagram (orange/rose/violet) dans l'UI.
