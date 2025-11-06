// GET USER PROFILE, EDIT PROFILE, AND DELETE ACCOUNT
import { type NextRequest, NextResponse } from "next/server";

import { getClient } from "@/lib/mongoose";
import bcrypt from "bcryptjs";

export async function GET(request: NextRequest, { params }: { params: { email: string } }) {
    try {
        await getClient();
        const email = params.email;
        const user = await User.findOne({ email });

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
        await getClient();
        const userId = params.userId;
        const { email, password } = await request.json();
        const user = await User.findById(userId);

        if (!user) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        if (email) user.email = email;

        if (password) user.password = await bcrypt.hash(password, 10);

        const updatedUser = await user.save();
        return NextResponse.json(updatedUser, { status: 200 });
    } catch (error) {
        console.error("Error updating user profile:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest, { params }: { params: { email: string } }) {
    try {
        await getClient();
        const email = params.email;
        const user = await User.findOneAndDelete({ email });

        if (!user) {
            return NextResponse.json({ message: "User not found." }, { status: 404 });
        }

        return NextResponse.json({ message: "User account deleted successfully." }, { status: 200 });
    } catch (error) {
        console.error("Error deleting user account:", error);
        return NextResponse.json({ message: "Internal server error." }, { status: 500 });
    }
}
