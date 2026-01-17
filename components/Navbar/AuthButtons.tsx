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
import { User, Settings, HelpCircle, LogOut, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";

export default function AuthButtons() {
    const { data: sessionData } = authClient.useSession();
    const [userImage, setUserImage] = useState<string | null>(null);
    const [userName, setUserName] = useState<string>("ME");

    useEffect(() => {
        async function fetchUserProfile() {
            if (sessionData?.user) {
                setUserName(sessionData.user.name || "ME");
                try {
                    const profileResponse = await fetch('/api/profile/current');
                    const profileData = await profileResponse.json();
                    if (profileData?.profile?.image) {
                        setUserImage(profileData.profile.image);
                    } else if (sessionData.user.image) {
                        setUserImage(sessionData.user.image);
                    }
                } catch (error) {
                    console.error('Error fetching profile:', error);
                }
            }
        }
        fetchUserProfile();
    }, [sessionData?.user]);

    const handleLogout = async () => {
        await authClient.signOut();
    };
    return (
        <ul className="list-none flex items-center gap-2">
            {sessionData ? (
                <>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex items-center gap-2 h-14 pl-2 border-l ml-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src={userImage || `https://api.dicebear.com/7.x/avataaars/svg?seed=${sessionData?.user?.email || userName}`} />
                                    <AvatarFallback>{userName.substring(0, 2).toUpperCase()}</AvatarFallback>
                                </Avatar>
                                <span className="text-xs font-medium hidden lg:inline">Me</span>
                                <ChevronDown className="h-4 w-4 hidden lg:inline" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <Link href="/profile">
                                <DropdownMenuItem>
                                    <User className="mr-2 h-4 w-4" />
                                    View Profile
                                </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings & Privacy</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                <HelpCircle className="mr-2 h-4 w-4" />
                                <span>Help Center</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <LogOut className="mr-2 h-4 w-4" />
                                <Button
                                    className="p-0 text-destructive focus:text-destructive"
                                    variant={"link"}
                                    onClick={handleLogout}
                                >
                                    Log out
                                </Button>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </>
            ) : (
                <>
                    <li className="text-center">
                        <Button asChild>
                            <Link href="/login">Login</Link>
                        </Button>
                    </li>
                    <li className="text-center">
                        <Button variant="outline" asChild>
                            <Link href="/register">Register</Link>
                        </Button>
                    </li>
                </>
            )}
        </ul>
    );
}
