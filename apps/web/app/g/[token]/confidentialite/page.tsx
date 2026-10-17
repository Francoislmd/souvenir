import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PrivacyPage({ params }: { params: { token: string } }) {
  const participant = await prisma.participant.findUnique({
    where: { token: params.token },
    include: { sortie: { include: { operator: true } } },
  });

  if (!participant || participant.deletedAt) notFound();

  const operator = participant.sortie.operator;

  return (
    <main style={{ maxWidth: 520, margin: "0 auto", minHeight: "100vh", background: "#fff", padding: "32px 20px", fontFamily: "'Inter', system-ui, sans-serif", color: "#191D24" }}>
      <Link href={`/g/${participant.token}`} style={{ fontSize: "0.9rem", color: "#6B7380", textDecoration: "underline" }}>
        ← Retour à votre galerie
      </Link>

      <h1 style={{ fontFamily: "var(--font-bricolage), Inter, sans-serif", fontSize: "1.9rem", fontWeight: 700, marginTop: 16, letterSpacing: "-0.02em" }}>
        Vos photos,
        <br />
        vos règles.
      </h1>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 24 }}>
        <div style={{ border: "1px solid #E3E7EE", borderRadius: 16, padding: 16, background: "#F7F8FA" }}>
          <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>👁 Qui voit quoi</p>
          <p style={{ marginTop: 6, fontSize: "0.87rem", color: "#3F4652", lineHeight: 1.5 }}>
            Vos photos ne sont visibles que via ce lien privé. Aucun autre participant de la sortie n&rsquo;y a accès.
          </p>
        </div>
        <div style={{ border: "1px solid #E3E7EE", borderRadius: 16, padding: 16, background: "#F7F8FA" }}>
          <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>🗓 Rétention 90 jours</p>
          <p style={{ marginTop: 6, fontSize: "0.87rem", color: "#3F4652", lineHeight: 1.5 }}>
            Vos photos personnelles sont conservées 90 jours sur nos serveurs, puis supprimées automatiquement.
          </p>
        </div>
        <div style={{ border: "1px solid #E3E7EE", borderRadius: 16, padding: 16, background: "#F7F8FA" }}>
          <p style={{ fontWeight: 700, fontSize: "0.9rem", margin: 0 }}>🔒 Sous-traitants</p>
          <p style={{ marginTop: 6, fontSize: "0.87rem", color: "#3F4652", lineHeight: 1.5 }}>
            {operator.name} utilise Stripe (paiement), Supabase (stockage) et Twilio (WhatsApp) pour vous livrer et vous vendre vos photos.
          </p>
        </div>
      </div>

      <Link
        href={`/g/${participant.token}/supprimer`}
        style={{
          marginTop: 24,
          display: "flex",
          height: 44,
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 999,
          border: "1px solid #E3E7EE",
          fontSize: "0.9rem",
          fontWeight: 600,
          color: "#191D24",
          textDecoration: "none",
        }}
      >
        🗑 Demander la suppression immédiate
      </Link>

      <Link
        href="/confidentialite"
        style={{
          marginTop: 16,
          display: "block",
          textAlign: "center",
          fontSize: "0.85rem",
          color: "#6B7380",
          textDecoration: "underline",
        }}
      >
        Voir notre politique de confidentialité complète →
      </Link>
    </main>
  );
}
