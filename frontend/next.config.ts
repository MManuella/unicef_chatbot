import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'standalone' crée un build minimal autonome pour la production.
  // Génère .next/standalone/server.js qui n'a besoin que d'un node_modules minimal.
  // Nécessaire pour le Dockerfile (évite d'embarquer 500 MB de node_modules).
  output: "standalone",

  // Proxy des appels /api/* vers le backend FastAPI.
  // En production (HF Spaces) : NEXT_PUBLIC_API_URL="" → les appels front
  // utilisent des chemins relatifs (/api/chat/stream) → redirigés ici vers
  // FastAPI sur port 8000 (même machine, réseau interne).
  // En dev local : NEXT_PUBLIC_API_URL=http://localhost:8000 → appels directs,
  // ces rewrites ne s'appliquent pas (URLs absolues bypassent les rewrites).
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:8000/api/:path*",
      },
    ];
  },
};

export default nextConfig;
