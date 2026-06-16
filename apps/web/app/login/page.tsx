"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase-browser";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setStatus("error");
      setError(
        signInError.message === "Invalid login credentials"
          ? "Email ou mot de passe incorrect."
          : "Le réseau a coupé — réessaie dans une minute.",
      );
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-extrabold text-ink">Bon retour 👋</h1>
      <p className="mt-2 text-sm text-ink-2">Connecte-toi pour accéder à ton espace opérateur.</p>

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
          autoComplete="current-password"
          placeholder="Mot de passe"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={inputClass}
        />

        <div className="text-right">
          <Link href="/forgot-password" className="text-sm text-ink-2 hover:text-accent">
            Mot de passe oublié ?
          </Link>
        </div>

        <Button type="submit" variant="accent" size="lg" disabled={status === "loading"} className="w-full">
          {status === "loading" ? "Connexion…" : "Se connecter"}
        </Button>
        {error ? <p className="text-sm text-danger">{error}</p> : null}
      </form>

      <p className="mt-6 text-sm text-ink-2">
        Pas encore de compte ?{" "}
        <Link href="/signup" className="font-medium text-accent hover:text-accent-hover">
          Créer un compte
        </Link>
      </p>
    </AuthLayout>
  );
}
