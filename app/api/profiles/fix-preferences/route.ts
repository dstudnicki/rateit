import { NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import Profile from "@/models/Profile";

// Test endpoint to check and fix preferences for existing profiles
export async function GET() {
    try {
        await getClient();

        // Find all profiles without preferences or with incomplete preferences
        const profiles = await Profile.find({
            $or: [
                { preferences: { $exists: false } },
                { "preferences.onboardingCompleted": { $exists: false } }
            ]
        });

        console.log(`Found ${profiles.length} profiles needing preferences update`);

        // Update each profile with default preferences
        const updates = await Promise.all(
            profiles.map(async (profile) => {
                if (!profile.preferences) {
                    profile.preferences = {
                        industries: [],
                        skills: [],
                        companies: [],
                        onboardingCompleted: false,
                    };
                } else if (profile.preferences.onboardingCompleted === undefined) {
                    profile.preferences.onboardingCompleted = false;
                }

                if (!profile.interactionHistory) {
                    profile.interactionHistory = [];
                }

                await profile.save();
                return profile.slug || profile.userId;
            })
        );

        return NextResponse.json({
            success: true,
            message: `Updated ${updates.length} profiles with preferences`,
            profiles: updates,
        });
    } catch (error) {
        console.error("Error updating profiles:", error);
        return NextResponse.json(
            { success: false, error: "Failed to update profiles" },
            { status: 500 }
        );
    }
}

