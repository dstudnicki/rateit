"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { saveUserPreferences, type UserPreferences, getUserPreferences } from "@/app/actions/preferences";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const SUGGESTED_INDUSTRIES = [
    "Technology",
    "Finance",
    "Healthcare",
    "Education",
    "Marketing",
    "Design",
    "Engineering",
    "Sales",
    "Human Resources",
    "Consulting",
    "Manufacturing",
    "Retail",
];

const SUGGESTED_SKILLS = [
    "JavaScript",
    "Python",
    "React",
    "Node.js",
    "TypeScript",
    "Project Management",
    "Marketing Strategy",
    "Data Analysis",
    "UI/UX Design",
    "Leadership",
    "Communication",
    "Problem Solving",
];

export default function OnboardingPage() {
    const router = useRouter();
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [industries, setIndustries] = useState<string[]>([]);
    const [customIndustry, setCustomIndustry] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [customSkill, setCustomSkill] = useState("");

    const totalSteps = 2;

    // Determine if we are in edit mode (from settings)
    useEffect(() => {
        let isMounted = true;

        const checkOnboarding = async () => {
            try {
                const params = new URLSearchParams(window.location.search);
                const editMode = params.get("edit") === "true";

                const result = await getUserPreferences();

                if (!isMounted) return;

                if (!result.success) {
                    // Not authenticated - redirect to login
                    window.location.href = "/login";
                    return;
                }

                // If editing, allow to stay on this page even if onboardingCompleted
                if (result.preferences?.onboardingCompleted && !editMode) {
                    // Already completed - redirect to home
                    window.location.href = "/";
                    return;
                }

                // If editing and preferences exist, prefill the form
                if (editMode && result.preferences) {
                    setIndustries(result.preferences.industries || []);
                    setSkills(result.preferences.skills || []);
                }
            } catch (error) {
                console.error("Error checking onboarding status:", error);
                // If error while checking, allow user to continue in edit mode if URL requests it
                const params = new URLSearchParams(window.location.search);
                const editMode = params.get("edit") === "true";
                if (!editMode) {
                    // fallback redirect to login
                    window.location.href = "/login";
                    return;
                }
            } finally {
                if (isMounted) {
                    setIsLoading(false);
                }
            }
        };

        checkOnboarding();

        return () => {
            isMounted = false;
        };
    }, []);

    const toggleIndustry = (industry: string) => {
        setIndustries((prev) => (prev.includes(industry) ? prev.filter((i) => i !== industry) : [...prev, industry]));
    };

    const addCustomIndustry = () => {
        if (customIndustry.trim() && !industries.includes(customIndustry.trim())) {
            setIndustries((prev) => [...prev, customIndustry.trim()]);
            setCustomIndustry("");
        }
    };

    const removeIndustry = (industry: string) => {
        setIndustries((prev) => prev.filter((i) => i !== industry));
    };

    const toggleSkill = (skill: string) => {
        setSkills((prev) => (prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]));
    };

    const addCustomSkill = () => {
        if (customSkill.trim() && !skills.includes(customSkill.trim())) {
            setSkills((prev) => [...prev, customSkill.trim()]);
            setCustomSkill("");
        }
    };

    const removeSkill = (skill: string) => {
        setSkills((prev) => prev.filter((s) => s !== skill));
    };

    const handleNext = () => {
        if (step < totalSteps) {
            setStep(step + 1);
        }
    };

    const handleBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    const handleSkip = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const preferences: UserPreferences = {
                industries: [],
                skills: [],
                companies: [],
            };

            const result = await saveUserPreferences(preferences);

            if (result.success) {
                router.push("/profile");
            } else {
                setError(result.error || "Nie udało się zapisać preferencji");
                setIsSubmitting(false);
            }
        } catch (err) {
            console.error("Error skipping onboarding:", err);
            setError("Wystąpił nieoczekiwany błąd");
            setIsSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const preferences: UserPreferences = {
                industries,
                skills,
                companies: [],
            };

            const result = await saveUserPreferences(preferences);

            if (result.success) {
                router.push("/profile");
            } else {
                setError(result.error || "Nie udało się zapisać preferencji");
                setIsSubmitting(false);
            }
        } catch (err) {
            console.error("Error saving preferences:", err);
            setError("Wystąpił nieoczekiwany błąd");
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-12 px-4">
            <div className="container max-w-2xl mx-auto">
                <Card>
                    <CardHeader className="text-center">
                        <CardTitle className="text-3xl">Witaj w RateIT!</CardTitle>
                        <CardDescription className="text-base mt-2">
                            Spersonalizujmy Twoje doświadczenie poznając Twoje zainteresowania
                        </CardDescription>
                        <div className="flex justify-center gap-2 mt-6">
                            {[1, 2].map((s) => (
                                <div
                                    key={s}
                                    className={`h-2 w-16 rounded-full transition-colors ${
                                        s <= step ? "bg-primary" : "bg-muted"
                                    }`}
                                />
                            ))}
                        </div>
                    </CardHeader>

                    <CardContent className="pt-6">
                        {error && (
                            <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
                                <p className="text-sm text-destructive">{error}</p>
                            </div>
                        )}

                        {/* Step 1: Industries */}
                        {step === 1 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Jakie branże Cię interesują?</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Wybierz branże, którymi jesteś zainteresowany. To pomoże nam pokazać Ci odpowiednie
                                        firmy, posty i możliwości.
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-base font-medium mb-3 block">Wybierz z popularnych branż</Label>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {SUGGESTED_INDUSTRIES.map((industry) => (
                                            <Badge
                                                key={industry}
                                                variant={industries.includes(industry) ? "default" : "outline"}
                                                className="cursor-pointer hover:opacity-80 transition-opacity text-sm py-2 px-3"
                                                onClick={() => toggleIndustry(industry)}
                                            >
                                                {industry}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="custom-industry" className="text-sm font-medium mb-2 block">
                                        Dodaj konkretne obszary lub specjalizacje
                                    </Label>
                                    <p className="text-xs text-muted-foreground mb-2">
                                        np. &quot;AI&quot;, &quot;Cloud Computing&quot;
                                    </p>
                                    <div className="flex gap-2">
                                        <Input
                                            id="custom-industry"
                                            placeholder="np. Sztuczna Inteligencja"
                                            value={customIndustry}
                                            onChange={(e) => setCustomIndustry(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addCustomIndustry();
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            onClick={addCustomIndustry}
                                            disabled={!customIndustry.trim()}
                                            title="Dodaj branżę"
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {industries.length > 0 && (
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">
                                            Twoje wybrane branże ({industries.length})
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {industries.map((industry) => (
                                                <Badge key={industry} variant="secondary" className="gap-1 py-2 px-3">
                                                    {industry}
                                                    <X
                                                        className="h-3 w-3 cursor-pointer"
                                                        onClick={() => removeIndustry(industry)}
                                                    />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 2: Skills */}
                        {step === 2 && (
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-xl font-semibold mb-2">Jakie są Twoje kluczowe umiejętności?</h3>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Pomóż nam dopasować Cię do odpowiednich możliwości i treści.
                                    </p>
                                </div>

                                <div>
                                    <Label className="text-base font-medium mb-3 block">
                                        Wybierz z popularnych umiejętności
                                    </Label>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {SUGGESTED_SKILLS.map((skill) => (
                                            <Badge
                                                key={skill}
                                                variant={skills.includes(skill) ? "default" : "outline"}
                                                className="cursor-pointer hover:opacity-80 transition-opacity text-sm py-2 px-3"
                                                onClick={() => toggleSkill(skill)}
                                            >
                                                {skill}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <Label htmlFor="custom-skill" className="text-sm font-medium mb-2 block">
                                        Lub dodaj własne
                                    </Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="custom-skill"
                                            placeholder="np. Machine Learning"
                                            value={customSkill}
                                            onChange={(e) => setCustomSkill(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") {
                                                    e.preventDefault();
                                                    addCustomSkill();
                                                }
                                            }}
                                        />
                                        <Button
                                            type="button"
                                            size="icon"
                                            variant="outline"
                                            onClick={addCustomSkill}
                                            disabled={!customSkill.trim()}
                                        >
                                            <Plus className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                {skills.length > 0 && (
                                    <div>
                                        <Label className="text-sm font-medium mb-2 block">
                                            Twoje wybrane umiejętności ({skills.length})
                                        </Label>
                                        <div className="flex flex-wrap gap-2">
                                            {skills.map((skill) => (
                                                <Badge key={skill} variant="secondary" className="gap-1 py-2 px-3">
                                                    {skill}
                                                    <X className="h-3 w-3 cursor-pointer" onClick={() => removeSkill(skill)} />
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex justify-between items-center mt-8 pt-6 border-t">
                            <div className="flex gap-2">
                                {step > 1 && (
                                    <Button type="button" variant="outline" onClick={handleBack} disabled={isSubmitting}>
                                        <ArrowLeft className="h-4 w-4 mr-2" />
                                        Wstecz
                                    </Button>
                                )}
                                <Button type="button" variant="ghost" onClick={handleSkip} disabled={isSubmitting}>
                                    Pomiń na razie
                                </Button>
                            </div>

                            {step < totalSteps ? (
                                <Button type="button" onClick={handleNext} disabled={industries.length === 0}>
                                    Dalej
                                    <ArrowRight className="h-4 w-4 ml-2" />
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting || (skills.length === 0 && industries.length === 0)}
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Zapisywanie...
                                        </>
                                    ) : (
                                        <>
                                            Zakończ konfigurację
                                            <ArrowRight className="h-4 w-4 ml-2" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </div>

                        <p className="text-xs text-center text-muted-foreground mt-6">
                            Krok {step} z {totalSteps} • Możesz zawsze zmienić to później w ustawieniach
                        </p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
