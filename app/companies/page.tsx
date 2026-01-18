import { CompanySearch } from "@/components/companies/company-search";
import { CompanyList } from "@/components/companies/company-list";
import { getPersonalizedCompanies, searchCompaniesByName } from "@/app/actions/companies";

export default async function CompaniesPage({
    searchParams,
}: {
    searchParams: Promise<{ query?: string; industry?: string; location?: string; sortBy?: string }>;
}) {
    // Await searchParams (Next.js 15+)
    const params = await searchParams;

    let companies;
    let isSearchResult = false;

    if (params.query && params.query.trim().length >= 2) {
        // Search mode
        const result = await searchCompaniesByName(params.query, params.location);
        companies = result.companies || [];
        isSearchResult = true;
    } else {
        // Default personalized list
        const result = await getPersonalizedCompanies();
        companies = result.companies || [];
    }

    return (
        <div className="min-h-screen bg-background">
            <main className="container max-w-7xl mx-auto px-4 py-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    <CompanySearch />
                    <CompanyList companies={companies} searchQuery={isSearchResult ? params.query : undefined} />
                </div>
            </main>
        </div>
    );
}
