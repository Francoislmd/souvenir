"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase-browser";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");

    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    });

    setStatus(error ? "error" : "sent");
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-extrabold text-ink">Mot de passe oublié</h1>
      <p className="mt-2 text-sm text-ink-2">On t&apos;envoie un lien pour en choisir un nouveau.</p>

      {status === "sent" ? (
        <p className="mt-6 rounded-control bg-canvas px-4 py-3 text-sm text-ink">
          Si un compte existe pour <strong>{email}</strong>, tu vas recevoir un email avec un lien de réinitialisation.
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 text-left">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="ton@email.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputClass}
          />
          <Button type="submit" variant="accent" size="lg" disabled={status === "loading"} className="w-full">
            {status === "loading" ? "Envoi…" : "Recevoir le lien"}
          </Button>
          {status === "error" ? (
            <p className="text-sm text-danger">Le réseau a coupé — réessaie dans une minute.</p>
          ) : null}
        </form>
      )}

      <p className="mt-6 text-sm text-ink-2">
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          ← Retour à la connexion
        </Link>
      </p>
    </AuthLayout>
  );
}
