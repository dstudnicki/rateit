"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, revalidateLogic, type AnyFieldApi } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { signinGithub } from "@/lib/social-login";
import { Github } from "lucide-react";

function FieldInfo({ field }: { field: AnyFieldApi }) {
    return (
        <>
            {field.state.meta.isTouched && !field.state.meta.isValid ? (
                <em className="text-sm text-red-500 not-italic">
                    {field.state.meta.errors.map((err: any) => (typeof err === "string" ? err : err.message)).join(", ")}
                </em>
            ) : null}
            {field.state.meta.isValidating ? "Validating..." : null}
        </>
    );
}

const formSchema = z.object({
    email: z.email({ error: "This is not a valid email" }),
    password: z
        .string()
        .min(8, "Password must be at least 8 characters long")
        .max(50, "Password must be at most 50 characters long"),
});

export default function LoginForm() {
    const [formError, setFormError] = useState<string | null>(null);
    const [githubLoading, setGithubLoading] = useState(false);
    const router = useRouter();

    const handleGithubLogin = async () => {
        setGithubLoading(true);
        setFormError(null);
        try {
            await signinGithub();
        } catch (error: any) {
            setFormError(error.message || "Failed to sign in with GitHub");
        } finally {
            setGithubLoading(false);
        }
    };

    const form = useForm({
        defaultValues: {
            email: "",
            password: "",
        },
        validationLogic: revalidateLogic(),
        validators: {
            onDynamic: formSchema,
        },
        onSubmit: async ({ value }) => {
            setFormError(null);
            try {
                await authClient.signIn.email(
                    {
                        email: value.email,
                        password: value.password,
                    },
                    {
                        onError: (error: any) => {
                            setFormError(error.message);
                        },
                        onSuccess: () => {
                            router.push("/");
                        },
                    },
                );
            } catch (error: any) {
                setFormError(error.message);
            }
        },
    });

    return (
        <div className="grid gap-6">
            {/* GitHub Login Button */}
            <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGithubLogin}
                disabled={githubLoading}
            >
                <Github className="mr-2 h-4 w-4" />
                {githubLoading ? "Connecting..." : "Continue with GitHub"}
            </Button>

            {/* Separator */}
            <div className="relative">
                <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
                </div>
            </div>

            {/* Email/Password Form */}
            <form
                onSubmit={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    form.handleSubmit();
                }}
            >
                <FieldGroup>
                    {formError && (
                        <Alert variant="destructive">
                            <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-4">
                        <form.Field name="email">
                            {(field) => (
                                <>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        type="email"
                                        placeholder="johndoe@email.com"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                    />
                                    <FieldInfo field={field} />
                                </>
                            )}
                        </form.Field>
                        <form.Field name="password">
                            {(field) => (
                                <>
                                    <FieldLabel htmlFor="password">Password</FieldLabel>
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                    />
                                    <FieldInfo field={field} />
                                </>
                            )}
                        </form.Field>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            // eslint-disable-next-line react/no-children-prop
                            children={([canSubmit, isSubmitting]) => (
                                <Button type="submit" disabled={!canSubmit} className="w-full">
                                    {isSubmitting ? "Signing in..." : "Sign in"}
                                </Button>
                            )}
                        />
                    </div>
                </FieldGroup>
            </form>
        </div>
    );
}
