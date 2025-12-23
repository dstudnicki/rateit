// GET AND UPDATE USER PROFILE
import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Profile from "@/models/Profile";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateTag } from "next/cache";

// Get user profile by userId
export async function GET(request: NextRequest, { params }: { params: Promise<{ _id: string }> }) {
    try {
        await getClient();
        const { _id } = await params;

        let profile = await Profile.findOne({ _id }).lean();

        // If profile doesn't exist, create a default one
        if (!profile) {
            const newProfile = await Profile.create({
                _id,
                fullName: "",
                headline: "",
                location: "",
                about: "",
                experience: [],
                education: [],
                skills: [],
                connections: 0,
            });
            profile = newProfile.toObject();
        }

        return NextResponse.json(profile, { status: 200 });
    } catch (error) {
        console.error("Error fetching profile:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

// Update user profile
export async function PUT(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await getClient();
        const { userId } = await params;

        // Ensure user can only update their own profile
        if (session.user.id !== userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const updateData = await request.json();

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $set: updateData },
            { new: true, upsert: true, runValidators: true }
        );

        updateTag(`profile-${userId}`);

        return NextResponse.json(profile, { status: 200 });
    } catch (error) {
        console.error("Error updating profile:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

