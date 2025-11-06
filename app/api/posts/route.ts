// GET AND POST POSTS
import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
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
        const user = jwt.decode(token) as { userId: string };

        const { title, content } = await request.json();
        const newPost = { title, content, user: new mongoose.Types.ObjectId(user.userId), createdAt: new Date() };
        const result = await Post.create(newPost);
        if (result) {
            return NextResponse.json({ message: "Post created successfully!" }, { status: 201 });
        } else {
            return NextResponse.json({ message: "Failed to create post." }, { status: 500 });
        }
    } catch (error) {
        console.error("Post creation error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

export async function GET() {
    try {
        await getClient();

        const posts = await Post.find().populate("user", "username email").sort({ createdAt: -1 });
        return NextResponse.json(posts, { status: 200 });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
