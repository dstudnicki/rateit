"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm, revalidateLogic, type AnyFieldApi } from "@tanstack/react-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FieldGroup } from "@/components/ui/field";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { signinGoogle, signinGithub } from "@/lib/social-login";
import { Eye, EyeOff } from "lucide-react";
import { Label } from "@/components/ui/label";
import * as React from "react";

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
        name: z.string().min(2, "Name must be at least 2 characters long"),
        email: z
            .string()
            .email({ message: "This is not a valid email" })
            .min(8, "Password must be at least 8 characters long")
            .max(50, "Password must be at most 50 characters long"),
        password: z.string().min(8, "Password must be at least 8 characters long"),
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
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const router = useRouter();

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

    const form = useForm({
        defaultValues: {
            name: "",
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
                        name: value.name,
                        email: value.email,
                        password: value.password,
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
                                        router.push("/");
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
                setFormError(error.message || "Rejestracja nie powiodła się. Spróbuj ponownie.");
            }
        },
    });

    return (
        <form
            onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                form.handleSubmit();
            }}
            className="space-y-4"
        >
            <FieldGroup>
                {formError && (
                    <Alert variant="destructive" className="mb-4">
                        <AlertDescription>{formError}</AlertDescription>
                    </Alert>
                )}
                {/* Name Field */}
                <form.Field
                    name="name"
                    validators={{
                        onChange: formSchema.shape.name,
                    }}
                >
                    {(field) => (
                        <div className="space-y-2">
                            <Label htmlFor="name">Imię i nazwisko *</Label>
                            <Input
                                id="name"
                                type="text"
                                placeholder="Jan Kowalski"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                            />
                            <FieldInfo field={field} />
                        </div>
                    )}
                </form.Field>

                {/* Email Field */}
                <form.Field name="email">
                    {(field) => (
                        <div className="space-y-2">
                            <Label htmlFor="register-email">Email *</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="jan.kowalski@email.pl"
                                value={field.state.value}
                                onChange={(e) => field.handleChange(e.target.value)}
                                onBlur={field.handleBlur}
                            />
                            <FieldInfo field={field} />
                        </div>
                    )}
                </form.Field>

                {/* Password Field */}
                <form.Field name="password">
                    {(field) => (
                        <div className="space-y-2">
                            <Label htmlFor="register-password">Hasło *</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    onBlur={field.handleBlur}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <FieldInfo field={field} />
                            <p className="text-xs text-muted-foreground">
                                Musi zawierać min. 8 znaków, wielką literę, małą literę i cyfrę
                            </p>
                        </div>
                    )}
                </form.Field>

                {/* Confirm Password Field */}
                <form.Field name="confirmPassword">
                    {(field) => (
                        <div className="space-y-2">
                            <Label htmlFor="confirm-password">Potwierdź hasło *</Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={field.state.value}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    onBlur={field.handleBlur}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                >
                                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                            <FieldInfo field={field} />
                        </div>
                    )}
                </form.Field>

                <div className="space-y-3 pt-2">
                    <p className="text-sm text-center">
                        Zakładając konto, wyrażasz zgodę na przetwarzanie danych osobowych zgodnie z RODO
                    </p>

                    {/* Submit Button */}
                    <form.Subscribe
                        selector={(state) => ({
                            canSubmit: state.canSubmit,
                            isSubmitting: state.isSubmitting,
                        })}
                    >
                        {({ canSubmit }) => (
                            <Button type="submit" className="w-full" disabled={!canSubmit || isLoading}>
                                {isLoading ? "Tworzenie konta..." : "Akceptuję i dołączam"}
                            </Button>
                        )}
                    </form.Subscribe>
                </div>

                {/* Divider */}
                <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                        <span className="bg-card px-2 text-muted-foreground">lub</span>
                    </div>
                </div>

                {/* Social Signup */}
                <div className="grid grid-cols-2 gap-3">
                    <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleGoogleLogin}>
                        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Google
                    </Button>
                    <Button type="button" variant="outline" className="w-full bg-transparent" onClick={handleGithubLogin}>
                        <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z" />
                        </svg>
                        GitHub
                    </Button>
                </div>
            </FieldGroup>
        </form>
    );
}
