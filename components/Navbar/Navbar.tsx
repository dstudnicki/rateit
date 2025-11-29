import Link from "next/link";
import AuthButtons from "@/components/Navbar/AuthButtons";

export default function Navbar() {
    return (
        <nav className="text-lg px-10 py-10">
            <ul className="list-none flex justify-evenly items-center p-0">
                <ul className="list-none flex items-center gap-10">
                    <li className="text-center">
                        <Link href="/" className="hover:underline">
                            Home
                        </Link>
                    </li>
                    <li className="text-center">
                        <Link href="/posts" className="hover:underline">
                            Posts
                        </Link>
                    </li>
                    <li className="text-center">
                        <Link href="/photos" className="hover:underline">
                            Photos
                        </Link>
                    </li>
                    <li className="text-center">
                        <Link href="/posts/add" className="hover:underline">
                            Add Post
                        </Link>
                    </li>
                    <li className="text-center">
                        <Link href="/photos/upload" className="hover:underline">
                            Upload Photo
                        </Link>
                    </li>
                </ul>
                    <AuthButtons />
            </ul>
        </nav>
    );
}
