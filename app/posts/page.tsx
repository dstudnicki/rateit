// POSTS PAGE
import { Suspense } from "react";
import { getPosts } from "@/app/data/posts/get-posts";
import { PostListClient } from "@/components/post-list-client";
import { cacheLife, cacheTag } from "next/cache";
import { getSession } from "@/lib/auth-client";

export default async function PostsPage() {
    "use cache"
    cacheLife('hours')
    cacheTag('posts')
    const postsPromise = getPosts();

    return (
        <Suspense fallback={<div className="max-w-[30rem] mx-auto my-10 text-center">Loading posts...</div>}>
            <PostListClient posts={postsPromise} />
        </Suspense>
    );
}
