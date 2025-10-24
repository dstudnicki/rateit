// import { type NextRequest, NextResponse } from "next/server";
// import dbConnect from "@/lib/mongoose";
// import User from "@/models/User";

// import bcrypt from "bcryptjs";
// import jwt from "jsonwebtoken";

// export async function POST(request: NextRequest) {
//     try {
//         await dbConnect();
//         const { email, password } = await request.json();
//         const existingUser = await User.findOne({ email });

//         if (!existingUser) return NextResponse.json({ message: "Authentication failed: User not found" }, { status: 401 });
//         const passwordMatch = await bcrypt.compare(password, existingUser.password);

//         if (!passwordMatch) {
//             return NextResponse.json({ message: "Authentication failed: Incorrect password" }, { status: 401 });
//         }
//         const token = jwt.sign({ userId: existingUser._id }, process.env.JWT_SECRET ?? "", { expiresIn: "1h" });
//         return NextResponse.json({ message: "Login successful", token }, { status: 200 });
//     } catch (error) {
//         console.error("Login error:", error);
//         return NextResponse.json({ message: "Internal server error." }, { status: 500 });
//     }
// }
