import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"
import { Navbar } from "@/components/Navbar/Navbar";
import BanCheckWrapper from "@/components/BanCheckWrapper";
import { Toaster } from "sonner";

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
    title: "RateIT",
    description: "Share your thoughts and connect with professionals",
}

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode
}>) {
    return (
        <html lang="en">
        <body className={`font-sans antialiased`}>
        <Toaster position="top-center" richColors />
        <BanCheckWrapper>
            <Navbar />
            {children}
        </BanCheckWrapper>
        </body>
        </html>
    )
}
