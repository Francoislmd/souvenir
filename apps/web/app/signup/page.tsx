"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase-browser";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Le mot de passe doit faire au moins 8 caractères.");
      setStatus("error");
      return;
    }

    if (password !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas.");
      setStatus("error");
      return;
    }

    setStatus("loading");

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });

    if (signUpError) {
      setStatus("error");
      setError(
        signUpError.message === "User already registered"
          ? "Un compte existe déjà avec cet email — connecte-toi plutôt."
          : "Le réseau a coupé — réessaie dans une minute.",
      );
      return;
    }

    if (!data.session) {
      // La confirmation email est activée côté Supabase : pas de session immédiate.
      setStatus("sent");
      return;
    }

    router.push("/onboarding");
    router.refresh();
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-extrabold text-ink">Créer ton compte</h1>
      <p className="mt-2 text-sm text-ink-2">Configure ton école en quelques minutes.</p>

      {status === "sent" ? (
        <p className="mt-6 rounded-control bg-canvas px-4 py-3 text-sm text-ink">
          On t&apos;a envoyé un email de confirmation à <strong>{email}</strong>. Clique sur le lien pour activer ton
          compte.
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
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Mot de passe (8 caractères min.)"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputClass}
          />
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Confirme le mot de passe"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            className={inputClass}
          />

          <Button type="submit" variant="accent" size="lg" disabled={status === "loading"} className="w-full">
            {status === "loading" ? "Création…" : "Créer mon compte"}
          </Button>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </form>
      )}

      <p className="mt-6 text-sm text-ink-2">
        Déjà un compte ?{" "}
        <Link href="/login" className="font-medium text-accent hover:text-accent-hover">
          Se connecter
        </Link>
      </p>
    </AuthLayout>
  );
}
