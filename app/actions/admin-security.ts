"use server";

import { getClient } from "@/lib/mongoose";
import { requireAdmin } from "@/lib/auth-helpers";

/**
 * Security audit log for admin actions
 */
interface AuditLog {
    action: string;
    performedBy: string;
    performedByEmail: string;
    targetUserId?: string;
    targetEmail?: string;
    oldValue?: any;
    newValue?: any;
    reason?: string;
    timestamp: Date;
    ipAddress?: string;
}

/**
 * Log security-sensitive admin action
 */
async function logAuditAction(log: AuditLog) {
    try {
        const db = await getClient();
        await db.collection("audit_logs").insertOne(log);

        // Also log to console for immediate visibility
        console.log(`[AUDIT] ${log.action} by ${log.performedByEmail}`, {
            target: log.targetEmail,
            timestamp: log.timestamp
        });
    } catch (error) {
        console.error("Failed to log audit action:", error);
    }
}

/**
 * Safely add admin role with audit trail
 */
export async function addAdminRole(targetUserId: string, reason: string) {
    const admin = await requireAdmin();

    try {
        const db = await getClient();
        const { ObjectId } = require('mongodb');

        // Get target user info
        let targetUser;
        try {
            targetUser = await db.collection("user").findOne(
                { _id: new ObjectId(targetUserId) },
                { projection: { email: 1, role: 1 } }
            );
        } catch (e) {
            targetUser = await db.collection("user").findOne(
                { _id: targetUserId as any },
                { projection: { email: 1, role: 1 } }
            );
        }

        if (!targetUser) {
            return { success: false, error: "User not found" };
        }

        // Check if already admin
        if (targetUser.role === "admin") {
            return { success: false, error: "User is already an admin" };
        }

        // Update role
        let result;
        try {
            result = await db.collection("user").updateOne(
                { _id: new ObjectId(targetUserId) },
                {
                    $set: {
                        role: "admin",
                        roleSetAt: new Date(),
                        roleSetBy: admin.id,
                        roleReason: reason
                    }
                }
            );
        } catch (e) {
            result = await db.collection("user").updateOne(
                { _id: targetUserId as any },
                {
                    $set: {
                        role: "admin",
                        roleSetAt: new Date(),
                        roleSetBy: admin.id,
                        roleReason: reason
                    }
                }
            );
        }

        if (result.modifiedCount > 0) {
            // Log the action
            await logAuditAction({
                action: "ROLE_CHANGE",
                performedBy: admin.id,
                performedByEmail: admin.email,
                targetUserId,
                targetEmail: targetUser.email,
                oldValue: targetUser.role || "user",
                newValue: "admin",
                reason,
                timestamp: new Date()
            });

            return {
                success: true,
                message: `Admin role granted to ${targetUser.email}`
            };
        }

        return { success: false, error: "Failed to update role" };
    } catch (error) {
        console.error("Error adding admin role:", error);
        return { success: false, error: "Failed to add admin role" };
    }
}

/**
 * Safely remove admin role with audit trail
 */
export async function removeAdminRole(targetUserId: string, reason: string) {
    const admin = await requireAdmin();

    try {
        const db = await getClient();
        const { ObjectId } = require('mongodb');

        // Prevent self-demotion
        if (admin.id === targetUserId) {
            return { success: false, error: "Cannot remove your own admin role" };
        }

        // Get target user info
        let targetUser;
        try {
            targetUser = await db.collection("user").findOne(
                { _id: new ObjectId(targetUserId) },
                { projection: { email: 1, role: 1 } }
            );
        } catch (e) {
            targetUser = await db.collection("user").findOne(
                { _id: targetUserId as any },
                { projection: { email: 1, role: 1 } }
            );
        }

        if (!targetUser) {
            return { success: false, error: "User not found" };
        }

        // Check if email is in ADMIN_EMAILS (cannot remove these)
        const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || [];
        if (adminEmails.includes(targetUser.email)) {
            return {
                success: false,
                error: "Cannot remove admin role from users in ADMIN_EMAILS. Remove from .env first."
            };
        }

        // Update role
        let result;
        try {
            result = await db.collection("user").updateOne(
                { _id: new ObjectId(targetUserId) },
                {
                    $set: {
                        role: "user",
                        roleRemovedAt: new Date(),
                        roleRemovedBy: admin.id,
                        roleRemovalReason: reason
                    }
                }
            );
        } catch (e) {
            result = await db.collection("user").updateOne(
                { _id: targetUserId as any },
                {
                    $set: {
                        role: "user",
                        roleRemovedAt: new Date(),
                        roleRemovedBy: admin.id,
                        roleRemovalReason: reason
                    }
                }
            );
        }

        if (result.modifiedCount > 0) {
            // Log the action
            await logAuditAction({
                action: "ROLE_REVOKE",
                performedBy: admin.id,
                performedByEmail: admin.email,
                targetUserId,
                targetEmail: targetUser.email,
                oldValue: "admin",
                newValue: "user",
                reason,
                timestamp: new Date()
            });

            return {
                success: true,
                message: `Admin role removed from ${targetUser.email}`
            };
        }

        return { success: false, error: "Failed to update role" };
    } catch (error) {
        console.error("Error removing admin role:", error);
        return { success: false, error: "Failed to remove admin role" };
    }
}

/**
 * Get audit logs (admin only)
 */
export async function getAuditLogs(limit: number = 50) {
    await requireAdmin();

    try {
        const db = await getClient();

        const logs = await db.collection("audit_logs")
            .find({})
            .sort({ timestamp: -1 })
            .limit(limit)
            .toArray();

        return {
            success: true,
            logs: logs.map(log => ({
                ...log,
                _id: log._id.toString()
            }))
        };
    } catch (error) {
        console.error("Error fetching audit logs:", error);
        return { success: false, error: "Failed to fetch audit logs" };
    }
}

/**
 * Check if email would be auto-admin (for testing)
 */
export async function checkEmailForAutoAdmin(email: string) {
    await requireAdmin();

    const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || [];
    return {
        success: true,
        isAutoAdmin: adminEmails.includes(email),
        configuredEmails: adminEmails.length
    };
}

