"use client";

import { useState } from "react";
import { UploadAnimation } from "./UploadAnimation";
import { DistributionAnimation } from "./DistributionAnimation";
import { GalleryPhoneAnimated } from "./GalleryPhoneAnimated";

type TabId = "upload" | "repartition" | "galerie" | "dashboard";

const TABS: {
  id: TabId;
  label: string;
  title: string;
  desc: string;
  bullets: string[];
}[] = [
  {
    id: "upload",
    label: "Upload",
    title: "Importez en 3 taps",
    desc: "Sélectionnez toutes vos photos depuis la pellicule. Les transferts reprennent automatiquement si le réseau coupe — inutile de rester sur l'écran.",
    bullets: ["Upload résumable en 4G/5G", "File d'attente persistée", "Photos + vidéos"],
  },
  {
    id: "repartition",
    label: "Répartition",
    title: "Un clic par client",
    desc: "Après l'import groupé, attribuez chaque photo à la bonne personne en quelques secondes. Remplissez les coordonnées et Souvenir envoie toutes les galeries d'un coup.",
    bullets: ["Tri visuel par miniatures", "Envoi groupé en une action", "Email + SMS automatique"],
  },
  {
    id: "galerie",
    label: "Galerie",
    title: "Le client voit et achète",
    desc: "Chaque client ouvre sa galerie brandée, voit les aperçus floutés et débloque le pack HD en un clic. Stripe encaisse et verse votre part automatiquement.",
    bullets: ["Galerie sans compte client", "Paiement embarqué", "Téléchargement zip HD"],
  },
  {
    id: "dashboard",
    label: "Dashboard",
    title: "Suivez tout en temps réel",
    desc: "Taux d'achat, CA encaissé, avis collectés : votre dashboard se met à jour à chaque vente. Rien à configurer, rien à exporter.",
    bullets: ["CA et taux d'achat", "Historique par session", "Mise à jour instantanée"],
  },
];

export function FeatureTabs() {
  const [active, setActive] = useState<TabId>("upload");
  const tab = TABS.find((t) => t.id === active)!;

  return (
    <div>
      <div className="flex flex-wrap justify-center gap-2 sm:gap-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setActive(t.id)}
            className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
              active === t.id
                ? "bg-white text-ink shadow-card"
                : "border border-white/15 text-white/55 hover:border-white/30 hover:text-white/85"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-14 grid grid-cols-1 items-center gap-10 md:grid-cols-[5fr_4fr] md:gap-16">
        <div className="flex justify-center">
          {active === "upload" && <UploadAnimation />}
          {active === "repartition" && <DistributionAnimation />}
          {active === "galerie" && <GalleryPhoneAnimated />}
          {active === "dashboard" && <DashboardPreview />}
        </div>

        <div>
          <h3 className="font-display text-2xl font-extrabold text-white sm:text-3xl">
            {tab.title}
          </h3>
          <p className="mt-4 text-base leading-relaxed text-white/55">{tab.desc}</p>
          <ul className="mt-7 space-y-3">
            {tab.bullets.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-white/70">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/20">
                  <svg
                    viewBox="0 0 14 14"
                    fill="none"
                    className="h-3 w-3 text-brand"
                    stroke="currentColor"
                    strokeWidth="2.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M2 7l3.5 3.5 6.5-6.5" />
                  </svg>
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function DashboardPreview() {
  return (
    <div className="w-full overflow-hidden rounded-card border border-white/10 bg-white/[0.04]">
      <div className="border-b border-white/10 px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-white/35">
          CA encaissé aujourd&apos;hui
        </p>
        <div className="mt-1.5 flex items-end gap-2">
          <span className="font-display text-4xl font-extrabold text-white">290 €</span>
          <span className="mb-1 text-sm font-medium text-[#4ADE80]">↑ +87 € vs hier</span>
        </div>
      </div>
      <div className="divide-y divide-white/[0.06]">
        {[
          {
            name: "Léa Martin",
            tag: "Acheté ✓",
            tagCls: "text-[#4ADE80] bg-[#4ADE80]/10",
            amount: "29 €",
          },
          {
            name: "Tom Durand",
            tag: "Acheté ✓",
            tagCls: "text-[#4ADE80] bg-[#4ADE80]/10",
            amount: "29 €",
          },
          {
            name: "Emma Petit",
            tag: "Galerie ouverte",
            tagCls: "text-white/50 bg-white/[0.07]",
            amount: "—",
          },
          {
            name: "Marc Faure",
            tag: "Envoyé",
            tagCls: "text-white/30 bg-white/[0.04]",
            amount: "—",
          },
        ].map((r) => (
          <div key={r.name} className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-white/60">
                {r.name[0]}
              </div>
              <p className="text-sm font-medium text-white/75">{r.name}</p>
            </div>
            <div className="flex items-center gap-2.5">
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${r.tagCls}`}
              >
                {r.tag}
              </span>
              <span className="w-8 text-right text-sm font-semibold text-white/55">
                {r.amount}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
