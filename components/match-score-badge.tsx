"use client";

import { Badge } from "@/components/ui/badge";

interface MatchScoreBadgeProps {
    score: number;
    matchReasons?: { reason: string; points: number }[];
    showDetails?: boolean;
}

export function MatchScoreBadge({ score, matchReasons = [], showDetails = false }: MatchScoreBadgeProps) {
    if (!showDetails) {
        return null; // Hide in production
    }

    return (
        <div className="inline-flex items-center gap-2">
            <Badge
                variant="secondary"
                className="font-mono text-xs"
                title="Content match score"
            >
                🎯 {score}
            </Badge>
            {matchReasons.length > 0 && (
                <span className="text-xs text-muted-foreground">
                    ({matchReasons.length} match{matchReasons.length !== 1 ? 'es' : ''})
                </span>
            )}
        </div>
    );
}

