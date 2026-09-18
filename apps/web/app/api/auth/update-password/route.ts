import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase-server";
import { isAcceptable, MIN_LENGTH } from "@/lib/auth/password-strength";

const bodySchema = z.object({
  password: z.string().min(MIN_LENGTH),
});

export async function POST(req: Request) {
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || !isAcceptable(parsed.data.password)) {
    return NextResponse.json({ error: "weak_password" }, { status: 400 });
  }

  const supabase = createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) {
    return NextResponse.json({ error: "update_failed" }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
