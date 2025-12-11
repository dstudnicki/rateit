export async function getComments(postId: string) {
    const data = await fetch(`http://localhost:3000/api/posts/${postId}/comments`, {
        next: {
            tags: [`comments-${postId}`]
        }
    });
    return data.json()
}