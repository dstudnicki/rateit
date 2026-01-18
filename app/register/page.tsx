"use client";

import * as React from "react";
import RegisterForm from "@/components/forms/register/client";
import { Suspense } from "react";

export default function RegisterPage() {
    return (
        <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-card rounded-lg shadow-lg border border-border overflow-hidden">
                    <div className="p-6">
                        <Suspense fallback={<p>Ładowanie...</p>}>
                            <RegisterForm />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}
