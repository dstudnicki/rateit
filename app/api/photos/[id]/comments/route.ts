// GET POST  COMMENTS FOR PHOTO

import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Photo from "@/models/Photo";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
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
        await dbConnect();
        const photoId = params.id;
        const { userId, content } = await request.json();

        const photo = await Photo.findById(photoId);
        if (!photo) {
            return NextResponse.json({ message: "Photo not found." }, { status: 404 });
        }

        photo.comments.push({ user: userId, content });
        await photo.save();

        return NextResponse.json(photo.comments, { status: 201 });
    } catch (error) {
        console.error("Error adding comment:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

export async function GET({ params }: { params: { id: string } }) {
    try {
        await dbConnect();
        const photoId = params.id;
        const photo = await Photo.findById(photoId).populate("comments.user", "username email");

        if (!photo) {
            return NextResponse.json({ message: "Photo not found." }, { status: 404 });
        }

        return NextResponse.json(photo.comments, { status: 200 });
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
