"use client";

import { useState, useTransition, useRef } from "react";
import { Camera, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfileSettings } from "@/app/actions/settings";
import { uploadProfileImage, deleteProfileImage } from "@/app/actions/images";
import { compressImage } from "@/lib/image-compression";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProfileSettingsClientProps {
    user: {
        name: string;
        email: string;
        userImage?: string | null;
        oauthImage?: string | null;
    };
    profile: {
        fullName?: string;
        headline?: string;
        location?: string;
        backgroundImage?: string | null;
    };
}

export function ProfileSettingsClient({ user, profile }: ProfileSettingsClientProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingBackground, setIsUploadingBackground] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const backgroundInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        fullName: profile.fullName || user.name || "",
        headline: profile.headline || "",
        location: profile.location || "",
    });

    const avatarUrl = user.userImage || user.oauthImage || null;
    const backgroundUrl = profile.backgroundImage || null;

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large", {
                description: "Avatar must be less than 5MB",
            });
            return;
        }

        try {
            setIsUploadingAvatar(true);
            toast.loading("Uploading avatar...", { id: "avatar-upload" });

            const compressedFile = await compressImage(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 500,
            });

            const formData = new FormData();
            formData.append("file", compressedFile);

            const result = await uploadProfileImage(formData, "avatar");

            if (result.success && result.url) {
                toast.success("Avatar updated!", {
                    id: "avatar-upload",
                });
                await new Promise((resolve) => setTimeout(resolve, 300));
                router.refresh();
            } else {
                toast.error("Upload failed", {
                    id: "avatar-upload",
                    description: result.error || "Failed to upload avatar",
                });
            }
        } catch (error) {
            toast.error("Upload failed", {
                id: "avatar-upload",
                description: "An error occurred while uploading",
            });
        } finally {
            setIsUploadingAvatar(false);
            if (avatarInputRef.current) {
                avatarInputRef.current.value = "";
            }
        }
    };

    const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            toast.error("Plik zbyt duży", {
                description: "Tło musi być mniejsze niż 5MB",
            });
            return;
        }

        try {
            setIsUploadingBackground(true);
            toast.loading("Przesyłanie tła...", { id: "background-upload" });

            const compressedFile = await compressImage(file, {
                maxSizeMB: 2,
                maxWidthOrHeight: 1920,
            });

            const formData = new FormData();
            formData.append("file", compressedFile);

            const result = await uploadProfileImage(formData, "background");

            if (result.success && result.url) {
                toast.success("Tło zaktualizowane!", {
                    id: "background-upload",
                });
                await new Promise((resolve) => setTimeout(resolve, 300));
                router.refresh();
            } else {
                toast.error("Przesyłanie nie powiodło się", {
                    id: "background-upload",
                    description: result.error || "Nie udało się przesłać tła",
                });
            }
        } catch (error) {
            toast.error("Przesyłanie nie powiodło się", {
                id: "background-upload",
                description: "Wystąpił błąd podczas przesyłania",
            });
        } finally {
            setIsUploadingBackground(false);
            if (backgroundInputRef.current) {
                backgroundInputRef.current.value = "";
            }
        }
    };

    const handleDeleteAvatar = async () => {
        try {
            toast.loading("Usuwanie avatara...", { id: "avatar-delete" });
            const result = await deleteProfileImage("avatar");

            if (result.success) {
                toast.success("Avatar usunięty!", { id: "avatar-delete" });
                await new Promise((resolve) => setTimeout(resolve, 300));
                router.refresh();
            } else {
                toast.error("Nie udało się usunąć avatara", {
                    id: "avatar-delete",
                    description: result.error,
                });
            }
        } catch (error) {
            toast.error("Nie udało się usunąć avatara", { id: "avatar-delete" });
        }
    };

    const handleDeleteBackground = async () => {
        try {
            toast.loading("Usuwanie tła...", { id: "background-delete" });
            const result = await deleteProfileImage("background");

            if (result.success) {
                toast.success("Tło usunięte!", { id: "background-delete" });
                await new Promise((resolve) => setTimeout(resolve, 300));
                router.refresh();
            } else {
                toast.error("Nie udało się usunąć tła", {
                    id: "background-delete",
                    description: result.error,
                });
            }
        } catch (error) {
            toast.error("Nie udało się usunąć tła", { id: "background-delete" });
        }
    };

    const handleSave = async () => {
        startTransition(async () => {
            const result = await updateProfileSettings(formData);
            if (result.success) {
                toast.success("Profil zaktualizowany pomyślnie!");
                router.refresh();
            } else {
                toast.error("Nie udało się zaktualizować profilu", {
                    description: result.error,
                });
            }
        });
    };

    const initials = formData.fullName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase();

    return (
        <Card className="overflow-hidden">
            {/* Background Image */}
            <div
                className="relative h-32 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20"
                style={
                    backgroundUrl
                        ? {
                              backgroundImage: `url(${backgroundUrl})`,
                              backgroundSize: "cover",
                              backgroundPosition: "center",
                          }
                        : undefined
                }
            >
                <input
                    ref={backgroundInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleBackgroundUpload}
                    disabled={isUploadingBackground}
                />
                <div className="absolute top-4 right-4 flex gap-2">
                    {backgroundUrl && (
                        <Button
                            variant="secondary"
                            size="icon"
                            className="bg-card/80 hover:bg-card"
                            onClick={handleDeleteBackground}
                            disabled={isUploadingBackground}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    )}
                    <Button
                        variant="secondary"
                        size="icon"
                        className="bg-card/80 hover:bg-card"
                        onClick={() => backgroundInputRef.current?.click()}
                        disabled={isUploadingBackground}
                    >
                        {isUploadingBackground ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                    </Button>
                </div>
            </div>

            <div className="relative px-6 pb-6">
                {/* Avatar */}
                <div className="relative -mt-12 mb-4">
                    <Avatar className="h-24 w-24 border-4 border-card">
                        <AvatarImage src={avatarUrl || undefined} />
                        <AvatarFallback className="text-xl">{initials}</AvatarFallback>
                    </Avatar>
                    <input
                        ref={avatarInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleAvatarUpload}
                        disabled={isUploadingAvatar}
                    />
                    <div className="absolute bottom-0 right-0 flex gap-1">
                        {user.userImage && (
                            <Button
                                variant="secondary"
                                size="icon"
                                className="rounded-full h-8 w-8"
                                onClick={handleDeleteAvatar}
                                disabled={isUploadingAvatar}
                            >
                                <Trash2 className="h-3 w-3" />
                            </Button>
                        )}
                        <Button
                            variant="secondary"
                            size="icon"
                            className="rounded-full h-8 w-8"
                            onClick={() => avatarInputRef.current?.click()}
                            disabled={isUploadingAvatar}
                        >
                            {isUploadingAvatar ? <Loader2 className="h-3 w-3 animate-spin" /> : <Camera className="h-3 w-3" />}
                        </Button>
                    </div>
                </div>

                {/* Form Fields */}
                <div className="space-y-4">
                    <div>
                        <Label htmlFor="name">Imię i Nazwisko *</Label>
                        <Input
                            id="name"
                            value={formData.fullName}
                            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                            className="mt-2"
                        />
                    </div>

                    <div>
                        <Label htmlFor="headline">Nagłówek Zawodowy *</Label>
                        <Input
                            id="headline"
                            value={formData.headline}
                            onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                            className="mt-2"
                            placeholder="np. Inżynier Oprogramowania w Google"
                        />
                    </div>

                    <div>
                        <Label htmlFor="location">Lokalizacja</Label>
                        <Input
                            id="location"
                            value={formData.location}
                            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                            className="mt-2"
                            placeholder="np. Warszawa, Polska"
                        />
                    </div>
                    <div className="flex gap-3 justify-end pt-4">
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending ? "Zapisywanie..." : "Zapisz Zmiany"}
                        </Button>
                    </div>
                </div>
            </div>
        </Card>
    );
}
