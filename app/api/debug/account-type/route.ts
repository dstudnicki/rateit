import { NextResponse } from "next/server";
import { getClient } from "@/lib/mongoose";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { ObjectId } from "mongodb";

export async function GET() {
    try {
        const session = await auth.api.getSession({
            headers: await headers(),
        });

        if (!session) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const db = await getClient();

        // Get user
        let userObjectId: any;
        try {
            userObjectId = new ObjectId(session.user.id);
        } catch {
            userObjectId = session.user.id;
        }

        const user = await db.collection("user").findOne({ _id: userObjectId });

        // Try to find account with different userId variants
        const userIdString = user?._id?.toString();
        let account = await db.collection("account").findOne({ userId: session.user.id });

        if (!account && userIdString) {
            account = await db.collection("account").findOne({ userId: userIdString });
        }

        if (!account && userObjectId) {
            account = await db.collection("account").findOne({ userId: userObjectId.toString() });
        }

        // Try with ObjectId (in case userId is stored as ObjectId in account collection)
        if (!account) {
            try {
                const userIdAsObjectId = new ObjectId(session.user.id);
                account = await db.collection("account").findOne({ userId: userIdAsObjectId });
            } catch {
                // Ignore if can't convert to ObjectId
            }
        }

        // Debug: Show all accounts to see what's in the collection
        const allAccounts = await db.collection("account").find({}).limit(5).toArray();

        return NextResponse.json({
            sessionUserId: session.user.id,
            dbUserId: userIdString,
            user: {
                email: user?.email,
                name: user?.name,
                image: user?.image,
                userImage: user?.userImage,
            },
            account: {
                exists: !!account,
                providerId: account?.providerId,
                accountId: account?.accountId,
                userId: account?.userId, // Show what userId is stored in account
                userIdType: account?.userId ? typeof account.userId : null,
            },
            diagnosis: {
                isGitHub: account?.providerId === "github",
                isGoogle: account?.providerId === "google",
                isCredential: account?.providerId === "credential",
                hasOAuthImage: !!(user?.image?.includes("github") || user?.image?.includes("google")),
                userIdMatch: session.user.id === userIdString,
                accountUserIdMatch: account?.userId === session.user.id || account?.userId === userIdString,
            },
            debug: {
                allAccountsCount: allAccounts.length,
                allAccounts: allAccounts.map((acc) => ({
                    userId: acc.userId,
                    userIdType: typeof acc.userId,
                    providerId: acc.providerId,
                })),
            },
        });
    } catch (error) {
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : "Unknown error",
            },
            { status: 500 },
        );
    }
}
