"use server";

import { updateTag } from "next/cache";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import { requireUser } from "@/app/data/user/require-user";

export async function createPost(content: string) {
    const session = await requireUser();

    try {
        await getClient();
        const newPost = { content, user: session.user.id, createdAt: new Date() };
        await Post.create(newPost);

        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        updateTag(`posts-feed-${cacheBucket}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to create post:", error);
        return { success: false, error: "Failed to create post" };
    }
}

export async function updatePost(postId: string, content: string) {
    const session = await requireUser();

    try {
        await getClient();

        const post = await Post.findById(postId);

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        if (post.user.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to edit this post" };
        }

        post.content = content;
        post.updatedAt = new Date();
        await post.save();

        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        updateTag(`posts-feed-${cacheBucket}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to update post:", error);
        return { success: false, error: "Failed to update post" };
    }
}

export async function deletePost(postId: string) {
    const session = await requireUser();

    try {
        await getClient();

        const post = await Post.findById(postId);

        if (!post) {
            return { success: false, error: "Post not found" };
        }

        if (post.user.toString() !== session.user.id) {
            return { success: false, error: "Not authorized to delete this post" };
        }

        await Post.findByIdAndDelete(postId);

        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        updateTag(`posts-feed-${cacheBucket}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to delete post:", error);
        return { success: false, error: "Failed to delete post" };
    }
}

