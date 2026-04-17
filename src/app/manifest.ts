import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ArtisanVoice",
    short_name: "ArtisanVoice",
    description: "Assistant vocal de facturation pour artisans",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2e3165",
    orientation: "portrait",
    icons: [
      {
        src: "/icon-192.svg",
        sizes: "192x192",
        type: "image/svg+xml",
      },
      {
        src: "/icon-512.svg",
        sizes: "512x512",
        type: "image/svg+xml",
      },
    ],
  };
}
