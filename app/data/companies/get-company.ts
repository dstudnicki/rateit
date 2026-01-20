import "server-only";
// Get base URL - localhost in dev, Vercel URL in production
import { cookies } from "next/headers";

const BASE_URL =
    process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export async function getCompany(id: string) {
    const data = await fetch(`${BASE_URL}/api/companies/${id}`, {
        next: {
            tags: [`company-${id}`],
        },
    });

    if (!data.ok) {
        return null;
    }

    return data.json();
}

export async function getCompanyBySlug(slug: string) {
    const cookieStore = await cookies();
    const data = await fetch(`${BASE_URL}/api/companies/slug/${slug}`, {
        headers: { cookie: cookieStore.toString() },
        cache: "no-store",
    });

    if (!data.ok) {
        return null;
    }

    return data.json();
}
