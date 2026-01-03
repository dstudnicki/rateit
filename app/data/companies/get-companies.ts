import "server-only"

export async function getCompanies(params?: {
    query?: string;
    industry?: string;
    location?: string;
    sortBy?: string;
}) {
    // const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute buckets

    // const searchParams = new URLSearchParams();
    // if (params?.query) searchParams.set("query", params.query);
    // if (params?.industry) searchParams.set("industry", params.industry);
    // if (params?.location) searchParams.set("location", params.location);
    // if (params?.sortBy) searchParams.set("sortBy", params.sortBy);

    // const queryString = searchParams.toString();
    // const url = `http://localhost:3000/api/companies${queryString ? `?${queryString}` : ""}`;

    const data = await fetch(`http://localhost:3000/api/companies`, {
        next: {
            tags: [`companies-list`]
        }
    });

    return data.json();
}

