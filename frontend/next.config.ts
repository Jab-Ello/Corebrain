import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // On exporte en statique pour être servi par FastAPI
  output: "export",
  images: { unoptimized: true }, // évite le besoin du serveur Next pour /_next/image
  trailingSlash: true,           // utile pour générer index.html par route
};

export default nextConfig;
