import type { Metadata } from "next";
import { ManageCookiesLink } from "@/components/analytics/ManageCookiesLink";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Linktrip",
  description: "Comment Linktrip collecte, utilise et protège les données personnelles des opérateurs et des participants.",
};

export default function ConfidentialitePage() {
  return (
    <>
      <h1>Politique de confidentialité</h1>
      <p className="text-sm text-muted">Dernière mise à jour : 11 août 2026</p>
      <p>
        Cette page vous explique quelles données personnelles Linktrip collecte, pourquoi, et
        combien de temps elles sont conservées. Si vous êtes participant à une sortie, vous
        trouverez aussi une version courte de cette politique, propre à votre galerie, dans
        les réglages de celle-ci.
      </p>

      <h2 id="responsable">Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données décrites ci-dessous est TODO(françois) :
        raison sociale de la société, contactable à{" "}
        <a href="mailto:hello@linktrip.co">hello@linktrip.co</a>.
      </p>

      <h2 id="donnees">Données que nous collectons</h2>
      <p>Selon votre usage de Linktrip, nous collectons :</p>
      <ul>
        <li>
          <strong>Opérateurs et moniteurs</strong> : email et mot de passe, nom de
          l&apos;activité, informations de facturation et d&apos;identité transmises à Stripe
          pour l&apos;ouverture d&apos;un compte de paiement (Stripe Connect).
        </li>
        <li>
          <strong>Participants</strong> : nom, et un moyen de contact (email ou numéro de
          téléphone WhatsApp) transmis par l&apos;opérateur ou saisi lors de l&apos;inscription
          à une sortie, afin de vous envoyer le lien de votre galerie privée.
        </li>
        <li>
          <strong>Photos</strong> : les photos prises pendant votre sortie par l&apos;opérateur,
          ainsi que leurs versions aperçu et miniature générées automatiquement.
        </li>
      </ul>

      <h2 id="finalites">Pourquoi nous les utilisons</h2>
      <ul>
        <li>créer et livrer votre galerie de photos privée ;</li>
        <li>vous permettre d&apos;acheter vos photos et traiter le paiement via Stripe ;</li>
        <li>vous envoyer votre galerie et d&apos;éventuelles relances par email ou WhatsApp ;</li>
        <li>assurer le support et répondre à vos demandes ;</li>
        <li>mesurer l&apos;usage de la plateforme de façon agrégée, pour l&apos;opérateur.</li>
      </ul>

      <h2 id="conservation">Combien de temps nous les conservons</h2>
      <p>
        Vos photos et vos coordonnées de participant sont conservées <strong>90 jours</strong>{" "}
        après votre inscription à la sortie. Passé ce délai, un processus automatique
        (exécuté quotidiennement) :
      </p>
      <ul>
        <li>supprime définitivement vos photos de nos serveurs de stockage ;</li>
        <li>
          anonymise votre fiche participant (nom et contact effacés), sans conserver de moyen
          de vous identifier a posteriori.
        </li>
      </ul>
      <p>
        Pour les sorties en mode groupe, l&apos;ensemble des photos de la sortie est supprimé
        selon le même principe, 90 jours après la publication de la sortie.
      </p>
      <p>
        Vous pouvez à tout moment demander la suppression immédiate de vos données depuis votre
        galerie, sans attendre ce délai.
      </p>

      <h2 id="destinataires">Qui a accès à vos données</h2>
      <p>
        Vos photos ne sont accessibles qu&apos;à vous, via le lien privé de votre galerie (et,
        en mode groupe, aux autres participants de la même sortie pour les photos où ils
        figurent également — voir les <a href="/cgu">CGU</a>). L&apos;opérateur qui a organisé
        votre sortie a accès à vos coordonnées de contact et à l&apos;historique de vos achats.
      </p>

      <h2 id="sous-traitants">Nos sous-traitants</h2>
      <p>Pour fonctionner, Linktrip s&apos;appuie sur les prestataires suivants :</p>
      <ul>
        <li><strong>Supabase</strong> — hébergement de la base de données et stockage des photos ;</li>
        <li><strong>Stripe</strong> — traitement des paiements ;</li>
        <li><strong>Twilio</strong> — envoi des messages WhatsApp ;</li>
        <li><strong>Resend</strong> — envoi des emails ;</li>
        <li><strong>Vercel</strong> — hébergement du site et exécution des tâches planifiées ;</li>
        <li>
          <strong>Google Ireland Limited</strong> — mesure d&apos;audience du site
          (Google Analytics 4 et Google Tag Manager), uniquement si vous y consentez.
        </li>
      </ul>
      <p>
        Google Analytics peut transférer des données vers les États-Unis. Ces transferts sont
        encadrés par les clauses contractuelles types de la Commission européenne, complétées
        par les mesures techniques décrites plus bas (anonymisation de l&apos;adresse IP et
        absence de cookie tant que vous n&apos;avez pas accepté).
      </p>
      <p>
        TODO(françois) : confirmer la localisation des données chez Supabase, Stripe, Twilio,
        Resend et Vercel (UE / hors UE) et, le cas échéant, les garanties de transfert
        applicables.
      </p>

      <h2 id="droits">Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez d&apos;un droit d&apos;accès, de rectification,
        d&apos;effacement, de limitation, d&apos;opposition et de portabilité sur vos données
        personnelles. Vous pouvez exercer ces droits en nous écrivant à{" "}
        <a href="mailto:hello@linktrip.co">hello@linktrip.co</a>, ou, pour vos photos, en
        utilisant directement le bouton de suppression disponible dans votre galerie. Vous
        pouvez également introduire une réclamation auprès de la CNIL (cnil.fr).
      </p>

      <h2 id="cookies">Cookies et traceurs</h2>
      <p>
        Aucun cookie de mesure d&apos;audience ou de publicité n&apos;est déposé avant votre
        accord. Au premier chargement du site, tous ces traceurs sont bloqués par défaut : un
        bandeau vous propose de les accepter, de les refuser ou de choisir catégorie par
        catégorie. Refuser est aussi simple qu&apos;accepter, et votre choix est conservé
        <strong> 6 mois</strong> avant de vous être redemandé.
      </p>

      <h3>Cookies strictement nécessaires (sans consentement)</h3>
      <p>
        Ils sont indispensables au fonctionnement du service et ne servent à aucune mesure
        d&apos;audience.
      </p>
      <ul>
        <li>
          <strong>Cookie de session Supabase Auth</strong> — maintient la connexion d&apos;un
          opérateur à son espace. Durée : la session, ou jusqu&apos;à déconnexion.
        </li>
        <li>
          <strong>Enregistrement local de votre choix de cookies</strong> (clé
          <code> lt_consent_v1</code>, stockage local du navigateur, 6 mois) — mémorise votre
          décision pour ne pas vous réafficher le bandeau à chaque page.
        </li>
      </ul>

      <h3>Mesure d&apos;audience (avec votre consentement)</h3>
      <p>
        Nous utilisons Google Analytics 4, déployé via Google Tag Manager, pour comprendre
        comment le site est utilisé : pages consultées, parcours d&apos;inscription, achats de
        photos. Ces données nous servent à améliorer le produit, jamais à vous recontacter.
      </p>
      <ul>
        <li>
          <strong>_ga</strong> — distingue les visiteurs les uns des autres. Durée :
          13 mois.
        </li>
        <li>
          <strong>_ga_YZ2GD0BFBZ</strong> — maintient l&apos;état de la session de mesure.
          Durée : 13 mois.
        </li>
      </ul>
      <p>
        Si vous refusez, ces cookies ne sont pas déposés. Google reçoit alors uniquement des
        signaux anonymes, sans identifiant et avec adresse IP tronquée, qui lui permettent
        d&apos;estimer statistiquement la fréquentation sans vous suivre individuellement
        (mécanisme dit de « consentement Google » — Consent Mode v2).
      </p>

      <h3>Publicité et personnalisation (avec votre consentement)</h3>
      <p>
        Aucune régie publicitaire n&apos;est installée sur le site à ce jour. Cette catégorie
        commande le fait que Google puisse ou non rapprocher vos données de mesure de nos
        futures campagnes publicitaires. Tant que vous ne l&apos;acceptez pas, ces
        rapprochements sont désactivés et les échanges avec les services publicitaires de
        Google sont expurgés de toute donnée d&apos;identification.
      </p>

      <h3>Modifier votre choix</h3>
      <p>
        Vous pouvez revenir sur votre décision à tout moment :{" "}
        <ManageCookiesLink className="underline underline-offset-2" /> — ou en supprimant les
        cookies du site depuis les réglages de votre navigateur.
      </p>

      <h2 id="contact">Contact</h2>
      <p>
        Pour toute question relative à cette politique de confidentialité, écrivez-nous à{" "}
        <a href="mailto:hello@linktrip.co">hello@linktrip.co</a>.
      </p>
    </>
  );
}
