export default function manifest() {
  return {
    name: "COOP134 — Gestione Turni",
    short_name: "COOP134",
    description: "Cooperativa Sociale — Gestione ore operai",
    start_url: "/principale",
    display: "standalone",
    background_color: "#0c0e12",
    theme_color: "#b91c1c",
    orientation: "portrait",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
    ],
  }
}
