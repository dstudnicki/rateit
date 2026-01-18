import "server-only";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// NOTE: cache() removed - doesn't work with headers()
// headers() is dynamic and changes per request, so React cache cannot memoize it
// This is a lightweight auth check anyway (no heavy DB queries)
export async function requireUser() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    return session;
}
