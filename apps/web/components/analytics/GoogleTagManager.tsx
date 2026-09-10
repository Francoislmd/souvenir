import { CONSENT_MAX_AGE_MS, CONSENT_STORAGE_KEY, CONSENT_VERSION } from "@/lib/consent";
import { GtmLoader, GtmNoScript } from "@/components/analytics/GtmLoader";

const GTM_ID = process.env.NEXT_PUBLIC_GTM_ID ?? "";

/**
 * Script d'amorçage — DOIT s'exécuter avant gtm.js.
 *
 * 1. Pose les défauts Consent Mode v2 à `denied` : GA4 n'écrit alors aucun
 *    cookie et n'envoie que des pings sans identifiant (« consent mode
 *    modelling »), ce qui reste conforme et préserve la modélisation.
 * 2. Rejoue immédiatement un choix déjà enregistré, pour ne pas perdre 500 ms
 *    de mesure à chaque page vue d'un visiteur qui a déjà accepté.
 * 3. `url_passthrough` conserve gclid/utm dans la navigation quand les cookies
 *    sont refusés ; `ads_data_redaction` anonymise les pings publicitaires.
 */
const consentBootstrap = `
(function(){
  window.dataLayer = window.dataLayer || [];
  function gtag(){window.dataLayer.push(arguments);}
  window.gtag = gtag;
  gtag('consent','default',{
    ad_storage:'denied',
    ad_user_data:'denied',
    ad_personalization:'denied',
    analytics_storage:'denied',
    personalization_storage:'denied',
    functionality_storage:'granted',
    security_storage:'granted',
    wait_for_update:500
  });
  gtag('set','ads_data_redaction',true);
  gtag('set','url_passthrough',true);
  try{
    var raw = window.localStorage.getItem('${CONSENT_STORAGE_KEY}');
    if(raw){
      var s = JSON.parse(raw);
      if(s && s.v === ${CONSENT_VERSION} && typeof s.t === 'number' && (Date.now() - s.t) < ${CONSENT_MAX_AGE_MS}){
        var a = s.analytics ? 'granted' : 'denied';
        var p = s.ads ? 'granted' : 'denied';
        gtag('consent','update',{
          ad_storage:p, ad_user_data:p, ad_personalization:p,
          personalization_storage:p, analytics_storage:a
        });
        window.dataLayer.push({event:'consent_ready',consent_analytics:!!s.analytics,consent_ads:!!s.ads});
      }
    }
  }catch(e){}
})();
`;

const gtmLoader = `
(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});
var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';
j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','${GTM_ID}');
`;

/**
 * À placer dans <head> via le layout racine. Sans NEXT_PUBLIC_GTM_ID (dev,
 * previews, tests) le composant ne rend rien : aucune requête réseau, aucun
 * bruit dans les données de production.
 */
export function GoogleTagManager() {
  if (!GTM_ID) return null;

  return (
    <>
      {/* Balise <script> brute (et non next/script) : c'est le seul moyen
          d'avoir la garantie d'une exécution synchrone, dans le HTML initial,
          AVANT que gtm.js ne démarre. Un `beforeInteractive` de next/script
          conviendrait aussi mais n'est supporté que dans le layout racine. */}
      <script id="consent-mode-default" dangerouslySetInnerHTML={{ __html: consentBootstrap }} />
      {/* Le chargeur est un composant client : il se tait sur les boutiques et
          les galeries, où aucune mesure n'est faite. Le script d'amorçage
          ci-dessus reste rendu partout, il ne fait aucune requête réseau et
          se contente de poser les défauts Consent Mode. */}
      <GtmLoader script={gtmLoader} />
    </>
  );
}

/** Repli sans JavaScript — à placer juste après l'ouverture de <body>. */
export function GoogleTagManagerNoScript() {
  if (!GTM_ID) return null;

  return <GtmNoScript gtmId={GTM_ID} />;
}
