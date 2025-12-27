// GET COMMENTS FOR POST

import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const db = await getClient();
        const { ObjectId } = require('mongodb');

        const { id: postId } = await params;
        const post = await Post.findById(postId).lean();

        if (!post) {
            return NextResponse.json({ message: "Post not found." }, { status: 404 });
        }

        const commentsWithUsers = await Promise.all(
            post.comments.map(async (comment: any) => {
                let commentUser = null;
                if (comment.user) {
                    const userIdString = typeof comment.user === 'string' ? comment.user : comment.user.toString();

                    try {
                        commentUser = await db.collection("user").findOne(
                            { _id: new ObjectId(userIdString) },
                            { projection: { name: 1, email: 1, _id: 1, image: 1 } }
                        );
                    } catch (e) {
                        commentUser = await db.collection("user").findOne(
                            { _id: userIdString },
                            { projection: { name: 1, email: 1, _id: 1, image: 1 } }
                        );
                    }

                    if (commentUser) {
                        const profile = await db.collection("profiles").findOne(
                            { userId: userIdString },
                            { projection: { slug: 1, fullName: 1 } }
                        );

                        commentUser = {
                            ...commentUser,
                            _id: userIdString,
                            slug: profile?.slug || commentUser.name,
                            fullName: profile?.fullName || null,
                        };
                    }
                }

                const repliesWithUsers = await Promise.all(
                    (comment.replies || []).map(async (reply: any) => {
                        let replyUser = null;
                        if (reply.user) {
                            const userIdString = typeof reply.user === 'string' ? reply.user : reply.user.toString();

                            try {
                                replyUser = await db.collection("user").findOne(
                                    { _id: new ObjectId(userIdString) },
                                    { projection: { name: 1, email: 1, _id: 1, image: 1 } }
                                );
                            } catch (e) {
                                replyUser = await db.collection("user").findOne(
                                    { _id: userIdString },
                                    { projection: { name: 1, email: 1, _id: 1, image: 1 } }
                                );
                            }

                            if (replyUser) {
                                const profile = await db.collection("profiles").findOne(
                                    { userId: userIdString },
                                    { projection: { slug: 1, fullName: 1 } }
                                );

                                replyUser = {
                                    ...replyUser,
                                    _id: userIdString,
                                    slug: profile?.slug || replyUser.name,
                                    fullName: profile?.fullName || null,
                                };
                            }
                        }
                        return { ...reply, user: replyUser };
                    })
                );

                return { ...comment, user: commentUser, replies: repliesWithUsers };
            })
        );

        return NextResponse.json(commentsWithUsers, { status: 200 });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
