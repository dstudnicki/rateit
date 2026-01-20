import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import { toCommentPublicDTO } from "@/lib/dto/public";
import Profile from "@/models/Profile";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// Collect userIds from comments + nested replies
function collectUserIdsFromComments(comments: any[], out = new Set<string>()) {
    for (const c of comments || []) {
        if (c?.user) out.add(String(c.user));
        if (Array.isArray(c?.replies) && c.replies.length) {
            collectUserIdsFromComments(c.replies, out);
        }
    }
    return out;
}

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

        // Build userId -> profile map for ALL comment authors (comments + replies)
        const ids = Array.from(collectUserIdsFromComments(post.comments || []));
        const profiles = ids.length
            ? await Profile.find({ userId: { $in: ids } })
                  .select("userId slug fullName image userImage")
                  .lean()
            : [];

        const profileMap: Record<string, any> = {};
        for (const p of profiles as any[]) profileMap[String(p.userId)] = p;

        // Map comments and replies using profileMap
        const commentsPublic = (post.comments || []).map((comment: any) =>
            toCommentPublicDTO(comment, profileMap, sessionUserId),
        );

        return NextResponse.json(commentsPublic, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
