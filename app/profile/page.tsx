import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getProfile } from "@/app/actions/profile";
import { redirect } from "next/navigation";

export default async function ProfilePage() {
    const session = await auth.api.getSession({
        headers: await headers(),
    });

    if (!session) {
        redirect("/login");
    }

    // Get or create user's profile
    const result = await getProfile(session.user.id);

    if (!result.success || !result.profile) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p>Błąd podczas ładowania profilu</p>
            </div>
        );
    }

    const slug = result.profile.slug;

    const isObjectId = /^[0-9a-f]{24}$/i.test(slug || "");
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug || "");

    if (!slug || isObjectId || isUUID) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <p>Błąd: Nieprawidłowy slug profilu. Skontaktuj się z pomocą techniczną.</p>
            </div>
        );
    }

    redirect(`/${slug}`);
}
