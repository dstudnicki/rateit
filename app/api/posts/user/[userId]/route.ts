// GET POSTS BY USER
import { NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import * as dtoPublic from "@/lib/dto/public";
import Profile from "@/models/Profile";

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;

        await getClient();

        const posts = await Post.find({ user: userId })
            .select("content images likes detectedCompanies detectedSkills detectedIndustries comments createdAt updatedAt")
            .sort({ createdAt: -1 })
            .lean();

        const postsPublic = await Promise.all(
            posts.map(async (post) => {
                let authorProfile = null;
                if (post.user) {
                    const userIdString = typeof post.user === "string" ? post.user : post.user.toString();
                    try {
                        authorProfile = await Profile.findOne({ userId: userIdString }).select("slug fullName image").lean();
                    } catch {
                        authorProfile = null;
                    }
                }
                return dtoPublic.toPostPublicDTO(post, authorProfile);
            }),
        );

        return NextResponse.json(postsPublic, { status: 200 });
    } catch {
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
