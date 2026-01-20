import "server-only";
// Get base URL - localhost in dev, Vercel URL in production
import { headers } from "next/headers";

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
    const h = await headers();
    const data = await fetch(`${BASE_URL}/api/companies/slug/${slug}`, {
        headers: h,
        cache: "no-store",
    });

    if (!data.ok) {
        return null;
    }

    return data.json();
}
