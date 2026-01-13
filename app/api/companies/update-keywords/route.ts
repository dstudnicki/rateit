import { NextResponse } from "next/server";
import { updateAllCompaniesKeywords } from "@/app/actions/company-keywords";

// Endpoint to update keywords for all companies
export async function GET() {
    try {
        const result = await updateAllCompaniesKeywords();

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error updating company keywords:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update keywords" },
            { status: 500 }
        );
    }
}

