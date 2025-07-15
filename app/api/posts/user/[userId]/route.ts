// GET POST BY USER
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Post from "@/models/Post";

export async function GET() {
    try {
        await dbConnect();
        const posts = await Post.find().populate("user", "username email").populate("comments.user", "username email");
        return NextResponse.json(posts, { status: 200 });
    } catch (error) {
        console.error("Error fetching posts by user:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
