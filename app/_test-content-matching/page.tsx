"use client";

import { useState, useEffect } from "react";
import { getUserPreferences } from "@/app/actions/preferences";
import { getPersonalizedFeed } from "@/app/actions/posts";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function TestContentMatchingPage() {
    const [loading, setLoading] = useState(true);
    const [preferences, setPreferences] = useState<any>(null);
    const [feedResult, setFeedResult] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);

        try {
            // Test getUserPreferences
            const prefsResult = await getUserPreferences();
            console.log("Preferences result:", prefsResult);
            setPreferences(prefsResult);

            // Test getPersonalizedFeed
            const feed = await getPersonalizedFeed(5, 0);
            console.log("Feed result:", feed);
            setFeedResult(feed);
        } catch (err: any) {
            console.error("Test error:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const fixPreferences = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/profiles/fix-preferences");
            const result = await response.json();
            console.log("Fix result:", result);
            alert(`Fixed ${result.profiles?.length || 0} profiles`);
            loadData(); // Reload data
        } catch (err: any) {
            console.error("Fix error:", err);
            alert("Error fixing preferences: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="container max-w-4xl mx-auto px-4 py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    return (
        <div className="container max-w-4xl mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold mb-6">System Dopasowywania Treści - Strona Testowa</h1>

            {error && (
                <Card className="mb-6 border-destructive">
                    <CardHeader>
                        <CardTitle className="text-destructive flex items-center gap-2">
                            <XCircle className="h-5 w-5" />
                            Błąd
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{error}</p>
                    </CardContent>
                </Card>
            )}

            <div className="space-y-6">
                {/* User Preferences Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {preferences?.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            Preferencje Użytkownika
                        </CardTitle>
                        <CardDescription>Status: {preferences?.success ? "Załadowano" : "Niepowodzenie"}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {preferences?.success && preferences.preferences ? (
                            <>
                                <div>
                                    <Badge variant={preferences.preferences.onboardingCompleted ? "default" : "secondary"}>
                                        {preferences.preferences.onboardingCompleted ? "Completed" : "Not Completed"}
                                    </Badge>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">
                                        Industries ({preferences.preferences.industries?.length || 0}):
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {preferences.preferences.industries?.map((ind: string) => (
                                            <Badge key={ind} variant="outline">
                                                {ind}
                                            </Badge>
                                        )) || <span className="text-muted-foreground">None</span>}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">
                                        Skills ({preferences.preferences.skills?.length || 0}):
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                        {preferences.preferences.skills?.map((skill: string) => (
                                            <Badge key={skill} variant="outline">
                                                {skill}
                                            </Badge>
                                        )) || <span className="text-muted-foreground">None</span>}
                                    </div>
                                </div>

                                <div>
                                    <h3 className="font-semibold mb-2">Followed Companies:</h3>
                                    <p className="text-muted-foreground">
                                        {preferences.preferences.companies?.length || 0} companies
                                    </p>
                                </div>
                            </>
                        ) : (
                            <div>
                                <p className="text-muted-foreground mb-4">{preferences?.error || "No preferences found"}</p>
                                {preferences?.error === "Not authenticated" ? (
                                    <p className="text-sm text-muted-foreground">Please log in to see your preferences.</p>
                                ) : (
                                    <Button onClick={fixPreferences} disabled={loading}>
                                        Fix Missing Preferences
                                    </Button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Feed Status */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            {feedResult?.success ? (
                                <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                                <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            Personalized Feed
                        </CardTitle>
                        <CardDescription>Status: {feedResult?.success ? "Loaded" : "Failed"}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {feedResult?.success ? (
                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-semibold mb-2">Feed Stats:</h3>
                                    <ul className="list-disc list-inside space-y-1 text-sm">
                                        <li>Posts loaded: {feedResult.posts?.length || 0}</li>
                                        <li>
                                            Feed type:{" "}
                                            {preferences?.preferences?.onboardingCompleted ? "Personalized" : "Generic"}
                                        </li>
                                    </ul>
                                </div>

                                {feedResult.posts && feedResult.posts.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2">Sample Posts:</h3>
                                        <div className="space-y-2">
                                            {feedResult.posts.slice(0, 3).map((post: any) => (
                                                <div key={post._id} className="p-3 bg-secondary/50 rounded-lg">
                                                    <p className="text-sm font-medium">
                                                        {post.user?.fullName || post.user?.name || "Unknown"}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                                                        {post.content}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <p className="text-muted-foreground">{feedResult?.error || "Failed to load feed"}</p>
                        )}
                    </CardContent>
                </Card>

                {/* Actions */}
                <Card>
                    <CardHeader>
                        <CardTitle>Akcje Testowe</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Button onClick={loadData} disabled={loading} className="mr-2">
                                Przeładuj Dane
                            </Button>
                            <Button onClick={fixPreferences} disabled={loading} variant="outline">
                                Napraw Wszystkie Profile
                            </Button>
                        </div>
                        <div className="text-sm text-muted-foreground space-y-2">
                            <p>
                                <strong>Jak testować:</strong>
                            </p>
                            <ol className="list-decimal list-inside space-y-1 ml-2">
                                <li>Jeśli nie jesteś zalogowany, najpierw się zaloguj</li>
                                <li>
                                    Jeśli "Status Onboardingu" pokazuje "Nie ukończony", powinieneś zobaczyć dialog onboardingu
                                    na stronie głównej
                                </li>
                                <li>Ukończ onboarding wybierając branże i umiejętności</li>
                                <li>Wróć tutaj i przeładuj - powinieneś zobaczyć swoje preferencje</li>
                                <li>Kanał powinien być teraz spersonalizowany na podstawie Twoich preferencji</li>
                            </ol>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
