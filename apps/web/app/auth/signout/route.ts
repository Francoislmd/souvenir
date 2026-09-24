import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";

export async function POST(request: Request): Promise<Response> {
  const supabase = createClient();
  await supabase.auth.signOut();
  // 303 et non 307 (défaut) : un 307 fait rejouer le POST sur /connexion,
  // qui ne l'accepte pas, et le navigateur affiche une erreur 405.
  return NextResponse.redirect(new URL("/connexion", request.url), 303);
}
