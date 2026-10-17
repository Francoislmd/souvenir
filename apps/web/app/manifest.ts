import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Linktrip",
    short_name: "Linktrip",
    description: "Vos photos de sortie deviennent un revenu.",
    start_url: "/",
    display: "standalone",
    background_color: "#F7F8FA",
    theme_color: "#1A55D6",
    icons: [
      { src: "/icons/icone-app-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icone-app-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icone-app-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
