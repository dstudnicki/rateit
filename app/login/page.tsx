"use client";
import * as React from "react";
import { Button } from "@/components/ui/button";
import LoginForm from "@/components/forms/login/client";
import { Icons } from "@/components/ui/icons";
import { Suspense } from "react";
import { signinGoogle, signinGithub } from "@/lib/social-login";

export default function LoginPage() {
    const [isLoading, setIsLoading] = React.useState<boolean>(false);

    const handleGoogleLogin = async () => {
        setIsLoading(true);
        try {
            await signinGoogle();
        } catch (error) {
            console.error("Google login error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGithubLogin = async () => {
        setIsLoading(true);
        try {
            await signinGithub();
        } catch (error) {
            console.error("GitHub login error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <main className="px-4 sm:px-8 lg:px-12 xl:px-0 xl:container mx-auto">
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">Log into your account.</h1>
                        <p className="text-sm text-muted-foreground">Please enter your credentials below.</p>
                    </div>
                    <Suspense fallback={<p>Loading...</p>}>
                    <LoginForm />
                    </Suspense>
                </div>
            </div>
            <div className="flex flex-col gap-2 max-w-2xl mx-auto">
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <span className="w-full border-t" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                    </div>
                </div>
                <Button variant="outline" type="button" disabled={isLoading} onClick={handleGoogleLogin}>
                    {isLoading ? (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Icons.google className="mr-2 h-4 w-4" />
                    )}{" "}
                    Google
                </Button>
                <Button variant="outline" type="button" disabled={isLoading} onClick={handleGithubLogin}>
                    {isLoading ? (
                        <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                        <Icons.gitHub className="mr-2 h-4 w-4" />
                    )}{" "}
                    GitHub
                </Button>
            </div>
        </main>
    );
}
