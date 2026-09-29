import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales de vente — Linktrip",
  description: "Conditions générales de vente applicables à l'achat de photos sur Linktrip et à la relation commerciale avec les opérateurs.",
};

export default function CgvPage() {
  return (
    <>
      <h1>Conditions générales de vente</h1>
      <p className="text-sm text-muted">Dernière mise à jour : 29 septembre 2026</p>
      <p>
        Les présentes conditions générales de vente (CGV) régissent, d&apos;une part, la vente
        de photos numériques aux participants via la plateforme Linktrip, et d&apos;autre part
        la relation commerciale entre Linktrip et les opérateurs qui utilisent la plateforme
        pour vendre leurs photos.
      </p>

      <h2 id="participants">A. Achat de photos par un participant</h2>

      <h3 id="vendeur">Vendeur</h3>
      <p>
        Les photos sont vendues par l&apos;opérateur qui a organisé la sortie et les a prises,
        et non par Linktrip. Linktrip fournit à l&apos;opérateur la plateforme technique qui
        permet de les présenter, de les vendre et de les livrer. L&apos;identité de
        l&apos;opérateur (raison sociale, adresse, numéro SIRET, contact) est affichée avant le
        paiement, sur la feuille de paiement et dans ses conditions de vente, puis reprise sur
        le reçu.
      </p>

      <h3 id="prix">Prix et paiement</h3>
      <p>
        Le prix des photos et packs proposés est fixé librement par chaque opérateur et affiché
        avant toute confirmation d&apos;achat, toutes taxes comprises. Le paiement est réalisé en
        ligne par carte bancaire via Stripe, prestataire de paiement sécurisé, et encaissé
        directement sur le compte Stripe de l&apos;opérateur. Linktrip n&apos;a jamais accès aux
        données bancaires du participant.
      </p>

      <h3 id="livraison">Livraison</h3>
      <p>
        Les photos achetées sont livrées immédiatement après confirmation du paiement : elles
        deviennent accessibles en haute définition, sans filigrane, directement dans la galerie
        privée du participant, à l&apos;adresse qui lui a été communiquée par l&apos;opérateur.
      </p>

      <h3 id="retractation">Droit de rétractation</h3>
      <p>
        Conformément à l&apos;article L221-28 13° du Code de la consommation, le droit de
        rétractation ne s&apos;applique pas à la fourniture d&apos;un contenu numérique non
        fourni sur un support matériel dont l&apos;exécution a commencé après accord préalable
        exprès du consommateur et renoncement exprès à son droit de rétractation. En procédant
        au paiement, le participant reconnaît demander une livraison immédiate de ses photos et
        renonce expressément à son droit de rétractation dès que celles-ci sont accessibles
        dans sa galerie. Cette renonciation est portée à sa connaissance sur la feuille de
        paiement, avant tout bouton de paiement, et confirmée sur le reçu qui lui est adressé.
      </p>

      <h3 id="remboursement-participant">Garantie et remboursement</h3>
      <p>
        Les photos bénéficient de la garantie légale de conformité des contenus numériques
        (articles L224-25-1 et suivants du Code de la consommation). Une photo floue, illisible,
        corrompue ou différente de l&apos;aperçu présenté avant l&apos;achat est remboursée par
        l&apos;opérateur sur simple demande du participant, en répondant au reçu ou en écrivant
        à l&apos;adresse de contact de l&apos;opérateur. En dehors de ces cas, le participant
        ayant demandé la livraison immédiate de ses photos, aucun remboursement n&apos;est dû.
      </p>

      <h3 id="recu">Reçu</h3>
      <p>
        Après chaque paiement, le participant reçoit un reçu par e-mail ou par WhatsApp, selon
        le moyen par lequel l&apos;opérateur lui a transmis ses photos. Ce reçu reprend le
        contenu de la commande, le prix payé, l&apos;identité de l&apos;opérateur et la
        renonciation au droit de rétractation. Il vaut confirmation du contrat.
      </p>

      <h2 id="operateurs">B. Relation commerciale avec les opérateurs</h2>

      <h3 id="commission">Commission</h3>
      <p>
        L&apos;inscription sur Linktrip est gratuite et sans engagement. Linktrip prélève une
        commission sur chaque vente réalisée via la plateforme ; le solde est reversé à
        l&apos;opérateur. Le taux de commission est de 20 %. Il est rappelé à l&apos;opérateur
        dans son espace de réglages avant toute vente. La commission est calculée sur le prix de vente TTC payé par le participant.
      </p>

      <h3 id="frais-paiement">Frais de paiement</h3>
      <p>
        Les frais de traitement des paiements facturés par Stripe sont à la charge de
        l&apos;opérateur. Ils sont prélevés par Stripe sur chaque paiement, en plus de la
        commission Linktrip, selon la tarification de Stripe en vigueur.
      </p>

      <h3 id="reversement">Reversement des fonds</h3>
      <p>
        Les paiements des participants sont encaissés directement sur le compte Stripe de
        l&apos;opérateur (Stripe Connect), qui doit à ce titre créer et maintenir à jour un
        compte valide. Au moment de chaque paiement, Stripe prélève la commission Linktrip et
        ses propres frais ; le solde reste sur le compte de l&apos;opérateur et part vers sa
        banque selon le calendrier de versement qu&apos;il y a réglé. Les fonds ne transitent
        jamais par Linktrip.
      </p>
      <p>
        L&apos;opérateur étant le vendeur, les remboursements et les contestations de paiement
        (chargebacks) sont imputés sur son compte Stripe. En cas de remboursement total,
        TODO(françois) : préciser si la commission Linktrip est restituée à l&apos;opérateur.
      </p>

      <h3 id="responsabilite-operateur">Responsabilité de l&apos;opérateur</h3>
      <p>
        L&apos;opérateur reste seul responsable de la conformité de son activité, de
        l&apos;organisation de ses sorties, de la qualité et de la légalité des photos qu&apos;il
        met en ligne, ainsi que du recueil des autorisations de prise de vue auprès de ses
        participants.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        Pour toute question relative aux présentes CGV, écrivez-nous à{" "}
        <a href="mailto:hello@linktrip.co">hello@linktrip.co</a>.
      </p>
    </>
  );
}
