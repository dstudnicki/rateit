"use client";

import { useState } from "react";
import { Search, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AddCompanyDialog } from "./add-company-dialog";
import { useRouter, useSearchParams } from "next/navigation";

export function CompanySearch() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [companyName, setCompanyName] = useState(searchParams.get("query") || "");
    const [location, setLocation] = useState(searchParams.get("location") || "");

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();

        const params = new URLSearchParams();
        if (companyName) params.set("query", companyName);
        if (location) params.set("location", location);

        const queryString = params.toString();
        router.push(`/companies${queryString ? `?${queryString}` : ""}`);
    };

    return (
        <Card className="p-6">
            <h1 className="text-2xl font-bold mb-2">Opinie o firmach i dyskusje</h1>
            <p className="text-muted-foreground mb-6">Znajdź opinie, doświadczenia zawodowe i informacje o rekrutacji</p>

            <form onSubmit={handleSearch} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Nazwa firmy lub ID"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>

                <div className="md:col-span-1">
                    <Button type="submit" className="w-full">
                        Szukaj
                    </Button>
                </div>
            </form>

            <div className="mt-6 pt-6 border-t">
                <AddCompanyDialog />
            </div>
        </Card>
    );
}
