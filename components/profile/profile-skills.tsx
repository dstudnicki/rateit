"use client";

import { useState, useTransition } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addSkill, deleteSkill } from "@/app/actions/profile";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogFooter,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
    AlertDialogCancel,
} from "@/components/ui/alert-dialog";

interface Skill {
    name: string;
    endorsements: number;
}

interface ProfileSkillsProps {
    skills: Skill[];
    isOwnProfile?: boolean;
}

export function ProfileSkills({ skills: initialSkills, isOwnProfile = true }: ProfileSkillsProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isAdding, setIsAdding] = useState(false);
    const [newSkill, setNewSkill] = useState("");
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleAdd = async () => {
        if (!newSkill.trim()) return;

        startTransition(async () => {
            const result = await addSkill(newSkill.trim());
            if (result.success) {
                setNewSkill("");
                setIsAdding(false);
                router.refresh();
            } else {
                toast.error("Nie udało się dodać umiejętności");
            }
        });
    };

    const handleRemove = (skillName: string) => {
        setDeleteTarget(skillName);
        setShowDeleteDialog(true);
    };

    const confirmRemove = async () => {
        if (!deleteTarget) return;
        setShowDeleteDialog(false);
        setIsDeleting(true);
        startTransition(async () => {
            const result = await deleteSkill(deleteTarget);
            setIsDeleting(false);
            if (result.success) {
                router.refresh();
            } else {
                toast.error("Nie udało się usunąć umiejętności");
            }
        });
        setDeleteTarget(null);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Umiejętności</CardTitle>
                    {isOwnProfile && (
                        <Button variant="ghost" size="icon" onClick={() => setIsAdding(true)}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent>
                    {initialSkills.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Nie dodano jeszcze żadnych umiejętności</p>
                    ) : (
                        <div className="space-y-4">
                            {initialSkills.map((skill) => (
                                <div key={skill.name} className="flex items-center justify-between group">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-medium">{skill.name}</h4>
                                        </div>
                                    </div>
                                    {isOwnProfile && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleRemove(skill.name)}
                                                disabled={isPending || isDeleting}
                                                className="h-8 w-8"
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={isAdding} onOpenChange={setIsAdding}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Dodaj umiejętność</DialogTitle>
                        <DialogDescription>Dodaj nową umiejętność do swojego profilu</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="skill">Umiejętność *</Label>
                            <Input
                                id="skill"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Np: React, Python, Project Management"
                                disabled={isPending}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        handleAdd();
                                    }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAdding(false)} disabled={isPending}>
                            Anuluj
                        </Button>
                        <Button onClick={handleAdd} disabled={isPending}>
                            {isPending ? "Zapisywanie" : "Zapisz"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* AlertDialog for deleting skill */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usuń umiejętność</AlertDialogTitle>
                        <AlertDialogDescription>Czy na pewno chcesz usunąć tę umiejętność z profilu?</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmRemove} className="bg-destructive">
                            Usuń
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
