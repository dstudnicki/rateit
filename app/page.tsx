"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import Link from "next/link";

interface Post {
    _id: string;
    title: string;
    content: string;
    user: {
        _id: string | undefined;
        username: string;
    };
    createdAt: string;
}

interface DecodedToken {
    userId: string;
    iat: number;
    exp: number;
}

interface Photo {
    _id: string;
    description: string;
    filename: string;
    user: {
        _id: string | undefined;
        username: string;
    };
    createdAt: string;
}

interface Comment {
    _id: string;
    content: string;
    user: {
        _id: string;
        username: string;
    };
    createdAt: string;
}

interface User {
    _id: string;
    username: string;
    email: string;
}

interface Data {
    user: User;
    posts: Post[];
    photos: Photo[];
}
const PostContainer = styled.article`
    max-width: 30rem;
    margin: 40px auto;
    border: 1px solid;
    border-radius: 1rem;
    border-color: #e1e0e9;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
    padding-top: 1.5rem;

    .text:last-of-type {
        font-weight: bold;
        padding-top: 0.75rem;
        display: inline-block;
        font-size: 0.85rem;
    }
`;

const PostWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding: 0 1.5rem 1.5rem;
`;

const UserContent = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
`;

const PostContent = styled.div`
    display: flex;
    flex-direction: column;
    padding-top: 1rem;
    gap: 0.5rem;
`;

const CommentsWrapper = styled.div`
    display: flex;
    flex-direction: column;
    padding-top: 1.25rem;

    .comment {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        border-bottom: 1px solid #ccc;
        padding: 1rem 0;
    }

    .comment-content {
        display: flex;
        flex-direction: column;
        gap: 0.25rem;
    }

    .comment-user {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .text-muted {
        color: #696969;
    }
`;

const AddCommentForm = styled.form`
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
`;

const Input = styled.input`
    display: flex;
    height: 2.5rem;
    width: 100%;
    border: 1px solid #e1e0e9;
    border-radius: 0.375rem;
    box-shadow: 0 0 5px 0 rgba(0, 0, 0, 0.1);
    padding: 0 0.5rem;
`;

const Button = styled.button`
    display: inline-flex;
    justify-content: center;
    align-items: center;
    padding: 0 1.25rem;
    font-size: medium;
    background-color: #1d1c24;
    color: #fff;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;

    .invert {
        filter: invert(1);
    }
`;

const ButtonIcon = styled.button`
    background-color: #ffffff;
    border: none;
    font-size: 1rem;
    cursor: pointer;
`;

