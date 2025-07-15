// GET POST  COMMENTS FOR POST

import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Post from "@/models/Post";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
        const user = jwt.decode(token) as { userId: string };
        const postId = params.id;
        const { content } = await request.json();
        const newComment = { content, user, createdAt: new Date() };

        const post = await Post.findById(postId);
        if (!post) {
            return NextResponse.json({ message: "Post not found." }, { status: 404 });
        }

        post.comments.push(newComment);
        await post.save();

        return NextResponse.json({ message: "Comment added successfully!" }, { status: 201 });
    } catch (error) {
        console.error("Comment creation error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

export async function GET({ params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const postId = params.id;
        const post = await Post.findById(postId).populate("comments.user", "username email");

        if (!post) {
            return NextResponse.json({ message: "Post not found." }, { status: 404 });
        }

        return NextResponse.json(post.comments, { status: 200 });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
