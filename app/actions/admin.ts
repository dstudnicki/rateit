"use server";

import { getClient } from "@/lib/mongoose";
import { requireAdmin, isAdmin, isModerator, UserRole } from "@/lib/auth-helpers";

/**
 * Set user role (admins only)
 */
export async function setUserRole(userId: string, role: UserRole) {
    const admin = await requireAdmin();

    if (!["user", "moderator", "admin"].includes(role)) {
        return { success: false, error: "Invalid role" };
    }

    try {
        const db = await getClient();
        const { ObjectId } = require("mongodb");

        let result;
        try {
            result = await db
                .collection("user")
                .updateOne(
                    { _id: new ObjectId(userId) },
                    { $set: { role, roleUpdatedBy: admin.id, roleUpdatedAt: new Date() } },
                );
        } catch (e) {
            result = await db
                .collection("user")
                .updateOne({ _id: userId as any }, { $set: { role, roleUpdatedBy: admin.id, roleUpdatedAt: new Date() } });
        }

        if (result.modifiedCount > 0) {
            console.log(`User ${userId} role changed to ${role} by admin ${admin.id} (${admin.email})`);
            return { success: true, message: `User role updated to ${role}` };
        }

        return { success: false, error: "Failed to update user role" };
    } catch (error) {
        console.error("Failed to set user role:", error);
        return { success: false, error: "Failed to set user role" };
    }
}

/**
 * Get all users with their roles (admins only)
 */
export async function getAllUsers(limit: number = 50, skip: number = 0) {
    await requireAdmin();

    try {
        const db = await getClient();

        const users = await db
            .collection("user")
            .find({})
            .project({
                _id: 1,
                name: 1,
                email: 1,
                role: 1,
                banned: 1,
                banReason: 1,
                createdAt: 1,
            })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .toArray();

        const total = await db.collection("user").countDocuments();

        return {
            success: true,
            users: users.map((user: any) => ({
                ...user,
                _id: user._id.toString(),
                role: user.role || "user",
            })),
            total,
        };
    } catch (error) {
        console.error("Failed to get users:", error);
        return { success: false, error: "Failed to get users" };
    }
}

/**
 * Search users by email or name (admins only)
 */
export async function searchUsers(query: string) {
    await requireAdmin();

    if (!query || query.trim().length === 0) {
        return { success: false, error: "Search query is required" };
    }

    try {
        const db = await getClient();
        const searchRegex = new RegExp(query, "i");

        const users = await db
            .collection("user")
            .find({
                $or: [{ email: searchRegex }, { name: searchRegex }],
            })
            .project({
                _id: 1,
                name: 1,
                email: 1,
                role: 1,
                banned: 1,
            })
            .limit(20)
            .toArray();

        return {
            success: true,
            users: users.map((user: any) => ({
                ...user,
                _id: user._id.toString(),
                role: user.role || "user",
            })),
        };
    } catch (error) {
        console.error("Failed to search users:", error);
        return { success: false, error: "Failed to search users" };
    }
}

/**
 * Get user stats (admins only)
 */
export async function getUserStats() {
    await requireAdmin();

    try {
        const db = await getClient();

        const totalUsers = await db.collection("user").countDocuments();
        const totalAdmins = await db.collection("user").countDocuments({ role: "admin" });
        const totalModerators = await db.collection("user").countDocuments({ role: "moderator" });
        const totalBanned = await db.collection("user").countDocuments({ banned: true });

        // Get posts count
        const Post = (await import("@/models/Post")).default;
        const totalPosts = await Post.countDocuments();

        // Get companies count
        const Company = (await import("@/models/Company")).default;
        const totalCompanies = await Company.countDocuments();

        return {
            success: true,
            stats: {
                totalUsers,
                totalAdmins,
                totalModerators,
                totalBanned,
                totalPosts,
                totalCompanies,
            },
        };
    } catch (error) {
        console.error("Failed to get user stats:", error);
        return { success: false, error: "Failed to get user stats" };
    }
}

/**
 * Check current user's role
 */
export async function checkMyRole() {
    try {
        const adminStatus = await isAdmin();
        const moderatorStatus = await isModerator();

        let role: UserRole = "user";
        if (adminStatus) {
            role = "admin";
        } else if (moderatorStatus) {
            role = "moderator";
        }

        return {
            success: true,
            role,
            isAdmin: adminStatus,
            isModerator: moderatorStatus,
        };
    } catch (error) {
        return {
            success: true,
            role: "user" as UserRole,
            isAdmin: false,
            isModerator: false,
        };
    }
}
