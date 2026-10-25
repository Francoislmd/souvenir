import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Linktrip",
    short_name: "Linktrip",
    description: "Vos photos de sortie deviennent un revenu.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF7F2",
    theme_color: "#D4442C",
    icons: [
      { src: "/icons/icone-app-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icone-app-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icone-app-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
