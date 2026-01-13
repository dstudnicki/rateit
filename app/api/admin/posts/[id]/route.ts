import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import { requireAdmin } from "@/lib/auth-helpers";

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await requireAdmin();
        await getClient();

        const { id } = await params;

        const result = await Post.deleteOne({ _id: id });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { error: "Post not found" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Post deleted successfully"
        });
    } catch (error: any) {
        console.error("Admin post delete error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete post" },
            { status: error.message === "Admin access required" ? 403 : 500 }
        );
    }
}

