import { Button } from "@/components/ui/button";
import { Bell, Briefcase, HelpCircle, Home, LogOut, MessageSquare, Settings, User, Users, X } from "lucide-react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";

interface MobileMenuProps {
    mobileMenuOpen: boolean;
    setMobileMenuOpen: (mobileMenuOpen: boolean) => void;
}

export function MobileMenu({ mobileMenuOpen, setMobileMenuOpen }: MobileMenuProps) {
    const { data: sessionData } = authClient.useSession();
    const handleLogout = async () => {
        await authClient.signOut();
    };

    return (
        <>
            {mobileMenuOpen && (
                <div className="sm:hidden border-t py-4">
                    <nav className="flex flex-col gap-1">
                        <Button variant="ghost" className="justify-start gap-3 h-12 px-3" onClick={() => setMobileMenuOpen(false)}>
                            <Link href="/" className="font-medium flex items-center flex-row lg:flex-col gap-3">
                                <Home className="h-5 w-5" /> Home
                            </Link>
                        </Button>
                        {/*<Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>*/}
                        {/*    <Users className="h-5 w-5" />*/}
                        {/*    <span className="font-medium">Network</span>*/}
                        {/*</Button>*/}
                        <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                            <Briefcase className="h-5 w-5" />
                            <span className="font-medium">Jobs</span>
                        </Button>
                        {/*<Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>*/}
                        {/*    <MessageSquare className="h-5 w-5" />*/}
                        {/*    <span className="font-medium">Messages</span>*/}
                        {/*</Button>*/}
                        {/*<Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>*/}
                        {/*    <Bell className="h-5 w-5" />*/}
                        {/*    <span className="font-medium">Notifications</span>*/}
                        {/*</Button>*/}

                        <div className="h-px bg-border my-2" />

                        <Button variant="ghost" className="justify-start gap-3 h-12 px-3" onClick={() => setMobileMenuOpen(false)}>
                            <Link className="font-medium flex items-center flex-row lg:flex-col gap-3" href="/profile">
                                <User className="h-5 w-5" /> View Profile
                            </Link>
                        </Button>
                        <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                            <Settings className="h-5 w-5" />
                            <span className="font-medium">Settings & Privacy</span>
                        </Button>
                        <Button variant="ghost" className="justify-start gap-3 h-12" onClick={() => setMobileMenuOpen(false)}>
                            <HelpCircle className="h-5 w-5" />
                            <span className="font-medium">Help Center</span>
                        </Button>

                        <div className="h-px bg-border my-2" />

                        <Button
                            variant="ghost"
                            className="justify-start gap-3 h-12"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <Button className="p-0 text-destructive focus:text-destructive" variant="link" onClick={handleLogout}>
                                Log out
                            </Button>
                        </Button>
                    </nav>
                </div>
            )}
        </>
    );
}
