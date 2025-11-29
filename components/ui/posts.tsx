import React from 'react'
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Post {
    _id: string;
    title: string;
    content: string;
    user: {
        _id: string | undefined;
        name: string;
    };
    createdAt: string;
}

interface PostCardProps {
    post: Post;
    actions?: React.ReactNode;
    children?: React.ReactNode;
}

export function PostCard({
    post,
    actions,
    children,
}: PostCardProps) {



    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Link href={`/${post.user.name}`}>
                        <Avatar>
                            <AvatarImage src={process.env.PUBLIC_URL + "/user.png"} alt={post.user.name} />
                            <AvatarFallback>{post.user.name.toUpperCase()}</AvatarFallback>
                        </Avatar>
                    </Link>
                    <Link href={`/${post.user.name}`}>
                        <strong>@{post.user.name}</strong>
                    </Link>
                    {actions}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <h3 className="text-xl font-semibold">{post.title}</h3>
                    <p>{post.content}</p>
                </div>
                <span className="text-sm font-bold inline-block pt-3">
                    {new Intl.DateTimeFormat("en-US", {
                        hour: "numeric",
                        minute: "numeric",
                        hour12: true,
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    }).format(new Date(post.createdAt))}
                </span>
                {children}
            </CardContent>
        </Card>
    );
}