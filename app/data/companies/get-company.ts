import "server-only"

export async function getCompany(id: string) {
    const data = await fetch(`http://localhost:3000/api/companies/${id}`, {
        next: {
            tags: [`company-${id}`]
        }
    });

    if (!data.ok) {
        return null;
    }

    return data.json();
}

export async function getCompanyBySlug(slug: string) {
    const data = await fetch(`http://localhost:3000/api/companies/slug/${slug}`, {
        next: {
            tags: [`company-slug-${slug}`]
        }
    });

    if (!data.ok) {
        return null;
    }

    return data.json();
}

