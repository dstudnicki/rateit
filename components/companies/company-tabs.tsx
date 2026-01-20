"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewList } from "@/components/companies/review-list";
import { AddReviewDialog } from "@/components/companies/add-review-dialog";

type TabType = "all" | "positive" | "mixed" | "negative" | "interviews";

interface CompanyTabsProps {
    company: {
        _id: string;
        reviews: any[];
    };
}

export function CompanyTabs({ company }: CompanyTabsProps) {
    const [activeTab, setActiveTab] = useState<TabType>("all");
    return (
        <div className="space-y-4">
            <Card className="p-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant={activeTab === "all" ? "default" : "outline"}
                            onClick={() => setActiveTab("all")}
                            className="rounded-full"
                        >
                            Wszystkie
                        </Button>
                        <Button
                            variant={activeTab === "positive" ? "default" : "outline"}
                            onClick={() => setActiveTab("positive")}
                            className="rounded-full"
                        >
                            Pozytywne
                        </Button>
                        <Button
                            variant={activeTab === "mixed" ? "default" : "outline"}
                            onClick={() => setActiveTab("mixed")}
                            className="rounded-full"
                        >
                            Mieszane
                        </Button>
                        <Button
                            variant={activeTab === "negative" ? "default" : "outline"}
                            onClick={() => setActiveTab("negative")}
                            className="rounded-full"
                        >
                            Negatywne
                        </Button>
                        <Button
                            variant={activeTab === "interviews" ? "default" : "outline"}
                            onClick={() => setActiveTab("interviews")}
                            className="rounded-full"
                        >
                            Proces rekrutacji
                        </Button>
                    </div>
                    <AddReviewDialog companyId={company._id} />
                </div>
            </Card>

            <ReviewList companyId={company._id} reviews={company.reviews} filter={activeTab} />
        </div>
    );
}
