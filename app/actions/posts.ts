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

        // Invalidate current time bucket so user sees their post immediately
        const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000));
        updateTag(`posts-feed-${cacheBucket}`);

        return { success: true };
    } catch (error) {
        console.error("Failed to create post:", error);
        return { success: false, error: "Failed to create post" };
    }
}
