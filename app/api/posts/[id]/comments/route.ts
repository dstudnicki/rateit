// GET POST  COMMENTS FOR POST

import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ message: "Missing authentication token." }, { status: 401 });
    }

    try {
        await getClient();
        const { id: postId } = await params;
        const { content } = await request.json();
        const newComment = { content, user: session.user.id, createdAt: new Date() };

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

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        const db = await getClient();

        const { id: postId } = await params;
        const post = await Post.findById(postId).lean();

        if (!post) {
            return NextResponse.json({ message: "Post not found." }, { status: 404 });
        }

        // Manually populate users for comments and replies
        const commentsWithUsers = await Promise.all(
            post.comments.map(async (comment: any) => {
                let commentUser = null;
                if (comment.user) {
                    commentUser = await db.collection("user").findOne(
                        { _id: comment.user },
                        { projection: { name: 1, email: 1 } }
                    );
                }

                // Manually populate users for replies
                const repliesWithUsers = await Promise.all(
                    (comment.replies || []).map(async (reply: any) => {
                        let replyUser = null;
                        if (reply.user) {
                            replyUser = await db.collection("user").findOne(
                                { _id: reply.user },
                                { projection: { name: 1, email: 1 } }
                            );
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
