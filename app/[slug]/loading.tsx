import { Card, CardContent } from "@/components/ui/card";

export default function Loading() {
    return (
        <div className="min-h-screen bg-background">
            <main className="container max-w-5xl mx-auto px-4 py-6">
                <Card>
                    <CardContent className="py-12">
                        <p className="text-center text-muted-foreground">Ładowanie profilu...</p>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}
