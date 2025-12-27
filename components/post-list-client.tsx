"use client";
import React, { use } from "react";
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
