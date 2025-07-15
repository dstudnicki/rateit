// UPLOAD PHOTO POST
"use client";
import React, { useState } from "react";
import styled from "styled-components";
import axios from "axios";
import { redirect } from "next/navigation";

const PhotoContainer = styled.div`
  max-width: 27rem;
  margin: 100px auto;
  padding: 1.5rem;
  border: 1px solid;
  border-radius: 1rem;
  border-color: #E1E0E9;
  box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
`;

const PhotoSection = styled.div`
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
  padding: 0.75rem;
  border: 1px solid #ccc;
  border-radius: 8px;
  font-size: 1rem;
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

const UploadPhotoForm = () => {
    const [description, setTitle] = useState("");
    const [file, setFile] = useState<File | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return alert("Please select a file.");

        const formData = new FormData();
        formData.append("description", description);
        formData.append("photo", file);

        try {
            await axios.post("/photos", formData, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
            });
        } catch (error) {
            console.error("Failed to upload photo:", error);
        }
        redirect("/photos");
    };

    return (
        <PhotoContainer>
            <PhotoSection>
                <h1>Upload your photo</h1>
                <p>Provide necessary data to upload your photo</p>
            </PhotoSection>
            <Form onSubmit={handleSubmit}>
                <InputContainer>
                    <Label>Description</Label>
                    <Input type="text" value={description} onChange={(e) => setTitle(e.target.value)} required />
                </InputContainer>
                <InputContainer>
                    <Label>Photo</Label>
                    <Input type="file" onChange={(e) => setFile(e.target.files?.[0] || null)} required />
                </InputContainer>
                <Button type="submit">Upload</Button>
            </Form>
        </PhotoContainer>
    );
};

export default UploadPhotoForm;
