import { betterAuth } from "better-auth";
import { mongodbAdapter } from "better-auth/adapters/mongodb";
import { nextCookies } from "better-auth/next-js";
import { getClient } from "./mongoose";

const client = await getClient();

export const auth = betterAuth({
    database: mongodbAdapter(client),
    baseURL: process.env.BETTER_AUTH_URL || "http://localhost:3000",
    trustedOrigins: [
        "http://localhost:3000",
        "http://localhost:3001",
        process.env.BETTER_AUTH_URL || "http://localhost:3000"
    ],
    appName: "RateIt",
    emailAndPassword: {
        enabled: true,
    },
    socialProviders: {
        github: {
            clientId: process.env.GITHUB_CLIENT_ID as string,
            clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
        },
        google: {
            clientId: process.env.AUTH_GOOGLE_ID as string,
            clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
        },
    },
    session: {
        cookieCache: {
            enabled: true,
            maxAge: 5 * 60, // Cache duration in seconds (5 minutes)
        },
    },
    advanced: {
        // Add custom redirect after OAuth success
        useSecureCookies: process.env.NODE_ENV === "production",
    },
    plugins: [nextCookies()],
});

