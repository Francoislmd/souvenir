import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase-server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request): Promise<Response> {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user?.email) {
      if (next) return NextResponse.redirect(`${origin}${next}`);

      const user = await prisma.user.findUnique({ where: { email: data.user.email } });
      return NextResponse.redirect(`${origin}${user ? "/dashboard" : "/onboarding"}`);
    }
  }

  return NextResponse.redirect(`${origin}/login`);
}
