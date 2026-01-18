"use client";

import { useState, useTransition } from "react";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateProfile } from "@/app/actions/profile";
import { useRouter } from "next/navigation";

interface ProfileAboutProps {
    about: string;
    isOwnProfile?: boolean;
}

export function ProfileAbout({ about: initialAbout, isOwnProfile = true }: ProfileAboutProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState(initialAbout);

    const handleSave = async () => {
        startTransition(async () => {
            const result = await updateProfile({ about: formData });
            if (result.success) {
                setIsEditing(false);
                router.refresh();
            } else {
                console.error("Failed to update about:", result.error);
            }
        });
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>O mnie</CardTitle>
                    {isOwnProfile && (
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                            <Pencil className="h-4 w-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {initialAbout ? (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{initialAbout}</p>
                    ) : (
                        <p className="text-sm text-muted-foreground italic">Dodaj opis o sobie</p>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Edytuj O mnie</DialogTitle>
                        <DialogDescription>
                            Podziel się swoją historią, umiejętnościami i tym, co Cię wyróżnia
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="about">O mnie</Label>
                        <Textarea
                            id="about"
                            value={formData}
                            onChange={(e) => setFormData(e.target.value)}
                            rows={10}
                            className="mt-2"
                            placeholder="Opowiedz o sobie, swoim doświadczeniu i tym, co Cię pasjonuje..."
                        />
                        <p className="text-xs text-muted-foreground mt-2">{formData.length} / 2 600 znaków</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditing(false)} disabled={isPending}>
                            Anuluj
                        </Button>
                        <Button onClick={handleSave} disabled={isPending}>
                            {isPending ? "Zapisywanie..." : "Zapisz"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
