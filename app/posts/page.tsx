// POSTS PAGE
import { Suspense } from "react";
import { getPosts } from "@/app/data/posts/get-posts";
import { PostListClient } from "@/components/post-list-client";

export default async function PostsPage() {
    // Note: "use cache" disabled - not compatible with dynamic routes
    // Using cache() from React in getPosts() instead for request memoization

    const postsPromise = getPosts();

    return (
        <Suspense fallback={<div className="max-w-[30rem] mx-auto my-10 text-center">Ładowanie postów...</div>}>
            <PostListClient posts={postsPromise} />
        </Suspense>
    );
}
