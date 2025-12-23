// ADD, UPDATE, DELETE EDUCATION
import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Profile from "@/models/Profile";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { updateTag } from "next/cache";

// Add education
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

        const educationData = await request.json();

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $push: { education: educationData } },
            { new: true, upsert: true }
        );

        updateTag(`profile-${userId}`);

        return NextResponse.json(profile, { status: 201 });
    } catch (error) {
        console.error("Error adding education:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

// Update specific education
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

        const { educationId, ...updateData } = await request.json();

        const profile = await Profile.findOneAndUpdate(
            { userId, "education._id": educationId },
            { $set: { "education.$": { _id: educationId, ...updateData } } },
            { new: true }
        );

        if (!profile) {
            return NextResponse.json({ message: "Education not found" }, { status: 404 });
        }

        updateTag(`profile-${userId}`);

        return NextResponse.json(profile, { status: 200 });
    } catch (error) {
        console.error("Error updating education:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

// Delete education
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
        const educationId = searchParams.get("educationId");

        if (!educationId) {
            return NextResponse.json({ message: "Education ID required" }, { status: 400 });
        }

        const profile = await Profile.findOneAndUpdate(
            { userId },
            { $pull: { education: { _id: educationId } } },
            { new: true }
        );

        if (!profile) {
            return NextResponse.json({ message: "Profile not found" }, { status: 404 });
        }

        updateTag(`profile-${userId}`);

        return NextResponse.json(profile, { status: 200 });
    } catch (error) {
        console.error("Error deleting education:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

