"use client";

import { useState, useTransition, useRef } from "react";
import { Camera, MapPin, Pencil, Loader2, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateProfile } from "@/app/actions/profile";
import { uploadProfileImage, deleteProfileImage } from "@/app/actions/images";
import { compressImage } from "@/lib/image-compression";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface ProfileHeaderProps {
    user: {
        id: string;
        name: string;
        email: string;
        image?: string;
    };
    profile: {
        fullName?: string;
        headline?: string;
        location?: string;
        connections: number;
        image?: string;
        backgroundImage?: string;
    };
    isOwnProfile?: boolean;
}

export function ProfileHeader({ user, profile, isOwnProfile = true }: ProfileHeaderProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isUploadingBackground, setIsUploadingBackground] = useState(false);
    const avatarInputRef = useRef<HTMLInputElement>(null);
    const backgroundInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        fullName: profile.fullName || user.name || "",
        headline: profile.headline || "",
        location: profile.location || "",
    });

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large", {
                description: "Avatar must be less than 5MB",
            });
            return;
        }

        try {
            setIsUploadingAvatar(true);
            toast.loading("Uploading avatar...", { id: "avatar-upload" });

            // Compress image
            const compressedFile = await compressImage(file, {
                maxSizeMB: 1,
                maxWidthOrHeight: 500,
            });

            // Upload to Vercel Blob
            const formData = new FormData();
            formData.append("file", compressedFile);

            const result = await uploadProfileImage(formData, "avatar");

            if (result.success && result.url) {
                toast.success("Avatar updated!", {
                    id: "avatar-upload",
                    description: "Your profile picture has been updated",
                });

                // Wait a bit for DB to update, then refresh
                await new Promise((resolve) => setTimeout(resolve, 300));
                router.refresh();
            } else {
                toast.error("Upload failed", {
                    id: "avatar-upload",
                    description: result.error || "Failed to upload avatar",
                });
            }
        } catch (error) {
            console.error("Avatar upload error:", error);
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

        // Validate file size
        if (file.size > 5 * 1024 * 1024) {
            toast.error("File too large", {
                description: "Background image must be less than 5MB",
            });
            return;
        }

        try {
            setIsUploadingBackground(true);
            toast.loading("Uploading background...", { id: "background-upload" });

            // Compress image
            const compressedFile = await compressImage(file, {
                maxSizeMB: 2,
                maxWidthOrHeight: 2048,
            });

            // Upload to Vercel Blob
            const formData = new FormData();
            formData.append("file", compressedFile);

            const result = await uploadProfileImage(formData, "background");

            if (result.success && result.url) {
                toast.success("Background updated!", {
                    id: "background-upload",
                    description: "Your cover photo has been updated",
                });

                // Wait a bit for DB to update, then refresh
                await new Promise((resolve) => setTimeout(resolve, 300));
                router.refresh();
            } else {
                toast.error("Upload failed", {
                    id: "background-upload",
                    description: result.error || "Failed to upload background",
                });
            }
        } catch (error) {
            console.error("Background upload error:", error);
            toast.error("Upload failed", {
                id: "background-upload",
                description: "An error occurred while uploading",
            });
        } finally {
            setIsUploadingBackground(false);
            if (backgroundInputRef.current) {
                backgroundInputRef.current.value = "";
            }
        }
    };

    const handleDeleteAvatar = async () => {
        if (!confirm("Jesteś pewny że chcesz usunąć zdjęcie profilowe?")) {
            return;
        }

        try {
            toast.loading("Removing avatar...", { id: "delete-avatar" });

            const result = await deleteProfileImage("avatar");

            if (result.success) {
                toast.success("Zdjęcie profilowe usunięte", {
                    id: "delete-avatar",
                    description: "Twoje zdjęcie profilowe zostało usunięte",
                });

                // Wait a bit for DB to update, then refresh
                await new Promise((resolve) => setTimeout(resolve, 300));
                router.refresh();
            } else {
                toast.error("Delete failed", {
                    id: "delete-avatar",
                    description: result.error || "Failed to remove avatar",
                });
            }
        } catch (error) {
            console.error("Avatar delete error:", error);
            toast.error("Delete failed", {
                id: "delete-avatar",
                description: "An error occurred while removing avatar",
            });
        }
    };

    const handleDeleteBackground = async () => {
        if (!confirm("Jesteś pewny że chcesz usunąć tło?")) {
            return;
        }

        try {
            toast.loading("Usuwanie tła...", { id: "delete-background" });

            const result = await deleteProfileImage("background");

            if (result.success) {
                toast.success("Tło usunięte!", {
                    id: "delete-background",
                    description: "Tło nie będzie się już pokazywać.",
                });

                // Wait a bit for DB to update, then refresh
                await new Promise((resolve) => setTimeout(resolve, 300));
                router.refresh();
            } else {
                toast.error("Delete failed", {
                    id: "delete-background",
                    description: result.error || "Failed to remove background",
                });
            }
        } catch (error) {
            console.error("Background delete error:", error);
            toast.error("Delete failed", {
                id: "delete-background",
                description: "An error occurred while removing background",
            });
        }
    };

    const handleSave = async () => {
        startTransition(async () => {
            const result = await updateProfile(formData);
            if (result.success) {
                setIsEditing(false);

                // If fullName was updated, redirect to new slug URL
                if (formData.fullName !== (profile.fullName || user.name) && result.profile?.slug) {
                    router.push(`/${result.profile.slug}`);
                } else {
                    router.refresh();
                }
            } else {
                console.error("Failed to update profile:", result.error);
            }
        });
    };

    const displayName = profile.fullName || user.name || "User";
    const connections = profile.connections > 500 ? "500+" : profile.connections.toString();
    const avatarUrl = user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
    const backgroundUrl = profile.backgroundImage;

    return (
        <>
            <Card className="overflow-hidden">
                {/* Cover Photo */}
                <div
                    className="relative h-48 bg-gradient-to-r from-primary/20 via-primary/10 to-accent/20"
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
                    {isOwnProfile && (
                        <>
                            <input
                                ref={backgroundInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp"
                                onChange={handleBackgroundUpload}
                                className="hidden"
                            />
                            <Button
                                variant="secondary"
                                size="icon"
                                className="absolute top-4 right-4 bg-card/80 hover:bg-card z-10"
                                onClick={() => backgroundInputRef.current?.click()}
                                disabled={isUploadingBackground}
                            >
                                {isUploadingBackground ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Camera className="h-4 w-4" />
                                )}
                            </Button>
                        </>
                    )}
                </div>

                {/* Profile Content */}
                <div className="relative px-6 pb-6">
                    {/* Profile Picture */}
                    <div className="relative -mt-16 mb-4">
                        <Avatar className="h-32 w-32 border-4 border-card">
                            <AvatarImage src={avatarUrl} />
                            <AvatarFallback className="text-2xl">
                                {displayName
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                        {isOwnProfile && (
                            <>
                                <input
                                    ref={avatarInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                    onChange={handleAvatarUpload}
                                    className="hidden"
                                />
                                <Button
                                    variant="secondary"
                                    size="icon"
                                    className="absolute bottom-0 right-0 rounded-full h-10 w-10 z-10"
                                    onClick={() => avatarInputRef.current?.click()}
                                    disabled={isUploadingAvatar}
                                >
                                    {isUploadingAvatar ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Camera className="h-4 w-4" />
                                    )}
                                </Button>
                            </>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold mb-1">{displayName}</h1>
                            {profile.headline && <p className="text-base text-foreground mb-2">{profile.headline}</p>}
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                {profile.location && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        {profile.location}
                                    </span>
                                )}
                            </div>
                        </div>
                        {isOwnProfile && (
                            <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                                <Pencil className="h-4 w-4 mr-2" />
                                Edytuj profil
                            </Button>
                        )}
                    </div>
                </div>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edytuj profil</DialogTitle>
                        <DialogDescription>Wprowadź zmiany w informacjach swojego profilu</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="fullName">Pełne imię i nazwisko *</Label>
                            <Input
                                id="fullName"
                                value={formData.fullName}
                                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                placeholder="Twoje pełne imię i nazwisko"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="headline">Nagłówek</Label>
                            <Input
                                id="headline"
                                value={formData.headline}
                                onChange={(e) => setFormData({ ...formData, headline: e.target.value })}
                                placeholder="Inżynier oprogramowania | Entuzjasta React"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Lokalizacja</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Warszawa, Polska"
                            />
                        </div>

                        {/* Image Management */}
                        <div className="border-t pt-4 mt-2">
                            <Label className="text-base mb-3 block">Zdjęcia profilu</Label>
                            <div className="space-y-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={handleDeleteAvatar}
                                    className="w-full justify-start text-destructive hover:text-destructive"
                                >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Usuń zdjęcie profilowe
                                </Button>
                                {backgroundUrl && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDeleteBackground}
                                        className="w-full justify-start text-destructive hover:text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Usuń zdjęcie tła
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>
                            Anuluj
                        </Button>
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending ? "Zapisywanie..." : "Zapisz zmiany"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
