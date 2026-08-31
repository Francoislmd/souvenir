# Repartir sur un projet Supabase neuf (31/08/2026)

Le projet Supabase `gjkgcctxejpsuwilwalp` est restreint pour dépassement du quota
de stockage (2,55 Go pour 1 Go inclus). Restriction = plus d'auth, plus de Data
API, et **aucun moyen de supprimer les fichiers** : l'API Storage répond 402 même
avec la clé `service_role`, et la suppression directe dans `storage.objects` est
bloquée par le trigger Supabase `protect_objects_delete`.

La seule sortie gratuite est donc de supprimer le projet et d'en repartir un neuf.
Les photos vivant désormais chez Cloudflare R2 (commit `54b52f9`), le nouveau
projet ne contiendra plus que Postgres et l'auth — quelques dizaines de Mo, sous
le quota gratuit pour longtemps.

## Ce qu'on perd, et pourquoi ce n'est pas grave

Inventaire fait le 31/08/2026 avant toute suppression :

| Table | Lignes | Nature |
|---|---|---|
| `Event` | 2 446 | analytics de test |
| `AuthAttempt` | 142 | rate-limit, éphémère par construction |
| `Sortie` | 82 | sorties de test |
| `Participant` | 68 | participants de test |
| `auth.users` | 53 | **aucun compte réel** (voir ci-dessous) |
| `Slot` | 41 | créneaux de test |
| `Order` | 30 | Stripe en mode test |
| `User` / `Operator` | 7 / 7 | comptes de test de François |
| `Waitlist` | **1** | **le seul enregistrement réel** |

Les 53 comptes `auth.users` se décomposent en 31 `test-*@example.com` créés par
des scripts de test, 18 adresses de François, `rosas@gmail.com` et
`test@teszt.fr`. Aucun opérateur réel, donc **aucun hash de mot de passe à
migrer** — c'est ce qui rend l'opération simple.

Le seul vrai contenu est la ligne `Waitlist`, sauvegardée dans
`docs/sauvegarde-waitlist-2026-08-31.json` :
**La guilde de l'eau vive** (rafting, 500 à 2 000 clients/an, vend déjà ses
photos) — inscrite le 27/08/2026. C'est un prospect qualifié, à ne pas perdre.

## Marche à suivre

L'étape 1 est irréversible. Tout ce qui doit être conservé l'est déjà dans
`docs/` — relire la section ci-dessus avant de cliquer.

1. **Supprimer le projet `souvenir`** : tableau de bord → Settings → General →
   Delete project. C'est une action du plan de contrôle, elle fonctionne malgré
   la restriction. Les 2,55 Go partent avec, l'organisation repasse sous quota.
   Tant qu'il est là, aucun autre projet ne peut servir de requêtes : le quota
   est compté au niveau de l'organisation, pas du projet.
   *Au passage* : le projet `francoislemarchand4@gmail.com's Project`
   (eu-north-1, en pause) est celui créé d'office avec le compte, jamais utilisé.
   Autant le supprimer aussi.

2. **Créer le nouveau projet.** Région : `eu-west-3` (Paris) si elle est
   proposée, sinon `eu-central-1` (Francfort) — plus proche des utilisateurs
   français que l'ancien `eu-west-1` (Irlande), et plus simple à défendre côté
   RGPD auprès des prestataires.

3. **Reporter les nouvelles valeurs** dans `apps/web/.env.local` :
   `DATABASE_URL`, `DIRECT_URL`, `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

4. **Créer le schéma** — il n'y a pas de dossier `migrations`, le projet
   fonctionne en `db push` :
   ```
   pnpm --filter @souvenir/db db:push
   ```

5. **Remettre le prospect** de la liste d'attente :
   ```sql
   insert into "Waitlist" (id, "createdAt", "updatedAt", email, company, activity, "yearlyGuests", "photoUsage", source, "userAgent")
   values ('cmtc19jtp00011q5sg7ah62r3', '2026-08-27T21:26:57.182Z', '2026-08-27T21:26:57.182Z',
           'laguilde05@gmail.com', 'La guilde de l''eau vive', 'Rafting', '500 à 2 000',
           'Je les vends déjà', 'liste-attente', 'iPhone / Safari');
   ```

6. **Mettre en place R2** — voir `apps/web/.env.example` pour les six variables :
   créer les deux buckets et un jeton « Object Read & Write », puis
   ```
   R2_CORS_ORIGINS="https://linktrip.co,http://localhost:3000" pnpm --filter @souvenir/worker setup:storage
   ```
   Le script crée les buckets et pose la règle CORS. Il reste **un réglage
   manuel** qu'aucune API ne fait : bucket `previews` → Settings → Public access
   → rattacher un domaine (ex. `images.linktrip.co`), et reporter cette URL dans
   `R2_PREVIEWS_PUBLIC_URL`. Laisser `originals` privé.

7. **Reporter toutes ces variables sur Vercel** (les cinq Supabase mises à jour
   + les six R2 ajoutées), puis déployer depuis `apps/web` :
   ```
   vercel --prod
   ```

8. **Recréer un compte opérateur** via `/signup`, et **redéposer le logo** dans
   Réglages : `Operator.logoUrl` stocke une URL absolue, les anciennes pointent
   vers le domaine Supabase disparu.

## Vérifications une fois en ligne

- `/connexion` : créer un compte, se connecter, se déconnecter.
- Déposer trois photos sur une sortie. **C'est le test qui compte** : l'envoi se
  fait en PUT direct du navigateur vers R2, donc il valide d'un coup les
  identifiants, la règle CORS et l'URL signée. En cas d'échec, regarder l'onglet
  réseau : une erreur CORS s'y voit tout de suite.
- Ouvrir la galerie client : si les aperçus ne s'affichent pas alors que les
  photos sont bien dans le bucket, c'est l'accès public de `previews` ou
  `R2_PREVIEWS_PUBLIC_URL` qui manque.
- Vérifier que le quota de stockage du nouveau projet Supabase reste à quelques
  Mo — s'il grimpe, c'est qu'un chemin d'écriture est resté sur Supabase.
