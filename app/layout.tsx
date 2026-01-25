import type React from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/Navbar/Navbar";
import BanCheckWrapper from "@/components/BanCheckWrapper";
import { Toaster } from "sonner";
import { Suspense } from "react";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
    title: "RateIT",
    description: "Dziel się swoimi przemyśleniami i łącz z profesjonalistami",
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="pl">
            <body className={"font-sans antialiased"}>
                <Toaster position="top-center" richColors />
                <Suspense fallback={null}>
                    <BanCheckWrapper>
                        <Navbar />
                        {children}
                    </BanCheckWrapper>
                    <Analytics />
                    <SpeedInsights />
                </Suspense>
            </body>
        </html>
    );
}
