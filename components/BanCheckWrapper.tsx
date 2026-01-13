"use client";

import { useEffect, useState } from "react";
import { checkUserBan } from "@/lib/ban-check";
import { useRouter } from "next/navigation";

interface BanInfo {
    isBanned: boolean;
    banReason?: string;
    bannedAt?: Date;
    banUntil?: Date | null;
    isPermanent: boolean;
    daysRemaining?: number;
}

export default function BanCheckWrapper({ children }: { children: React.ReactNode }) {
    const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
    const [showPopup, setShowPopup] = useState(false);
    const [hasChecked, setHasChecked] = useState(false);
    const router = useRouter();

    useEffect(() => {
        // Only check once
        if (hasChecked) return;

        const checkBan = async () => {
            try {
                const info = await checkUserBan();

                if (info.isBanned) {
                    // Set cookie for server-side checks
                    document.cookie = "user-banned=true; path=/; max-age=86400";
                    setBanInfo(info);
                    setShowPopup(true);
                } else {
                    // Clear cookie
                    document.cookie = "user-banned=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
                }
            } catch (error) {
                console.error("Error checking ban:", error);
            } finally {
                setHasChecked(true);
            }
        };

        checkBan();
    }, [hasChecked]);

    return (
        <>
            {children}

            {/* Ban Notification Popup - Shows on home page */}
            {showPopup && banInfo && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full overflow-hidden">
                        {/* Header */}
                        <div className="bg-red-600 px-6 py-4">
                            <div className="flex items-center">
                                <svg className="h-8 w-8 text-white mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                                <h2 className="text-xl font-bold text-white">Account Suspended</h2>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="px-6 py-4">
                            <p className="text-gray-700 mb-4">
                                Your account has been {banInfo.isPermanent ? "permanently" : "temporarily"} suspended.
                            </p>

                            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
                                <p className="text-sm text-red-800">
                                    <strong>Reason:</strong> {banInfo.banReason || "No reason provided"}
                                </p>
                                {!banInfo.isPermanent && banInfo.daysRemaining && (
                                    <p className="text-sm text-red-800 mt-1">
                                        <strong>Duration:</strong> {banInfo.daysRemaining} day{banInfo.daysRemaining !== 1 ? 's' : ''} remaining
                                    </p>
                                )}
                            </div>

                            <p className="text-sm text-gray-600 mb-4">
                                You cannot create posts, comment, or interact with content while suspended.
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="bg-gray-50 px-6 py-4 flex gap-3">
                            <button
                                onClick={() => setShowPopup(false)}
                                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition font-medium"
                            >
                                I Understand
                            </button>
                            <button
                                onClick={() => {
                                    setShowPopup(false);
                                    router.push("/profile/settings");
                                }}
                                className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
                            >
                                Account Settings
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

