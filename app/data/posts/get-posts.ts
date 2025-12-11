import "server-only"

export async function getPosts() {
    // Use time-based bucket for cache - auto-expires every 5 minutes
    const cacheBucket = Math.floor(Date.now() / (5 * 60 * 1000)); // 5-minute buckets

    const data = await fetch("http://localhost:3000/api/posts", {
        next: {
            tags: [`posts-feed-${cacheBucket}`]
        }
    });
    return data.json()
}