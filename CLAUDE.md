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

1. **Stack** : Next.js 14 (App Router, TypeScript strict) · Supabase (Postgres + Auth) · Cloudflare R2 (fichiers, depuis le 21/09/2026) · Prisma · Stripe Connect (Express) · Twilio WhatsApp · Resend (email) · Tailwind. C'est la stack des projets précédents (Yieldly/Linktrip) — réutilise les patterns, n'introduis pas de nouveau framework.
2. **Monorepo** pnpm : `apps/web` (Next, déployé Vercel) + `packages/db` (Prisma partagé). Il n'y a **pas** de worker : `apps/worker` a existé, n'a jamais été branché (aucun job n'était créé en `pending`, sa boucle tournait à vide) et a été supprimé le 12/09/2026.
3. **Aucune queue.** Le traitement des photos tourne **en ligne, dans la requête** : `/api/photos/[photoId]/complete` appelle `lib/photo-processing.ts`, `/api/sorties/[sortieId]/publish` appelle `lib/group-publish.ts`. Pas de Redis, pas de BullMQ, pas d'Inngest, pas de table de jobs. `Photo.status` (UPLOADED → PROCESSING → READY/FAILED) est la seule source de vérité sur l'avancement. Zéro infra en plus.

> **Le produit s'appelle Linktrip en interface** (logo, emails, titres, `hello@linktrip.co`). "Souvenir" est le nom du repo et de ce document — historique, jamais utilisé côté utilisateur.

---

## 3. Architecture réelle

Le modèle métier a divergé de la v1 : plus de "Session/Delivery/Media" ni de compte client — le vocabulaire réel est **Sortie / Slot / Participant / Photo**, en français dans le code et l'UI.

```
souvenir/
├── apps/
│   └── web/                        # Next.js 14 App Router
│   │   ├── app/
│   │   │   ├── (operator)/         # dashboard opérateur, derrière middleware.ts (session Supabase)
│   │   │   │   ├── sorties/                # liste + sorties/[sortieId] + sorties/nouvelle
│   │   │   │   ├── reglages/               # marque, prix, mode, Stripe Connect, automations
│   │   │   │   └── revenus/                # KPIs, GMV, panier moyen
│   │   │   ├── (auth)/             # connexion, mot-de-passe-oublie, reinitialiser
│   │   │   ├── (legal)/            # mentions-legales, cgu, cgv, confidentialite — pages racine
│   │   │   ├── onboarding/         # wizard de création de compte + qualification
│   │   │   ├── signup/
│   │   │   ├── g/[token]/          # galerie privée d'un client (les deux modes) — pas de compte, token = seul secret
│   │   │   │   └── confidentialite/, desinscription/, supprimer/, retrait/
│   │   │   ├── s/[slug]/          # « Retrouvez vos photos » : e-mail → lien privé. Servie sur store.linktrip.co/{slug}
│   │   │   │   ├── [code]/         # le QR de fin de sortie : inscrit l'e-mail à la sortie, envoie le lien
│   │   │   │   └── retrait/        # ancienne adresse, redirige vers la boutique
│   │   │   ├── sitemap.ts, robots.ts   # landing + pages légales uniquement, le reste est exclu
│   │   │   └── api/
│   │   │       ├── webhooks/stripe/        # payment_intent.*, charge.refunded, charge.dispute.*, account.updated
│   │   │       ├── stripe/connect/         # onboarding Connect Express (+refresh, +sync)
│   │   │       ├── checkout/, checkout/confirm/
│   │   │       ├── cron/automations/       # relances email/WhatsApp — Vercel Cron, secured by CRON_SECRET
│   │   │       ├── cron/gdpr-purge/        # purge RGPD — Vercel Cron, secured by CRON_SECRET
│   │   │       ├── sorties/, participants/, photos/, operator/
│   │   │       └── g/[token]/, store/[slug]/link  # galerie privée (poll, achats, choix du départ, retrait) ; demande de lien
│   │   ├── sentry.client.config.ts, sentry.server.config.ts, sentry.edge.config.ts, instrumentation.ts
│   │   ├── components/
│   │   └── lib/                    # stripe.ts, twilio.ts, supabase-server.ts, analytics.ts, gdpr.ts, order-fulfillment.ts, order-refunds.ts, automations.ts…
└── packages/db/                    # schema.prisma + client Prisma partagé (source TS brute, pas de build)
```

- **Auth** : Supabase Auth **email + mot de passe** (pas de magic link) pour les opérateurs/moniteurs uniquement, avec rate-limiting maison (`AuthAttempt` : 5 tentatives/email et 20/IP sur une fenêtre de 15 min — voir `lib/env.ts`/`api/auth/*`). Le participant final n'a JAMAIS de compte — il accède via le token de sa galerie individuelle (`/g/[token]`) dans les deux modes ; en GROUPE, ce lien ne montre que son départ (`Participant.slotId`). `middleware.ts` rafraîchit la session Supabase sur tout le site sauf la landing (`/`), `/g/*` et `/api/webhooks/*`.

**Galerie privée uniquement** (🔒 décidé le 02/10/2026, remplace la boutique publique du 10/09) : aucune photo n'est visible sans le lien personnel `/g/{token}`, reçu par e-mail. `store.linktrip.co/{operator.slug}` ne montre plus rien : le client y entre son e-mail et reçoit les liens des sorties publiées où il figure (réponse identique que l'adresse soit connue ou non). `store.linktrip.co/{slug}/{sortie.shareCode}` est l'adresse du QR de fin de sortie. 🔒 Comme le dossard chez Finisher Memories, **l'e-mail est l'identifiant** : seule une adresse déjà sur la liste de la sortie (collée par le pro) reçoit son lien ; une adresse inconnue ne reçoit rien et rien ne s'inscrit (décidé le 02/10/2026, après qu'une inscription libre par QR ouvrait la galerie à n'importe quelle adresse). Une sortie de groupe sans liste d'adresses ne peut donc rien vendre. Les adresses collées avant publication reçoivent leur lien à la publication (`lib/private-link.ts`, `sendPendingInvites`). Le code n'est jamais réémis (`ensureShareCode`) : un QR imprimé doit continuer de marcher.

