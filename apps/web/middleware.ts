import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Les boutiques vivent sur leur propre sous-domaine : store.linktrip.co/{slug}/{code}.
// Next ne connaît que le chemin interne /s/{slug}/{code} — la traduction se
// fait ici, à l'entrée. Un sous-domaine plutôt qu'un chemin à la racine du
// site, sinon le premier segment d'URL entrerait en concurrence avec les
// pages marketing (/produit, /tarifs, /activites…) et un opérateur nommé
// "Tarifs" volerait une page du site.
const STORE_HOST_PREFIX = "store.";

// Ce qui ne doit jamais être pris pour un slug d'opérateur.
const STORE_PASSTHROUGH = /^\/(?:_next|api|favicon\.ico|robots\.txt|sitemap\.xml)(?:\/|$)/;

function storeRewrite(request: NextRequest): NextResponse | null {
  const host = (request.headers.get("host") ?? "").split(":")[0]!;
  if (!host.startsWith(STORE_HOST_PREFIX)) return null;

  const { pathname } = request.nextUrl;
  if (STORE_PASSTHROUGH.test(pathname) || /\.[a-z0-9]+$/i.test(pathname)) {
    return NextResponse.next();
  }

  const url = request.nextUrl.clone();
  url.pathname = `/s${pathname}`;
  const rewritten = NextResponse.rewrite(url);
  // Le header noindex de next.config.mjs est posé sur le chemin d'ENTRÉE
  // (/{slug}/{code}), pas sur la cible de la réécriture : il ne s'appliquerait
  // pas ici. Une boutique porte des visages de clients, elle ne doit jamais
  // finir dans un index de moteur de recherche.
  rewritten.headers.set("X-Robots-Tag", "noindex, nofollow");
  return rewritten;
}

export async function middleware(request: NextRequest) {
  const store = storeRewrite(request);
  if (store) return store;

  // Un seul objet réponse pour toute la requête : Supabase pose parfois
  // plusieurs cookies d'affilée lors d'un rafraîchissement de session
  // (access + refresh token). Recréer `response` à chaque set()/remove()
  // (via NextResponse.next()) effaçait les cookies déjà posés par l'appel
  // précédent — seul le dernier survivait, la session se corrompait et
  // l'utilisateur se retrouvait déconnecté à la moindre navigation.
  const response = NextResponse.next({ request: { headers: request.headers } });

  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  // Rafraîchit la session si besoin (pose les cookies à jour sur la réponse).
  await supabase.auth.getUser();

  return response;
}

export const config = {
  // "$" exclut la racine "/" : la landing page est 100% statique et ne lit
  // jamais la session, mais restait derrière ce middleware — chaque visite
  // déclenchait un aller-retour réseau vers Supabase Auth (getUser()) avant
  // de servir le HTML déjà pré-généré, ralentissant inutilement la page la
  // plus visitée du site. Même raison pour les trois autres routes de la
  // landing pré-lancement (fonctionnement/simulation/liste-attente) : pages
  // publiques tout aussi statiques, sans session à lire.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|g/|api/webhooks/|$|fonctionnement$|simulation$|liste-attente$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
