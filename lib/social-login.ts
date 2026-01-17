import { authClient } from "./auth-client";

export const signinGithub = async () => {
    await authClient.signIn.social({
        provider: "github",
        callbackURL: "/",
    });
};

export const signinGoogle = async () => {
    await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
    });
};

