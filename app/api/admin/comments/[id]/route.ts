import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
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
        const { searchParams } = new URL(request.url);
        const type = searchParams.get("type");

        if (type === "post") {
            // Delete comment from post
            const result = await Post.updateOne(
                { "comments._id": id },
                { $pull: { comments: { _id: id } } }
            );

            if (result.modifiedCount === 0) {
                return NextResponse.json(
                    { error: "Comment not found" },
                    { status: 404 }
                );
            }
        } else if (type === "company") {
            // Delete review from company
            const result = await Company.updateOne(
                { "reviews._id": id },
                { $pull: { reviews: { _id: id } } }
            );

            if (result.modifiedCount === 0) {
                return NextResponse.json(
                    { error: "Review not found" },
                    { status: 404 }
                );
            }

            // Recalculate average rating
            const company = await Company.findOne({ "reviews._id": { $exists: true } });
            if (company && company.reviews) {
                const totalRating = company.reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0);
                const averageRating = company.reviews.length > 0 ? totalRating / company.reviews.length : 0;
                await Company.updateOne(
                    { _id: company._id },
                    { $set: { averageRating } }
                );
            }
        } else {
            return NextResponse.json(
                { error: "Invalid type parameter" },
                { status: 400 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Comment deleted successfully"
        });
    } catch (error: any) {
        console.error("Admin comment delete error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete comment" },
            { status: error.message === "Admin access required" ? 403 : 500 }
        );
    }
}

