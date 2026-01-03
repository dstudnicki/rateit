import { NextResponse } from "next/server";
import { migrateCompanySlugs } from "@/app/actions/migrate-company-slugs";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Migration endpoint to add slugs to existing companies
 *
 * Usage: GET /api/companies/migrate-slugs
 *
 * This should be run once after deploying the slug feature
 * to update all existing companies.
 */
export async function GET() {
    try {
        // Optional: Add authentication check
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        // Uncomment to require authentication
        // if (!session) {
        //     return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
        // }

        const result = await migrateCompanySlugs();

        return NextResponse.json(result, {
            status: result.success ? 200 : 500
        });
    } catch (error) {
        console.error("Migration endpoint error:", error);
        return NextResponse.json({
            success: false,
            message: "Internal server error",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}

