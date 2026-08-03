import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales de vente — Linktrip",
  description: "Conditions générales de vente applicables à l'achat de photos sur Linktrip et à la relation commerciale avec les opérateurs.",
};

export default function CgvPage() {
  return (
    <>
      <h1>Conditions générales de vente</h1>
      <p className="text-sm text-muted">Dernière mise à jour : 3 août 2026</p>
      <p>
        Les présentes conditions générales de vente (CGV) régissent, d&apos;une part, la vente
        de photos numériques aux participants via la plateforme Linktrip, et d&apos;autre part
        la relation commerciale entre Linktrip et les opérateurs qui utilisent la plateforme
        pour vendre leurs photos.
      </p>

      <h2 id="participants">A. Achat de photos par un participant</h2>

      <h3 id="prix">Prix et paiement</h3>
      <p>
        Le prix des photos et packs proposés est fixé librement par chaque opérateur et affiché
        avant toute confirmation d&apos;achat, toutes taxes comprises. Le paiement est réalisé en
        ligne par carte bancaire via Stripe, prestataire de paiement sécurisé. Linktrip
        n&apos;a jamais accès aux données bancaires du participant.
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
        dans sa galerie. TODO(françois) : confirmer que cette renonciation est bien recueillie
        explicitement (case à cocher ou mention équivalente) au moment du paiement — sinon
        l&apos;ajouter au parcours de paiement.
      </p>

      <h3 id="remboursement-participant">Remboursement</h3>
      <p>
        TODO(françois) : préciser la politique de remboursement applicable aux participants
        (cas éventuels acceptés — erreur de facturation, photo corrompue — et modalités de
        demande). En l&apos;absence de politique spécifique, seuls les remboursements décidés au
        cas par cas par Linktrip ou l&apos;opérateur, ou imposés par une contestation bancaire
        (chargeback), sont traités.
      </p>

      <h2 id="operateurs">B. Relation commerciale avec les opérateurs</h2>

      <h3 id="commission">Commission</h3>
      <p>
        L&apos;inscription sur Linktrip est gratuite et sans engagement. Linktrip prélève une
        commission sur chaque vente réalisée via la plateforme ; le solde est reversé à
        l&apos;opérateur. Le taux de commission applicable est TODO(françois) : confirmer le
        taux affiché publiquement (20 % par défaut selon la configuration actuelle de la
        plateforme) — il est rappelé à l&apos;opérateur dans son espace de réglages avant toute
        vente.
      </p>

      <h3 id="reversement">Reversement des fonds</h3>
      <p>
        Les paiements des participants sont collectés par Stripe pour le compte de
        l&apos;opérateur (Stripe Connect), qui doit à ce titre créer et maintenir à jour un
        compte Stripe Connect valide. La part revenant à l&apos;opérateur (prix de vente moins
        commission Linktrip) est reversée automatiquement par Stripe selon le calendrier de
        versement propre à son compte Stripe. Linktrip n&apos;intervient pas dans la conservation
        des fonds.
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