export default function HomePage() {
    const [profileUser, setProfileUser] = useState<Data | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
    const [commentInputsByPost, setCommentInputsByPost] = useState<Record<string, string>>({});
    const [commentsByPhoto, setCommentsByPhoto] = useState<Record<string, Comment[]>>({});
    const [commentInputsByPhoto, setCommentInputsByPhoto] = useState<Record<string, string>>({});
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
    console.log(posts);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (token) {
                    const decoded: DecodedToken = jwtDecode(token);
                    const userId = decoded?.userId;
                    const { data: user } = await axios.get(`/user/id/${userId}`);
                    setProfileUser(user);
                }
            } catch (error) {
                console.error("Invalid token", error);
                setIsAuthenticated(false);
            }
        };
        fetchUserData();
    }, []);

    const handleAuthentication = () => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded: DecodedToken = jwtDecode(token);
                const tokenId = decoded?.userId;
                const userId = profileUser?.user?._id;
                setIsAuthenticated(tokenId === userId);
            } catch (error) {
                console.error("Invalid token", error);
                setIsAuthenticated(false);
            }
        } else {
            setIsAuthenticated(false);
        }
    };

    useEffect(() => {
        if (profileUser) {
            handleAuthentication();
        }
    }, [profileUser]);

    const addCommentPost = async (postId: string, e: React.FormEvent) => {
        e.preventDefault();

        const content = commentInputsByPost[postId]?.trim();
        if (!content) return;

        try {
            await axios.post(`/posts/${postId}/comments`, { content });

            const { data: updatedComments } = await axios.get(`/posts/${postId}/comments`);
            setCommentsByPost((prev) => ({
                ...prev,
                [postId]: updatedComments,
            }));

            setCommentInputsByPhoto((prev) => ({
                ...prev,
                [postId]: "",
            }));
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    };

    const addCommentPhoto = async (photoId: string, e: React.FormEvent) => {
        e.preventDefault();

        const content = commentInputsByPhoto[photoId]?.trim();
        if (!content) return;

        try {
            await axios.post(`/photos/${photoId}/comments`, { content });

            const { data: updatedComments } = await axios.get(`/photos/${photoId}/comments`);
            setCommentsByPhoto((prev) => ({
                ...prev,
                [photoId]: updatedComments,
            }));

            setCommentInputsByPhoto((prev) => ({
                ...prev,
                [photoId]: "",
            }));
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    };

    useEffect(() => {
        const fetchPostsPhotosAndComments = async () => {
            try {
                const response = await fetch("api/posts", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const postsData = await response.json();
                setPosts(postsData);
                const photos = await fetch("api/photos", {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                    },
                });
                const photosData = await photos.json();
                setPhotos(photosData);
                console.log("Posts:", posts);

                // const commentsPromisesPosts = posts.map((post: Post) => axios.get(`/posts/${post._id}/comments`));
                // const commentsResponsesPosts = await Promise.all(commentsPromisesPosts);

                // const commentsPromisesPhotos = photos.map((photo: Photo) => axios.get(`/photos/${photo._id}/comments`));
                // const commentsResponsesPhotos = await Promise.all(commentsPromisesPhotos);

                // const commentsDataPosts: Record<string, Comment[]> = {};
                // commentsResponsesPosts.forEach((response, index) => {
                //     commentsDataPosts[posts[index]._id] = response.data;
                // });

                // const commentsDataPhotos: Record<string, Comment[]> = {};
                // commentsResponsesPhotos.forEach((response, index) => {
                //     commentsDataPhotos[photos[index]._id] = response.data;
                // });

                // setCommentsByPost(commentsDataPosts);
                // setCommentsByPhoto(commentsDataPhotos);
            } catch (error) {
                console.error("Error fetching posts or comments:", error);
            }
        };

        fetchPostsPhotosAndComments();
    }, []);

    const deleteCommentPost = async (postId: string, commentId: string) => {
        try {
            await axios.delete(`/posts/${postId}/comments/${commentId}`);

            setCommentsByPost((prev) => {
                const updatedComments = prev[postId]?.filter((comment) => comment._id !== commentId);
                return {
                    ...prev,
                    [postId]: updatedComments || [],
                };
            });
        } catch (error) {
            console.error("Failed to delete comment:", error);
        }
    };

    const deleteCommentPhoto = async (photoId: string, commentId: string) => {
        try {
            await axios.delete(`/photos/${photoId}/comments/${commentId}`);

            setCommentsByPhoto((prev) => {
                const updatedComments = prev[photoId]?.filter((comment) => comment._id !== commentId);
                return {
                    ...prev,
                    [photoId]: updatedComments || [],
                };
            });
        } catch (error) {
            console.error("Failed to delete comment:", error);
        }
    };

    const deletePost = async (postId: string) => {
        try {
            await axios.delete(`/posts/${postId}`);

            setPosts((prev) => prev.filter((post) => post._id !== postId));
        } catch (error) {
            console.error("Failed to delete post:", error);
        }
    };

    const deletePhoto = async (photoId: string) => {
        try {
            await axios.delete(`/photos/${photoId}`);

            setPhotos((prev) => prev.filter((photo) => photo._id !== photoId));
        } catch (error) {
            console.error("Failed to delete photo:", error);
        }
    };

    console.log(posts);

    const mergedData = [...posts, ...photos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return (
        <PostContainer>
            {mergedData.map((item) =>
                "title" in item ? (
                    <PostWrapper key={item._id}>
                        <UserContent>
                            <Link href={`/${item.user.username}`}>
                                <img width="40px" height="40px" src={process.env.PUBLIC_URL + "/user.png"} alt="user" />
                            </Link>
                            <Link href={`/${item.user.username}`}>
                                <strong>@{item.user.username}</strong>
                            </Link>
                            {isAuthenticated && item.user._id === profileUser?.user._id && (
                                <ButtonIcon onClick={() => deletePost(item._id)}>
                                    <img width="16px" height="16px" src={process.env.PUBLIC_URL + "/delete.png"} alt="user" />
                                </ButtonIcon>
                            )}
                        </UserContent>
                        <PostContent>
                            <h3>{item.title}</h3>
                            <p>{item.content}</p>
                        </PostContent>
                        <span className="text">
                            {new Intl.DateTimeFormat("en-US", {
                                hour: "numeric",
                                minute: "numeric",
                                hour12: true,
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            }).format(new Date(item.createdAt))}
                        </span>
                        <CommentsWrapper>
                            <AddCommentForm onSubmit={(e) => addCommentPost(item._id, e)}>
                                <Input
                                    type="text"
                                    value={commentInputsByPost[item._id] || ""}
                                    onChange={(e) =>
                                        setCommentInputsByPost((prev) => ({
                                            ...prev,
                                            [item._id]: e.target.value,
                                        }))
                                    }
                                    placeholder="Add a comment"
                                />
                                <Button type="submit">
                                    <img
                                        className="invert"
                                        width="16px"
                                        height="16px"
                                        src={process.env.PUBLIC_URL + "/send.png"}
                                        alt="send"
                                    />
                                </Button>
                            </AddCommentForm>
                            {commentsByPost[item._id]?.map((comment) => (
                                <div className="comment" key={comment._id}>
                                    <Link href={`/${item.user.username}`}>
                                        <img width="40px" height="40px" src={process.env.PUBLIC_URL + "/03.png"} alt="user" />
                                    </Link>
                                    <div className="comment-content">
                                        <div className="comment-user">
                                            <div>
                                                <Link href={`/${item.user.username}`}>
                                                    <strong>@{comment.user.username} </strong>
                                                </Link>
                                                <span>· </span>
                                                <span className="text-muted">
                                                    {new Intl.DateTimeFormat("en-US", {
                                                        month: "short",
                                                        day: "numeric",
                                                    }).format(new Date(item.createdAt))}
                                                </span>
                                            </div>
                                            {isAuthenticated && item.user._id === profileUser?.user._id && (
                                                <ButtonIcon onClick={() => deleteCommentPost(item._id, comment._id)}>
                                                    <img
                                                        width="16px"
                                                        height="16px"
                                                        src={process.env.PUBLIC_URL + "/delete.png"}
                                                        alt="user"
                                                    />
                                                </ButtonIcon>
                                            )}
                                        </div>
                                        <p>{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </CommentsWrapper>
                    </PostWrapper>
                ) : (
                    <PostWrapper key={item._id}>
                        <UserContent>
                            <Link href={`/${item.user.username}`}>
                                <img width="40px" height="40px" src={process.env.PUBLIC_URL + "/user.png"} alt="user" />
                            </Link>
                            <Link href={`/${item.user.username}`}>
                                <strong>@{item.user.username}</strong>
                            </Link>
                            {isAuthenticated && item.user._id === profileUser?.user._id && (
                                <ButtonIcon onClick={() => deletePhoto(item._id)}>
                                    <img width="16px" height="16px" src={process.env.PUBLIC_URL + "/delete.png"} alt="user" />
                                </ButtonIcon>
                            )}
                        </UserContent>
                        <PostContent>
                            <h3>{item.description}</h3>
                            <img src={`http://localhost:5000/uploads/${item.filename}`} alt={item.description} />
                        </PostContent>
                        <span className="text">
                            {new Intl.DateTimeFormat("en-US", {
                                hour: "numeric",
                                minute: "numeric",
                                hour12: true,
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            }).format(new Date(item.createdAt))}
                        </span>

                        <CommentsWrapper>
                            <AddCommentForm onSubmit={(e) => addCommentPhoto(item._id, e)}>
                                <Input
                                    type="text"
                                    value={commentInputsByPhoto[item._id] || ""}
                                    onChange={(e) =>
                                        setCommentInputsByPhoto((prev) => ({
                                            ...prev,
                                            [item._id]: e.target.value,
                                        }))
                                    }
                                    placeholder="Add a comment"
                                />
                                <Button type="submit">
                                    <img
                                        className="invert"
                                        width="16px"
                                        height="16px"
                                        src={process.env.PUBLIC_URL + "/send.png"}
                                        alt="send"
                                    />
                                </Button>
                            </AddCommentForm>
                            {commentsByPhoto[item._id]?.map((comment) => (
                                <div className="comment" key={comment._id}>
                                    <img width="40px" height="40px" src={process.env.PUBLIC_URL + "/03.png"} alt="user" />
                                    <div className="comment-content">
                                        <div className="comment-user">
                                            <strong>@{comment.user.username} </strong>
                                            <span>· </span>
                                            <span className="text-muted">
                                                {new Intl.DateTimeFormat("en-US", {
                                                    month: "short",
                                                    day: "numeric",
                                                }).format(new Date(item.createdAt))}
                                            </span>
                                            {isAuthenticated && item.user._id === profileUser?.user._id && (
                                                <ButtonIcon onClick={() => deleteCommentPhoto(item._id, comment._id)}>
                                                    <img
                                                        width="16px"
                                                        height="16px"
                                                        src={process.env.PUBLIC_URL + "/delete.png"}
                                                        alt="user"
                                                    />
                                                </ButtonIcon>
                                            )}
                                        </div>
                                        <p>{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                        </CommentsWrapper>
                    </PostWrapper>
                ),
            )}
        </PostContainer>
    );
}
