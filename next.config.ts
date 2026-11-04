import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  output: "standalone",
  // Moduli nativi / con font e worker propri: caricati da node_modules, non impacchettati
  serverExternalPackages: ["@resvg/resvg-js", "@react-pdf/renderer"],
  async redirects() {
    return [
      // Dominio senza www → www (un solo indirizzo per i motori di ricerca)
      {
        source: "/:path*",
        has: [{ type: "host", value: "dppdesigner.com" }],
        destination: "https://www.dppdesigner.com/:path*",
        permanent: true,
      },
      // Vecchio percorso del wizard
      { source: "/:locale(it|en)/readiness", destination: "/:locale/progetta", permanent: true },
      { source: "/:locale(it|en)/readiness/:path*", destination: "/:locale/progetta/:path*", permanent: true },
    ];
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default withNextIntl(nextConfig);
