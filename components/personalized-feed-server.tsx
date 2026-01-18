import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getPersonalizedFeed } from "@/app/actions/posts";
import { PostCard } from "@/components/ui/post";
import { getClient } from "@/lib/mongoose";
import { OnboardingRedirect } from "@/components/onboarding-redirect";

export async function PersonalizedFeedServer() {
    try {
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
                            <p className="text-muted-foreground">Brak postów. Bądź pierwszy i podziel się czymś!</p>
                        </div>
                    )}
                </div>
            );
        }

        // Check if user has profile
        const db = await getClient();
        const profile = await db.collection("profiles").findOne({ userId: session.user.id });

        // Create profile if doesn't exist (OAuth users)
        if (!profile) {
            const slug = session.user.name
                ? session.user.name
                      .toLowerCase()
                      .replace(/[^a-z0-9]/g, "-")
                      .replace(/-+/g, "-")
                : `user-${session.user.id.slice(0, 8)}`;

            const slugExists = await db.collection("profiles").findOne({ slug });
            const finalSlug = slugExists ? `${slug}-${Date.now()}` : slug;

            // Get avatar from OAuth (GitHub or Google)
            const avatarUrl = session.user.image || null;

            await db.collection("profiles").insertOne({
                userId: session.user.id,
                fullName: session.user.name || "User",
                image: avatarUrl, // Avatar from GitHub/Google OAuth
                backgroundImage: null, // User can upload later
                headline: "",
                bio: "",
                location: "",
                website: "",
                company: "",
                position: "",
                skills: [],
                industries: [],
                interests: [],
                education: [],
                experience: [],
                connections: [],
                connectionScore: 0,
                slug: finalSlug,
                preferences: {
                    onboardingCompleted: false,
                    industries: [],
                    companySize: [],
                    jobRoles: [],
                    skills: [],
                    experienceLevel: "intermediate",
                },
                rodoConsent: true, // OAuth users automatically consent
                rodoConsentSource: "oauth", // Mark as OAuth consent
                createdAt: new Date(),
                updatedAt: new Date(),
            });

            // Return redirect component for new users
            return <OnboardingRedirect />;
        }

        // Check if user completed onboarding
        if (!profile.preferences?.onboardingCompleted) {
            return <OnboardingRedirect />;
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
                        <p className="text-muted-foreground">Brak postów. Bądź pierwszy i podziel się czymś!</p>
                    </div>
                )}
            </div>
        );
    } catch (error) {
        console.error("[PersonalizedFeedServer] Error:", error);

        // Fallback UI on error
        return (
            <div className="mt-4 text-center py-12">
                <p className="text-muted-foreground">Nie można załadować kanału. Odśwież stronę.</p>
            </div>
        );
    }
}
