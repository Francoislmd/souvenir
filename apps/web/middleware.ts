import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
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
  // plus visitée du site.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|g/|api/webhooks/|$|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
