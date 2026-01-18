// POSTS PAGE
import { Suspense } from "react";
import { getPosts } from "@/app/data/posts/get-posts";
import { PostListClient } from "@/components/post-list-client";
import { cacheLife, cacheTag } from "next/cache";

export default async function PostsPage() {
    "use cache";
    // Social media feeds should have shorter cache - 5 minutes is good balance
    cacheLife("minutes");

    // Use time-based bucket for cache granularity
    // This allows new posts to appear within 5 minutes without invalidating all users' cache
    const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute buckets
    cacheTag(`posts-feed-${cacheBucket}`);

    const postsPromise = getPosts();

    return (
        <Suspense fallback={<div className="max-w-[30rem] mx-auto my-10 text-center">Ładowanie postów...</div>}>
            <PostListClient posts={postsPromise} />
        </Suspense>
    );
}
