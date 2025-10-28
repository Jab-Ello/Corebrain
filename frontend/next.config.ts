import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: { unoptimized: true }, // évite le besoin du serveur Next pour /_next/image
  trailingSlash: true,           // utile pour générer index.html par route
};

export default nextConfig;
