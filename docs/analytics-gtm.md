# Tracking — Google Tag Manager + GA4

Le code ne dépend d'aucun ID en dur : tout passe par `NEXT_PUBLIC_GTM_ID`.

## Identifiants (compte `flemarchand@linktrip.co`)

| Quoi | Valeur |
| --- | --- |
| Conteneur GTM | `GTM-WRKSFP72` |
| ID de mesure GA4 | `G-YZ2GD0BFBZ` |
| Compte GA4 / propriété | `404362077` / `549565650` |
| Compte GTM / conteneur | `6370936983` / `260983530` |

Tout ce qui est décrit aux §3, §4 et §5 est **déjà configuré**. Ces sections servent de
documentation de l'existant (et de mode d'emploi si le conteneur doit être recréé).

---

## 1. Ce qui est en place dans le code

| Fichier | Rôle |
| --- | --- |
| `components/analytics/GoogleTagManager.tsx` | Charge gtm.js + pose les défauts **Consent Mode v2** (tout `denied`) avant toute balise |
| `components/analytics/CookieBanner.tsx` | Bandeau Accepter / Refuser / Personnaliser, met à jour Consent Mode |
| `components/analytics/PageViewTracker.tsx` | Pousse un `page_view` à chaque navigation client (App Router) |
| `lib/consent.ts` | Lecture/écriture du choix (`localStorage`, clé `lt_consent_v1`, 6 mois) |
| `lib/gtm.ts` | **Seul** point d'entrée du dataLayer : événements typés + helpers e-commerce GA4 |
| `lib/marketing-analytics.ts` | Les événements landing existants alimentent désormais le dataLayer |

Sans `NEXT_PUBLIC_GTM_ID`, **rien n'est chargé** : aucune requête, aucune donnée. C'est voulu pour
le dev local et les previews Vercel, qui ne doivent pas polluer les rapports de production.

---

## 1 bis. Ce qu'il reste à faire

Vercel est déjà configuré : `NEXT_PUBLIC_GTM_ID` et `NEXT_PUBLIC_GA4_ID` sont posées sur le
projet `souvenir`, **scope Production uniquement** (les previews ne doivent pas polluer GA4).

1. **Déployer le code.** Le projet Vercel n'est pas relié à Git : la dernière production a été
   poussée à la main et ne contient pas encore le code de mesure. Commiter, puis `vercel --prod`.
   Un « Redeploy » depuis le dashboard ne servirait à rien : il reconstruirait l'ancien commit.

2. **Recette.** Suivre le §8 (Tag Assistant + Temps réel GA4).

3. **Marquer 3 événements clés** — GA4 n'autorise le marquage qu'une fois l'événement reçu au
   moins une fois. Après le premier trafic réel : Administration → *Événements* → étoile sur
   `generate_lead`, `sign_up`, `onboarding_complete`. (`purchase` est déjà clé, définitivement.)

4. **Compléter `/confidentialite`** : la section cookies est écrite et à jour, mais deux TODO
   subsistent (raison sociale du responsable de traitement, localisation des données chez
   Supabase / Stripe / Twilio / Resend / Vercel).

## 2. Créer la propriété GA4 et le conteneur GTM (déjà fait — pour mémoire)

### 2.1 Créer la propriété GA4

1. <https://analytics.google.com> → **Administrateur** → **Créer** → **Propriété**
2. Nom `Linktrip`, fuseau **France**, devise **EUR**
3. Flux de données → **Web** → URL `https://linktrip.co`, nom du flux `Linktrip — Web`
4. Dans le flux, **désactiver** « Vues de page » dans *Mesure améliorée*
   → les vues de page sont envoyées par le code (SPA), sinon elles seraient comptées deux fois.
   Laisser activés : clics sortants, téléchargements, défilement, recherche sur le site.
5. Noter l'**ID de mesure** `G-XXXXXXXXXX`
6. Administrateur → **Paramètres des données → Conservation des données** : passer à **14 mois**
   (2 mois par défaut, ce qui rend toute analyse annuelle impossible)

### 2.2 Créer le conteneur GTM

1. <https://tagmanager.google.com> → **Créer un compte**
   Compte `Linktrip`, conteneur `linktrip.co`, plateforme **Web**
2. Noter l'**ID** `GTM-XXXXXXX`

### 2.3 Renseigner les variables d'environnement

```bash
# .env.local (dev) — laisser vide pour ne rien charger
NEXT_PUBLIC_GTM_ID=
NEXT_PUBLIC_GA4_ID=
```

En production (Vercel → Settings → Environment Variables, scope **Production** uniquement) :

```
NEXT_PUBLIC_GTM_ID=GTM-XXXXXXX
NEXT_PUBLIC_GA4_ID=G-XXXXXXXXXX
```

Redéployer : ces variables sont inlinées au build, un simple redémarrage ne suffit pas.

---

## 3. Configuration du conteneur GTM

