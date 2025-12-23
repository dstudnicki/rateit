// ADD, DELETE, ENDORSE SKILLS
import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Profile from "@/models/Profile";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateTag } from "next/cache";

// Add skill
export async function POST(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await getClient();
        const { userId } = await params;

        if (session.user.id !== userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { name } = await request.json();

        // Check if skill already exists
        const existingProfile = await Profile.findOne({ userId, "skills.name": name });
        if (existingProfile) {
            return NextResponse.json({ message: "Skill already exists" }, { status: 400 });
        }

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $push: { skills: { name, endorsements: 0 } } },
            { new: true, upsert: true }
        );

        updateTag(`profile-${userId}`);

        return NextResponse.json(profile, { status: 201 });
    } catch (error) {
        console.error("Error adding skill:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

// Delete skill
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await getClient();
        const { userId } = await params;

        if (session.user.id !== userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const skillName = searchParams.get("name");

        if (!skillName) {
            return NextResponse.json({ message: "Skill name required" }, { status: 400 });
        }

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $pull: { skills: { name: skillName } } },
            { new: true }
        );

        if (!profile) {
            return NextResponse.json({ message: "Profile not found" }, { status: 404 });
        }

        updateTag(`profile-${userId}`);

        return NextResponse.json(profile, { status: 200 });
    } catch (error) {
        console.error("Error deleting skill:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

// Endorse skill
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        await getClient();
        const { userId } = await params;

        const { name } = await request.json();

        if (!name) {
            return NextResponse.json({ message: "Skill name required" }, { status: 400 });
        }

        const profile = await Profile.findOneAndUpdate(
            { userId, "skills.name": name },
            { $inc: { "skills.$.endorsements": 1 } },
            { new: true }
        );

        if (!profile) {
            return NextResponse.json({ message: "Skill not found" }, { status: 404 });
        }

        updateTag(`profile-${userId}`);

        return NextResponse.json(profile, { status: 200 });
    } catch (error) {
        console.error("Error endorsing skill:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

