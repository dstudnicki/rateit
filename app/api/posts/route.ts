// GET AND POST POSTS
import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import * as dtoPublic from "@/lib/dto/public";
import Profile from "@/models/Profile";
import { requireSession } from "@/lib/auth/require-session";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

// export async function POST(request: NextRequest) {
//     let session;
//     try {
//         session = await requireSession();
//     } catch {
//         return NextResponse.json({ message: "Missing authentication token." }, { status: 401 });
//     }
//
//     try {
//         await getClient();
//
//         const { content } = await request.json();
//         const newPost = { content, user: session.user.id, createdAt: new Date() };
//         const result = await Post.create(newPost);
//         if (result) {
//             // Return minimal response without user id
//             return NextResponse.json({ message: "Post created successfully!" }, { status: 201 });
//         } else {
//             return NextResponse.json({ message: "Failed to create post." }, { status: 500 });
//         }
//     } catch {
//         return NextResponse.json({ message: "Internal server error." }, { status: 500 });
//     }
// }

export async function GET() {
    try {
        await getClient();

        // get optional session to compute permissions
        let sessionUserId: string | undefined = undefined;
        try {
            const session = await auth.api.getSession({ headers: await headers() });
            sessionUserId = session?.user?.id;
        } catch {
            sessionUserId = undefined;
        }

        // Use allowlist select to avoid returning sensitive fields
        const posts = await Post.find()
            .select(
                "content images likes detectedCompanies detectedSkills detectedIndustries comments createdAt updatedAt user",
            )
            .sort({ createdAt: -1 })
            .lean();

        const postsWithUsersAndProfiles = await Promise.all(
            posts.map(async (post) => {
                let authorProfile = null;
                if (post.user) {
                    const userIdString = typeof post.user === "string" ? post.user : post.user.toString();
                    // Lookup profile by userId (Better Auth id stored in Profile.userId)
                    try {
                        authorProfile = await Profile.findOne({ userId: userIdString }).select("slug fullName image").lean();
                    } catch {
                        authorProfile = null;
                    }
                }

                // Map to public DTO (never includes userId) and pass sessionUserId for permissions
                return dtoPublic.toPostPublicDTO(post, authorProfile, sessionUserId);
            }),
        );

        return NextResponse.json(postsWithUsersAndProfiles, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
