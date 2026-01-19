"use client";

import { useState, useTransition } from "react";
import { GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addEducation, updateEducation, deleteEducation } from "@/app/actions/profile";
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

interface Education {
    _id?: string;
    school: string;
    degree: string;
    field: string;
    startDate: string;
    endDate: string;
    grade?: string;
    activities?: string;
}

interface ProfileEducationProps {
    educations: Education[];
    isOwnProfile?: boolean;
}

export function ProfileEducation({ educations: initialEducations, isOwnProfile = true }: ProfileEducationProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Education>({
        school: "",
        degree: "",
        field: "",
        startDate: "",
        endDate: "",
        grade: "",
        activities: "",
    });
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleEdit = (edu: Education) => {
        setFormData(edu);
        setEditingId(edu._id || null);
        setIsEditing(true);
    };

    const handleAdd = () => {
        setFormData({
            school: "",
            degree: "",
            field: "",
            startDate: "",
            endDate: "",
            grade: "",
            activities: "",
        });
        setEditingId(null);
        setIsEditing(true);
    };

    const handleSave = async () => {
        startTransition(async () => {
            let result;
            if (editingId) {
                result = await updateEducation(editingId, formData);
            } else {
                result = await addEducation(formData);
            }

            if (result.success) {
                setIsEditing(false);
                router.refresh();
            } else {
                toast.error("Nie udało się zapisać edukacji");
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
            const result = await deleteEducation(deleteTarget);
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
                    <CardTitle>Wykształcenie</CardTitle>
                    {isOwnProfile && (
                        <Button variant="ghost" size="icon" onClick={handleAdd}>
                            <Plus className="h-4 w-4" />
                        </Button>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {initialEducations.length === 0 ? (
                        <p className="text-sm text-muted-foreground italic">Nie dodano jeszcze wykształcenia</p>
                    ) : (
                        initialEducations.map((edu) => (
                            <div key={edu._id} className="flex gap-4 group">
                                <div className="flex-shrink-0">
                                    <div className="h-12 w-12 rounded bg-secondary flex items-center justify-center">
                                        <GraduationCap className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold">{edu.school}</h3>
                                    <p className="text-sm text-foreground">
                                        {edu.degree}, {edu.field}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {edu.startDate} - {edu.endDate}
                                    </p>
                                    {edu.grade && <p className="text-sm text-muted-foreground">Ocena: {edu.grade}</p>}
                                    {edu.activities && <p className="text-sm mt-2">{edu.activities}</p>}
                                </div>
                                {isOwnProfile && (
                                    <div className="flex gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(edu)}
                                            disabled={isPending}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(edu._id!)}
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
                        <DialogTitle>{editingId ? "Edytuj wykształcenie" : "Dodaj wykształcenie"}</DialogTitle>
                        <DialogDescription>Dodaj informacje o swoim wykształceniu i osiągnięciach</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4 max-h-[60vh] overflow-y-auto">
                        <div className="grid gap-2">
                            <Label htmlFor="school">Szkoła *</Label>
                            <Input
                                id="school"
                                value={formData.school}
                                onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                                placeholder="Np.: Uniwersytet Warszawski"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="degree">Stopień *</Label>
                            <Input
                                id="degree"
                                value={formData.degree}
                                onChange={(e) => setFormData({ ...formData, degree: e.target.value })}
                                placeholder="Np.: Licencjat"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="field">Kierunek studiów *</Label>
                            <Input
                                id="field"
                                value={formData.field}
                                onChange={(e) => setFormData({ ...formData, field: e.target.value })}
                                placeholder="Np.: Informatyka"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label htmlFor="startDate">Rok rozpoczęcia *</Label>
                                <Input
                                    id="startDate"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    placeholder="2015"
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="endDate">Rok zakończenia *</Label>
                                <Input
                                    id="endDate"
                                    value={formData.endDate}
                                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                    placeholder="2019"
                                />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="grade">Ocena</Label>
                            <Input
                                id="grade"
                                value={formData.grade}
                                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                                placeholder="Np.: 4.5"
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="activities">Aktywności i organizacje</Label>
                            <Textarea
                                id="activities"
                                value={formData.activities}
                                onChange={(e) => setFormData({ ...formData, activities: e.target.value })}
                                rows={3}
                                placeholder="Np.: Członek Koła Naukowego Informatyków, Wolontariusz w lokalnym schronisku"
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

            {/* AlertDialog for deleting education */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Usuń wpis o wykształceniu</AlertDialogTitle>
                        <AlertDialogDescription>
                            Czy na pewno chcesz usunąć ten wpis? Ta operacja jest nieodwracalna.
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
