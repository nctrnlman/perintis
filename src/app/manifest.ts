import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Perintis",
    short_name: "Perintis",
    description:
      "Toolkit karir berbasis AI untuk pencari kerja Indonesia: optimasi resume, cek kompatibilitas ATS, dan cover letter.",
    start_url: "/",
    display: "standalone",
    background_color: "#09090B",
    theme_color: "#09090B",
    icons: [
      { src: "/icon", sizes: "32x32", type: "image/png" },
      { src: "/manifest-icon", sizes: "512x512", type: "image/png" },
    ],
  };
}
