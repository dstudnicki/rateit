export async function getComments(postId: string) {
    const data = await fetch(`/api/posts/${postId}/comments`, {
        next: {
            tags: [`comments-${postId}`],
        },
    });
    return data.json();
}
