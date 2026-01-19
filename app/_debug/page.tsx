import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function DebugIndexPage() {
    return (
        <div className="container max-w-4xl mx-auto py-8 space-y-6">
            <div>
                <h1 className="text-3xl font-bold mb-2">Narzędzia Debugowania</h1>
                <p className="text-muted-foreground">Narzędzia do demonstracji algorytmu dopasowywania treści</p>
            </div>

            <div className="grid gap-4">
                {/* Scoring Debug */}
                <Card className="p-6">
                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <h2 className="text-xl font-bold mb-2">Wyniki Dopasowania Treści</h2>
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
                            <h2 className="text-xl font-bold mb-2">Historia Interakcji</h2>
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
            </div>
        </div>
    );
}
