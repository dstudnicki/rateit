import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getClient } from "@/lib/mongoose";

/**
 * GET /api/profile/current
 * Get current user's profile with image
 */
export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = await getClient();
        const { ObjectId } = require("mongodb");

        // Get profile from database
        const profile = await db.collection("profiles").findOne(
            { userId: session.user.id },
            {
                projection: {
                    backgroundImage: 1,
                    fullName: 1,
                    slug: 1,
                    headline: 1,
                    _id: 1,
                },
            },
        );

        if (!profile) {
            return NextResponse.json(
                {
                    profile: null,
                    message: "Profile not found",
                },
                { status: 404 },
            );
        }

        // Get user data (including image and userImage)
        let user;
        try {
            user = await db
                .collection("user")
                .findOne({ _id: new ObjectId(session.user.id) }, { projection: { image: 1, userImage: 1 } });
        } catch (e) {
            user = await db
                .collection("user")
                .findOne({ _id: session.user.id as any }, { projection: { image: 1, userImage: 1 } });
        }

        // Convert MongoDB _id to string
        const profileData = {
            ...profile,
            _id: profile._id.toString(),
            image: user?.userImage || user?.image || null, // userImage has priority over OAuth image
        };

        return NextResponse.json({
            profile: profileData,
            success: true,
        });
    } catch (error) {
        console.error("[Profile Current] Error:", error);
        return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
    }
}
