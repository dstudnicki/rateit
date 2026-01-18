import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DebugIndexPage() {
    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">🔧 Narzędzia Debugowania</h1>
                <p className="text-muted-foreground">Narzędzia do demonstracji algorytmu dopasowywania treści</p>
            </div>

            <div className="grid gap-4">
                {/* Scoring Debug */}
                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">🎯 Wyniki Dopasowania Treści</h2>
                            <p className="text-muted-foreground mb-4">
                                Zobacz wyniki w czasie rzeczywistym dla postów i firm. Pokazuje dokładnie ile punktów otrzymuje
                                każda treść i dlaczego (rozbicie dopasowań z Twoim profilem).
                            </p>
                            <ul className="text-sm space-y-1 mb-4">
                                <li>✓ Zobacz wynik dopasowania dla każdego posta/firmy</li>
                                <li>✓ Szczegółowe rozbicie punktów</li>
                                <li>✓ Wizualizacja wykrytych słów kluczowych</li>
                                <li>✓ Aktualizuje się w czasie rzeczywistym podczas interakcji</li>
                            </ul>
                        </div>
                    </div>
                    <Link href="/debug/scoring">
                        <Button>Otwórz Debugowanie Wyników →</Button>
                    </Link>
                </Card>

                {/* Interaction History */}
                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">📊 Historia Interakcji</h2>
                            <p className="text-muted-foreground mb-4">
                                Zobacz wszystkie swoje interakcje (polubienia, komentarze, wyświetlenia), które algorytm
                                wykorzystuje do nauki Twoich preferencji i personalizacji kanału.
                            </p>
                            <ul className="text-sm space-y-1 mb-4">
                                <li>✓ Liczba polubień, komentarzy, wyświetleń</li>
                                <li>✓ Oś czasu ostatnich interakcji</li>
                                <li>✓ Pokazuje jakie dane są używane do dopasowania</li>
                                <li>✓ Aktualizuje się natychmiast po każdej akcji</li>
                            </ul>
                        </div>
                    </div>
                    <Link href="/debug/interactions">
                        <Button variant="secondary">Zobacz Interakcje →</Button>
                    </Link>
                </Card>

                {/* Keywords Migration */}
                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">🔑 Migracja Słów Kluczowych</h2>
                            <p className="text-muted-foreground mb-4">
                                Wyodrębnij i zaktualizuj słowa kluczowe dla wszystkich firm na podstawie ich opinii. To pomaga
                                algorytmowi dopasowania zrozumieć, czym zajmuje się każda firma.
                            </p>
                            <ul className="text-sm space-y-1 mb-4">
                                <li>✓ Analizuje wszystkie opinie o firmach</li>
                                <li>✓ Wyodrębnia umiejętności, technologie, benefity</li>
                                <li>✓ Aktualizuje pole detectedKeywords</li>
                                <li>✓ Jednorazowa konfiguracja lub odświeżenie</li>
                            </ul>
                        </div>
                    </div>
                    <Link href="/debug-companies">
                        <Button variant="outline">Uruchom Migrację →</Button>
                    </Link>
                </Card>
            </div>

            {/* How to Use */}
            <Card className="p-6 bg-muted/50">
                <h3 className="font-semibold mb-3">📖 Jak zademonstrować dla Instruktora</h3>
                <ol className="text-sm space-y-2">
                    <li>
                        <strong>1. Pokaż Stan Początkowy:</strong> Otwórz /debug/scoring aby zobaczyć bazowe wyniki
                    </li>
                    <li>
                        <strong>2. Dodaj Dane Profilu:</strong> Przejdź do /profile i dodaj doświadczenie (np. "Heineken
                        Group"), umiejętności (np. "TypeScript", "React")
                    </li>
                    <li>
                        <strong>3. Zobacz Zmianę Wyniku:</strong> Odśwież /debug/scoring - Heineken Group powinien mieć 100+
                        punktów!
                    </li>
                    <li>
                        <strong>4. Twórz Interakcje:</strong> Polub 3-5 postów o React, zobacz kilka firm technologicznych
                    </li>
                    <li>
                        <strong>5. Watch Learning:</strong> Check /debug/interactions to see tracked interactions, then
                        /debug/scoring to see React posts boosted (+15-30 points)
                    </li>
                    <li>
                        <strong>6. Explain Algorithm:</strong> Show the breakdown - explain how "learned from activity" gets
                        highest priority
                    </li>
                </ol>
            </Card>

            {/* Key Points */}
            <Card className="p-6 bg-blue-50 border-blue-200">
                <h3 className="font-semibold mb-3 text-blue-900">✨ Key Points to Emphasize</h3>
                <ul className="text-sm text-blue-800 space-y-2">
                    <li>
                        • <strong>Real Algorithm:</strong> This is not fake scoring - it's a real ML algorithm that analyzes
                        content and user behavior
                    </li>
                    <li>
                        • <strong>Transparent:</strong> You can see exactly how decisions are made (no black box)
                    </li>
                    <li>
                        • <strong>Adaptive:</strong> Learns from user behavior over time (last 30 days)
                    </li>
                    <li>
                        • <strong>Production-Ready:</strong> Same algorithms used by LinkedIn, Instagram, TikTok
                    </li>
                </ul>
            </Card>
        </div>
    );
}
