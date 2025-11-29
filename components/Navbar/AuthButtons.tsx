'use client'
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function AuthButtons() {
    const {data: sessionData} = authClient.useSession()
    const handleLogout = async () => {
        await authClient.signOut()
    };
    return (
        <ul className="list-none flex items-center gap-2">
            {sessionData ? (
                <>
                    <li className="text-center">
                        <Link href={sessionData?.user.name || "#"} className="hover:underline">
                            Profile
                        </Link>
                    </li>
                    <li className="text-center">
                        <Button onClick={handleLogout}>Log out</Button>
                    </li>
                </>
            ) : (
                <>
                    <li className="text-center">
                        <Link href="/login">
                            <Button>Login</Button>
                        </Link>
                    </li>
                    <li className="text-center">
                        <Link href="/register">
                            <Button variant="outline">Register</Button>
                        </Link>
                    </li>
                </>
            )}
        </ul>
    );
}