"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Lock, Shield, UserCircle, Settings as SettingsIcon } from "lucide-react";
import { ProfileSettingsClient } from "@/components/profile/profile-settings-client";
import { SecuritySettingsClient } from "@/components/profile/security-settings-client";
import { DataPrivacySettingsClient } from "@/components/profile/data-privacy-settings-client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

interface SettingsPageClientProps {
    user: {
        name: string;
        email: string;
        userImage?: string | null;
        oauthImage?: string | null;
    };
    profile: {
        fullName?: string;
        headline?: string;
        location?: string;
        backgroundImage?: string | null;
    };
    accountType: "credential" | "oauth";
    provider?: string;
    privacy: {
        rodoConsent: boolean;
        rodoConsentSource?: "manual" | "oauth";
    };
}

export default function SettingsPageClient({ user, profile, accountType, provider, privacy }: SettingsPageClientProps) {
    const [activeSection, setActiveSection] = useState("profile");
    const router = useRouter();

    const menuItems = [
        { id: "profile", label: "Profil", icon: UserCircle },
        { id: "security", label: "Logowanie i Bezpieczeństwo", icon: Lock },
        { id: "data", label: "Prywatność Danych", icon: Shield },
        { id: "preferences", label: "Preferencje", icon: SettingsIcon },
    ];

    return (
        <div className="min-h-screen bg-background">
            <main className="container max-w-7xl mx-auto px-4 py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold mb-2">Ustawienia i Prywatność</h1>
                    <p className="text-muted-foreground">Zarządzaj ustawieniami konta i preferencjami prywatności</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Sidebar Menu */}
                    <aside className="lg:col-span-3">
                        <Card className="p-2">
                            <nav className="space-y-1">
                                {menuItems.map((item) => {
                                    const Icon = item.icon as any;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setActiveSection(item.id)}
                                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-left ${
                                                activeSection === item.id
                                                    ? "bg-primary text-primary-foreground"
                                                    : "hover:bg-secondary text-foreground"
                                            }`}
                                        >
                                            <Icon className="h-5 w-5" />
                                            <span className="font-medium text-sm">{item.label}</span>
                                        </button>
                                    );
                                })}
                            </nav>
                        </Card>
                    </aside>

                    {/* Content Area */}
                    <div className="lg:col-span-9">
                        {activeSection === "profile" && (
                            <div className="space-y-6">
                                <ProfileSettingsClient user={user} profile={profile} />
                            </div>
                        )}
                        {activeSection === "security" && (
                            <SecuritySettingsClient accountType={accountType} provider={provider} />
                        )}
                        {activeSection === "data" && (
                            <DataPrivacySettingsClient
                                rodoConsent={privacy.rodoConsent}
                                rodoConsentSource={privacy.rodoConsentSource}
                            />
                        )}

                        {activeSection === "preferences" && (
                            <div className="space-y-6">
                                <Card>
                                    <div className="p-4">
                                        <h2 className="text-lg font-semibold">Preferencje</h2>
                                        <p className="text-sm text-muted-foreground mt-2">
                                            Edytuj swoje preferencje, które wpływają na dobór treści i firm pokazywanych w
                                            kanale.
                                        </p>

                                        <div className="mt-4">
                                            <Button onClick={() => router.push("/onboarding?edit=true")} variant="default">
                                                Edytuj preferencje (onboarding)
                                            </Button>
                                        </div>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
