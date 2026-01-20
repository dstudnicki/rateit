"use server";

import { revalidateTag } from "next/cache";
import { getClient } from "@/lib/mongoose";
import Company from "@/models/Company";
import Profile from "@/models/Profile";
import { requireUser } from "@/app/data/user/require-user";

export async function addReviewComment(content: string, companyId: string, reviewId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const newComment = {
            content,
            user: session.user.id,
            createdAt: new Date(),
            likes: [],
            replies: [],
        };

        const company = await Company.findById(companyId);
        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const review = company.reviews.id(reviewId);
        if (!review) {
            return { success: false, error: "Review not found" };
        }

        review.comments.push(newComment);
        await company.save();

        // Track interaction in user's profile
        try {
            const profile = await Profile.findOne({ userId: session.user.id });
            if (profile) {
                profile.interactionHistory.push({
                    type: "comment",
                    targetId: companyId,
                    targetType: "company",
                    timestamp: new Date(),
                });

                if (profile.interactionHistory.length > 100) {
                    profile.interactionHistory = profile.interactionHistory.slice(-100);
                }

                await profile.save();
                console.log(`[addReviewComment] Tracked comment on company ${companyId}`);
            }
        } catch (error) {
            console.error("[addReviewComment] Failed to track interaction:", error);
        }

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        return { success: true };
    } catch (error) {
        console.error("Failed to create comment:", error);
        return { success: false, error: "Failed to create comment" };
    }
}

export async function addReviewReply(
    content: string,
    companyId: string,
    reviewId: string,
    commentId: string,
    replyToUsername?: string,
) {
    const session = await requireUser();

    try {
        await getClient();

        const company = await Company.findById(companyId);
        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const review = company.reviews.id(reviewId);
        if (!review) {
            return { success: false, error: "Review not found" };
        }

        const comment = review.comments.id(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        const replyContent = replyToUsername ? `@${replyToUsername} ${content}` : content;
        const newReply = {
            content: replyContent,
            user: session.user.id,
            createdAt: new Date(),
            likes: [],
        };

        comment.replies.push(newReply);
        await company.save();

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        return { success: true };
    } catch (error) {
        console.error("Failed to create reply:", error);
        return { success: false, error: "Failed to create reply" };
    }
}

export async function toggleReviewCommentLike(companyId: string, reviewId: string, commentId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const company = await Company.findById(companyId);
        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const review = company.reviews.id(reviewId);
        if (!review) {
            return { success: false, error: "Review not found" };
        }

        const comment = review.comments.id(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        const userId = session.user.id;
        const likeIndex = comment.likes.indexOf(userId);

        if (likeIndex > -1) {
            comment.likes.splice(likeIndex, 1);
        } else {
            comment.likes.push(userId);
        }

        await company.save();

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        return { success: true, isLiked: likeIndex === -1, likesCount: comment.likes.length };
    } catch (error) {
        console.error("Failed to toggle like:", error);
        return { success: false, error: "Failed to toggle like" };
    }
}

export async function toggleReviewReplyLike(companyId: string, reviewId: string, commentId: string, replyId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const company = await Company.findById(companyId);
        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const review = company.reviews.id(reviewId);
        if (!review) {
            return { success: false, error: "Review not found" };
        }

        const comment = review.comments.id(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        const reply = comment.replies.id(replyId);
        if (!reply) {
            return { success: false, error: "Reply not found" };
        }

        const userId = session.user.id;
        const likeIndex = reply.likes.indexOf(userId);

        if (likeIndex > -1) {
            reply.likes.splice(likeIndex, 1);
        } else {
            reply.likes.push(userId);
        }

        await company.save();

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        return { success: true, isLiked: likeIndex === -1, likesCount: reply.likes.length };
    } catch (error) {
        console.error("Failed to toggle reply like:", error);
        return { success: false, error: "Failed to toggle reply like" };
    }
}

export async function updateReviewComment(companyId: string, reviewId: string, commentId: string, content: string) {
    const session = await requireUser();

    try {
        await getClient();
        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const review = company.reviews.id(reviewId);
        if (!review) {
            return { success: false, error: "Review not found" };
        }

        const comment = review.comments.id(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        if (comment.user.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to edit this comment" };
        }

        comment.content = content;
        await company.save();

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        return { success: true };
    } catch (error) {
        console.error("Failed to update comment:", error);
        return { success: false, error: "Failed to update comment" };
    }
}

export async function deleteReviewComment(companyId: string, reviewId: string, commentId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const review = company.reviews.id(reviewId);
        if (!review) {
            return { success: false, error: "Review not found" };
        }

        const comment = review.comments.id(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        if (comment.user.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to delete this comment" };
        }

        review.comments.pull(commentId);
        await company.save();

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete comment:", error);
        return { success: false, error: "Failed to delete comment" };
    }
}

export async function updateReviewReply(
    companyId: string,
    reviewId: string,
    commentId: string,
    replyId: string,
    content: string,
) {
    const session = await requireUser();

    try {
        await getClient();
        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const review = company.reviews.id(reviewId);
        if (!review) {
            return { success: false, error: "Review not found" };
        }

        const comment = review.comments.id(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        const reply = comment.replies.id(replyId);
        if (!reply) {
            return { success: false, error: "Reply not found" };
        }

        if (reply.user.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to edit this reply" };
        }

        reply.content = content;
        await company.save();

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        return { success: true };
    } catch (error) {
        console.error("Failed to update reply:", error);
        return { success: false, error: "Failed to update reply" };
    }
}

export async function deleteReviewReply(companyId: string, reviewId: string, commentId: string, replyId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const company = await Company.findById(companyId);

        if (!company) {
            return { success: false, error: "Company not found" };
        }

        const review = company.reviews.id(reviewId);
        if (!review) {
            return { success: false, error: "Review not found" };
        }

        const comment = review.comments.id(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        const reply = comment.replies.id(replyId);
        if (!reply) {
            return { success: false, error: "Reply not found" };
        }

        if (reply.user.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to delete this reply" };
        }

        comment.replies.pull(replyId);
        await company.save();

        revalidateTag(`company-${companyId}`, "max");
        revalidateTag(`company-slug-${company.slug}`, "max");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete reply:", error);
        return { success: false, error: "Failed to delete reply" };
    }
}
