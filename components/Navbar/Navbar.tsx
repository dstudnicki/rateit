"use client";
import { Home, Briefcase, Search, Menu, X, Building2, FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useEffect, useRef, useState } from "react";
import AuthButtons from "@/components/Navbar/AuthButtons";
import { MobileMenu } from "@/components/Navbar/MobileMenu";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/lib/hooks/use-debounce";

interface SearchSuggestion {
    id: string;
    text: string;
    type: "user" | "company" | "post";
    category: string;
    slug?: string;
    avatar?: string | null;
    headline?: string | null;
}

interface SearchResults {
    profiles: Array<{
        _id: string;
        slug: string;
        fullName: string;
        headline: string;
        image: string;
        user: { name: string; email: string; image: string | null };
    }>;
    companies: Array<{
        _id: string;
        slug: string;
        name: string;
        industry: string;
    }>;
    posts: Array<{
        _id: string;
        content: string;
        author: { name: string; slug: string; image: string | null };
    }>;
}

export function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Debounce search query for API calls
    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    // Fetch suggestions from API
    useEffect(() => {
        if (!debouncedSearchQuery.trim()) {
            setSuggestions([]);
            return;
        }

        const fetchSuggestions = async () => {
            setLoadingSuggestions(true);
            try {
                const response = await fetch(`/api/search?q=${encodeURIComponent(debouncedSearchQuery)}&limit=5`);

                if (!response.ok) {
                    throw new Error("Failed to fetch suggestions");
                }

                const data: SearchResults = await response.json();

                // Convert API results to suggestion format
                const profileSuggestions: SearchSuggestion[] = data.profiles.map((p) => ({
                    id: p._id,
                    text: p.fullName || p.user.name,
                    type: "user" as const,
                    category: "People",
                    slug: p.slug,
                    avatar: p.user.image || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.user.email || p.user.name}`,
                    headline: p.headline,
                }));

                const companySuggestions: SearchSuggestion[] = data.companies.map((c) => ({
                    id: c._id,
                    text: c.name,
                    type: "company" as const,
                    category: "Company",
                    slug: c.slug,
                }));

                const postSuggestions: SearchSuggestion[] = data.posts.map((p) => ({
                    id: p._id,
                    text: p.content.substring(0, 60) + (p.content.length > 60 ? "..." : ""),
                    type: "post" as const,
                    category: "Posts",
                }));

                setSuggestions([...profileSuggestions, ...companySuggestions, ...postSuggestions]);
            } catch (error) {
                console.error("Error fetching suggestions:", error);
                setSuggestions([]);
            } finally {
                setLoadingSuggestions(false);
            }
        };

        fetchSuggestions();
    }, [debouncedSearchQuery]);

    const filteredSuggestions = suggestions;

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = (query: string) => {
        if (query.trim()) {
            router.push(`/search?q=${encodeURIComponent(query)}`);
            setShowSuggestions(false);
            setSearchQuery("");
        }
    };

    const handleSuggestionClick = (suggestion: SearchSuggestion) => {
        setShowSuggestions(false);
        setSearchQuery("");

        // Navigate based on suggestion type
        if (suggestion.type === "user" && suggestion.slug) {
            router.push(`/${suggestion.slug}`);
        } else if (suggestion.type === "company" && suggestion.slug) {
            router.push(`/companies/${suggestion.slug}`);
        } else {
            // For posts or items without slug, go to search page
            router.push(`/search?q=${encodeURIComponent(suggestion.text)}&type=${suggestion.type}`);
        }
    };

    return (
        <header className="sticky top-0 z-50 border-b bg-card">
            <div className="container max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-between h-14">
                    {/* Logo and Search */}
                    <div className="flex items-center gap-4 flex-1">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
                                <span className="text-primary-foreground font-bold text-lg">R</span>
                            </div>
                        </Link>

                        <div className="hidden md:block max-w-xs flex-1 relative" ref={searchRef}>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Wyszukaj"
                                    className="pl-9 bg-secondary border-none h-9"
                                    value={searchQuery}
                                    onChange={(e) => {
                                        setSearchQuery(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            handleSearch(searchQuery);
                                        }
                                    }}
                                />
                            </div>

                            {/* Search Suggestions Dropdown */}
                            {showSuggestions && (
                                <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-lg shadow-lg overflow-hidden max-h-[400px] overflow-y-auto">
                                    {loadingSuggestions ? (
                                        <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                                            Wyszukiwanie...
                                        </div>
                                    ) : filteredSuggestions.length > 0 ? (
                                        <>
                                            {filteredSuggestions.map((suggestion) => (
                                                <button
                                                    key={suggestion.id}
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-secondary transition-colors text-left"
                                                >
                                                    <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                                        {suggestion.type === "user" && (
                                                            <Avatar className="h-8 w-8 flex-shrink-0">
                                                                <AvatarImage src={suggestion.avatar || "/placeholder.svg"} />
                                                                <AvatarFallback>{suggestion.text[0]}</AvatarFallback>
                                                            </Avatar>
                                                        )}
                                                        {suggestion.type === "company" && (
                                                            <div className="h-8 w-8 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                                                                <Building2 className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                        {suggestion.type === "post" && (
                                                            <div className="h-8 w-8 bg-secondary rounded flex items-center justify-center flex-shrink-0">
                                                                <FileText className="h-4 w-4" />
                                                            </div>
                                                        )}
                                                        <div className="flex-1 min-w-0">
                                                            <div className="font-medium truncate">{suggestion.text}</div>
                                                            <div className="text-xs text-muted-foreground">
                                                                {suggestion.category}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </button>
                                            ))}
                                            <Link
                                                href={`/search?q=${encodeURIComponent(searchQuery)}`}
                                                className="block w-full text-center py-3 text-sm text-primary hover:bg-secondary font-medium border-t"
                                                onClick={() => {
                                                    setShowSuggestions(false);
                                                    setSearchQuery("");
                                                }}
                                            >
                                                Zobacz wszystkie wyniki
                                            </Link>
                                        </>
                                    ) : searchQuery ? (
                                        <div className="px-4 py-8 text-center text-muted-foreground">Brak wyników</div>
                                    ) : (
                                        <div className="px-4 py-8 text-center text-muted-foreground text-sm">
                                            Spróbuj wyszukać osoby, firmy lub posty
                                        </div>
                                    )}
                                </div>
                            )}
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
                                    <Home className="h-5 w-5" /> Strona główna
                                </Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-col h-14 gap-0.5 hidden md:flex" asChild>
                                <Link href="/search" className="text-xs font-medium">
                                    <Search className="h-5 w-5" /> Szukaj
                                </Link>
                            </Button>
                            <Button variant="ghost" size="sm" className="flex-col h-14 gap-0.5 hidden md:flex" asChild>
                                <Link href="/companies" className="text-xs font-medium">
                                    <Briefcase className="h-5 w-5" /> Firmy
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
