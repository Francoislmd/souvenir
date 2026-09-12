import { LoadingBlock } from "@/components/ui/Spinner";

// La boutique s'ouvre après un scan de QR code, souvent en 4G sur un parking.
export default function Loading() {
  return <LoadingBlock label="Ouverture de la boutique…" pad={140} />;
}
