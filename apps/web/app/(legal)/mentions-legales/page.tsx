import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Mentions légales — Linktrip",
  description: "Informations légales relatives à l'éditeur et à l'hébergeur du site Linktrip.",
};

export default function MentionsLegalesPage() {
  return (
    <>
      <h1>Mentions légales</h1>
      <p className="text-sm text-muted">Dernière mise à jour : 3 août 2026</p>

      <h2 id="editeur">Éditeur du site</h2>
      <p>
        Le site et le service Linktrip sont édités par :{" "}
        <strong>TODO(françois) : raison sociale de la société</strong>, TODO(françois) : forme
        juridique (SAS, SASU, EI…), au capital de TODO(françois) : montant du capital social,
        immatriculée au Registre du Commerce et des Sociétés de TODO(françois) : ville sous le
        numéro SIRET TODO(françois) : numéro SIRET, dont le siège social est situé au
        TODO(françois) : adresse complète.
      </p>
      <p>
        Numéro de TVA intracommunautaire : TODO(françois).
        <br />
        Directeur de la publication : TODO(françois) : nom et qualité du responsable de
        publication.
        <br />
        Contact : <a href="mailto:hello@linktrip.co">hello@linktrip.co</a>
      </p>

      <h2 id="hebergement">Hébergement</h2>
      <p>
        Le site est hébergé par Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789,
        États-Unis. L&apos;infrastructure de base de données et de stockage des fichiers est
        hébergée par Supabase Inc. TODO(françois) : confirmer la région d&apos;hébergement des
        données (UE recommandé pour la conformité RGPD).
      </p>

      <h2 id="propriete">Propriété intellectuelle</h2>
      <p>
        La marque Linktrip, son logo, ainsi que l&apos;ensemble des éléments graphiques,
        textuels et logiciels composant le site sont la propriété exclusive de
        TODO(françois) : raison sociale, sauf mention contraire. Toute reproduction ou
        représentation, totale ou partielle, sans autorisation préalable est interdite.
      </p>
      <p>
        Les photos et vidéos mises en ligne par les opérateurs et livrées aux participants
        restent la propriété de leurs auteurs respectifs (opérateur ou photographe mandaté par
        celui-ci), sous réserve des droits cédés à l&apos;acheteur au moment de l&apos;achat —
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
