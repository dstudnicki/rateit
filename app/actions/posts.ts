"use server";

import { updateTag } from "next/cache";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getSession } from "@/lib/auth-client";
import { requireUser } from "@/app/data/user/require-user";

export async function createPost(content: string) {
    const session = await requireUser();

    try {
        await getClient();
        const newPost = { content, user: session.user.id, createdAt: new Date() };
        await Post.create(newPost);

        updateTag("posts");
        return { success: true };
    } catch (error) {
        console.error("Failed to create post:", error);
        return { success: false, error: "Failed to create post" };
    }
}