### 3.1 Variables

**Variables intégrées** — cocher au minimum : `Page Path`, `Page URL`, `Referrer`, `Click URL`,
`Click Text`, `Event`.

**Variable constante**

| Nom | Type | Valeur |
| --- | --- | --- |
| `CONST - GA4 Measurement ID` | Constante | `G-XXXXXXXXXX` |

**Variables de couche de données** — type *Variable de couche de données*, version 2.
Créer une variable par clé, en nommant `DLV - <clé>` :

`operator_id`, `sortie_id`, `participant_id`, `photos_total`, `photos_paid`, `photos_selected`,
`pack_only`, `reduced_offer`, `step_name`, `step_index`, `lead_method`, `method`,
`activities`, `activities_count`, `selection_source`, `page_path`, `page_title`, `page_location`,
`consent_analytics`, `consent_ads`.

### 3.2 Déclencheurs

| Nom | Type | Condition |
| --- | --- | --- |
| `CE - page_view` | Événement personnalisé | `page_view` |
| `CE - generate_lead` | Événement personnalisé | `generate_lead` |
| `CE - sign_up` | Événement personnalisé | `sign_up` |
| `CE - onboarding` | Événement personnalisé | regex `^(sign_up_start\|onboarding_step\|onboarding_complete\|stripe_onboarding_(start\|done))$` |
| `CE - ecommerce` | Événement personnalisé | regex `^(view_item_list\|add_to_cart\|remove_from_cart\|begin_checkout\|add_payment_info\|purchase)$` |
| `CE - gallery` | Événement personnalisé | regex `^(gallery_open\|select_all_photos\|review_click\|photo_preview)$` |
| `CE - purchase` | Événement personnalisé | `purchase` |

### 3.3 Balises

**1. Balise de configuration GA4**

- Type : *Google Tag*
- ID de balise : `{{CONST - GA4 Measurement ID}}`
- Paramètres de configuration : `send_page_view` = `false` ← **indispensable**, sinon double comptage
- Déclencheur : **Initialization – All Pages**
- Paramètres partagés (envoyés sur tous les événements) :
  `operator_id` = `{{DLV - operator_id}}`, `sortie_id` = `{{DLV - sortie_id}}`

**2. GA4 — page_view**

- Type : *Événement GA4*, nom `page_view`
- Paramètres : `page_path` = `{{DLV - page_path}}`, `page_title` = `{{DLV - page_title}}`,
  `page_location` = `{{DLV - page_location}}`
- Déclencheur : `CE - page_view`

**3. GA4 — e-commerce**

- Type : *Événement GA4*, nom `{{Event}}`
- Cocher **« Envoyer les données d'e-commerce »** → source : *Variable de couche de données*
- Paramètres : `participant_id` = `{{DLV - participant_id}}`, `reduced_offer` = `{{DLV - reduced_offer}}`
- Déclencheur : `CE - ecommerce`

**4. GA4 — événements métier**

- Type : *Événement GA4*, nom `{{Event}}`
- Paramètres : `lead_method`, `method`, `step_name`, `step_index`, `activities_count`,
  `selection_source`, `photos_paid` (via les DLV correspondantes)
- Déclencheurs : `CE - generate_lead`, `CE - sign_up`, `CE - onboarding`, `CE - gallery`

### 3.4 Paramètres de consentement (onglet *Consentement* de chaque balise)

Sur les balises GA4 : laisser **« Non défini »** — le Consent Mode intégré de Google gère déjà
`analytics_storage`. Sur toute balise tierce ajoutée plus tard (Meta Pixel, LinkedIn…), régler
**Consentement supplémentaire requis** = `ad_storage` + `analytics_storage`.

### 3.5 Publier

**Prévisualiser** (Tag Assistant) → parcourir le site → vérifier les événements → **Envoyer**.

---

## 4. Conversions à marquer dans GA4

Administrateur → *Événements clés* → activer :

