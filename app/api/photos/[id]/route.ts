// DELETE PHOTO BY ID
import { type NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Photo from "@/models/Photo";
import jwt from "jsonwebtoken";

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
        return NextResponse.json({ message: "Missing authentication token." }, { status: 401 });
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET!);
    } catch {
        return NextResponse.json({ message: "Invalid or expired token." }, { status: 401 });
    }

    try {
        await getClient();
        const photoId = params.id;
        const result = await Photo.findByIdAndDelete(photoId);

        if (result) {
            return NextResponse.json({ message: "Photo deleted successfully!" }, { status: 200 });
        } else {
            return NextResponse.json({ message: "Photo not found." }, { status: 404 });
        }
    } catch (error) {
        console.error("Photo deletion error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
