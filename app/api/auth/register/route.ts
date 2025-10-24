import { type NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        const { email, password } = await request.json();
        const existingUser = await User.findOne({ email });

        if (existingUser) return NextResponse.json({ message: "Email already registered!" }, { status: 400 });
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = { email, password: hashedPassword };
        const result = await User.insertOne(newUser);

        if (result.acknowledged) {
            return NextResponse.json({ message: "User registered successfully!" }, { status: 201 });
        } else {
            return NextResponse.json({ message: "Failed to register user." }, { status: 500 });
        }
    } catch (error) {
        console.error("Registration error:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
