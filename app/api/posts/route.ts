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
        const { ObjectId } = require('mongodb');

        const posts = await Post.find().sort({ createdAt: -1 }).lean();

        const postsWithUsersAndProfiles = await Promise.all(
            posts.map(async (post) => {
                if (post.user) {
                    const userIdString = typeof post.user === 'string' ? post.user : post.user.toString();

                    let user;
                    try {
                        user = await db.collection("user").findOne(
                            { _id: new ObjectId(userIdString) },
                            { projection: { name: 1, email: 1, _id: 1, image: 1, userImage: 1 } }
                        );
                    } catch (e) {
                        user = await db.collection("user").findOne(
                            { _id: userIdString as any },
                            { projection: { name: 1, email: 1, _id: 1, image: 1, userImage: 1 } }
                        );
                    }

                    if (user) {
                        const profile = await db.collection("profiles").findOne(
                            { userId: userIdString },
                            { projection: { slug: 1, fullName: 1, headline: 1, location: 1 } }
                        );

                        return {
                            ...post,
                            user: {
                                name: user.name,
                                email: user.email,
                                _id: userIdString,
                                slug: (profile?.slug && profile.slug.trim()) || null,
                                fullName: (profile?.fullName && profile.fullName.trim()) || null,
                                headline: (profile?.headline && profile.headline.trim()) || null,
                                location: (profile?.location && profile.location.trim()) || null,
                                image: user.userImage || user.image || null,
                            }
                        };
                    }
                }
                return post;
            }),
        );

        return NextResponse.json(postsWithUsersAndProfiles, { status: 200 });
    } catch (error) {
        console.error("Error fetching posts:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
