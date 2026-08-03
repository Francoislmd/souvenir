import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions générales d'utilisation — Linktrip",
  description: "Conditions générales d'utilisation du service Linktrip, pour les opérateurs et les participants.",
};

export default function CguPage() {
  return (
    <>
      <h1>Conditions générales d&apos;utilisation</h1>
      <p className="text-sm text-muted">Dernière mise à jour : 3 août 2026</p>

      <h2 id="objet">1. Objet</h2>
      <p>
        Linktrip est une plateforme qui permet à des professionnels du tourisme et des
        activités outdoor (« <strong>opérateurs</strong> ») de mettre en ligne les photos
        prises pendant leurs sorties, et à leurs clients (« <strong>participants</strong> »)
        d&apos;accéder à une galerie privée pour consulter et acheter leurs souvenirs. Les
        présentes conditions générales d&apos;utilisation (CGU) encadrent l&apos;usage de la
        plateforme par les opérateurs et par les participants. Les conditions financières de
        la relation entre Linktrip et les opérateurs sont détaillées dans les{" "}
        <a href="/cgv">CGV</a>.
      </p>

      <h2 id="comptes">2. Comptes opérateurs</h2>
      <p>
        La création d&apos;un compte opérateur nécessite une adresse email et un mot de passe.
        L&apos;opérateur est responsable de la confidentialité de ses identifiants et de
        toutes les actions effectuées depuis son compte, y compris par les moniteurs qu&apos;il
        y invite. Les participants finaux n&apos;ont jamais de compte : ils accèdent à leur
        galerie via un lien privé et non devinable, propre à chaque sortie.
      </p>

      <h2 id="contenu">3. Contenu mis en ligne par les opérateurs</h2>
      <p>
        L&apos;opérateur garantit être titulaire des droits nécessaires sur les photos et
        vidéos qu&apos;il met en ligne, et avoir informé les participants de la prise de vue
        pendant l&apos;activité, conformément à la réglementation applicable en matière de
        droit à l&apos;image. Linktrip se réserve le droit de retirer tout contenu manifestement
        illicite ou signalé comme tel.
      </p>

      <h2 id="groupe">4. Galeries de groupe : droit à l&apos;image et usage des photos</h2>
      <p>
        Certaines sorties sont proposées en <strong>mode groupe</strong> : les photos prises
        pendant l&apos;activité peuvent montrer plusieurs participants sur un même cliché, et un
        participant qui achète une photo peut donc y voir apparaître d&apos;autres personnes que
        lui-même.
      </p>
      <p>
        En achetant une photo ou en accédant à une galerie de groupe, le participant reconnaît
        et accepte que :
      </p>
      <ul>
        <li>
          les photos achetées sont destinées à un <strong>usage strictement personnel et
          privé</strong> (conservation, tirage, partage dans un cercle familial ou amical
          restreint) ;
        </li>
        <li>
          toute <strong>rediffusion publique</strong> — publication sur un compte de réseau
          social ouvert au public, un site web, ou toute réutilisation commerciale — d&apos;une
          photo sur laquelle apparaît une personne autre que lui-même est interdite sans
          l&apos;accord de cette personne ;
        </li>
        <li>
          il s&apos;interdit d&apos;identifier nommément (tag, légende) une personne tierce
          apparaissant sur une photo sans son consentement.
        </li>
      </ul>
      <p>
        Tout participant qui apparaît sur une photo, qu&apos;il l&apos;ait achetée ou non, peut à
        tout moment demander le retrait de son image de la galerie. Cette demande est traitée
        sans justification à apporter, et la photo concernée est immédiatement masquée pour
        l&apos;ensemble des participants de la sortie. TODO(françois) : confirmer le canal de
        demande à afficher ici (email dédié, formulaire dans la galerie, etc.).
      </p>
      <p>
        L&apos;opérateur reste responsable, vis-à-vis des participants, d&apos;avoir recueilli
        les autorisations nécessaires à la prise de vue en amont de l&apos;activité, conformément
        à ses propres conditions de vente et à la réglementation applicable.
      </p>

      <h2 id="paiement">5. Achat de photos</h2>
      <p>
        L&apos;achat d&apos;une photo ou d&apos;un pack est réalisé via Stripe, prestataire de
        paiement de Linktrip. Le participant est redirigé vers la galerie dès la confirmation
        du paiement, où les photos achetées deviennent immédiatement accessibles en haute
        définition. Les conditions de vente, de rétractation et de remboursement applicables à
        cet achat sont détaillées dans les <a href="/cgv">CGV</a>.
      </p>

      <h2 id="conservation">6. Conservation et suppression des données</h2>
      <p>
        Les photos et les informations d&apos;un participant sont automatiquement supprimées de
        nos serveurs 90 jours après la fin de la sortie, sauf suppression anticipée demandée
        par le participant. Le détail de ce traitement figure dans notre{" "}
        <a href="/confidentialite">politique de confidentialité</a>.
      </p>

      <h2 id="disponibilite">7. Disponibilité du service</h2>
      <p>
        Linktrip met en œuvre des moyens raisonnables pour assurer la disponibilité et la
        sécurité de la plateforme, sans garantie d&apos;absence totale d&apos;interruption
        (maintenance, incident technique chez un sous-traitant, etc.).
      </p>

      <h2 id="modification">8. Modification des CGU</h2>
      <p>
        Linktrip peut modifier les présentes CGU à tout moment. Les opérateurs sont informés de
        toute modification substantielle par email ou via leur espace opérateur.
      </p>

      <h2 id="droit-applicable">9. Droit applicable</h2>
      <p>
        Les présentes CGU sont soumises au droit français. TODO(françois) : confirmer la
        juridiction compétente en cas de litige.
      </p>

      <h2 id="contact">10. Contact</h2>
      <p>
        Pour toute question relative aux présentes CGU, écrivez-nous à{" "}
        <a href="mailto:hello@linktrip.co">hello@linktrip.co</a>.
      </p>
    </>
  );
}
