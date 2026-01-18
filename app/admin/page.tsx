"use client";

import { useState, useEffect } from "react";
import { checkMyRole } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const [role, setRole] = useState<"user" | "moderator" | "admin" | null>(null);
    const [loading, setLoading] = useState(true);
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

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Sprawdzanie uprawnień...</p>
                </div>
            </div>
        );
    }

    if (!role || role !== "admin") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Brak dostępu</h1>
                    <p className="mt-2 text-gray-600">Nie masz uprawnień do tej strony.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Panel Administratora</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <DashboardCard
                    title="Inicjalizacja Ról Administratora"
                    description="Ustaw rolę administratora dla użytkowników ADMIN_EMAILS"
                    href="/admin/init"
                />
                <DashboardCard
                    title="Zarządzanie Użytkownikami"
                    description="Zarządzaj użytkownikami, rolami i uprawnieniami"
                    href="/admin/users"
                />
                <DashboardCard
                    title="Moderacja Postów"
                    description="Moderuj i zarządzaj wszystkimi postami"
                    href="/admin/posts"
                />
                <DashboardCard
                    title="Moderacja Firm"
                    description="Moderuj i zarządzaj wszystkimi firmami"
                    href="/admin/companies"
                />
                <DashboardCard
                    title="Moderacja Komentarzy"
                    description="Moderuj i zarządzaj wszystkimi komentarzami i opiniami"
                    href="/admin/comments"
                />
                <DashboardCard
                    title="Statystyki Systemu"
                    description="Zobacz statystyki użytkowania i aktywności platformy"
                    href="/admin/stats"
                />
            </div>
        </div>
    );
}

interface DashboardCardProps {
    title: string;
    description: string;
    href: string;
}

function DashboardCard({ title, description, href }: DashboardCardProps) {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(href)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
        >
            <div className="flex items-center mb-4">
                <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}
