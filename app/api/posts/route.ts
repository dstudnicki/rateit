// GET AND POST POSTS
import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ message: "Missing authentication token." }, { status: 401 });
    }

    try {
        await getClient();

        const { content } = await request.json();
        const newPost = { content, user: session.user.id, createdAt: new Date() };
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
        const db = await getClient();

        const posts = await Post.find().sort({ createdAt: -1 }).lean();

        const postsWithUsers = await Promise.all(
            posts.map(async (post) => {
                if (post.user) {
                    const user = await db.collection("user").findOne({ _id: post.user }, { projection: { name: 1, email: 1 } });
                    return { ...post, user };
                }
                return post;
            }),
        );

        return NextResponse.json(postsWithUsers, { status: 200 });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
