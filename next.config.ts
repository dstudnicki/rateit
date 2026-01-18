import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    cacheComponents: true,
    compiler: {
        styledComponents: true,
    },
    // Wyłącz strony debug z production build
    outputFileTracingExcludes: {
        "/debug": ["**/*"],
        "/debug/**": ["**/*"],
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
