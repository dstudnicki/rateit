import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    cacheComponents: true,
    compiler: {
        styledComponents: true,
    },
    // Wyłącz strony debug i admin z production build
    outputFileTracingExcludes: {
        "/debug": ["**/*"],
        "/debug/**": ["**/*"],
        "/admin": ["**/*"],
        "/admin/**": ["**/*"],
        "/api/admin": ["**/*"],
        "/api/admin/**": ["**/*"],
        "/api/debug": ["**/*"],
        "/api/debug/**": ["**/*"],
    },
    // Ignoruj debug podczas production build
    ...(process.env.NODE_ENV === "production" && {
        experimental: {
            // Nie renderuj stron debug podczas production build
            fallbackNodePolyfills: false,
        },
    }),
};

export default nextConfig;
