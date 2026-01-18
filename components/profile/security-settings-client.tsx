"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

interface SecuritySettingsClientProps {
    accountType: "credential" | "oauth";
    provider?: string;
}

export function SecuritySettingsClient({ accountType, provider }: SecuritySettingsClientProps) {
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [isChanging, setIsChanging] = useState(false);
    const [error, setError] = useState<string | null>(null);

    console.log("[SecuritySettings] Received props:", { accountType, provider });

    const handleChangePassword = async () => {
        setError(null);

        // Validate
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError("Wszystkie pola są wymagane");
            return;
        }

        if (newPassword.length < 8) {
            setError("Nowe hasło musi mieć co najmniej 8 znaków");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Nowe hasła nie pasują do siebie");
            return;
        }

        try {
            setIsChanging(true);
            toast.loading("Zmiana hasła...", { id: "password-change" });

            const { error } = await authClient.changePassword({
                newPassword: newPassword,
                currentPassword: currentPassword,
                revokeOtherSessions: true,
            });

            if (error) {
                // Translate error messages from Better Auth
                let errorMessage = error.message || "Nie udało się zmienić hasła";

                // Common Better Auth error messages translation
                if (errorMessage.includes("Invalid password")) {
                    errorMessage = "Nieprawidłowe obecne hasło";
                } else if (errorMessage.includes("Password is too weak")) {
                    errorMessage = "Hasło jest zbyt słabe";
                } else if (errorMessage.includes("Password must be at least")) {
                    errorMessage = "Hasło musi mieć co najmniej 8 znaków";
                } else if (errorMessage.includes("failed") || errorMessage.includes("Failed")) {
                    errorMessage = "Nie udało się zmienić hasła";
                }

                setError(errorMessage);
                toast.error("Nie udało się zmienić hasła", {
                    id: "password-change",
                    description: errorMessage,
                });
                return;
            }

            toast.success("Hasło zostało pomyślnie zmienione!", {
                id: "password-change",
                description: "Wszystkie inne sesje zostały unieważnione",
            });

            // Clear form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
        } catch (err: any) {
            const errorMessage = err?.message || "Wystąpił błąd";
            setError(errorMessage);
            toast.error("Nie udało się zmienić hasła", {
                id: "password-change",
                description: errorMessage,
            });
        } finally {
            setIsChanging(false);
        }
    };

    return (
        <Card className="p-6">
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold mb-1">Logowanie i Bezpieczeństwo</h2>
                    <p className="text-sm text-muted-foreground">Zarządzaj swoim hasłem i ustawieniami bezpieczeństwa</p>
                </div>

                <Separator />

                {accountType === "oauth" ? (
                    <Alert>
                        <ShieldCheck className="h-4 w-4" />
                        <AlertDescription>
                            Twoje konto jest zarządzane przez <strong>{provider === "github" ? "GitHub" : "Google"}</strong>
                            Zmiana hasła powinna być dokonana w ustawieniach konta {provider === "github" ? "GitHub" : "Google"}
                            .
                        </AlertDescription>
                    </Alert>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <h3 className="font-semibold mb-3">Zmień hasło</h3>
                            {error && (
                                <Alert variant="destructive" className="mb-4">
                                    <AlertDescription>{error}</AlertDescription>
                                </Alert>
                            )}
                            <div className="space-y-3">
                                <div>
                                    <Label htmlFor="current-password">Obecne hasło</Label>
                                    <Input
                                        id="current-password"
                                        type="password"
                                        className="mt-2"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        disabled={isChanging}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="new-password">Nowe hasło (min. 8 znaków)</Label>
                                    <Input
                                        id="new-password"
                                        type="password"
                                        className="mt-2"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        disabled={isChanging}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="confirm-password">Potwierdź nowe hasło</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        className="mt-2"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        disabled={isChanging}
                                    />
                                </div>
                                <div className="flex gap-3 justify-end pt-4">
                                    <Button onClick={handleChangePassword} disabled={isChanging}>
                                        {isChanging ? "Aktualizowanie..." : "Zaktualizuj hasło"}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Card>
    );
}
