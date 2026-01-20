/**
 * Authorization and authentication helper functions
 */

import "server-only";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getClient } from "@/lib/mongoose";
import { ObjectId } from "mongodb";

export type UserRole = "user" | "moderator" | "admin";

export interface AuthUser {
    id: string;
    email: string;
    name: string;
    role: UserRole;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return null;
        }

        const db = await getClient();

        let user;
        try {
            user = await db
                .collection("user")
                .findOne({ _id: new ObjectId(session.user.id) }, { projection: { email: 1, name: 1, role: 1 } });
        } catch (e) {
            user = await db
                .collection("user")
                .findOne({ _id: session.user.id as any }, { projection: { email: 1, name: 1, role: 1 } });
        }

        if (!user) {
            return null;
        }

        return {
            id: session.user.id,
            email: user.email,
            name: user.name,
            role: user.role || "user",
        };
    } catch (error) {
        console.error("Error getting current user:", error);
        return null;
    }
}

/**
 * Check if user is authenticated
 * Throws error if not authenticated (for use in server actions)
 *
 * Note: For server components that need redirect behavior,
 * use requireUser() from @/app/data/user/require-user instead
 */
export async function requireAuth(): Promise<AuthUser> {
    const user = await getCurrentUser();
    if (!user) {
        throw new Error("Authentication required");
    }
    return user;
}

/**
 * Check if user has moderator or admin role
 */
export async function requireModerator(): Promise<AuthUser> {
    const user = await requireAuth();
    if (user.role !== "moderator" && user.role !== "admin") {
        throw new Error("Moderator access required");
    }
    return user;
}

export async function requireAdmin(): Promise<AuthUser> {
    const user = await requireAuth();

    const adminEmails = process.env.ADMIN_EMAILS;

    const isAdminByEmail = adminEmails?.includes(user.email);
    const isAdminByRole = user.role === "admin";

    if (!isAdminByEmail && !isAdminByRole) {
        throw new Error("Admin access required");
    }

    return user;
}

export async function isAdmin(userId?: string): Promise<boolean> {
    try {
        const user = userId ? await getUserById(userId) : await getCurrentUser();
        if (!user) return false;

        // Check environment variable for admin emails
        const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];
        const adminIds = process.env.ADMIN_USER_IDS?.split(",") || [];

        if (adminIds.includes(user.id) || adminEmails.includes(user.email)) {
            return true;
        }

        return user.role === "admin";
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
}

export async function isModerator(userId?: string): Promise<boolean> {
    try {
        const user = userId ? await getUserById(userId) : await getCurrentUser();
        if (!user) return false;
        return user.role === "moderator" || user.role === "admin";
    } catch (error) {
        console.error("Error checking moderator status:", error);
        return false;
    }
}

/**
 * Check if user can modify resource (owner, moderator, or admin)
 */
export async function canModifyResource(resourceOwnerId: string): Promise<boolean> {
    try {
        const user = await getCurrentUser();
        if (!user) return false;

        // Owner can modify
        if (user.id === resourceOwnerId) return true;

        // Moderators and admins can modify
        if (user.role === "moderator" || user.role === "admin") return true;

        return false;
    } catch (error) {
        console.error("Error checking resource permissions:", error);
        return false;
    }
}

/**
 * Get user by ID
 */
async function getUserById(userId: string): Promise<AuthUser | null> {
    try {
        const db = await getClient();
        const { ObjectId } = require("mongodb");

        let user;
        try {
            user = await db
                .collection("user")
                .findOne({ _id: new ObjectId(userId) }, { projection: { email: 1, name: 1, role: 1 } });
        } catch (e) {
            user = await db.collection("user").findOne({ _id: userId as any }, { projection: { email: 1, name: 1, role: 1 } });
        }

        if (!user) {
            return null;
        }

        return {
            id: userId,
            email: user.email,
            name: user.name,
            role: user.role || "user",
        };
    } catch (error) {
        console.error("Error getting user by ID:", error);
        return null;
    }
}

/**
 * Set user role (admin only)
 */
export async function setUserRole(userId: string, role: UserRole): Promise<boolean> {
    try {
        // Check if current user is admin
        await requireAdmin();

        const db = await getClient();
        const { ObjectId } = require("mongodb");

        let result;
        try {
            result = await db.collection("user").updateOne({ _id: new ObjectId(userId) }, { $set: { role } });
        } catch (e) {
            result = await db.collection("user").updateOne({ _id: userId as any }, { $set: { role } });
        }

        return result.modifiedCount > 0;
    } catch (error) {
        console.error("Error setting user role:", error);
        return false;
    }
}
