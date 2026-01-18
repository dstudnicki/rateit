"use client";

import { useState } from "react";
import { migrateCompanyKeywords } from "@/app/actions/migrate-keywords";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DebugCompanyMatchingPage() {
    const [migrationData, setMigrationData] = useState<any>(null);
    const [migrating, setMigrating] = useState(false);

    const handleMigration = async () => {
        setMigrating(true);
        try {
            const result = await migrateCompanyKeywords();
            setMigrationData(result);
        } catch (error) {
            console.error("Migration error:", error);
        } finally {
            setMigrating(false);
        }
    };

    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-2xl font-bold mb-4">Migracja Słów Kluczowych Firm</h1>
                <p className="text-muted-foreground mb-4">
                    To przeanalizuje wszystkie opinie o firmach i wyodrębni słowa kluczowe (umiejętności, technologie, benefity)
                    aby poprawić dopasowywanie treści.
                </p>
                <Button onClick={handleMigration} disabled={migrating}>
                    {migrating ? "Migrowanie..." : "Migruj Słowa Kluczowe"}
                </Button>
            </div>

            {migrationData && (
                <Card className="p-6">
                    <h2 className="text-xl font-semibold mb-4">Wyniki Migracji</h2>
                    {migrationData.success ? (
                        <div className="space-y-2">
                            <p className="text-green-600 font-semibold">
                                ✓ Pomyślnie przetworzono {migrationData.processed}{" "}
                                {migrationData.processed === 1
                                    ? "firmę"
                                    : migrationData.processed >= 2 && migrationData.processed <= 4
                                      ? "firmy"
                                      : "firm"}
                            </p>
                            <div className="mt-4">
                                <h3 className="font-semibold mb-2">Szczegóły:</h3>
                                <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[400px] text-sm">
                                    {JSON.stringify(migrationData.results, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <p className="text-red-600">✗ Migracja nie powiodła się: {migrationData.error}</p>
                    )}
                </Card>
            )}
        </div>
    );
}
