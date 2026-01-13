import { Card } from "@/components/ui/card"
import { Star, MapPin, Clock } from "lucide-react"
import Link from "next/link"

interface Company {
  _id: string
  name: string
  slug: string
  location: string
  industry: string
  averageRating: number
  reviewCount: number
  lastReviewDate: string | null
}

interface CompanyListProps {
  companies: Company[]
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= Math.floor(rating)
              ? "fill-yellow-500 text-yellow-500"
              : star - 0.5 <= rating
                ? "fill-yellow-500/50 text-yellow-500"
                : "fill-muted text-muted"
          }`}
        />
      ))}
    </div>
  )
}

function getTimeAgo(date: string | null): string {
  if (!date) return "No reviews yet"

  const now = new Date()
  const reviewDate = new Date(date)
  const diffMs = now.getTime() - reviewDate.getTime()
  const diffMins = Math.floor(diffMs / 60000)

  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`
  const diffHours = Math.floor(diffMins / 60)
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`
  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`
  const diffMonths = Math.floor(diffDays / 30)
  return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`
}

export function CompanyList({ companies }: CompanyListProps) {
  if (companies.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">No companies found. Be the first to add one!</p>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {companies.map((company) => (
        <Link key={company._id} href={`/companies/${company.slug}`}>
          <Card className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-primary hover:underline">{company.name}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{company.location}</span>
                  <span className="text-xs px-2 py-0.5 bg-muted rounded-md">{company.industry}</span>
                </div>

                <div className="flex items-center gap-3 mt-3">
                  <StarRating rating={company.averageRating} />
                  <span className="text-sm font-medium">{company.averageRating.toFixed(1)}/5</span>
                  <span className="text-sm text-muted-foreground">
                    ({company.reviewCount} review{company.reviewCount !== 1 ? 's' : ''})
                  </span>
                </div>
              </div>

              {company.lastReviewDate && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                  <Clock className="h-3 w-3" />
                  <span>Review: {getTimeAgo(company.lastReviewDate)}</span>
                </div>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
