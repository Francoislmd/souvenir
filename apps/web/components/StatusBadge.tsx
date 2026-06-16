import type { DeliveryStatus } from "@souvenir/db";

const LABELS: Record<DeliveryStatus, { label: string; className: string }> = {
  CREATED: { label: "Créée", className: "bg-canvas text-ink-2" },
  CLAIMED: { label: "Récupérée", className: "bg-accent-tint text-accent" },
  DELIVERED: { label: "Livrée", className: "bg-accent-tint text-accent" },
  PURCHASED: { label: "Achetée", className: "bg-success-tint text-success" },
};

export function StatusBadge({ status }: { status: DeliveryStatus }) {
  const { label, className } = LABELS[status];
  return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${className}`}>{label}</span>;
}
