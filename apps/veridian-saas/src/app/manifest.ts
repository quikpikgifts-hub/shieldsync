import type { MetadataRoute } from "next";
import { site } from "@/data/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: site.name,
    short_name: site.name,
    description: site.description,
    start_url: "/",
    display: "standalone",
    background_color: "#020617",
    theme_color: "#2563eb",
    icons: [{ src: "/icon", sizes: "32x32", type: "image/png" }],
  };
}
