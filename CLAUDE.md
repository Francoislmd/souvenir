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

1. **Stack** : Next.js 14 (App Router, TypeScript strict) · Supabase (Postgres + Auth + Storage) · Prisma · Stripe Connect (Express) · Twilio WhatsApp · Tailwind. C'est la stack des projets précédents (Yieldly/Linktrip) — réutilise les patterns, n'introduis pas de nouveau framework.
2. **Monorepo** pnpm : `apps/web` (Next, déployé Vercel) + `apps/worker` (Node + ffmpeg, déployé Railway/Fly) + `packages/db` (Prisma partagé).
3. **Queue de traitement = table Postgres** (`processing_jobs`, polling `FOR UPDATE SKIP LOCKED`). Pas de Redis, pas de BullMQ, pas d'Inngest. Zéro infra en plus.


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