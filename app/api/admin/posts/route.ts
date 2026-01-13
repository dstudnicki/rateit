import { NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import { requireAdmin } from "@/lib/auth-helpers";

export async function GET() {
    try {
        await requireAdmin();
        await getClient();

        const posts = await Post.find()
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        const db = await getClient();
        const { ObjectId } = require('mongodb');

        // Populate user data
        const postsWithUsers = await Promise.all(
            posts.map(async (post: any) => {
                if (post.user) {
                    const userIdString = typeof post.user === 'string' ? post.user : post.user.toString();

                    let user;
                    try {
                        user = await db.collection("user").findOne(
                            { _id: new ObjectId(userIdString) },
                            { projection: { name: 1, email: 1, _id: 1 } }
                        );
                    } catch (e) {
                        user = await db.collection("user").findOne(
                            { _id: userIdString as any },
                            { projection: { name: 1, email: 1, _id: 1 } }
                        );
                    }

                    if (user) {
                        return {
                            ...post,
                            _id: (post._id as any).toString(),
                            user: {
                                _id: userIdString,
                                name: user.name,
                                email: user.email,
                            }
                        };
                    }
                }
                return {
                    ...post,
                    _id: (post._id as any).toString(),
                };
            })
        );

        return NextResponse.json({ posts: postsWithUsers });
    } catch (error: any) {
        console.error("Admin posts fetch error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch posts" },
            { status: error.message === "Admin access required" ? 403 : 500 }
        );
    }
}

