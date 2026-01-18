"use client";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

interface AuthButtonsProps {
    setMobileMenuOpen?: () => void;
}

export default function AuthButtons({ setMobileMenuOpen }: AuthButtonsProps) {
    const { data: sessionData } = authClient.useSession();
    const [userImage, setUserImage] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("ME");

    useEffect(() => {
        async function fetchUserProfile() {
            if (sessionData?.user) {
                setUserName(sessionData.user.name || "ME");
                try {
                    const profileResponse = await fetch("/api/profile/current");
                    const profileData = await profileResponse.json();
                    if (profileData?.profile?.image) {
                        setUserImage(profileData.profile.image);
                    } else if (sessionData.user.image) {
                        setUserImage(sessionData.user.image);
                    }
                } catch (error) {
                    console.error("Error fetching profile:", error);
                }
            }
        }
        fetchUserProfile();
    }, [sessionData?.user]);

    const handleLogout = async () => {
        await authClient.signOut();
        setMobileMenuOpen?.();
    };
    return (
        <ul className="list-none flex justify-between gap-2">
            {sessionData ? (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2 h-14 pl-2 border-l ml-2">
                            <Avatar className="h-9 w-9">
                                <AvatarImage
                                    className="object-cover object-center"
                                    src={
                                        userImage ||
                                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionData?.user?.email || userName}`
                                    }
                                />
                                <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <span className="text-xs font-medium hidden lg:inline">Ja</span>
                            <ChevronDown className="h-4 w-4 hidden lg:inline" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Moje Konto</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <Link href="/profile">
                            <DropdownMenuItem>
                                <User className="mr-2 h-4 w-4" />
                                Zobacz Profil
                            </DropdownMenuItem>
                        </Link>

                        <Link href="/profile/settings">
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Ustawienia i Prywatność</span>
                            </DropdownMenuItem>
                        </Link>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                            <LogOut className="mr-2 h-4 w-4" />
                            <Button
                                className="p-0 text-destructive focus:text-destructive"
                                variant={"link"}
                                onClick={handleLogout}
                            >
                                Wyloguj się
                            </Button>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ) : (
                <div className="flex gap-2">
                    <Button asChild onClick={() => setMobileMenuOpen?.()} className="flex-1">
                        <Link href="/login">Zaloguj</Link>
                    </Button>
                    <Button variant="outline" asChild onClick={() => setMobileMenuOpen?.()} className="flex-1">
                        <Link href="/register">Zarejestruj</Link>
                    </Button>
                </div>
            )}
        </ul>
    );
}
