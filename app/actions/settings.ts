"use server";

import { getClient } from "@/lib/mongoose";
import Profile from "@/models/Profile";
import Post from "@/models/Post";
import { requireAuth } from "@/lib/auth-helpers";
import { del } from "@vercel/blob";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

interface ActionResponse {
    success: boolean;
    message?: string;
    error?: string;
}

/**
 * Update profile settings (fullName, headline, location)
 */
export async function updateProfileSettings(data: {
    fullName?: string;
    headline?: string;
    location?: string;
}): Promise<ActionResponse> {
    try {
        const user = await requireAuth();

        await getClient();

        const updateData: Record<string, string> = {};
        if (data.fullName !== undefined) updateData.fullName = data.fullName;
        if (data.headline !== undefined) updateData.headline = data.headline;
        if (data.location !== undefined) updateData.location = data.location;

        const profile = await Profile.findOneAndUpdate({ userId: user.id }, { $set: updateData }, { new: true });

        if (!profile) {
            return { success: false, error: "Profile not found" };
        }

        return {
            success: true,
            message: "Profile updated successfully",
        };
    } catch (error) {
        console.error("[Settings] Update profile error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update profile",
        };
    }
}

/**
 * Update RODO consent
 */
export async function updateRodoConsent(consent: boolean): Promise<ActionResponse> {
    try {
        const user = await requireAuth();

        await getClient();

        const profile = await Profile.findOneAndUpdate({ userId: user.id }, { $set: { rodoConsent: consent } }, { new: true });

        if (!profile) {
            return { success: false, error: "Profile not found" };
        }

        return {
            success: true,
            message: `RODO consent ${consent ? "granted" : "revoked"}`,
        };
    } catch (error) {
        console.error("[Settings] Update RODO consent error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to update consent",
        };
    }
}

export async function deleteAccount(): Promise<ActionResponse> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { success: false, error: "Authentication required" };
        }

        const userId = session.user.id;
        const db = await getClient();

        // Prepare ObjectId version of userId
        let userObjectId: ObjectId;
        try {
            userObjectId = new ObjectId(userId);
        } catch {
            // If userId is already an ObjectId or can't be converted, throw error
            throw new Error("Invalid user ID format");
        }

        // 1. Get user and profile data for cleanup
        const user = await db.collection("user").findOne({ _id: userObjectId as any });
        const profile = await db.collection("profiles").findOne({ userId });

        // 2. Delete images from Vercel Blob
        const imagesToDelete: string[] = [];

        if (user?.userImage && user.userImage.includes("blob.vercel-storage.com")) {
            imagesToDelete.push(user.userImage);
        }

        if (profile?.backgroundImage && profile.backgroundImage.includes("blob.vercel-storage.com")) {
            imagesToDelete.push(profile.backgroundImage);
        }

        // Delete images from blob storage
        for (const imageUrl of imagesToDelete) {
            try {
                await del(imageUrl, {
                    token: process.env.BLOB_READ_WRITE_TOKEN!,
                });
                console.log(`[Settings] Deleted blob image: ${imageUrl}`);
            } catch (error) {
                console.warn(`[Settings] Could not delete blob image ${imageUrl}:`, error);
            }
        }

        // 3. Update all user's posts - set user to "deleted-user" string
        // Post model uses ObjectId for user field, so we need to use the ObjectId version
        try {
            await Post.updateMany(
                { user: userObjectId }, // Use ObjectId here
                {
                    $set: {
                        user: "deleted-user",
                        updatedAt: new Date(),
                    },
                },
            );
            console.log(`[Settings] Updated posts for deleted user ${userId}`);
        } catch (postError) {
            console.warn("[Settings] Could not update posts (user might not have any):", postError);
        }

        // 3a. Update comments where user is the author
        try {
            await Post.updateMany(
                { "comments.user": userObjectId },
                {
                    $set: {
                        "comments.$[comment].user": "deleted-user",
                        updatedAt: new Date(),
                    },
                },
                {
                    arrayFilters: [{ "comment.user": userObjectId }],
                },
            );
            console.log(`[Settings] Updated comments for deleted user ${userId}`);
        } catch (commentError) {
            console.warn("[Settings] Could not update comments:", commentError);
        }

        // 3b. Update replies where user is the author
        try {
            await Post.updateMany(
                { "comments.replies.user": userObjectId },
                {
                    $set: {
                        "comments.$[].replies.$[reply].user": "deleted-user",
                        updatedAt: new Date(),
                    },
                },
                {
                    arrayFilters: [{ "reply.user": userObjectId }],
                },
            );
            console.log(`[Settings] Updated replies for deleted user ${userId}`);
        } catch (replyError) {
            console.warn("[Settings] Could not update replies:", replyError);
        }

        // 4. Delete profile (uses string userId)
        await db.collection("profiles").deleteOne({ userId }); // String userId
        console.log(`[Settings] Deleted profile for user ${userId}`);

        // 5. Delete account from Better Auth (uses string userId) - MUST be before deleting user!
        await db.collection("account").deleteOne({ userId }); // String userId
        console.log(`[Settings] Deleted account for user ${userId}`);

        // 6. Delete all sessions (uses string userId)
        await db.collection("session").deleteMany({ userId }); // String userId
        console.log(`[Settings] Deleted sessions for user ${userId}`);

        // 7. Delete user account (uses ObjectId) - LAST, after all references are removed!
        await db.collection("user").deleteOne({ _id: userObjectId }); // ObjectId
        console.log(`[Settings] Deleted user account ${userId}`);

        return {
            success: true,
            message: "Account deleted successfully",
        };
    } catch (error) {
        console.error("[Settings] Delete account error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to delete account",
        };
    }
}

