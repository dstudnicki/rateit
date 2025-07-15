// GET AND POST PHOTO
import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Photo from "@/models/Photo";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json({ message: "Authentication failed: No token provided" }, { status: 401 });
    }

    try {
        await dbConnect();
        const user = jwt.decode(token) as { userId: string };
        const { filename, description } = await request.json();
        const newPhoto = { filename, description, user, createdAt: new Date() };
        const result = await Photo.create(newPhoto);

        if (result) {
            return NextResponse.json({ message: "Photo created successfully!" }, { status: 201 });
        } else {
            return NextResponse.json({ message: "Failed to create photo." }, { status: 500 });
        }
    } catch (error) {
        console.error("Photo creation error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

export async function GET() {
    try {
        await dbConnect();
        const photos = await Photo.find().sort({ createdAt: -1 });
        return NextResponse.json(photos, { status: 200 });
    } catch (error) {
        console.error("Error fetching photos:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
