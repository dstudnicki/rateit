"use client";
import { Home, Users, Briefcase, MessageSquare, Bell, Search, Menu, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import AuthButtons from "@/components/Navbar/AuthButtons";
import { MobileMenu } from "@/components/Navbar/MobileMenu";
import Link from "next/link";
export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <header className="sticky top-0 z-50 border-b bg-card">
            <div className="container max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-14">
                    {/* Logo and Search */}
                    <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                            <Link href="/" className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-lg">R</span>
                            </Link>
                        </div>

                        <div className="hidden md:block max-w-xs flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search" className="pl-9 bg-secondary border-none h-9" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="sm:hidden"
                            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        >
                            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                        </Button>

                        {/* Navigation */}
                        <nav className="hidden sm:flex items-center gap-1 lg:gap-6">
                            <Button variant="ghost" size="sm" className="flex-col h-14 gap-0.5 hidden md:flex" asChild>
                                <Link href="/" className="text-xs font-medium">
                                    <Home className="h-5 w-5" /> Home
                                </Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-col h-14 gap-0.5 hidden md:flex" asChild>
                                <Link href="/companies" className="text-xs font-medium">
                                    <Briefcase className="h-5 w-5" /> Companies
                                </Link>
                            </Button>
                            <AuthButtons />
                        </nav>
                    </div>
                </div>

                <MobileMenu mobileMenuOpen={mobileMenuOpen} setMobileMenuOpen={() => setMobileMenuOpen(!mobileMenuOpen)} />
            </div>
        </header>
    );
}
