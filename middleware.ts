import { NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // PRODUCTION ONLY: Block admin and debug routes (404)
    // In development (npm run dev), these routes work normally for demonstration
    if (process.env.NODE_ENV === "production") {
        if (
            pathname.startsWith("/admin") ||
            pathname.startsWith("/api/admin") ||
            pathname.startsWith("/debug") ||
            pathname.startsWith("/api/debug")
        ) {
            return new NextResponse("Not Found", { status: 404 });
        }
    }

    // Allow all Better Auth routes (including OAuth callbacks) without any checks
    if (pathname.startsWith("/api/auth")) {
        return NextResponse.next();
    }

    // Protected API routes
    const protectedApiRoutes = ["/api/posts", "/api/companies", "/api/profiles", "/api/search"];

    // Admin-only routes - will be checked in server actions
    // Middleware just checks authentication here
    // NOTE: /admin and /debug are blocked in production (see check above)
    // They work in development mode for demonstration purposes
    const adminRoutes = ["/api/companies/migrate-slugs", "/api/companies/update-keywords", "/api/profiles/fix-preferences"];

    // Routes that don't require authentication (for non-banned users)
    const publicRoutes = ["/login", "/register"];

    // Public content routes that anyone can see (if not banned)
    const publicContentRoutes = ["/", "/companies", "/search", "/posts"];

    // Routes banned users CAN access
    const bannedUserAllowedRoutes = [
        "/", // ← Home page (will show popup)
        "/login",
        "/register",
        "/profile/settings",
    ];

    // Allow static files and Next.js internal routes
    if (pathname.startsWith("/_next") || pathname.startsWith("/favicon.ico") || pathname.includes(".")) {
        return NextResponse.next();
    }

    // Check for session cookie (Better Auth uses "better-auth.session_token")
    const sessionToken = request.cookies.get("better-auth.session_token");
    const hasSession = !!sessionToken;

    // Check for banned user cookie (set by ban check)
    const isBannedCookie = request.cookies.get("user-banned");
    const isBanned = isBannedCookie?.value === "true";

    // If user is banned, only allow specific routes
    if (hasSession && isBanned) {
        const isAllowedRoute = bannedUserAllowedRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"));

        if (!isAllowedRoute) {
            // Redirect to home page (they'll see popup)
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // Check if it's a public route (for non-banned users)
    if (publicRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
        return NextResponse.next();
    }

    // Check if it's public content route (anyone can see if not banned)
    if (publicContentRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
        return NextResponse.next();
    }

    // Check admin routes - require authentication
    // Actual admin role check happens in server actions
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
        if (!hasSession) {
            if (pathname.startsWith("/api/")) {
                return NextResponse.json({ error: "Authentication required" }, { status: 401 });
            } else {
                return NextResponse.redirect(new URL("/login", request.url));
            }
        }
        // Let it pass - role check will be done in the actual route/action
        return NextResponse.next();
    }

    // Check protected API routes (require authentication but not admin)
    if (protectedApiRoutes.some((route) => pathname.startsWith(route))) {
        // Allow GET requests for reading data (with rate limiting)
        if (request.method === "GET") {
            // Apply rate limiting for unauthenticated users
            if (!hasSession) {
                const rateLimitResult = checkRateLimit(request);
                if (!rateLimitResult.allowed) {
                    return NextResponse.json({ error: "Rate limit exceeded. Please try again later." }, { status: 429 });
                }
            }
            return NextResponse.next();
        }

        // POST, PUT, DELETE, PATCH require authentication
        if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
            if (!hasSession) {
                return NextResponse.json({ error: "Authentication required" }, { status: 401 });
            }
        }
    }
    return NextResponse.next();
}

// Simple in-memory rate limiting (for production, use Redis)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(request: NextRequest): { allowed: boolean } {
    // Get IP from headers (works in Vercel and other platforms)
    const forwardedFor = request.headers.get("x-forwarded-for");
    const ip = forwardedFor ? forwardedFor.split(",")[0].trim() : "unknown";

    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxRequests = 100; // Max 100 requests per 15 minutes for unauthenticated users

    const userLimit = rateLimitMap.get(ip);

    if (!userLimit || now > userLimit.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return { allowed: true };
    }

    if (userLimit.count >= maxRequests) {
        return { allowed: false };
    }

    userLimit.count++;
    return { allowed: true };
}

export const config = {
    matcher: [
        // Match all paths except static files, images, and API auth
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};
