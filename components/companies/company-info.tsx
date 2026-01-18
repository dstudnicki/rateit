import { Card } from "@/components/ui/card";
import { Globe, MapPin, Building2 } from "lucide-react";
import { AddReviewDialog } from "./add-review-dialog";

interface CompanyInfoProps {
    company: {
        _id: string;
        name: string;
        location: string;
        website?: string;
        description?: string;
        industry: string;
    };
}

export function CompanyInfo({ company }: CompanyInfoProps) {
    return (
        <div className="space-y-4">
            <Card className="p-6">
                <h2 className="font-semibold mb-4">Informacje o firmie</h2>

                <div className="space-y-3">
                    <div className="flex items-start gap-3 text-sm">
                        <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <div className="font-medium">Lokalizacja</div>
                            <div className="text-muted-foreground">{company.location}</div>
                        </div>
                    </div>

                    <div className="flex items-start gap-3 text-sm">
                        <Building2 className="h-4 w-4 mt-0.5 text-muted-foreground" />
                        <div>
                            <div className="font-medium">Branża</div>
                            <div className="text-muted-foreground">{company.industry}</div>
                        </div>
                    </div>

                    {company.website && (
                        <div className="flex items-start gap-3 text-sm">
                            <Globe className="h-4 w-4 mt-0.5 text-muted-foreground" />
                            <div>
                                <div className="font-medium">Strona internetowa</div>
                                <a
                                    href={company.website}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline"
                                >
                                    {company.website.replace(/^https?:\/\//, "")}
                                </a>
                            </div>
                        </div>
                    )}

                    {company.description && (
                        <div className="text-sm pt-2">
                            <div className="font-medium mb-1">O firmie</div>
                            <div className="text-muted-foreground">{company.description}</div>
                        </div>
                    )}
                </div>

                <div className="mt-6">
                    <AddReviewDialog companyId={company._id} />
                </div>
            </Card>
        </div>
    );
}
