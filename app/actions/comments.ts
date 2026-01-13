"use server";

import { revalidatePath } from "next/cache";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import Profile from "@/models/Profile";
import { requireUser } from "@/app/data/user/require-user";
import { requireAuth } from "@/lib/auth-helpers";
import { validateCommentContent, sanitizeString } from "@/lib/validation";
import { requireNotBanned } from "@/lib/ban-check";

// Toggle like on a POST
export async function togglePostLike(postId: string) {
    const user = await requireAuth();

    try {
        await getClient();

        const post = await Post.findById(postId);
        if (!post) {
            return { success: false, error: "Post not found" };
        }

        // Initialize likes array if it doesn't exist
        if (!Array.isArray(post.likes)) {
            post.likes = [];
        }

        const userIdString = user.id;
        const likeIndex = post.likes.findIndex((id: any) => id.toString() === userIdString);

        let isLiking = false;
        if (likeIndex > -1) {
            // Unlike: remove user from likes
            post.likes.splice(likeIndex, 1);
        } else {
            // Like: add user to likes
            post.likes.push(userIdString);
            isLiking = true;
        }

        await post.save();

        // Track interaction in user's profile for content matching
        if (isLiking) {
            try {
                const profile = await Profile.findOne({ userId: userIdString });
                if (profile) {
                    profile.interactionHistory.push({
                        type: "like",
                        targetId: postId,
                        targetType: "post",
                        timestamp: new Date(),
                    });

                    // Keep only last 100 interactions to avoid bloat
                    if (profile.interactionHistory.length > 100) {
                        profile.interactionHistory = profile.interactionHistory.slice(-100);
                    }

                    await profile.save();
                    console.log(`[togglePostLike] Tracked like interaction for user ${userIdString}`);
                }
            } catch (error) {
                console.error("[togglePostLike] Failed to track interaction:", error);
                // Don't fail the like action if tracking fails
            }
        }

        return {
            success: true,
            isLiked: isLiking,
            likesCount: post.likes.length
        };
    } catch (error) {
        console.error("Failed to toggle post like:", error);
        return { success: false, error: "Failed to like post" };
    }
}

export async function addComment(content: string, postId: string) {
    const user = await requireAuth();

    // Check if user is banned
    await requireNotBanned();

    // Validate and sanitize comment
    const sanitizedContent = sanitizeString(content);
    const validation = validateCommentContent(sanitizedContent);

    if (!validation.valid) {
        return { success: false, error: validation.error };
    }

    try {
        await getClient();
        const newComment = { content: sanitizedContent, user: user.id, createdAt: new Date(), likes: [], replies: [] };

        const post = await Post.findById(postId);
        if (!post) {
            return { success: false, error: "Post not found" };
        }

        post.comments.push(newComment);
        await post.save();

        // Track interaction in user's profile
        try {
            const profile = await Profile.findOne({ userId: user.id });
            if (profile) {
                profile.interactionHistory.push({
                    type: "comment",
                    targetId: postId,
                    targetType: "post",
                    timestamp: new Date(),
                });

                if (profile.interactionHistory.length > 100) {
                    profile.interactionHistory = profile.interactionHistory.slice(-100);
                }

                await profile.save();
                console.log(`[addComment] Tracked comment interaction for user ${user.id}`);
            }
        } catch (error) {
            console.error("[addComment] Failed to track interaction:", error);
        }


        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to create comment:", error);
        return { success: false, error: "Failed to create comment" };
    }
}

export async function addReply(content: string, postId: string, commentId: string, replyToUsername?: string) {
    const session = await requireUser();

    try {
        await getClient();

        const post = await Post.findById(postId);
        if (!post) {
            return { success: false, error: "Post not found" };
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        const replyContent = replyToUsername ? `@${replyToUsername} ${content}` : content;
        const newReply = { content: replyContent, user: session.user.id, createdAt: new Date(), likes: [] };

        comment.replies.push(newReply);
        await post.save();

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to create reply:", error);
        return { success: false, error: "Failed to create reply" };
    }
}

export async function toggleCommentLike(postId: string, commentId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const post = await Post.findById(postId);
        if (!post) {
            return { success: false, error: "Post not found" };
        }

        const comment = post.comments.id(commentId);
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

        await post.save();

        revalidatePath("/");
        return { success: true, isLiked: likeIndex === -1, likesCount: comment.likes.length };
    } catch (error) {
        console.error("Failed to toggle like:", error);
        return { success: false, error: "Failed to toggle like" };
    }
}

export async function toggleReplyLike(postId: string, commentId: string, replyId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const post = await Post.findById(postId);
        if (!post) {
            return { success: false, error: "Post not found" };
        }

        const comment = post.comments.id(commentId);
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

        await post.save();

        // Invalidate cache for this specific post's comments
        revalidatePath("/");
        return { success: true, isLiked: likeIndex === -1, likesCount: reply.likes.length };
    } catch (error) {
        console.error("Failed to toggle reply like:", error);
        return { success: false, error: "Failed to toggle reply like" };
    }
}

export async function updateComment(postId: string, commentId: string, content: string) {
    const session = await requireUser();

    try {
        await getClient();
        const post = await Post.findById(postId);

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        if (comment.user.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to edit this comment" };
        }

        comment.content = content;
        await post.save();

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to update comment:", error);
        return { success: false, error: "Failed to update comment" };
    }
}

export async function deleteComment(postId: string, commentId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const post = await Post.findById(postId);

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        const comment = post.comments.id(commentId);
        if (!comment) {
            return { success: false, error: "Comment not found" };
        }

        if (comment.user.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to delete this comment" };
        }

        post.comments.pull(commentId);
        await post.save();

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete comment:", error);
        return { success: false, error: "Failed to delete comment" };
    }
}

export async function updateReply(postId: string, commentId: string, replyId: string, content: string) {
    const session = await requireUser();

    try {
        await getClient();
        const post = await Post.findById(postId);

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        const comment = post.comments.id(commentId);
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
        await post.save();

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to update reply:", error);
        return { success: false, error: "Failed to update reply" };
    }
}

export async function deleteReply(postId: string, commentId: string, replyId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const post = await Post.findById(postId);

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        const comment = post.comments.id(commentId);
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
        await post.save();

        revalidatePath("/");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete reply:", error);
        return { success: false, error: "Failed to delete reply" };
    }
}
