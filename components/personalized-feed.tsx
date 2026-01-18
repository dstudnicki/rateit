"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { PostCard } from "@/components/ui/post";
import { getPersonalizedFeed } from "@/app/actions/posts";
import { getUserPreferences } from "@/app/actions/preferences";
import { Loader2 } from "lucide-react";

export function PersonalizedFeed() {
    const router = useRouter();
    const pathname = usePathname();
    const [isCheckingPreferences, setIsCheckingPreferences] = useState(true);
    const [posts, setPosts] = useState<any[]>([]);
    const [isLoadingPosts, setIsLoadingPosts] = useState(true);
    const [refreshKey, setRefreshKey] = useState(0);

    // Check if user needs onboarding and redirect if needed
    useEffect(() => {
        const checkPreferences = async () => {
            try {
                const result = await getUserPreferences();
                console.log("PersonalizedFeed - getUserPreferences result:", result);

                if (result.success && result.preferences) {
                    if (!result.preferences.onboardingCompleted) {
                        console.log("Redirecting to /onboarding - onboarding not completed");
                        router.push("/onboarding");
                        return;
                    }
                } else {
                    console.log("No preferences or not authenticated:", result.error);
                }
            } catch (error) {
                console.error("Error checking preferences:", error);
            } finally {
                setIsCheckingPreferences(false);
            }
        };

        checkPreferences();
    }, [router]);

    // Load posts - re-run when pathname changes (after router.refresh())
    useEffect(() => {
        const loadPosts = async () => {
            setIsLoadingPosts(true);
            try {
                const result = await getPersonalizedFeed(10, 0);
                console.log("PersonalizedFeed - getPersonalizedFeed result:", result);
                if (result.success && result.posts) {
                    setPosts(result.posts);
                }
            } catch (error) {
                console.error("Error loading posts:", error);
            } finally {
                setIsLoadingPosts(false);
            }
        };

        // Only load posts after checking preferences
        if (!isCheckingPreferences) {
            loadPosts();
        }
    }, [isCheckingPreferences, pathname, refreshKey]); // Add pathname and refreshKey as dependencies

    if (isCheckingPreferences || isLoadingPosts) {
        return (
            <div className="max-w-120 mx-auto my-10 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
                <p className="mt-4 text-muted-foreground">Ładowanie kanału...</p>
            </div>
        );
    }

    return (
        <div className="mt-4 space-y-4">
            {posts.length > 0 ? (
                posts.map((post) => <PostCard key={post._id} post={post} />)
            ) : (
                <div className="text-center py-12">
                    <p className="text-muted-foreground">Brak postów. Bądź pierwszy i podziel się czymś!</p>
                </div>
            )}
        </div>
    );
}
