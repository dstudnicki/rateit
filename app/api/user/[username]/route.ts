// GET USER PROFILE, EDIT PROFILE, AND DELETE ACCOUNT
import { type NextRequest, NextResponse } from "next/server";

import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest, { params }: { params: { username: string } }) {
    try {
        await dbConnect();
        const username = params.username;
        const user = await User.findOne({ username });

        if (!user) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        return NextResponse.json(user, { status: 200 });
    } catch (error) {
        console.error("Error fetching user profile:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

export async function PUT(request: NextRequest, { params }: { params: { userId: string } }) {
    try {
        await dbConnect();
        const userId = params.userId;
        const { username, email, password } = await request.json();
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        if (username) user.username = username;

        if (email) user.email = email;

        if (password) user.password = await bcrypt.hash(password, 10);

        const updatedUser = await user.save();
        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { username: string } }) {
    try {
        await dbConnect();
        const username = params.username;
        const user = await User.findOneAndDelete({ username });

        if (!user) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        return NextResponse.json({ message: "User account deleted successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error deleting user account:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
