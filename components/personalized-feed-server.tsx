import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getPersonalizedFeed } from "@/app/actions/posts";
import { PostCard } from "@/components/ui/post";
import { redirect } from "next/navigation";
import { getClient } from "@/lib/mongoose";
import Profile from "@/models/Profile";
import { unstable_noStore as noStore } from "next/cache";

export async function PersonalizedFeedServer() {
    // Prevent caching of this component
    noStore();

    // Check auth
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        // Show generic feed for non-authenticated users
        const result = await getPersonalizedFeed(10, 0);
        const posts = result.success ? result.posts : [];

        return (
            <div className="mt-4 space-y-4">
                {posts.length > 0 ? (
                    posts.map((post) => <PostCard key={post._id} post={post} />)
                ) : (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            No posts yet. Be the first to share something!
                        </p>
                    </div>
                )}
            </div>
        );
    }

    // Check if user completed onboarding
    await getClient();
    const profile = await Profile.findOne({ userId: session.user.id }).lean();

    if (!profile || !profile.preferences?.onboardingCompleted) {
        redirect("/onboarding");
    }

    // Load posts
    const result = await getPersonalizedFeed(10, 0);
    const posts = result.success ? result.posts : [];

    return (
        <div className="mt-4 space-y-4">
            {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post._id} post={post} />)
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">
                        No posts yet. Be the first to share something!
                    </p>
                </div>
            )}
        </div>
    );
}

