"use client";

import { useState, useEffect } from "react";
import { getUserStats } from "@/app/actions/admin";
import { checkMyRole } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

interface Stats {
    totalUsers: number;
    totalAdmins: number;
    totalModerators: number;
    totalBanned: number;
    totalPosts: number;
    totalCompanies: number;
}

export default function StatsPage() {
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkRole = async () => {
            const result = await checkMyRole();
            if (!result.isAdmin) {
                router.push("/");
                return;
            }
            setIsAdmin(true);
            loadStats();
        };

        checkRole();
    }, [router]);

    const loadStats = async () => {
        setLoading(true);
        const result = await getUserStats();
        if (result.success && result.stats) {
            setStats(result.stats);
        }
        setLoading(false);
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Sprawdzanie uprawnień...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">Statystyki Systemu</h1>
                <p className="text-gray-600">Przegląd użytkowania i aktywności platformy</p>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Ładowanie statystyk...</p>
                </div>
            ) : stats ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <StatCard title="Wszyscy Użytkownicy" value={stats.totalUsers} color="blue" />
                    <StatCard title="Administratorzy" value={stats.totalAdmins} color="purple" />
                    <StatCard title="Moderatorzy" value={stats.totalModerators} color="green" />
                    <StatCard title="Zbanowani Użytkownicy" value={stats.totalBanned} color="red" />
                    <StatCard title="Wszystkie Posty" value={stats.totalPosts} color="indigo" />
                    <StatCard title="Total Companies" value={stats.totalCompanies} color="orange" />
                </div>
            ) : (
                <div className="text-center py-12">
                    <p className="text-gray-600">Failed to load statistics</p>
                    <button onClick={loadStats} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Retry
                    </button>
                </div>
            )}

            <div className="mt-8 bg-blue-50 border-l-4 border-blue-400 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-blue-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-blue-700">
                            Statistics are updated in real-time. Refresh this page to see the latest numbers.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface StatCardProps {
    title: string;
    value: number;
    color: "blue" | "purple" | "green" | "red" | "indigo" | "orange";
}

function StatCard({ title, value, color }: StatCardProps) {
    const colorClasses = {
        blue: "bg-blue-100 text-blue-800 border-blue-200",
        purple: "bg-purple-100 text-purple-800 border-purple-200",
        green: "bg-green-100 text-green-800 border-green-200",
        red: "bg-red-100 text-red-800 border-red-200",
        indigo: "bg-indigo-100 text-indigo-800 border-indigo-200",
        orange: "bg-orange-100 text-orange-800 border-orange-200",
    };

    return (
        <div className={`${colorClasses[color]} rounded-lg p-6 border-2`}>
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium uppercase tracking-wide">{title}</h3>
            </div>
            <p className="text-4xl font-bold">{value.toLocaleString()}</p>
        </div>
    );
}
