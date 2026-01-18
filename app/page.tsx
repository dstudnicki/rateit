import { CreatePost } from "@/components/create-post";
import { PersonalizedFeedServer } from "@/components/personalized-feed-server";
import { Suspense } from "react";

// Disable prerendering - this page needs auth data
export const dynamic = "force-dynamic";

export default function FeedPage() {
    return (
        <div className="min-h-screen bg-background">
            <main className="container max-w-2xl mx-auto px-4 py-6">
                <CreatePost />
                <Suspense
                    fallback={
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
                    }
                >
                    <PersonalizedFeedServer />
                </Suspense>
            </main>
        </div>
    );
}