En GROUPE, le départ d'un client (`Participant.slotId`) est donné par le pro, jamais choisi par le client : c'est le dossard. Sortie publiée à plusieurs départs : un champ d'adresses par départ (`POST /api/sorties/[id]/invite` avec `slotId`), les liens partent aussitôt ; les adresses collées avant publication attendent dans « Départ à indiquer » (`POST /api/participants/[id]/slot`). S'il n'y a qu'un départ, il est attribué d'office. À partir de deux, le lien d'un client ne part qu'une fois son départ indiqué (`departureKnown`, `lib/private-link.ts`) ; un client qui a payé garde son départ. Ce qu'un lien montre est défini à un seul endroit : `visiblePhotoWhere` (`lib/access.ts`).

**Achats multiples, pack plafonné** : un Participant a plusieurs `Order`. L'accès est l'union des commandes `succeeded` ; le pack est atteint si une commande `isPack` existe ou si le cumul payé atteint `priceAllCents`, et il débloque tout, y compris les photos ajoutées ensuite. Le prix d'un nouvel achat est plafonné à `priceAllCents − déjà payé` (`accessFromOrders`, `remainingCapCents`).

Retrait sans justification : depuis la galerie privée (`/g/{token}/retrait`, `POST /api/g/[token]/hide`), limité aux photos que ce lien montre.

La traduction sous-domaine → chemin interne `/s/{slug}` se fait dans `middleware.ts`, qui y pose aussi le `X-Robots-Tag: noindex` ; sans `NEXT_PUBLIC_STORE_URL` (local, previews) les boutiques se servent depuis le domaine principal sur `/s/...`.
- **Storage** : Cloudflare R2, buckets `originals` (privé, liens signés) et `previews` (public via `R2_PREVIEWS_PUBLIC_URL`). `lib/storage.ts` est la **seule couture** : rien d'autre ne parle au SDK S3. 🔒 **On reste dans l'offre gratuite** (10 Go) : `lib/storage-quota.ts` refuse tout dépôt qui ferait dépasser `STORAGE_QUOTA_GB` (9 Go), la taille déclarée est signée dans l'URL d'envoi (R2 refuse un autre fichier), le contrôle se fait sous verrou Postgres. Ne jamais créer d'objet en dehors de ce compte sans l'y ajouter (`Photo.sizeBytes`). Une URL signée ne supporte aucun paramètre ajouté : un lien de téléchargement se demande à `getOriginalSignedUrl(key, nom)`.
- **Accès DB** : Prisma côté serveur uniquement (server components, route handlers, scripts). Pas de requête Supabase côté client.
- **SEO** : `app/sitemap.ts` et `app/robots.ts` n'exposent que la landing et les 4 pages légales — galeries, boutiques, espace opérateur et auth sont explicitement exclus (`Disallow` + header `X-Robots-Tag: noindex` sur `/g/:path*` et `/s/:path*`, posé dans `next.config.mjs`, et sur le sous-domaine par `middleware.ts`).
- **Monitoring** : Sentry (`@sentry/nextjs`), entièrement optionnel — inerte tant que `NEXT_PUBLIC_SENTRY_DSN` n'est pas définie, l'app démarre sans.

