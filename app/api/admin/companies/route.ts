import { NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
    try {
        await requireAdmin();
        await getClient();

        const companies = await Company.find().sort({ createdAt: -1 }).lean();

        const companiesPlain = companies.map((company: any) => ({
            ...company,
            _id: company._id.toString(),
            averageRating: company.averageRating || 0,
        }));

        return NextResponse.json({ companies: companiesPlain });
    } catch (error: any) {
        console.error("Admin companies fetch error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch companies" },
            { status: error.message === "Admin access required" ? 403 : 500 },
        );
    }
}
