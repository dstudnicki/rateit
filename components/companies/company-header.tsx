"use client"

import { Card } from "@/components/ui/card"
import { Star, MapPin } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface CompanyHeaderProps {
  company: {
    _id: string
    name: string
    location: string
    industry: string
    averageRating: number
    reviewCount: number
  }
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 ${
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

export function CompanyHeader({ company }: CompanyHeaderProps) {
  const initials = company.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .substring(0, 2)
    .toUpperCase()

  return (
    <Card className="p-6">
      <div className="flex items-start gap-6">
        <Avatar className="h-20 w-20 rounded-lg">
          <AvatarImage src="/generic-company-logo.png" />
          <AvatarFallback className="rounded-lg text-2xl">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <h1 className="text-2xl font-bold">{company.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <StarRating rating={company.averageRating} />
            <span className="text-lg font-semibold">{company.averageRating.toFixed(1)}/5</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Based on {company.reviewCount} review{company.reviewCount !== 1 ? 's' : ''}
          </p>

          <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span>{company.location}</span>
            <span className="text-xs px-2 py-0.5 bg-muted rounded-md">{company.industry}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}


