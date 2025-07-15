// DELETE POST BY ID
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Post from "@/models/Post";
import jwt from "jsonwebtoken";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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
        await dbConnect();
        const postId = params.id;
        const result = await Post.findByIdAndDelete(postId);

        if (result) {
            return NextResponse.json({ message: "Post deleted successfully!" }, { status: 200 });
        } else {
            return NextResponse.json({ message: "Post not found." }, { status: 404 });
        }
    } catch (error) {
        console.error("Post deletion error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
