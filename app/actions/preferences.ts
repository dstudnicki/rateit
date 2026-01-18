"use server";

import { getClient } from "@/lib/mongoose";
import Profile from "@/models/Profile";
import { requireUser } from "@/app/data/user/require-user";
import { revalidateTag } from "next/cache";

export interface UserPreferences {
    industries: string[];
    skills: string[];
    companies: string[];
}

export async function saveUserPreferences(preferences: UserPreferences) {
    const session = await requireUser();

    try {
        await getClient();

        // Use updateOne instead of save() to avoid serialization issues
        const result = await Profile.updateOne(
            { userId: session.user.id },
            {
                $set: {
                    preferences: {
                        ...preferences,
                        onboardingCompleted: true,
                    },
                },
            },
        );

        if (result.matchedCount === 0) {
            return { success: false, error: "Profile not found" };
        }

        // Invalidate cache to refresh feed
        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        revalidateTag(`posts-feed-${cacheBucket}`, "max");

        return { success: true };
    } catch (error) {
        console.error("Failed to save user preferences:", error);
        return { success: false, error: "Failed to save preferences" };
    }
}

export async function trackInteraction(
    targetId: string,
    targetType: "post" | "company" | "profile",
    interactionType: "like" | "comment" | "view",
) {
    console.log(`[trackInteraction] Called: ${interactionType} on ${targetType} ${targetId}`);

    // Use auth instead of requireUser to avoid redirect for non-authenticated users
    const { auth } = await import("@/lib/auth");
    const session = await auth.api.getSession({
        headers: await import("next/headers").then((m) => m.headers()),
    });

    // Silently return if no session - tracking is optional
    if (!session) {
        return { success: false, error: "Not authenticated" };
    }

    try {
        await getClient();

        // Use updateOne with $push and $slice to add interaction and keep only last 100
        const result = await Profile.updateOne(
            { userId: session.user.id },
            {
                $push: {
                    interactionHistory: {
                        $each: [
                            {
                                type: interactionType,
                                targetId,
                                targetType,
                                timestamp: new Date(),
                            },
                        ],
                        $slice: -100, // Keep only last 100
                    },
                },
            },
        );

        if (result.matchedCount === 0) {
            console.log(`[trackInteraction] Profile not found for user ${session.user.id}`);
            return { success: false, error: "Profile not found" };
        }

        console.log(`[trackInteraction] ✓ Saved ${interactionType} on ${targetType} for user ${session.user.id}`);

        return { success: true };
    } catch (error) {
        console.error("[trackInteraction] Failed to track interaction:", error);
        return { success: false, error: "Failed to track interaction" };
    }
}

export async function getUserPreferences() {
    // Use auth instead of requireUser to avoid redirect for non-authenticated users
    const { auth } = await import("@/lib/auth");
    const session = await auth.api.getSession({
        headers: await import("next/headers").then((m) => m.headers()),
    });

    // Return early if no session - user is not logged in
    if (!session) {
        return { success: false, error: "Not authenticated", preferences: null };
    }

    try {
        await getClient();

        const profile = await Profile.findOne({ userId: session.user.id }).lean();

        if (!profile) {
            return { success: false, error: "Profile not found", preferences: null };
        }

        // Serialize preferences to plain object to avoid circular references
        const preferences = profile.preferences
            ? {
                  industries: profile.preferences.industries || [],
                  skills: profile.preferences.skills || [],
                  companies: profile.preferences.companies || [],
                  onboardingCompleted: profile.preferences.onboardingCompleted || false,
              }
            : null;

        return {
            success: true,
            preferences,
        };
    } catch (error) {
        console.error("Failed to get user preferences:", error);
        return { success: false, error: "Failed to get preferences", preferences: null };
    }
}
