// move this component to /actions folder

'use client'
import React from 'react'
import { Button } from "@/components/ui/button";

interface PostActionsProps {
    postId: string;
    isOwner: boolean;
    onDelete: (postId: string) => void;
}

export function PostActions({ postId, isOwner, onDelete }: PostActionsProps) {
    if (!isOwner) return null;

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(postId)}
            className="ml-auto"
        >
            <img width="16px" height="16px" src={process.env.PUBLIC_URL + "/delete.png"} alt="delete" />
        </Button>
    );
}
