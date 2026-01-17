"use client";

import * as React from "react";
import { Icons } from "@/components/ui/icons";
import { Button } from "@/components/ui/button";
import RegisterForm from "@/components/forms/register/client";
import { Suspense } from "react";
import { signinGoogle, signinGithub } from "@/lib/social-login";

export default function RegisterPage() {
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
        <main className="px-4 xl:container sm:px-8 lg:px-12 xl:px-0 mx-auto">
            <div className="lg:p-8">
                <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
                    <div className="flex flex-col space-y-2 text-center">
                        <h1 className="text-2xl font-semibold tracking-tight">Create an account</h1>
                        <p className="text-sm text-muted-foreground">Enter your email below to create your account</p>
                    </div>
                    <Suspense fallback={<p>Loading...</p>}>
                    <RegisterForm />
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
