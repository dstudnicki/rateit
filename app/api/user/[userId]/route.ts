import { NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import { ObjectId } from "mongodb";

export async function GET(request: Request, { params }: { params: Promise<{ userId: string }> }) {
    try {
        const { userId } = await params;
        const db = await getClient();

        // Try to convert to ObjectId
        let userObjectId;
        try {
            userObjectId = new ObjectId(userId);
        } catch {
            userObjectId = userId;
        }

        // Find user in database
        const user = await db
            .collection("user")
            .findOne({ _id: userObjectId as any }, { projection: { userImage: 1, image: 1, name: 1, email: 1 } });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            userImage: user.userImage || null,
            image: user.image || null,
            name: user.name,
            email: user.email,
        });
    } catch (error) {
        console.error("[API] Get user error:", error);
        return NextResponse.json({ error: "Failed to fetch user" }, { status: 500 });
    }
}
