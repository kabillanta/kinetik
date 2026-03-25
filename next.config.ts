import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";
    
    // Extract origin for CSP (e.g. https://api.example.com)
    let apiOrigin = "";
    try {
      const url = new URL(apiBaseUrl);
      apiOrigin = url.origin;
    } catch (e) {
      apiOrigin = apiBaseUrl;
    }

    // Define connect-src with the dynamic API origin
    const connectSrc = [
      "'self'",
      "https://*.googleapis.com",
      "https://*.firebaseio.com",
      "https://*.firebaseapp.com",
      "wss://*.firebaseio.com",
      "https://*.identitytoolkit.googleapis.com",
      apiOrigin,
      "http://localhost:*", // Keep for local dev
    ].join(" ");

    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin-allow-popups",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://apis.google.com https://*.firebaseapp.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              `connect-src ${connectSrc}`,
              "frame-src 'self' https://*.firebaseapp.com https://accounts.google.com",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