---

## 4. Le traitement des photos — ce qui tourne vraiment

Tout se passe **en ligne, dans la requête Vercel**, il n'y a aucun processus de fond.

- **Une photo déposée** : `/api/photos/[photoId]/complete` → `lib/photo-processing.ts` (sharp) → miniature, aperçu, aperçu flouté pour l'email (`blurEmailKey`), l'aperçu filigrané (`groupPreviewKey`, `lib/group-watermark.ts`) dans les deux modes, et l'heure de prise de vue (`takenAt`, EXIF brute). `maxDuration = 60`.
- **Une sortie GROUPE publiée** : `/api/sorties/[sortieId]/publish` → `lib/group-publish.ts` → regroupement en `Slot` à partir de ce que le dépôt a préparé ; seules les photos sans `groupPreviewKey` (déposées avant le 19/09/2026, ou rendu raté au dépôt) sont retéléchargées pour EXIF + aperçu, 6 en parallèle. L'avancement est renvoyé en flux NDJSON (`lib/progress-stream.ts`) et affiché par l'écran de la sortie. `maxDuration = 120`.
- **Rattrapage** : un aperçu filigrané raté à la publication est régénéré à la demande par `backfillGroupPreviews`, appelé depuis `lib/gallery.ts`. **Au plus une tentative par photo et par tranche de 10 minutes** (`lib/preview-backfill.ts`) : ces deux routes sont sondées toutes les 4 s par la galerie, régénérer sans garde-fou revenait à relancer sharp + canvas toutes les 4 secondes, indéfiniment, sur une route publique.

