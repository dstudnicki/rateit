// GET POSTS BY USER
import { NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;

        await getClient();
        const db = await getClient();
        const { ObjectId } = require("mongodb");

        const posts = await Post.find({ user: userId }).sort({ createdAt: -1 }).lean();

        const postsWithUsersAndProfiles = await Promise.all(
            posts.map(async (post) => {
                if (post.user) {
                    const userIdString = typeof post.user === "string" ? post.user : post.user.toString();

                    let user;
                    try {
                        user = await db
                            .collection("user")
                            .findOne({ _id: new ObjectId(userIdString) }, { projection: { name: 1, email: 1, _id: 1, image: 1 } });
                    } catch (e) {
                        user = await db
                            .collection("user")
                            .findOne({ _id: userIdString }, { projection: { name: 1, email: 1, _id: 1, image: 1 } });
                    }

                    if (user) {
                        const profile = await db
                            .collection("profiles")
                            .findOne({ userId: userIdString }, { projection: { slug: 1, fullName: 1, headline: 1, location: 1 } });

                        return {
                            ...post,
                            user: {
                                name: user.name,
                                email: user.email,
                                _id: userIdString,
                                slug: profile?.slug || user.name,
                                fullName: profile?.fullName || null,
                                headline: profile?.headline || null,
                                location: profile?.location || null,
                                image: user.image || null,
                            },
                        };
                    }
                }
                return post;
            }),
        );

        return NextResponse.json(postsWithUsersAndProfiles, { status: 200 });
    } catch (error) {
        console.error("Error fetching posts by user:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
