import { CompanySearch } from "@/components/companies/company-search"
import { CompanyList } from "@/components/companies/company-list"
import { getCompanies } from "@/app/data/companies/get-companies"

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: { query?: string; industry?: string; location?: string; sortBy?: string }
}) {
  const companies = await getCompanies()

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
