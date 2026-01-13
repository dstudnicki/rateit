import { NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";

/**
 * Initialize admin users from ADMIN_EMAILS environment variable
 * This endpoint should be called once to set role field in database
 *
 * GET /api/admin/init
 */
export async function GET() {
    try {
        // Get admin emails from environment
        const adminEmails = process.env.ADMIN_EMAILS?.split(",").map(e => e.trim()) || [];
        const adminIds = process.env.ADMIN_USER_IDS?.split(",").map(id => id.trim()) || [];

        if (adminEmails.length === 0 && adminIds.length === 0) {
            return NextResponse.json({
                success: false,
                error: "No admin emails or IDs configured in ADMIN_EMAILS or ADMIN_USER_IDS",
                message: "Please set ADMIN_EMAILS or ADMIN_USER_IDS in your .env file"
            }, { status: 400 });
        }

        const db = await getClient();
        const results = [];

        // Update users by email
        for (const email of adminEmails) {
            const result = await db.collection("user").updateOne(
                { email },
                {
                    $set: {
                        role: "admin",
                        roleUpdatedAt: new Date(),
                        roleUpdatedBy: "system-init"
                    }
                }
            );

            if (result.matchedCount > 0) {
                results.push({
                    email,
                    status: result.modifiedCount > 0 ? "updated" : "already-admin",
                    message: result.modifiedCount > 0
                        ? "Role set to admin"
                        : "Already has admin role"
                });
            } else {
                results.push({
                    email,
                    status: "not-found",
                    message: "User not found - please register first"
                });
            }
        }

        // Update users by ID
        const { ObjectId } = require('mongodb');
        for (const userId of adminIds) {
            try {
                let result;
                try {
                    result = await db.collection("user").updateOne(
                        { _id: new ObjectId(userId) },
                        {
                            $set: {
                                role: "admin",
                                roleUpdatedAt: new Date(),
                                roleUpdatedBy: "system-init"
                            }
                        }
                    );
                } catch (e) {
                    result = await db.collection("user").updateOne(
                        { _id: userId as any },
                        {
                            $set: {
                                role: "admin",
                                roleUpdatedAt: new Date(),
                                roleUpdatedBy: "system-init"
                            }
                        }
                    );
                }

                if (result.matchedCount > 0) {
                    results.push({
                        userId,
                        status: result.modifiedCount > 0 ? "updated" : "already-admin",
                        message: result.modifiedCount > 0
                            ? "Role set to admin"
                            : "Already has admin role"
                    });
                } else {
                    results.push({
                        userId,
                        status: "not-found",
                        message: "User not found"
                    });
                }
            } catch (error) {
                results.push({
                    userId,
                    status: "error",
                    message: error instanceof Error ? error.message : "Failed to update"
                });
            }
        }

        const successCount = results.filter(r => r.status === "updated").length;
        const alreadyAdminCount = results.filter(r => r.status === "already-admin").length;
        const notFoundCount = results.filter(r => r.status === "not-found").length;
        const errorCount = results.filter(r => r.status === "error").length;

        return NextResponse.json({
            success: true,
            message: "✅ Admin initialization complete!",
            summary: {
                updated: successCount,
                alreadyAdmin: alreadyAdminCount,
                notFound: notFoundCount,
                errors: errorCount,
                total: results.length
            },
            details: results,
            instructions: {
                notFound: notFoundCount > 0
                    ? "⚠️ Some users were not found. Please register those accounts first, then call this endpoint again."
                    : null,
                success: successCount > 0
                    ? "✅ Admin roles have been saved to database. Users will now show as ADMIN in user management."
                    : null,
                alreadyAdmin: alreadyAdminCount > 0
                    ? "ℹ️ Some users already had admin role."
                    : null,
                nextStep: "Refresh the /admin/users page to see updated roles."
            }
        });

    } catch (error) {
        console.error("Admin initialization error:", error);
        return NextResponse.json({
            success: false,
            error: "Failed to initialize admin users",
            details: error instanceof Error ? error.message : "Unknown error"
        }, { status: 500 });
    }
}

