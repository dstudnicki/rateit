import { CreatePost } from "@/components/create-post";
import PostsPage from "@/app/posts/page";



export default function FeedPage() {
    return (
        <div className="min-h-screen bg-background">
            <main className="container max-w-2xl mx-auto px-4 py-6">
                <CreatePost />
                <PostsPage />
            </main>
        </div>
    );
}
