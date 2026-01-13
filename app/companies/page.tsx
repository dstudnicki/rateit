import { CompanySearch } from "@/components/companies/company-search"
import { CompanyList } from "@/components/companies/company-list"
import { getPersonalizedCompanies } from "@/app/actions/companies"

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { query?: string; industry?: string; location?: string; sortBy?: string }
}) {
  const result = await getPersonalizedCompanies()
  const companies = result.companies || []

  return (
    <div className="min-h-screen bg-background">
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-6">
          <CompanySearch />
          <CompanyList companies={companies} />
        </div>
      </main>
    </div>
  )
}
