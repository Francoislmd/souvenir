"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase-browser";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Button } from "@/components/ui/Button";
import { inputClass } from "@/components/ui/Input";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
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
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setStatus("error");
      setError("Le lien a expiré — demande un nouveau lien de réinitialisation.");
      return;
    }

    setStatus("done");
    setTimeout(() => {
      router.push("/dashboard");
      router.refresh();
    }, 1500);
  }

  return (
    <AuthLayout>
      <h1 className="font-display text-2xl font-extrabold text-ink">Choisis un nouveau mot de passe</h1>

      {status === "done" ? (
        <p className="mt-6 rounded-control bg-success-tint px-4 py-3 text-sm text-success">
          Mot de passe mis à jour ✓ Redirection…
        </p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3 text-left">
          <input
            type="password"
            required
            autoComplete="new-password"
            placeholder="Nouveau mot de passe (8 caractères min.)"
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
            {status === "loading" ? "Mise à jour…" : "Mettre à jour le mot de passe"}
          </Button>
          {error ? <p className="text-sm text-danger">{error}</p> : null}
        </form>
      )}
    </AuthLayout>
  );
}
