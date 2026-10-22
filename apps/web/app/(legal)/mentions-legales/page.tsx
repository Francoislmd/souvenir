import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Linktrip",
  description: "Informations légales relatives à l'éditeur et à l'hébergeur du site Linktrip.",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <h1>Mentions légales</h1>
      <p className="text-sm text-muted">Dernière mise à jour : 22 octobre 2026</p>

      <h2 id="editeur">Éditeur du site</h2>
      <p>
        Le site et le service Linktrip sont édités par <strong>François Lemarchand</strong>,
        entrepreneur individuel (EI), exerçant sous le nom commercial Linktrip.
      </p>
      <p>
        SIRET : 131 395 865 00010, inscrit au Registre national des entreprises (RNE).
        <br />
        Adresse : 19 rue George Sand, 75016 Paris, France.
        <br />
        TVA non applicable, article 293 B du Code général des impôts.
        <br />
        Directeur de la publication : François Lemarchand.
        <br />
        Contact : <a href="mailto:hello@linktrip.co">hello@linktrip.co</a>
      </p>

      <h2 id="hebergement">Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 440 N Barranca Avenue #4133, Covina, CA 91723,
        États-Unis (vercel.com). Les serveurs qui exécutent le site sont situés à Paris.
      </p>
      <p>
        La base de données est hébergée par Supabase Inc. (supabase.com), à Paris. Les photos
        et vidéos sont stockées par Cloudflare, Inc., 101 Townsend Street, San Francisco,
        CA 94107, États-Unis (cloudflare.com), dans des centres de données situés en Europe
        de l&apos;Ouest.
      </p>

      <h2 id="propriete">Propriété intellectuelle</h2>
      <p>
        La marque Linktrip, son logo, ainsi que l&apos;ensemble des éléments graphiques,
        textuels et logiciels composant le site sont la propriété exclusive de François
        Lemarchand (EI), sauf mention contraire. Toute reproduction ou représentation, totale
        ou partielle, sans autorisation préalable est interdite.
      </p>
      <p>
        Les photos et vidéos mises en ligne par les opérateurs et livrées aux participants
        restent la propriété de leurs auteurs respectifs (opérateur ou photographe mandaté par
        celui-ci), sous réserve des droits cédés à l&apos;acheteur au moment de l&apos;achat :
        voir les <a href="/cgu">CGU</a>.
      </p>

      <h2 id="responsabilite">Responsabilité</h2>
      <p>
        Linktrip agit en tant qu&apos;intermédiaire technique entre les opérateurs d&apos;activités
        (écoles de surf, moniteurs, guides, etc.) et les participants à leurs sorties. Linktrip
        ne prend pas les photos, n&apos;organise pas les activités et n&apos;est pas partie au
        contrat conclu entre l&apos;opérateur et son client pour la prestation d&apos;activité
        elle-même.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        Pour toute question relative aux présentes mentions légales, écrivez-nous à{" "}
        <a href="mailto:hello@linktrip.co">hello@linktrip.co</a>.
      </p>
    </>
  );
}