Écarts à connaître par rapport à la vision produit (§1) et au schéma :
- **Vidéos (depuis le 21/09/2026), sans ffmpeg** : une vidéo est une ligne `Photo` avec `isVideo = true` — même prix, même panier, même purge. Le navigateur de l'opérateur en tire au dépôt une vignette, la durée et l'heure de tournage (`lib/video-probe.ts`, boîte `mvhd` / date Apple) ; la vignette part dans `originals` (`posterKey`, privée : elle est nette) et le serveur la traite comme une photo. **Aucune vidéo n'est jamais décodée côté serveur.** Sans vignette (format illisible par le navigateur), `lib/photo-processing.ts` pose une image de repli. Toute dérivée d'image passe par `imageSourceKeyOf` (`lib/media.ts`), jamais par `originalKey` directement. Avant achat, le client voit la vignette filigranée et la durée ; après, la vidéo s'ouvre dans le lecteur du téléphone. Plafond par vidéo : `NEXT_PUBLIC_MAX_VIDEO_MB` (500 par défaut, pour ne pas consommer le quota gratuit en quelques fichiers).
- **Dépôt en deux temps (depuis le 23/09/2026)** : depuis un téléphone, attendre les originaux (3 à 12 Mo par photo) rendait une sortie de 50 photos publiable en dix minutes. Le navigateur fait maintenant une copie de travail 2048 px de chaque photo de plus de 900 Ko (`lib/fast-copy.ts`, avec une vignette locale 360 px et l'heure EXIF lue en chaîne brute), l'envoie sous `posterKey` (`…-work.jpg`, bucket privé), et le serveur fabrique tout à partir d'elle : la photo est publiable (`status: background` dans la file). L'original part ensuite en tâche de fond (`/api/photos/[photoId]/original` : GET = URL d'envoi neuve, POST = vérifié dans le stockage puis `originalPending = false`). Une vidéo suit le même chemin : vignette d'abord, vidéo ensuite. Tant que `originalPending`, la livraison passe par `deliverableKeyOf` (`lib/media.ts`) : copie de travail pour une photo, rien pour une vidéo. L'original n'avance que si Linktrip reste ouvert sur l'appareil qui a déposé : l'écran de la sortie le dit (« Vos photos arrivent en haute définition »), et sur un autre appareil il dit lequel attendre.
- **File d'envoi refondue (24/09/2026)**, après un test instrumenté en production (20 photos, grille relevée toutes les 50 ms : chaque case changeait trois fois d'image, la grille passait de 20 à 26 cases, la publication arrivait au bout de 115 s dans le banc d'essai). `UploadQueueProvider` tient l'état **en mémoire** (IndexedDB n'est qu'une sauvegarde, fichiers dans un magasin `blobs` à part, `lib/idb.ts` v2) et enchaîne des étapes explicites : préparer (`lib/fast-copy.ts`, plus `quickThumb` qui lit la vignette EXIF sans décoder) → enregistrer **par lots** (`POST /api/sorties/[id]/photos` avec `{ items }`, un seul passage sous le verrou du quota, `withStorageBudget`) → envoyer → `/complete` (qui répond 502 si le traitement échoue) → original. Au démarrage, les éléments d'une sortie supprimée ou d'un autre compte sont retirés, et une URL d'envoi de plus de 5 h est redemandée (`GET /api/photos/[id]/upload`). Dans `SortieScreen`, une photo déposée sur l'appareil garde **sa case et son image locale** jusqu'au bout ; la liste du serveur n'ajoute que ce que l'appareil ne connaît pas, et toute image passe par `components/ui/StableImg.tsx` (la nouvelle source est décodée avant d'être affichée). La publication GROUPE écarte une photo jamais traitée dont le fichier est introuvable au lieu de la publier sans aperçu.
- **Région des fonctions : Paris (`cdg1`, `apps/web/vercel.json`)**. Jusqu'au 24/09/2026 elles tournaient à Washington (`iad1`, défaut Vercel) alors que la base et R2 sont en Europe : 1,7 s pour lire la liste des photos d'une sortie, 5 à 10 s pour enregistrer une photo, 6 à 7 s pour la traiter. Ne pas retirer.
- **Pas de détection de visage** : blazeface (TF.js) a été essayé puis abandonné le 09/09/2026, et ses dépendances retirées le 12/09/2026. Le filigrane est le même sur toutes les photos, c'est ce qui le fait lire comme une signature de marque.
- Le téléchargement groupé (zip) existe, lui : `/api/g/[token]/zip`, fabriqué à la volée, uniquement sur les photos payées.

## 5. Paiements — Stripe Connect

- Connect **Express** en 🔒 **charge directe** (depuis le 19/09/2026) : le PaymentIntent est créé sur le compte de l'opérateur (`{ stripeAccount }`), Linktrip ne perçoit que `application_fee_amount`, les frais Stripe sont à la charge de l'opérateur — voir `lib/checkout.ts`. Raison : en micro-entreprise, le CA déclaré est ce qui est encaissé ; en charge « destination », 100 % du prix des photos comptait comme CA de Linktrip. Ne jamais revenir à `transfer_data`. Toute lecture/mise à jour d'un PaymentIntent passe `{ stripeAccount }`, et le navigateur charge Stripe.js avec `stripeAccount` (`lib/stripe-client.ts`, `getStripe`).
- `Order.status` est un `String` libre (pas d'enum Prisma) : `pending | succeeded | failed | refunded | disputed`. Les vérifications d'accès galerie sont en égalité stricte (`=== "succeeded"`, `lib/gallery.ts`) — tout autre statut re-verrouille automatiquement l'accès au prochain chargement, sans code de révocation séparé.
- Idempotence par relecture d'état DB avant écriture (pas de table d'event-id Stripe) — voir `lib/order-fulfillment.ts` et `lib/order-refunds.ts`.
- Webhook (`api/webhooks/stripe/route.ts`) — une URL, deux endpoints Stripe (plateforme + « comptes connectés »), deux secrets essayés tour à tour. Géré : `payment_intent.succeeded/payment_failed`, `charge.refunded` (total et partiel — pas de politique de remboursement partiel côté produit, tout remboursement verrouille la galerie), `charge.dispute.created/closed`, `account.updated`.

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
- `STRIPE_CONNECT_WEBHOOK_SECRET` est **requise** : c'est le secret de l'endpoint « comptes connectés », par lequel arrivent en charge directe les paiements, remboursements, litiges et `account.updated`.