/**
 * Get account type (email/password vs OAuth)
 */
export async function getAccountType(): Promise<{
    success: boolean;
    accountType?: "credential" | "oauth";
    provider?: string;
    error?: string;
}> {
    try {
        const user = await requireAuth();
        const db = await getClient();

        // Get user document first to find the correct userId
        let userObjectId: any;
        try {
            userObjectId = new ObjectId(user.id);
        } catch {
            userObjectId = user.id;
        }

        const userDoc = await db.collection("user").findOne({ _id: userObjectId });

        if (!userDoc) {
            return { success: false, error: "User not found in database" };
        }

        // Try to find account by userId (string representation of _id)
        const userIdString = userDoc._id.toString();
        let account = await db.collection("account").findOne({ userId: userIdString });

        // If not found, try with the session user.id
        if (!account) {
            account = await db.collection("account").findOne({ userId: user.id });
        }

        // If still not found, try with ObjectId as string
        if (!account && userObjectId) {
            account = await db.collection("account").findOne({ userId: userObjectId.toString() });
        }

        console.log("[Settings] Account check:", {
            sessionUserId: user.id,
            dbUserId: userIdString,
            found: !!account,
            providerId: account?.providerId,
        });

        // If no account found, try to detect from user.image (OAuth fallback)
        if (!account) {
            console.log("[Settings] No account found, checking user.image:", {
                hasImage: !!userDoc?.image,
                image: userDoc?.image,
            });

            if (userDoc?.image) {
                if (userDoc.image.includes("googleusercontent.com")) {
                    console.log("[Settings] Detected Google OAuth from user.image");
                    return {
                        success: true,
                        accountType: "oauth",
                        provider: "google",
                    };
                } else if (userDoc.image.includes("githubusercontent.com") || userDoc.image.includes("github")) {
                    console.log("[Settings] Detected GitHub OAuth from user.image");
                    return {
                        success: true,
                        accountType: "oauth",
                        provider: "github",
                    };
                }
            }

            return { success: false, error: "Account not found and could not detect OAuth" };
        }

        const isCredential = account.providerId === "credential";
        const accountType = isCredential ? "credential" : "oauth";
        const provider = isCredential ? undefined : account.providerId;

        console.log("[Settings] Account type result:", {
            accountType,
            provider,
            isCredential,
        });

        return {
            success: true,
            accountType,
            provider,
        };
    } catch (error) {
        console.error("[Settings] Get account type error:", error);
        return {
            success: false,
            error: error instanceof Error ? error.message : "Failed to get account type",
        };
    }
}
