"use client";

import { useState, useEffect } from "react";
import { getAllUsers, setUserRole, searchUsers } from "@/app/actions/admin";
import { banUser, unbanUser } from "@/app/actions/moderation";
import { checkMyRole } from "@/app/actions/admin";
import { useRouter } from "next/navigation";

interface User {
    _id: string;
    name: string;
    email: string;
    role: "user" | "moderator" | "admin";
    banned?: boolean;
    banReason?: string;
    createdAt?: Date;
}

export default function UsersManagementPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
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
            loadUsers();
        };

        checkRole();
    }, [router]);

    const loadUsers = async () => {
        setLoading(true);
        const result = await getAllUsers(50, 0);
        if (result.success && result.users) {
            setUsers(result.users);
        }
        setLoading(false);
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadUsers();
            return;
        }

        setLoading(true);
        const result = await searchUsers(searchQuery);
        if (result.success && result.users) {
            setUsers(result.users);
        }
        setLoading(false);
    };

    const handleRoleChange = async (userId: string, newRole: "user" | "moderator" | "admin") => {
        if (!confirm(`Are you sure you want to change this user's role to ${newRole}?`)) {
            return;
        }

        const result = await setUserRole(userId, newRole);
        if (result.success) {
            alert("Role updated successfully");
            loadUsers();
        } else {
            alert(`Failed to update role: ${result.error}`);
        }
    };

    const handleBanUser = async (userId: string, userName: string) => {
        const reason = prompt(`Enter reason for banning ${userName}:`);
        if (!reason) return;

        const durationStr = prompt("Enter ban duration in days (leave empty for permanent):");
        const duration = durationStr ? parseInt(durationStr) : undefined;

        const result = await banUser(userId, reason, duration);
        if (result.success) {
            alert("User banned successfully");
            loadUsers();
        } else {
            alert(`Failed to ban user: ${result.error}`);
        }
    };

    const handleUnbanUser = async (userId: string, userName: string) => {
        if (!confirm(`Are you sure you want to unban ${userName}?`)) {
            return;
        }

        const result = await unbanUser(userId);
        if (result.success) {
            alert("User unbanned successfully");
            loadUsers();
        } else {
            alert(`Failed to unban user: ${result.error}`);
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-4">User Management</h1>
                <div className="flex gap-4">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        placeholder="Search by email or name..."
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                        onClick={handleSearch}
                        className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Search
                    </button>
                    <button
                        onClick={loadUsers}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
                    >
                        Clear
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading users...</p>
                </div>
            ) : (
                <div className="bg-white shadow-md rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    User
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Role
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Status
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {users.map((user) => (
                                <tr key={user._id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-500">{user.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <select
                                            value={user.role}
                                            onChange={(e) =>
                                                handleRoleChange(
                                                    user._id,
                                                    e.target.value as "user" | "moderator" | "admin"
                                                )
                                            }
                                            className="text-sm border border-gray-300 rounded px-2 py-1"
                                        >
                                            <option value="user">User</option>
                                            <option value="moderator">Moderator</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {user.banned ? (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                                Banned
                                            </span>
                                        ) : (
                                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                Active
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {user.banned ? (
                                            <button
                                                onClick={() => handleUnbanUser(user._id, user.name)}
                                                className="text-green-600 hover:text-green-900 mr-4"
                                            >
                                                Unban
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleBanUser(user._id, user.name)}
                                                className="text-red-600 hover:text-red-900 mr-4"
                                            >
                                                Ban
                                            </button>
                                        )}
                                        <button
                                            onClick={() => router.push(`/profile/${user._id}`)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            View Profile
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

