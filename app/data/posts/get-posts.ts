import "server-only"
import { requireUser } from "@/app/data/user/require-user";

export async function getPosts() {
    const data = await fetch("http://localhost:3000/api/posts", {
        next: {
            tags: ['posts']
        }
    });
    return data.json()
}