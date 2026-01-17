"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export function OnboardingRedirect() {
    const router = useRouter();

    useEffect(() => {
        router.push("/onboarding");
    }, [router]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="text-muted-foreground">Setting up your account...</p>
            </div>
        </div>
    );
}

