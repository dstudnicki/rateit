// GET PHOTO BY USER
import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Photo from "@/models/Photo";

export async function GET() {
    try {
        await dbConnect();
        const photos = await Photo.find().populate("user", "username email");
        return NextResponse.json(photos, { status: 200 });
    } catch (error) {
        console.error("Error fetching posts by user:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
