import { requireUser } from "@/app/data/user/require-user";
import { getClient } from "@/lib/mongoose";
import { getProfile } from "@/app/actions/profile";
import { getAccountType } from "@/app/actions/settings";
import SettingsPageClient from "./settings-client";
import { ObjectId } from "mongodb";

export default async function SettingsPage() {
    // Get current user session
    const session = await requireUser();
    const db = await getClient();

    // Get user data
    let userObjectId: any;
    try {
        userObjectId = new ObjectId(session.user.id);
    } catch {
        userObjectId = session.user.id;
    }

    const user = await db
        .collection("user")
        .findOne({ _id: userObjectId }, { projection: { name: 1, email: 1, userImage: 1, image: 1 } });

    if (!user) {
        throw new Error("User not found");
    }

    // Get profile data
    const profileResult = await getProfile(session.user.id);
    if (!profileResult.success || !profileResult.profile) {
        throw new Error("Profile not found");
    }

    const profile = profileResult.profile;

    // Get account type
    const accountTypeResult = await getAccountType();
    const accountType = (accountTypeResult.accountType ?? "credential") as "oauth" | "credential";
    const provider = accountTypeResult.provider;

    // Prepare data for client components
    const userData = {
        name: user.name || "",
        email: user.email || "",
        userImage: user.userImage || null,
        oauthImage: user.image || null,
    };

    const profileData = {
        fullName: profile.fullName || "",
        headline: profile.headline || "",
        location: profile.location || "",
        backgroundImage: profile.backgroundImage || null,
    };

    const privacyData = {
        rodoConsent: profile.rodoConsent || false,
        rodoConsentSource: (profile.rodoConsentSource || "manual") as "manual" | "oauth",
    };

    return (
        <SettingsPageClient
            user={userData}
            profile={profileData}
            accountType={accountType}
            provider={provider}
            privacy={privacyData}
        />
    );
}
