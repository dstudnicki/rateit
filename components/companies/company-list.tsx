import { Card } from "@/components/ui/card";
import { Star, MapPin, Clock } from "lucide-react";
import Link from "next/link";

interface Company {
    _id: string;
    name: string;
    slug: string;
    location: string;
    industry: string;
    averageRating: number;
    reviewCount: number;
    lastReviewDate: string | null;
}

interface CompanyListProps {
    companies: Company[];
    searchQuery?: string;
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
    );
}

function getTimeAgo(date: string | null): string {
    if (!date) return "Brak opinii";

    const now = new Date();
    const reviewDate = new Date(date);
    const diffMs = now.getTime() - reviewDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
        const minuteText = diffMins === 1 ? "minutę" : diffMins >= 2 && diffMins <= 4 ? "minuty" : "minut";
        return `${diffMins} ${minuteText} temu`;
    }

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) {
        const hourText = diffHours === 1 ? "godzinę" : diffHours >= 2 && diffHours <= 4 ? "godziny" : "godzin";
        return `${diffHours} ${hourText} temu`;
    }

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 30) {
        const dayText = diffDays === 1 ? "dzień" : "dni";
        return `${diffDays} ${dayText} temu`;
    }

    const diffMonths = Math.floor(diffDays / 30);
    const monthText = diffMonths === 1 ? "miesiąc" : diffMonths >= 2 && diffMonths <= 4 ? "miesiące" : "miesięcy";
    return `${diffMonths} ${monthText} temu`;
}

export function CompanyList({ companies, searchQuery }: CompanyListProps) {
    if (companies.length === 0) {
        return (
            <Card className="p-8 text-center">
                {searchQuery ? (
                    <>
                        <p className="text-muted-foreground mb-2">
                            Nie znaleziono firm dla zapytania: <strong>&ldquo;{searchQuery}&rdquo;</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">Spróbuj innych słów kluczowych lub sprawdź pisownię</p>
                    </>
                ) : (
                    <p className="text-muted-foreground">Nie znaleziono firm. Bądź pierwszy i dodaj jedną!</p>
                )}
            </Card>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            {searchQuery && (
                <div className="text-sm text-muted-foreground mb-2">
                    Znaleziono {companies.length}{" "}
                    {companies.length === 1 ? "firmę" : companies.length >= 2 && companies.length <= 4 ? "firmy" : "firm"} dla:{" "}
                    <strong>&ldquo;{searchQuery}&rdquo;</strong>
                </div>
            )}
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
                                        ({company.reviewCount}{" "}
                                        {company.reviewCount === 1
                                            ? "opinia"
                                            : company.reviewCount >= 2 && company.reviewCount <= 4
                                              ? "opinie"
                                              : "opinii"}
                                        )
                                    </span>
                                </div>
                            </div>

                            {company.lastReviewDate && (
                                <div className="flex items-center gap-1 text-xs text-muted-foreground whitespace-nowrap">
                                    <Clock className="h-3 w-3" />
                                    <span>Opinia: {getTimeAgo(company.lastReviewDate)}</span>
                                </div>
                            )}
                        </div>
                    </Card>
                </Link>
            ))}
        </div>
    );
}
