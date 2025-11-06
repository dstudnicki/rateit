// DELETE COMMENT BY PHOTO ID
import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import jwt from "jsonwebtoken";

export async function DELETE(request: NextRequest, { params }: { params: { id: string; commentId: string } }) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json({ message: "Missing authentication token." }, { status: 401 });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
        return NextResponse.json({ message: "Invalid or expired token." }, { status: 401 });
    }

    try {
        await getClient();
        const photoId = params.id;
        const commentId = params.commentId;

        const post = await Post.findById(photoId);
        if (!post) {
            return NextResponse.json({ message: "Photo not found." }, { status: 404 });
        }

        post.comments = post.comments.filter(
            (comment: { _id: { toString: () => string } }) => comment._id.toString() !== commentId,
        );
        await post.save();

        return NextResponse.json({ message: "Comment deleted successfully!" }, { status: 200 });
    } catch (error) {
        console.error("Comment deletion error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
