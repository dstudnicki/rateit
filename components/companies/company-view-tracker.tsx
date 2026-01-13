"use client";

import { useEffect } from "react";
import { trackInteraction } from "@/app/actions/preferences";

interface CompanyViewTrackerProps {
    companyId: string;
}

export function CompanyViewTracker({ companyId }: CompanyViewTrackerProps) {
    useEffect(() => {
        if (companyId) {
            trackInteraction(companyId, "company", "view").catch(console.error);
        }
    }, [companyId]);

    // This component doesn't render anything
    return null;
}

