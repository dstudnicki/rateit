"use server";

import { updateTag } from "next/cache";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import { requireUser } from "@/app/data/user/require-user";

export async function addComment(content: string, postId: string) {
    const session = await requireUser();

    try {
        await getClient();
        const newComment = { content, user: session.user.id, createdAt: new Date(), likes: [], replies: [] };

        const post = await Post.findById(postId);
        if (!post) {
            return { success: false, error: "Post not found" };
        }

        post.comments.push(newComment);
        await post.save();

        updateTag("comments");
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

        if (comment.user.toString() === session.user.id) {
            return { success: false, error: "Cannot reply to your own comment" };
        }

        const replyContent = replyToUsername ? `@${replyToUsername} ${content}` : content;
        const newReply = { content: replyContent, user: session.user.id, createdAt: new Date(), likes: [] };

        comment.replies.push(newReply);
        await post.save();

        updateTag(`comments-${postId}`);
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

        updateTag("comments");
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
        updateTag(`comments-${postId}`);
        return { success: true, isLiked: likeIndex === -1, likesCount: reply.likes.length };
    } catch (error) {
        console.error("Failed to toggle reply like:", error);
        return { success: false, error: "Failed to toggle reply like" };
    }
}

