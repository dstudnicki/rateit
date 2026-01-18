import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    // Disabled: cacheComponents conflicts with dynamic = 'force-dynamic' in API routes
    // We use cache() from React instead for request memoization
    // cacheComponents: true,

    // Performance optimizations
    reactStrictMode: true, // Better performance + catches bugs
    poweredByHeader: false, // Remove X-Powered-By header (security)

    compiler: {
        styledComponents: true,
        removeConsole: process.env.NODE_ENV === "production" ? { exclude: ["error", "warn"] } : false,
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
            fallbackNodePolyfills: false,
        },
    }),
};

export default nextConfig;
