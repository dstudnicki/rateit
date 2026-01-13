"use server";

import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import Company from "@/models/Company";
import { requireModerator, requireAdmin } from "@/lib/auth-helpers";

/**
 * Moderate post - delete or flag (moderators and admins only)
 */
export async function moderatePost(postId: string, action: "delete" | "flag", reason?: string) {
    const user = await requireModerator();

    try {
        await getClient();

        const post = await Post.findById(postId);

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        if (action === "delete") {
            // Log moderation action
            console.log(`Post ${postId} deleted by moderator ${user.id} (${user.email}). Reason: ${reason}`);

            await Post.findByIdAndDelete(postId);
            return { success: true, message: "Post deleted successfully" };
        }

        if (action === "flag") {
            // Add flagged status to post
            await Post.findByIdAndUpdate(postId, {
                $set: {
                    flagged: true,
                    flaggedReason: reason,
                    flaggedBy: user.id,
                    flaggedAt: new Date()
                }
            });

            console.log(`Post ${postId} flagged by moderator ${user.id} (${user.email}). Reason: ${reason}`);
            return { success: true, message: "Post flagged successfully" };
        }

        return { success: false, error: "Invalid action" };
    } catch (error) {
        console.error("Failed to moderate post:", error);
        return { success: false, error: "Failed to moderate post" };
    }
}

/**
 * Moderate company review - delete or flag (moderators and admins only)
 */
export async function moderateCompanyReview(
    companyId: string,
    reviewId: string,
    action: "delete" | "flag",
    reason?: string
) {
    const user = await requireModerator();

    try {
        await getClient();

        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const reviewIndex = company.reviews.findIndex(
            (r: any) => r._id.toString() === reviewId
        );

        if (reviewIndex === -1) {
            return { success: false, error: "Review not found" };
        }

        if (action === "delete") {
            // Log moderation action
            console.log(`Review ${reviewId} on company ${companyId} deleted by moderator ${user.id} (${user.email}). Reason: ${reason}`);

            company.reviews.splice(reviewIndex, 1);
            await company.save();

            return { success: true, message: "Review deleted successfully" };
        }

        if (action === "flag") {
            // Flag review
            company.reviews[reviewIndex].flagged = true;
            company.reviews[reviewIndex].flaggedReason = reason;
            company.reviews[reviewIndex].flaggedBy = user.id;
            company.reviews[reviewIndex].flaggedAt = new Date();

            await company.save();

            console.log(`Review ${reviewId} on company ${companyId} flagged by moderator ${user.id} (${user.email}). Reason: ${reason}`);
            return { success: true, message: "Review flagged successfully" };
        }

        return { success: false, error: "Invalid action" };
    } catch (error) {
        console.error("Failed to moderate review:", error);
        return { success: false, error: "Failed to moderate review" };
    }
}

/**
 * Get all flagged content (moderators and admins only)
 */
export async function getFlaggedContent() {
    await requireModerator();

    try {
        await getClient();

        // Get flagged posts
        const flaggedPosts = await Post.find({ flagged: true })
            .sort({ flaggedAt: -1 })
            .lean();

        // Get companies with flagged reviews
        const companiesWithFlaggedReviews = await Company.find({
            "reviews.flagged": true
        }).lean();

        const flaggedReviews = companiesWithFlaggedReviews.flatMap(company =>
            company.reviews
                .filter((review: any) => review.flagged)
                .map((review: any) => ({
                    ...review,
                    companyId: company._id,
                    companyName: company.name
                }))
        );

        return {
            success: true,
            posts: flaggedPosts.map(post => ({
                ...post,
                _id: String(post._id || ''),
                user: String(post.user || ''),
            })),
            reviews: flaggedReviews.map(review => ({
                ...review,
                _id: String(review._id || ''),
                user: String(review.user || ''),
                companyId: String(review.companyId || ''),
            })),
        };
    } catch (error) {
        console.error("Failed to get flagged content:", error);
        return { success: false, error: "Failed to get flagged content" };
    }
}

/**
 * Get moderation logs (admins only)
 */
export async function getModerationLogs(limit: number = 50) {
    await requireAdmin();

    try {
        await getClient();

        // In production, you'd have a separate ModerationLog collection
        // For now, we'll return recently flagged/deleted items
        const recentlyFlagged = await Post.find({
            $or: [
                { flagged: true },
                { deletedBy: { $exists: true } }
            ]
        })
            .sort({ updatedAt: -1 })
            .limit(limit)
            .lean();

        return {
            success: true,
            logs: recentlyFlagged.map(item => ({
                ...item,
                _id: String(item._id || ''),
            })),
        };
    } catch (error) {
        console.error("Failed to get moderation logs:", error);
        return { success: false, error: "Failed to get moderation logs" };
    }
}

/**
 * Ban user (admins only)
 */
export async function banUser(userId: string, reason: string, duration?: number) {
    const admin = await requireAdmin();

    try {
        const db = await getClient();
        const { ObjectId } = require('mongodb');

        const banUntil = duration
            ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) // duration in days
            : null; // Permanent ban if no duration

        let result;
        try {
            result = await db.collection("user").updateOne(
                { _id: new ObjectId(userId) },
                {
                    $set: {
                        banned: true,
                        banReason: reason,
                        bannedBy: admin.id,
                        bannedAt: new Date(),
                        banUntil
                    }
                }
            );
        } catch (e) {
            result = await db.collection("user").updateOne(
                { _id: userId as any },
                {
                    $set: {
                        banned: true,
                        banReason: reason,
                        bannedBy: admin.id,
                        bannedAt: new Date(),
                        banUntil
                    }
                }
            );
        }

        if (result.modifiedCount > 0) {
            console.log(`User ${userId} banned by admin ${admin.id} (${admin.email}). Reason: ${reason}`);
            return { success: true, message: "User banned successfully" };
        }

        return { success: false, error: "Failed to ban user" };
    } catch (error) {
        console.error("Failed to ban user:", error);
        return { success: false, error: "Failed to ban user" };
    }
}

/**
 * Unban user (admins only)
 */
export async function unbanUser(userId: string) {
    const admin = await requireAdmin();

    try {
        const db = await getClient();
        const { ObjectId } = require('mongodb');

        let result;
        try {
            result = await db.collection("user").updateOne(
                { _id: new ObjectId(userId) },
                {
                    $set: { banned: false },
                    $unset: { banReason: "", bannedBy: "", bannedAt: "", banUntil: "" }
                }
            );
        } catch (e) {
            result = await db.collection("user").updateOne(
                { _id: userId as any },
                {
                    $set: { banned: false },
                    $unset: { banReason: "", bannedBy: "", bannedAt: "", banUntil: "" }
                }
            );
        }

        if (result.modifiedCount > 0) {
            console.log(`User ${userId} unbanned by admin ${admin.id} (${admin.email})`);
            return { success: true, message: "User unbanned successfully" };
        }

        return { success: false, error: "Failed to unban user" };
    } catch (error) {
        console.error("Failed to unban user:", error);
        return { success: false, error: "Failed to unban user" };
    }
}

