"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, revalidateLogic, type AnyFieldApi } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup, FieldLabel } from "@/components/ui/field";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { signinGithub } from "@/lib/social-login";
import { Github } from "lucide-react";
import Link from "next/link";

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

const formSchema = z
    .object({
        email: z.string().email({ message: "This is not a valid email" }),
        password: z
            .string()
            .min(8, "Password must be at least 8 characters long")
            .max(50, "Password must be at most 50 characters long"),
        confirmPassword: z.string(),
    })
    .superRefine(({ confirmPassword, password }, ctx) => {
        if (confirmPassword !== password) {
            ctx.addIssue({
                code: "custom",
                message: "The passwords did not match",
                path: ["confirmPassword"],
            });
        }
    });

export default function RegisterForm() {
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
            confirmPassword: "",
        },
        validationLogic: revalidateLogic(),
        validators: {
            onDynamic: formSchema,
        },
        onSubmit: async ({ value }) => {
            setFormError(null);
            try {
                await authClient.signUp.email(
                    {
                        email: value.email,
                        password: value.password,
                        name: value.email.split("@")[0], // Extract username from email
                    },
                    {
                        onError: (error: any) => {
                            setFormError(error.message);
                        },
                        onSuccess: async () => {
                            // Automatically sign in after successful registration
                            await authClient.signIn.email(
                                {
                                    email: value.email,
                                    password: value.password,
                                },
                                {
                                    onSuccess: () => {
                                        // Redirect to /profile which will create the profile and redirect to slug
                                        router.push("/profile");
                                    },
                                    onError: () => {
                                        router.push("/login");
                                    },
                                },
                            );
                        },
                    },
                );
            } catch (error: any) {
                setFormError(error.message || "Registration failed. Please try again.");
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
                        <Alert variant="destructive" className="mb-4">
                            <AlertDescription>{formError}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-4">
                        <form.Field name="email">
                            {(field) => (
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="email">Email</FieldLabel>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="johndoe@email.com"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                    />
                                    <p className="text-sm text-muted-foreground">
                                        This is your email used to sign into our app.
                                    </p>
                                    <FieldInfo field={field} />
                                </div>
                            )}
                        </form.Field>
                        <form.Field name="password">
                            {(field) => (
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="password">
                                        Password <span className="text-muted-foreground">(at least 8 characters long)</span>
                                    </FieldLabel>
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                    />
                                    <p className="text-sm text-muted-foreground">This is your password.</p>
                                    <FieldInfo field={field} />
                                </div>
                            )}
                        </form.Field>
                        <form.Field name="confirmPassword">
                            {(field) => (
                                <div className="space-y-2">
                                    <FieldLabel htmlFor="confirmPassword">Confirm Password</FieldLabel>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        placeholder="••••••••"
                                        value={field.state.value}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                        onBlur={field.handleBlur}
                                    />
                                    <p className="text-sm text-muted-foreground">Please confirm your password.</p>
                                    <FieldInfo field={field} />
                                </div>
                            )}
                        </form.Field>
                        <div className="space-x-1">
                            <span>Already have an account?</span>
                            <Link className="font-bold" href="/login">
                                Log in.
                            </Link>
                        </div>
                        <form.Subscribe
                            selector={(state) => [state.canSubmit, state.isSubmitting]}
                            // eslint-disable-next-line react/no-children-prop
                            children={([canSubmit, isSubmitting]) => (
                                <Button type="submit" disabled={!canSubmit} className="w-full">
                                    {isSubmitting ? "Creating account..." : "Sign up"}
                                </Button>
                            )}
                        />
                    </div>
                </FieldGroup>
            </form>
        </div>
    );
}
