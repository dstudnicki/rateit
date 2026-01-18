import { Card } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

const trendingCompanies = [
    { name: "Future Tech", location: "Warsaw", reviewCount: 342 },
    { name: "Creative Studio", location: "Krakow", reviewCount: 289 },
    { name: "Data Analytics Co", location: "Poznan", reviewCount: 256 },
    { name: "Cloud Systems", location: "Wrocław", reviewCount: 234 },
    { name: "Mobile Apps Inc", location: "Gdansk", reviewCount: 198 },
];

export function TrendingCompanies() {
    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="font-semibold">Najpopularniejsze w tym tygodniu</h2>
            </div>

            <div className="space-y-3">
                {trendingCompanies.map((company, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-colors">
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{company.name}</h3>
                            <p className="text-xs text-muted-foreground">{company.location}</p>
                        </div>
                        <div className="text-xs text-muted-foreground whitespace-nowrap">
                            {company.reviewCount}{" "}
                            {company.reviewCount === 1
                                ? "opinia"
                                : company.reviewCount >= 2 && company.reviewCount <= 4
                                  ? "opinie"
                                  : "opinii"}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}
