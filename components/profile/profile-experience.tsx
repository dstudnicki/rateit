"use client";

import { useState, useTransition } from "react";
import { Briefcase, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { addExperience, updateExperience, deleteExperience } from "@/app/actions/profile";
import { useRouter } from "next/navigation";
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
import { toast } from "sonner";

interface Experience {
    _id?: string;
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate?: string;
    current: boolean;
    description: string;
}

interface ProfileExperienceProps {
    experiences: Experience[];
    isOwnProfile?: boolean;
}

export function ProfileExperience({ experiences: initialExperiences, isOwnProfile = true }: ProfileExperienceProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Experience>({
        title: "",
        company: "",
        location: "",
        startDate: "",
        endDate: "",
        current: false,
        description: "",
    });
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = (exp: Experience) => {
        setFormData(exp);
        setEditingId(exp._id || null);
        setIsEditing(true);
    };

    const handleAdd = () => {
        setFormData({
            title: "",
            company: "",
            location: "",
            startDate: "",
            endDate: "",
            current: false,
            description: "",
        });
        setEditingId(null);
        setIsEditing(true);
    };

    const handleSave = async () => {
        startTransition(async () => {
            let result;
            if (editingId) {
                result = await updateExperience(editingId, formData);
            } else {
                result = await addExperience(formData);
            }

            if (result.success) {
                setIsEditing(false);
                router.refresh();
            } else {
                toast.error("Nie udało się zapisać doświadczenia");
            }
        });
    };

    const handleDelete = (id: string) => {
        setDeleteTarget(id);
        setShowDeleteDialog(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setShowDeleteDialog(false);
        setIsDeleting(true);
        startTransition(async () => {
            const result = await deleteExperience(deleteTarget);
            setIsDeleting(false);
            if (result.success) {
                router.refresh();
            } else {
                toast.error("Wystąpił błąd podczas usuwania");
            }
        });
        setDeleteTarget(null);
    };

    return (
        <>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                    <CardTitle>Doświadczenie</CardTitle>
                    {isOwnProfile && (
                        <Button variant="ghost" size="icon" onClick={handleAdd}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {initialExperiences.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Nie dodano jeszcze doświadczenia</p>
                    ) : (
                        initialExperiences.map((exp) => (
                            <div key={exp._id} className="flex gap-4 group">
                                <div className="flex-shrink-0">
                                    <div className="h-12 w-12 rounded bg-secondary flex items-center justify-center">
                                        <Briefcase className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold">{exp.title}</h3>
                                    <p className="text-sm text-foreground">{exp.company}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {exp.startDate} - {exp.endDate ? exp.endDate : "Obecnie"}
                                    </p>
                                    <p className="text-sm mt-2 leading-relaxed">{exp.description}</p>
                                </div>
                                {isOwnProfile && (
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(exp)}
                                            disabled={isPending}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(exp._id!)}
                                            disabled={isPending || isDeleting}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Dialog open={isEditing} onOpenChange={setIsEditing}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>{editingId ? "Edytuj doświadczenie" : "Dodaj doświadczenie"}</DialogTitle>
                        <DialogDescription>Dodaj swoje doświadczenie zawodowe, staże i wolontariat</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid gap-2">
                            <Label htmlFor="title">Stanowisko *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="Np.: Inżynier oprogramowania"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="company">Firma *</Label>
                            <Input
                                id="company"
                                value={formData.company}
                                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                                placeholder="Np.: Microsoft"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="location">Lokalizacja *</Label>
                            <Input
                                id="location"
                                value={formData.location}
                                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                                placeholder="Np.: Warszawa, Polska"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="current"
                                checked={formData.current}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        current: checked as boolean,
                                        endDate: checked ? "" : formData.endDate,
                                    })
                                }
                            />
                            <label htmlFor="current" className="text-sm font-medium leading-none cursor-pointer">
                                Obecnie tu pracuję
                            </label>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">Data rozpoczęcia *</Label>
                                <Input
                                    id="startDate"
                                    type="month"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                />
                            </div>
                            {!formData.current && (
                                <div className="grid gap-2">
                                    <Label htmlFor="endDate">Data zakończenia</Label>
                                    <Input
                                        id="endDate"
                                        type="month"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    />
                                </div>
                            )}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="description">Opis *</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={5}
                                placeholder="Opisz swoje obowiązki i osiągnięcia..."
                            />
                        </div>
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

            {/* AlertDialog for deleting experience */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usuń doświadczenie</AlertDialogTitle>
                        <AlertDialogDescription>
                            Czy na pewno chcesz usunąć to doświadczenie? Ta operacja jest nieodwracalna.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>Anuluj</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} className="bg-destructive">
                            Usuń
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
