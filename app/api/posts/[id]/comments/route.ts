// GET COMMENTS FOR POST

import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import { toCommentPublicDTO } from "@/lib/dto/public";
import Profile from "@/models/Profile";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
    try {
        await getClient();

        const { id: postId } = await params;
        const post: any = await Post.findById(postId).select("comments user").lean();

        if (!post) {
            return NextResponse.json({ message: "Post not found." }, { status: 404 });
        }

        // optional session for permissions
        let sessionUserId: string | undefined = undefined;
        try {
            const session = await auth.api.getSession({ headers: await headers() });
            sessionUserId = session?.user?.id;
        } catch {
            sessionUserId = undefined;
        }

        const commentsPublic = await Promise.all(
            (post.comments || []).map(async (comment: any) => {
                let authorProfile = null;
                if (comment.user) {
                    const userIdString = typeof comment.user === "string" ? comment.user : comment.user.toString();
                    try {
                        authorProfile = await Profile.findOne({ userId: userIdString }).select("slug fullName image").lean();
                    } catch {
                        authorProfile = null;
                    }
                }

                // Map comment and its replies to public DTO (no user/userId in output), pass session id
                return toCommentPublicDTO(comment, authorProfile, sessionUserId);
            }),
        );

        return NextResponse.json(commentsPublic, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
