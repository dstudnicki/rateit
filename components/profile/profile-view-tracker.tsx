"use client";

import { useEffect } from "react";
import { trackInteraction } from "@/app/actions/preferences";

interface ProfileViewTrackerProps {
    profileUserId: string;
    isOwnProfile: boolean;
}

export function ProfileViewTracker({ profileUserId, isOwnProfile }: ProfileViewTrackerProps) {
    useEffect(() => {
        // Don't track views of own profile
        if (!isOwnProfile && profileUserId) {
            trackInteraction(profileUserId, "profile", "view").catch(console.error);
        }
    }, [profileUserId, isOwnProfile]);

    // This component doesn't render anything
    return null;
}

