"use client";
import React, { use, useState } from "react";
import axios from "axios";
import { authClient } from "@/lib/auth-client";
import { PostActions } from "@/components/ui/post-actions";
import { PostCard } from "@/components/ui/post";

interface Comment {
    _id: string;
    content: string;
    user: {
        _id: string | undefined;
        username: string;
    };
    createdAt: string;
}

interface Post {
    _id: string;
    title: string;
    content: string;
    user: {
        _id: string | undefined;
        name: string;
    };
    createdAt: string;
    comments: Comment[]
}

export function PostListClient({ posts }: { posts: Promise<Post[]> }) {

    const allPosts = use(posts);
    // const [posts, setPosts] = useState<Post[]>(allPosts.posts);

    const session = authClient.useSession();
    const currentUserId = session.data?.user?.id;

    // const deletePost = async (postId: string) => {
    //     try {
    //         await axios.delete(`/api/posts/${postId}`);
    //
    //         setPosts((prev) => prev.filter((post) => post._id !== postId));
    //     } catch (error) {
    //         console.error("Failed to delete post:", error);
    //     }
    // };

    return (
        <div className="mt-4 space-y-4">
            {allPosts.map((post) => (
                <PostCard
                    key={post._id}
                    post={post}
                />
            ))}
        </div>
    );
}
