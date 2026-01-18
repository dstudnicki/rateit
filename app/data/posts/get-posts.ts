import "server-only";
import { getClient } from "@/lib/mongoose";
import Post from "@/models/Post";
import { ObjectId } from "mongodb";
import { cache } from "react";

export const getPosts = cache(async () => {
    // React cache for request memoization - deduplicates calls within single render

    try {
        const db = await getClient();
        const posts = await Post.find().sort({ createdAt: -1 }).limit(50).lean();

        // Get unique user IDs
        const userIds = [...new Set(posts.map((post: any) => post.user?.toString()).filter(Boolean))];

        // Fetch users
        const users = await db
            .collection("users")
            .find({
                _id: { $in: userIds.map((id: string) => new ObjectId(id)) },
            })
            .project({ name: 1, image: 1, email: 1 })
            .toArray();

        const userMap = new Map(users.map((u: any) => [u._id.toString(), u]));

        return posts.map((post: any) => ({
            ...post,
            _id: post._id.toString(),
            author: post.user ? userMap.get(post.user.toString()) || null : null,
        }));
    } catch (error) {
        console.error("Error fetching posts:", error);
        return [];
    }
});
