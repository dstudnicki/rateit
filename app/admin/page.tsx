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
                    <p className="mt-4 text-gray-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    if (!role || role !== "admin") {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
                    <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <DashboardCard
                    title="Initialize Admin Roles"
                    description="Set admin role in database for ADMIN_EMAILS users"
                    href="/admin/init"
                    icon="🚀"
                />
                <DashboardCard
                    title="User Management"
                    description="Manage users, roles, and permissions"
                    href="/admin/users"
                    icon="👥"
                />
                <DashboardCard
                    title="Post Moderation"
                    description="Moderate and manage all posts"
                    href="/admin/posts"
                    icon="📝"
                />
                <DashboardCard
                    title="Company Moderation"
                    description="Moderate and manage all companies"
                    href="/admin/companies"
                    icon="🏢"
                />
                <DashboardCard
                    title="Comment Moderation"
                    description="Moderate and manage all comments & reviews"
                    href="/admin/comments"
                    icon="💬"
                />
                <DashboardCard
                    title="System Statistics"
                    description="View platform usage and activity stats"
                    href="/admin/stats"
                    icon="📊"
                />
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg
                            className="h-5 w-5 text-yellow-400"
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                        >
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-700">
                            <strong>Admin Access:</strong> You have full administrative privileges. All actions are logged.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface DashboardCardProps {
    title: string;
    description: string;
    href: string;
    icon: string;
}

function DashboardCard({ title, description, href, icon }: DashboardCardProps) {
    const router = useRouter();

    return (
        <div
            onClick={() => router.push(href)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer border border-gray-200"
        >
            <div className="flex items-center mb-4">
                <span className="text-4xl mr-3">{icon}</span>
                <h2 className="text-xl font-semibold">{title}</h2>
            </div>
            <p className="text-gray-600">{description}</p>
        </div>
    );
}

