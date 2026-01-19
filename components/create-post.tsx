"use client";

import React, { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { ImageIcon } from "lucide-react";
import { createPost } from "@/app/actions/posts";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/image-upload";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";

export function CreatePost() {
    const [content, setContent] = useState("");
    const [isExpanded, setIsExpanded] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [images, setImages] = useState<string[]>([]);
    const [showImageUpload, setShowImageUpload] = useState(false);
    const [userImage, setUserImage] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("ME");
    const router = useRouter();

    const { data: sessionData } = authClient.useSession();

    useEffect(() => {
        // Fetch current user profile for avatar
        async function fetchUserProfile() {
            try {
                const response = await fetch("/api/auth/get-session");
                const session = await response.json();
                if (session?.user) {
                    setUserName(session.user.name || "ME");
                    // Try to fetch profile image
                    const profileResponse = await fetch("/api/profile/current");
                    const profileData = await profileResponse.json();
                    if (profileData?.profile?.image) {
                        setUserImage(profileData.profile.image);
                    } else if (session.user.image) {
                        setUserImage(session.user.image);
                    }
                }
            } catch (_error) {
                // Unused error intentionally ignored
            }
        }
        fetchUserProfile();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content.trim()) return toast.error("Proszę, napisz treść.");

        setIsSubmitting(true);

        // Optimistic update - clear form immediately for better UX
        const postContent = content;
        const postImages = images;
        setContent("");
        setImages([]);
        setIsExpanded(false);
        setShowImageUpload(false);

        try {
            const result = await createPost(postContent, postImages);

            if (result.success) {
                // Refresh the page to show the new post (cache is invalidated server-side)
                router.refresh();
            } else {
                // Restore content on error
                setContent(postContent);
                setImages(postImages);
                setIsExpanded(true);
                toast.error("Nie udało się utworzyć posta. Proszę, spróbuj ponownie.");
            }
        } catch (_error) {
            // Restore content on error
            setContent(postContent);
            setImages(postImages);
            setIsExpanded(true);
            toast.error("Nie udało się utworzyć posta. Proszę, spróbuj ponownie.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="p-4">
            {sessionData ? (
                <div className="flex gap-3">
                    <Avatar className="h-12 w-12">
                        <AvatarImage
                            src={userImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userName}`}
                            className=" object-center object-cover"
                        />
                        <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1">
                        <Textarea
                            placeholder="Co u Ciebie słychać?"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            onFocus={() => setIsExpanded(true)}
                            className="min-h-[60px] resize-none border-none p-0 focus-visible:ring-0 text-base"
                            disabled={isSubmitting}
                        />

                        {isExpanded && (
                            <div className="mt-4 space-y-4">
                                {/* Image Upload */}
                                {showImageUpload && (
                                    <ImageUpload
                                        mode="multiple"
                                        maxFiles={4}
                                        onUpload={(urls) => setImages(urls)}
                                        existingImages={images}
                                        folder="posts"
                                    />
                                )}

                                {/* Media Options */}
                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="gap-2"
                                        disabled={isSubmitting}
                                        onClick={() => setShowImageUpload(!showImageUpload)}
                                        type="button"
                                    >
                                        <ImageIcon className="h-4 w-4" />
                                        <span className="hidden sm:inline">
                                            {showImageUpload ? "Ukryj zdjęcia" : "Dodaj zdjęcia"}
                                        </span>
                                    </Button>
                                    {images.length > 0 && (
                                        <span className="text-xs text-muted-foreground">
                                            {images.length}{" "}
                                            {images.length === 1
                                                ? "zdjęcie"
                                                : images.length >= 2 && images.length <= 4
                                                  ? "zdjęcia"
                                                  : "zdjęć"}
                                        </span>
                                    )}
                                </div>

                                {/* Post Actions */}
                                <div className="flex items-center justify-end gap-2 pt-2 border-t">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => {
                                            setIsExpanded(false);
                                            setContent("");
                                            setImages([]);
                                            setShowImageUpload(false);
                                        }}
                                        disabled={isSubmitting}
                                    >
                                        Anuluj
                                    </Button>
                                    <Button size="sm" onClick={handleSubmit} disabled={!content.trim() || isSubmitting}>
                                        {isSubmitting ? "Publikowanie..." : "Opublikuj"}
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-sm text-muted-foreground">
                    Zaloguj się lub zarejestruj, aby odblokować pełne możliwości platformy.
                </div>
            )}
        </Card>
    );
}
