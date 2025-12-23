// ADD, UPDATE, DELETE EXPERIENCE
import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Profile from "@/models/Profile";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateTag } from "next/cache";

// Add experience
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

        const experienceData = await request.json();

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $push: { experience: experienceData } },
            { new: true, upsert: true }
        );

        updateTag(`profile-${userId}`);

        return NextResponse.json(profile, { status: 201 });
    } catch (error) {
        console.error("Error adding experience:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

// Update specific experience
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

        if (session.user.id !== userId) {
            return NextResponse.json({ message: "Forbidden" }, { status: 403 });
        }

        const { experienceId, ...updateData } = await request.json();

        const profile = await Profile.findOneAndUpdate(
            { userId, "experience._id": experienceId },
            { $set: { "experience.$": { _id: experienceId, ...updateData } } },
            { new: true }
        );

        if (!profile) {
            return NextResponse.json({ message: "Experience not found" }, { status: 404 });
        }

        updateTag(`profile-${userId}`);

        return NextResponse.json(profile, { status: 200 });
    } catch (error) {
        console.error("Error updating experience:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

// Delete experience
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
        const experienceId = searchParams.get("experienceId");

        if (!experienceId) {
            return NextResponse.json({ message: "Experience ID required" }, { status: 400 });
        }

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $pull: { experience: { _id: experienceId } } },
            { new: true }
        );

        if (!profile) {
            return NextResponse.json({ message: "Profile not found" }, { status: 404 });
        }

        updateTag(`profile-${userId}`);

        return NextResponse.json(profile, { status: 200 });
    } catch (error) {
        console.error("Error deleting experience:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

