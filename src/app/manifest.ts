import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "OFFTHREAD",
    short_name: "OFFTHREAD",
    description:
      "Heavyweight graphic tees, made in Delhi and dropped in limited numbers.",
    start_url: "/",
    display: "standalone",
    background_color: "#141210",
    theme_color: "#141210",
    icons: [
      {
        src: "/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
