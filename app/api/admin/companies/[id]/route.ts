import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import { requireAdmin } from "@/lib/auth-helpers";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requireAdmin();
        await getClient();

        const { id } = await params;

        const result = await Company.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: "Company not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Company deleted successfully"
        });
    } catch (error: any) {
        console.error("Admin company delete error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete company" },
            { status: error.message === "Admin access required" ? 403 : 500 }
        );
    }
}

