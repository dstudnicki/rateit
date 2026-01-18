import "server-only";

// Get base URL - localhost in dev, Vercel URL in production
const BASE_URL =
    process.env.BETTER_AUTH_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

export async function getCompanies(params?: { query?: string; industry?: string; location?: string; sortBy?: string }) {
    // Build query string from params
    const searchParams = new URLSearchParams();
    if (params?.query) searchParams.set("query", params.query);
    if (params?.industry) searchParams.set("industry", params.industry);
    if (params?.location) searchParams.set("location", params.location);
    if (params?.sortBy) searchParams.set("sortBy", params.sortBy);

    const queryString = searchParams.toString();
    const url = `${BASE_URL}/api/companies${queryString ? `?${queryString}` : ""}`;

    const data = await fetch(url, {
        next: {
            tags: ["companies-list"],
        },
    });

    if (!data.ok) {
        return [];
    }

    return data.json();
}
