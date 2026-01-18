"use client";

import { useState, useEffect } from "react";
import { checkMyRole } from "@/app/actions/admin";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, Eye, Building2 } from "lucide-react";

interface Company {
    _id: string;
    name: string;
    location: string;
    industry: string;
    description?: string;
    website?: string;
    reviews: any[];
    averageRating: number;
    createdAt: string;
}

export default function AdminCompaniesPage() {
    const [role, setRole] = useState<"user" | "moderator" | "admin" | null>(null);
    const [loading, setLoading] = useState(true);
    const [companies, setCompanies] = useState<Company[]>([]);
    const router = useRouter();

    useEffect(() => {
        const checkRole = async () => {
            const result = await checkMyRole();
            if (!result.isAdmin) {
                router.push("/");
                return;
            }
            setRole(result.role);
            setLoading(false);
        };

        checkRole();
    }, [router]);

    useEffect(() => {
        if (role) {
            fetchCompanies();
        }
    }, [role]);

    const fetchCompanies = async () => {
        try {
            const response = await fetch("/api/admin/companies");
            if (response.ok) {
                const data = await response.json();
                setCompanies(data.companies);
            }
        } catch (error) {
            console.error("Failed to fetch companies:", error);
        }
    };

    const handleDeleteCompany = async (companyId: string) => {
        if (!confirm("Czy na pewno chcesz usunąć tę firmę? To również usunie wszystkie jej opinie.")) return;

        try {
            const response = await fetch(`/api/admin/companies/${companyId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                setCompanies(companies.filter((c) => c._id !== companyId));
                alert("Firma usunięta pomyślnie");
            } else {
                alert("Nie udało się usunąć firmy");
            }
        } catch (error) {
            console.error("Failed to delete company:", error);
            alert("Nie udało się usunąć firmy");
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Moderacja Firm</h1>
                    <p className="text-gray-600 mt-1">Zarządzaj i moderuj wszystkie firmy</p>
                </div>
                <Button variant="outline" onClick={() => router.push("/admin")}>
                    Powrót do Panelu
                </Button>
            </div>

            <div className="space-y-4">
                {companies.length === 0 ? (
                    <Card className="p-12 text-center">
                        <Building2 className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No companies yet</h3>
                        <p className="text-gray-600">Companies will appear here once users add them.</p>
                    </Card>
                ) : (
                    companies.map((company) => (
                        <Card key={company._id} className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-3">
                                        <Building2 className="h-5 w-5 text-blue-600" />
                                        <h3 className="text-xl font-semibold">{company.name}</h3>
                                        <div className="bg-yellow-100 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded">
                                            ⭐ {company.averageRating?.toFixed(1) || "N/A"}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-3 text-sm">
                                        <div>
                                            <span className="text-gray-600">Location:</span>
                                            <span className="ml-2 font-medium">{company.location}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-600">Industry:</span>
                                            <span className="ml-2 font-medium">{company.industry}</span>
                                        </div>
                                    </div>

                                    {company.description && <p className="text-gray-700 mb-3 text-sm">{company.description}</p>}

                                    {company.website && (
                                        <a
                                            href={company.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-blue-600 hover:underline text-sm"
                                        >
                                            {company.website}
                                        </a>
                                    )}

                                    <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                                        <span>{company.reviews?.length || 0} reviews</span>
                                        <span>Added {new Date(company.createdAt).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 ml-4">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() =>
                                            window.open(
                                                `/companies/${company.name.toLowerCase().replace(/\s+/g, "-")}`,
                                                "_blank",
                                            )
                                        }
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={() => handleDeleteCompany(company._id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
