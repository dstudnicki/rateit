"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { getClient } from "@/lib/mongoose";

interface BanInfo {
    isBanned: boolean;
    banReason?: string;
    bannedAt?: Date;
    banUntil?: Date | null;
    isPermanent: boolean;
    daysRemaining?: number;
}

/**
 * Check if user is banned and get ban details
 */
export async function checkUserBan(): Promise<BanInfo> {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return { isBanned: false, isPermanent: false };
        }

        const db = await getClient();
        const { ObjectId } = require('mongodb');

        let user;
        try {
            user = await db.collection("user").findOne(
                { _id: new ObjectId(session.user.id) },
                { projection: { banned: 1, banReason: 1, bannedAt: 1, banUntil: 1 } }
            );
        } catch (e) {
            user = await db.collection("user").findOne(
                { _id: session.user.id as any },
                { projection: { banned: 1, banReason: 1, bannedAt: 1, banUntil: 1 } }
            );
        }

        if (!user || !user.banned) {
            return { isBanned: false, isPermanent: false };
        }

        // Check if temporary ban has expired
        if (user.banUntil) {
            const now = new Date();
            const banExpiry = new Date(user.banUntil);

            if (now >= banExpiry) {
                // Ban expired - automatically unban
                try {
                    await db.collection("user").updateOne(
                        { _id: new ObjectId(session.user.id) },
                        {
                            $set: { banned: false },
                            $unset: { banReason: "", bannedBy: "", bannedAt: "", banUntil: "" }
                        }
                    );
                } catch (e) {
                    await db.collection("user").updateOne(
                        { _id: session.user.id as any },
                        {
                            $set: { banned: false },
                            $unset: { banReason: "", bannedBy: "", bannedAt: "", banUntil: "" }
                        }
                    );
                }

                console.log(`User ${session.user.id} automatically unbanned (ban expired)`);
                return { isBanned: false, isPermanent: false };
            }

            // Calculate days remaining
            const msRemaining = banExpiry.getTime() - now.getTime();
            const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));

            return {
                isBanned: true,
                banReason: user.banReason,
                bannedAt: user.bannedAt,
                banUntil: user.banUntil,
                isPermanent: false,
                daysRemaining
            };
        }

        // Permanent ban
        return {
            isBanned: true,
            banReason: user.banReason,
            bannedAt: user.bannedAt,
            banUntil: null,
            isPermanent: true
        };
    } catch (error) {
        console.error("Error checking user ban:", error);
        return { isBanned: false, isPermanent: false };
    }
}

/**
 * Require user is NOT banned (for actions)
 */
export async function requireNotBanned() {
    const banInfo = await checkUserBan();

    if (banInfo.isBanned) {
        if (banInfo.isPermanent) {
            throw new Error(`Your account has been permanently banned. Reason: ${banInfo.banReason}`);
        } else {
            throw new Error(`Your account is banned for ${banInfo.daysRemaining} more days. Reason: ${banInfo.banReason}`);
        }
    }
}

