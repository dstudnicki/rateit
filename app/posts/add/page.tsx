// ADD POST PAGE
"use client";
import React, { useState } from "react";
import styled from "styled-components";
import { redirect } from "next/navigation";
import axios from "axios";

const PostContainer = styled.div`
  max-width: 27rem;
  margin: 100px auto;
  padding: 1.5rem;
  border: 1px solid;
  border-radius: 1rem;
  border-color: #E1E0E9;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
`;

const PostSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1.5rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const InputContainer = styled.div`
  display: grid;
  gap: 0.35rem;
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
`;

const Input = styled.input`
  display: flex;
  height: 2.5rem;
  border: 1px solid #E1E0E9;
  border-radius: 0.375rem;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
  padding: 0 0.5rem;
`;

const Button = styled.button`
  display: inline-flex;
  justify-content: center;
  align-items: center;
  padding: 0.75rem 1.25rem;
  font-size: medium;
  width: 100%;
  background-color: #1D1C24;
  color: #fff;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
`;

const AddPost = () => {
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!content) return alert("Please write a content.");

        const postData = {
            title,
            content,
        };

        try {
            await axios.post("/posts", postData, {
                headers: {
                    "Content-Type": "application/json",
                },
            });
        } catch (error) {
            console.error("Failed to upload post:", error);
        }
        redirect("/posts");
    };

    return (
        <PostContainer>
            <PostSection>
                <h1>Add your post</h1>
                <p>Enter title and content to add your post</p>
            </PostSection>
            <Form onSubmit={handleSubmit}>
                <InputContainer>
                    <Label>Title</Label>
                    <Input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
                </InputContainer>
                <InputContainer>
                    <Label>Content</Label>
                    <Input type="text" value={content} onChange={(e) => setContent(e.target.value)} required />
                </InputContainer>
                <Button type="submit">Add</Button>
            </Form>
        </PostContainer>
    );
};

export default AddPost;
