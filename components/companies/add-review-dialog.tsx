"use client";

import type React from "react";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Plus } from "lucide-react";
import { addCompanyReview } from "@/app/actions/companies";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";

interface AddReviewDialogProps {
    companyId: string;
    existingReviews?: any[];
}

export function AddReviewDialog({ companyId, existingReviews = [] }: AddReviewDialogProps) {
    const router = useRouter();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [rating, setRating] = useState(0);
    const [hoveredRating, setHoveredRating] = useState(0);
    const [hasReviewed, setHasReviewed] = useState(false);
    const session = authClient.useSession();
    const currentUserId = session.data?.user?.id;
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        role: "",
        reviewType: "work" as "work" | "interview",
        nick: "",
    });
    console.log(existingReviews);
    console.log(hasReviewed);
    // Check if user has already reviewed this company
    useEffect(() => {
        if (currentUserId && existingReviews) {
            const userReview = existingReviews.find(
                (review: any) => review.user?._id === currentUserId || review.user === currentUserId,
            );
            if (userReview) {
                setHasReviewed(true);
            } else {
                setHasReviewed(false);
            }
        }
    }, [currentUserId, existingReviews]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Check if user has already reviewed
        if (hasReviewed) {
            setError("Już oceniłeś tę firmę. Dozwolona jest tylko jedna recenzja na użytkownika, aby zapobiec spamowi.");
            return;
        }

        if (rating === 0) {
            setError("Dodaj swoją ocenę");
            return;
        }

        setIsSubmitting(true);
        setError(null);

        const result = await addCompanyReview(companyId, {
            ...formData,
            rating,
        });

        if (result.success) {
            setOpen(false);
            setRating(0);
            setFormData({
                title: "",
                content: "",
                role: "",
                reviewType: "work",
                nick: "",
            });
            setHasReviewed(true); // Mark as reviewed
            router.refresh();
        } else {
            setError(result.error || "Nie udało się dodać opinii");
        }

        setIsSubmitting(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button disabled={hasReviewed}>
                    <Plus className="w-4 h-4 mr-2" />
                    {hasReviewed ? "Już ocenione" : "Dodaj opinię"}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Dodaj swoją opinię</DialogTitle>
                    <DialogDescription>
                        Podziel się swoimi doświadczeniami z pracy w tej firmie lub procesem rozmowy kwalifikacyjnej.
                    </DialogDescription>
                    {hasReviewed && (
                        <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground mt-2">
                            Już oceniłeś tę firmę. Dozwolona jest tylko jedna recenzja na użytkownika, aby zapobiec spamowi.
                        </div>
                    )}
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">{error}</div>}

                    <div className="space-y-2">
                        <Label>Ogólna ocena *</Label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onMouseEnter={() => setHoveredRating(star)}
                                    onMouseLeave={() => setHoveredRating(0)}
                                    onClick={() => setRating(star)}
                                >
                                    <Star
                                        className={`h-8 w-8 transition-colors ${
                                            star <= (hoveredRating || rating)
                                                ? "fill-yellow-500 text-yellow-500"
                                                : "fill-muted text-muted"
                                        }`}
                                    />
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Typ opinii *</Label>
                        <div className="flex flex-col lg:flex-row gap-2">
                            <Button
                                type="button"
                                variant={formData.reviewType === "work" ? "default" : "outline"}
                                onClick={() => setFormData({ ...formData, reviewType: "work" })}
                                className="flex-1"
                            >
                                Doświadczenie zawodowe
                            </Button>
                            <Button
                                type="button"
                                variant={formData.reviewType === "interview" ? "default" : "outline"}
                                onClick={() => setFormData({ ...formData, reviewType: "interview" })}
                                className="flex-1"
                            >
                                Proces rekrutacji
                            </Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="title">Tytuł opinii *</Label>
                        <Input
                            id="title"
                            placeholder="Podsumuj swoje doświadczenie"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="review">Twoja opinia *</Label>
                        <Textarea
                            id="review"
                            placeholder="Podziel się szczegółami dotyczącymi doświadczenia zawodowego, kultury zespołu, zarządzania, procesu rekrutacji itp."
                            className="min-h-[150px]"
                            value={formData.content}
                            onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="nick">
                            Pseudonim *
                            <span className="text-xs text-muted-foreground ml-2">
                                (Twoje prawdziwe imię NIE będzie wyświetlane)
                            </span>
                        </Label>
                        <Input
                            id="nick"
                            placeholder="np. TechEnthusiast123"
                            value={formData.nick}
                            onChange={(e) => setFormData({ ...formData, nick: e.target.value })}
                            required
                            maxLength={30}
                        />
                        <p className="text-xs text-muted-foreground">
                            Ten pseudonim będzie widoczny zamiast Twojego prawdziwego imienia, aby chronić Twoją prywatność
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="role">Twoja rola *</Label>
                        <Input
                            id="role"
                            placeholder="np. Inżynier oprogramowania, Kandydat do pracy"
                            value={formData.role}
                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                            required
                        />
                    </div>

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
                            Anuluj
                        </Button>
                        <Button type="submit" disabled={isSubmitting || hasReviewed}>
                            {isSubmitting ? "Wysyłanie..." : hasReviewed ? "Już ocenione" : "Wyślij opinię"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
