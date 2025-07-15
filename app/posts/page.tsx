// POSTS PAGE
"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import Link from "next/link";
import { jwtDecode } from "jwt-decode";
import axios from "axios";

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
}
const PostContainer = styled.article`
  max-width: 30rem;
  margin: 40px auto;
  border: 1px solid;
  border-radius: 1rem;
  border-color: #E1E0E9;
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
  border: 1px solid #E1E0E9;
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
  background-color: #1D1C24;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;

    .invert {
        filter: invert(1);
    }
`;

const ButtonIcon = styled.button`
   background-color: #FFFFFF;
  border: none;
  font-size: 1rem;
  cursor: pointer;

`;

const PostList = () => {
    const [profileUser, setProfileUser] = useState<Data | null>(null);
    const [posts, setPosts] = useState<Post[]>([]);
    const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (token) {
                    const decoded: any = jwtDecode(token);
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
                const decoded: any = jwtDecode(token); // Decode the token
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

    const addComment = async (postId: string, e: React.FormEvent) => {
        e.preventDefault();

        const content = commentInputs[postId]?.trim();
        if (!content) return;

        try {
            await axios.post(`/posts/${postId}/comments`, { content });

            const { data: updatedComments } = await axios.get(`/posts/${postId}/comments`);
            setCommentsByPost((prev) => ({
                ...prev,
                [postId]: updatedComments,
            }));

            setCommentInputs((prev) => ({
                ...prev,
                [postId]: "",
            }));
        } catch (error) {
            console.error("Failed to add comment:", error);
        }
    };

    useEffect(() => {
        const fetchPostsAndComments = async () => {
            try {
                const { data: posts } = await axios.get("/posts");
                const sortedPosts = posts.sort((a: Post, b: Post) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                setPosts(sortedPosts);

                const commentsPromises = posts.map((post: Post) => axios.get(`/posts/${post._id}/comments`));
                const commentsResponses = await Promise.all(commentsPromises);

                const commentsData: Record<string, Comment[]> = {};
                commentsResponses.forEach((response, index) => {
                    commentsData[posts[index]._id] = response.data;
                });

                setCommentsByPost(commentsData);
            } catch (error) {
                console.error("Error fetching posts or comments:", error);
            }
        };

        fetchPostsAndComments();
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

    const deletePost = async (postId: string) => {
        try {
            await axios.delete(`/posts/${postId}`);

            setPosts((prev) => prev.filter((post) => post._id !== postId));
        } catch (error) {
            console.error("Failed to delete post:", error);
        }
    };

    return (
        <PostContainer>
            {posts.map((post) => (
                <PostWrapper key={post._id}>
                    <UserContent>
                        <Link href={`/${post.user.username}`}>
                            <img width="40px" height="40px" src={process.env.PUBLIC_URL + "/user.png"} alt="user" />
                        </Link>
                        <Link href={`/${post.user.username}`}>
                            <strong>@{post.user.username}</strong>
                        </Link>
                        {isAuthenticated && post.user._id === profileUser?.user._id && (
                            <ButtonIcon onClick={() => deletePost(post._id)}>
                                <img width="16px" height="16px" src={process.env.PUBLIC_URL + "/delete.png"} alt="user" />
                            </ButtonIcon>
                        )}{" "}
                    </UserContent>
                    <PostContent>
                        <h3>{post.title}</h3>
                        <p>{post.content}</p>
                    </PostContent>
                    <span className="text">
                        {new Intl.DateTimeFormat("en-US", {
                            hour: "numeric",
                            minute: "numeric",
                            hour12: true,
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                        }).format(new Date(post.createdAt))}
                    </span>

                    <CommentsWrapper>
                        <AddCommentForm onSubmit={(e) => addComment(post._id, e)}>
                            <Input
                                type="text"
                                value={commentInputs[post._id] || ""}
                                onChange={(e) =>
                                    setCommentInputs((prev) => ({
                                        ...prev,
                                        [post._id]: e.target.value,
                                    }))
                                }
                                placeholder="Add a comment"
                            />
                            <Button type="submit">
                                <img className="invert" width="16px" height="16px" src={process.env.PUBLIC_URL + "/send.png"} alt="send" />
                            </Button>
                        </AddCommentForm>
                        {commentsByPost[post._id]?.map((comment) => (
                            <div className="comment" key={comment._id}>
                                <Link href={`/${post.user.username}`}>
                                    <img width="40px" height="40px" src={process.env.PUBLIC_URL + "/03.png"} alt="user" />
                                </Link>
                                <div className="comment-content">
                                    <div className="comment-user">
                                        <Link href={`/${post.user.username}`}>
                                            <strong>@{comment.user.username} </strong>
                                        </Link>
                                        <span>· </span>
                                        <span className="text-muted">
                                            {new Intl.DateTimeFormat("en-US", {
                                                month: "short",
                                                day: "numeric",
                                            }).format(new Date(post.createdAt))}
                                        </span>
                                        {isAuthenticated && comment.user._id === profileUser?.user._id && (
                                            <ButtonIcon onClick={() => deleteCommentPost(post._id, comment._id)}>
                                                <img width="16px" height="16px" src={process.env.PUBLIC_URL + "/delete.png"} alt="user" />
                                            </ButtonIcon>
                                        )}
                                    </div>
                                    <p>{comment.content}</p>
                                </div>
                            </div>
                        ))}
                    </CommentsWrapper>
                </PostWrapper>
            ))}
        </PostContainer>
    );
};

export default PostList;
