import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Briefcase, Home, Settings, User, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AuthButtons from "@/components/Navbar/AuthButtons";

interface MobileMenuProps {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (mobileMenuOpen: boolean) => void;
}

export function MobileMenu({ mobileMenuOpen, setMobileMenuOpen }: MobileMenuProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
            setSearchQuery("");
            setMobileMenuOpen(false);
        }
    };

    return (
        <>
            {mobileMenuOpen && (
                <div className="md:hidden border-t py-4">
                    {/* Search Section */}
                    <div className="px-3 mb-4">
                        <form onSubmit={handleSearch}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Wyszukaj osoby, firmy, posty..."
                                    className="pl-9 bg-secondary border-none h-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                        </form>
                    </div>
                    <div className="h-px bg-border mb-2" />

                    <nav className="flex flex-col gap-1">
                        <Button
                            variant="ghost"
                            className="justify-start gap-3 h-12 px-3"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Link href="/" className="font-medium flex items-center flex-row lg:flex-col gap-3">
                                <Home className="h-5 w-5" /> Strona główna
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            className="justify-start gap-3 h-12 px-3"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Link href="/search" className="font-medium flex items-center flex-row lg:flex-col gap-3">
                                <Search className="h-5 w-5" /> Szukaj
                            </Link>
                        </Button>
                        <Button
                            variant="ghost"
                            className="justify-start gap-3 h-12 px-3"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Link href="/companies" className="font-medium flex items-center flex-row lg:flex-col gap-3">
                                <Briefcase className="h-5 w-5" />
                                <span className="font-medium">Firmy</span>
                            </Link>
                        </Button>
                        <div className="h-px bg-border my-2" />

                        <Button
                            variant="ghost"
                            className="justify-start gap-3 h-12 px-3"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <Link className="font-medium flex items-center flex-row lg:flex-col gap-3" href="/profile">
                                <User className="h-5 w-5" /> Zobacz profil
                            </Link>
                        </Button>
                        <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                            <Link className="font-medium flex items-center flex-row lg:flex-col gap-3" href="/profile/settings">
                                <Settings className="h-5 w-5" />
                                <span className="font-medium">Ustawienia i prywatność</span>
                            </Link>
                        </Button>
                        <div className="h-px bg-border my-2" />
                        <AuthButtons setMobileMenuOpen={() => setMobileMenuOpen(false)} />
                    </nav>
                </div>
            )}
        </>
    );
}
