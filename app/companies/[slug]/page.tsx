import { CompanyHeader } from "@/components/companies/company-header"
import { CompanyTabs } from "@/components/companies/company-tabs"
import { CompanyInfo } from "@/components/companies/company-info"
import { CompanyViewTracker } from "@/components/companies/company-view-tracker"
import { getCompanyBySlug } from "@/app/data/companies/get-company"
import { notFound } from "next/navigation"

interface CompanyPageProps {
  params: Promise<{ slug: string }>
}

export default async function CompanyPage(props: CompanyPageProps) {
  const params = await props.params
  const { slug } = params

  // Validate slug format - reject if it looks like a MongoDB ObjectId or UUID
  if (/^[0-9a-f]{24}$/i.test(slug) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
    notFound()
  }

  const company = await getCompanyBySlug(slug)

  if (!company) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-background">
      <CompanyViewTracker companyId={company._id} />
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <CompanyHeader company={company} />
            <CompanyTabs company={company} />
          </div>

          <div className="lg:col-span-1">
            <CompanyInfo company={company} />
          </div>
        </div>
      </main>
    </div>
  )
}

