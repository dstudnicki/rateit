"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { updateRodoConsent, deleteAccount } from "@/app/actions/settings";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ShieldCheck } from "lucide-react";

interface DataPrivacySettingsClientProps {
    rodoConsent: boolean;
    rodoConsentSource?: "manual" | "oauth";
}

export function DataPrivacySettingsClient({ rodoConsent, rodoConsentSource }: DataPrivacySettingsClientProps) {
    const router = useRouter();
    const [consent, setConsent] = useState(rodoConsent);
    const [isUpdating, setIsUpdating] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmText, setConfirmText] = useState("");

    const isOAuthConsent = rodoConsentSource === "oauth";

    const handleConsentChange = async (newConsent: boolean) => {
        if (isOAuthConsent) {
            toast.error("Cannot modify consent", {
                description: "Your consent was provided during OAuth login and cannot be changed here",
            });
            return;
        }

        try {
            setIsUpdating(true);
            setConsent(newConsent);

            const result = await updateRodoConsent(newConsent);

            if (result.success) {
                toast.success(
                    newConsent
                        ? "Wyrażono zgodę na przetwarzanie danych osobowych"
                        : "Usunięto zgodę na przetwarzanie danych osobowych",
                );
                router.refresh();
            } else {
                // Revert on error
                setConsent(!newConsent);
                toast.error("Failed to update consent", {
                    description: result.error,
                });
            }
        } catch {
            // Revert on error
            setConsent(!newConsent);
            toast.error("Failed to update consent");
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (confirmText !== "DELETE") {
            toast.error("Please type DELETE to confirm");
            return;
        }

        try {
            setIsDeleting(true);
            toast.loading("Deleting account...", { id: "delete-account" });

            const result = await deleteAccount();

            if (result.success) {
                toast.success("Account deleted successfully", { id: "delete-account" });

                // Sign out
                await authClient.signOut({
                    fetchOptions: {
                        onSuccess: () => {
                            router.push("/");
                        },
                    },
                });
            } else {
                toast.error("Failed to delete account", {
                    id: "delete-account",
                    description: result.error,
                });
                setIsDeleting(false);
            }
        } catch {
            toast.error("Failed to delete account", { id: "delete-account" });
            setIsDeleting(false);
        }
    };

    return (
        <>
            <Card className="p-6">
                <div className="space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">Prywatność danych</h2>
                        <p className="text-sm text-muted-foreground">
                            Zarządzaj swoimi danymi i preferencjami prywatności (zgodność z GDPR/RODO)
                        </p>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="font-semibold mb-4">Zgoda na przetwarzanie danych (GDPR/RODO)</h3>
                        {isOAuthConsent && (
                            <Alert className="mb-4">
                                <ShieldCheck className="h-4 w-4" />
                                <AlertDescription>
                                    Wyraziłeś zgodę na przetwarzanie danych podczas logowania OAuth (GitHub/Google). Ta zgoda
                                    jest zarządzana przez Twojego dostawcę OAuth.
                                </AlertDescription>
                            </Alert>
                        )}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium">Umowa przetwarzania danych</p>
                                    <p className="text-sm text-muted-foreground">
                                        Zezwól nam na przetwarzanie Twoich danych osobowych do funkcjonalności aplikacji i
                                        ulepszeń
                                    </p>
                                </div>
                                <Switch
                                    checked={consent}
                                    onCheckedChange={handleConsentChange}
                                    disabled={isUpdating || isOAuthConsent}
                                />
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div>
                        <h3 className="font-semibold mb-2">Usuń swoje konto</h3>
                        <p className="text-sm text-muted-foreground mb-3">
                            Usuń na stałe swoje konto i wszystkie powiązane dane. Tego działania nie da się cofnąć. Twoje posty
                            pozostanie, ale zostanie oznaczone jako z "Usunięte konto".
                        </p>
                        <Button variant="destructive" onClick={() => setShowDeleteDialog(true)}>
                            Usuń konto
                        </Button>
                    </div>
                </div>
            </Card>

            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Jesteś pewny?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Usuń na stałe swoje konto i wszystkie powiązane dane. Tego działania nie da się cofnąć. Twoje posty
                            pozostanie, ale zostanie oznaczone jako z "Usunięte konto".
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <div className="py-4">
                        <label htmlFor="confirm-delete" className="text-sm font-medium">
                            Type <strong>DELETE</strong> to confirm:
                        </label>
                        <input
                            id="confirm-delete"
                            type="text"
                            className="w-full mt-2 px-3 py-2 border rounded-md"
                            value={confirmText}
                            onChange={(e) => setConfirmText(e.target.value)}
                            placeholder="DELETE"
                        />
                    </div>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteAccount}
                            disabled={isDeleting || confirmText !== "DELETE"}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? "Usuwanie..." : "Usuń konto"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