| Événement | Ce qu'il mesure |
| --- | --- |
| `generate_lead` | Email capturé (hero ou liste d'attente) |
| `sign_up` | Compte créé |
| `onboarding_complete` | Opérateur réellement activé — **la vraie conversion B2B** |
| `purchase` | Achat de photos par un client final (avec `value` en EUR) |

---

## 5. Dimensions et métriques personnalisées

Administrateur → *Définitions personnalisées* → **Créer une dimension personnalisée** (portée
*Événement*) pour chaque paramètre à exploiter dans les rapports :

| Nom | Paramètre | Utilité |
| --- | --- | --- |
| Prestataire | `operator_id` | Comparer les performances entre pros |
| Sortie | `sortie_id` | Taux de conversion par sortie |
| Étape onboarding | `step_name` | Entonnoir d'inscription |
| Source du lead | `lead_method` | Hero vs liste d'attente |
| Offre réduite | `reduced_offer` | Impact de la remise de 20 % |
| Pack uniquement | `pack_only` | Effet du mode « tout ou rien » |

> ⚠️ Ces dimensions ne sont pas rétroactives : les créer **avant** de lancer les campagnes.

---

## 6. Carte des événements envoyés par le code

### Acquisition

| Événement | Déclenché depuis | Paramètres |
| --- | --- | --- |
| `page_view` | Toute navigation | `page_path`, `page_title`, `page_location`, `page_referrer` |
| `hero_email_submit` + `generate_lead` | `EmailCaptureField` | `lead_method: hero` |
| `waitlist_submit` + `generate_lead` | `WaitlistForm` | `lead_method: waitlist` |
| `simulator_interact` / `simulator_values` | `RevenueSlider` | valeurs du simulateur |

### Inscription opérateur

| Événement | Déclenché depuis | Paramètres |
| --- | --- | --- |
| `sign_up_start` | Étape 1 du wizard | `method` |
| `onboarding_step` | Chaque étape | `step_name`, `step_index`, `step_total` |
| `sign_up` | Compte Supabase créé | `method`, `verification_pending` |
| `onboarding_complete` | Opérateur créé en base | `activities`, `activities_count`, `city`, `price_photo_euros`, `price_all_euros` |
| `stripe_onboarding_start` / `stripe_onboarding_done` | Étape paiements | `skipped` |

### Galerie client (e-commerce GA4)

| Événement | Déclenché depuis | Paramètres |
| --- | --- | --- |
| `gallery_open` | Ouverture de la galerie | `photos_total`, `photos_free`, `photos_paid`, `pack_only`, `reduced_offer` |
| `view_item_list` | Ouverture de la galerie | `items[]`, `item_list_name` |
| `add_to_cart` / `remove_from_cart` | Sélection d'une photo | `items[]`, `value`, `selection_source` |
| `select_all_photos` | Bouton « tout prendre » | `photos_paid` |
| `begin_checkout` | Clic sur payer | `items[]`, `value`, `photos_selected` |
| `add_payment_info` | Feuille Stripe ouverte | `items[]`, `value`, `payment_type: stripe` |
| `purchase` | Paiement confirmé | `transaction_id` (= participantId), `value`, `tax: 0`, `shipping: 0`, `items[]` |
| `review_click` | Clic sur « Laisser un avis » | `platform: google` |

Tous les événements de la galerie portent `operator_id`, `sortie_id` et `participant_id`.

---

## 7. Conformité RGPD

- Défauts Consent Mode v2 : `ad_storage`, `ad_user_data`, `ad_personalization`,
  `analytics_storage`, `personalization_storage` → **denied** ; `security_storage` et
  `functionality_storage` → granted.
- `ads_data_redaction` et `url_passthrough` activés : sans cookies, gclid/utm survivent quand même
  à la navigation, et les pings publicitaires sont anonymisés.
- Refuser est aussi simple qu'accepter (bouton de même niveau) — exigence CNIL.
- Le choix est redemandé au bout de **6 mois**.
- Pour rouvrir le bandeau depuis un lien « Gérer mes cookies » :

  ```tsx
  "use client";
  import { openCookieBanner } from "@/components/analytics/CookieBanner";

  <button onClick={openCookieBanner}>Gérer mes cookies</button>
  ```

- Penser à mettre à jour `/confidentialite` : liste des cookies, finalités, durées, destinataire
  (Google Ireland Ltd), et le fait que les données transitent hors UE (clauses contractuelles types).

### Point d'attention : `purchase` côté client

L'achat est envoyé depuis le navigateur, à la confirmation Stripe. Deux limites connues :

1. si l'analytics est refusé, l'achat n'est pas remonté à GA4 ;
2. un bloqueur de publicité peut empêcher l'envoi.

Le chiffre d'affaires réel reste celui de Stripe / de la table `Order`. Pour une mesure exhaustive,
l'étape suivante serait un **envoi serveur** (Measurement Protocol GA4) depuis le webhook Stripe,
en dédupliquant sur `transaction_id` — déjà égal au `participantId`, donc prêt pour ça.

---

## 8. Recette avant publication

1. `pnpm dev` avec `NEXT_PUBLIC_GTM_ID` renseigné dans `.env.local`
2. Ouvrir le **Tag Assistant** (bouton *Prévisualiser* dans GTM)
3. Vérifier, dans l'ordre :
   - au chargement : `consent` par défaut = tout `denied`, aucun cookie `_ga`
   - clic « Tout accepter » → `consent_update` puis apparition du cookie `_ga`
   - navigation entre pages → un seul `page_view` par page, jamais deux
   - galerie de test → `view_item_list`, `add_to_cart`, `begin_checkout`, `purchase`
   - dans GA4 → *Rapports* → **Temps réel** : les événements arrivent avec leurs paramètres
4. Rejouer le parcours en refusant : aucun cookie `_ga`, seulement des pings sans identifiant.
