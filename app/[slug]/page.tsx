import { ProfileHeader } from "@/components/profile/profile-header";
import { ProfileAbout } from "@/components/profile/profile-about";
import { ProfileExperience } from "@/components/profile/profile-experience";
import { ProfileEducation } from "@/components/profile/profile-education";
import { ProfileSkills } from "@/components/profile/profile-skills";
import { ProfileActivity } from "@/components/profile/profile-activity";
import { ProfileViewTracker } from "@/components/profile/profile-view-tracker";
import { getProfileBySlug } from "@/app/actions/profile";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ProfilePageProps {
    params: Promise<{ slug: string }>;
}

export default async function ProfilePage(props: ProfilePageProps) {
    const params = await props.params;
    const { slug } = params;

    // Validate slug format - reject if it looks like a MongoDB ObjectId or UUID
    if (/^[0-9a-f]{24}$/i.test(slug) || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) {
        notFound();
    }

    const result = await getProfileBySlug(slug);

    if (!result || !result.success || !result.profile || !result.user) {
        notFound();
    }

    const profile = result.profile;
    const user = result.user;

    // Check if this is the current user's profile
    const session = await auth.api.getSession({
        headers: await headers(),
    });
    const isOwnProfile = session?.user?.id === user.id;

    return (
        <div className="min-h-screen bg-background">
            <ProfileViewTracker profileUserId={user.id} isOwnProfile={isOwnProfile} />
            <main className="container max-w-5xl mx-auto px-4 py-6">
                <div className="grid grid-cols-1 gap-4">
                    <ProfileHeader user={user} profile={profile} isOwnProfile={isOwnProfile} />
                    <ProfileAbout about={profile.about || ""} isOwnProfile={isOwnProfile} />
                    <Suspense
                        fallback={
                            <Card>
                                <CardHeader>
                                    <CardTitle>Aktywność</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">Ładowanie postów...</p>
                                </CardContent>
                            </Card>
                        }
                    >
                        <ProfileActivity userId={user.id} />
                    </Suspense>
                    <ProfileExperience experiences={profile.experience} isOwnProfile={isOwnProfile} />
                    <ProfileEducation educations={profile.education} isOwnProfile={isOwnProfile} />
                    <ProfileSkills skills={profile.skills} isOwnProfile={isOwnProfile} />
                </div>
            </main>
        </div>
    );
}
