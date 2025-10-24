// USER EDIT PROFILE PAGE
"use client";
import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useAuth } from "@/hooks/useAuth";
import axios from "axios";
import { redirect } from "next/navigation";

const ProfileContainer = styled.div`
    max-width: 30rem;
    margin: 100px auto;
    padding: 1.5rem;
    border: 1px solid #e1e0e9;
    border-radius: 1rem;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
`;

const ProfileSection = styled.div`
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
    border: 1px solid #e1e0e9;
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
    background-color: #1d1c24;
    color: #fff;
    border: none;
    border-radius: 0.375rem;
    cursor: pointer;
`;

const UserEditProfile = () => {
    const { user, fetchMyProfile } = useAuth();
    const [formData, setFormData] = useState({ email: "", password: "" });
    console.log(formData);

    useEffect(() => {
        const fetchUserData = async () => {
            await fetchMyProfile();
        };

        fetchUserData();
    }, []);

    useEffect(() => {
        if (user && formData.username === "") {
            setFormData({ username: user.username, email: user.email, password: "" });
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.put(`/user/edit/${user?._id}`, formData, {
                headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
            });
            redirect(`/${formData.username}`);
        } catch (error) {
            console.error("Update failed:", error);
        }
    };

    return (
        <ProfileContainer>
            <ProfileSection>
                <h1>Profile</h1>
                <p>Edit your profile details below</p>
            </ProfileSection>
            <Form onSubmit={handleSubmit}>
                <InputContainer>
                    <Label>Username</Label>
                    <Input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        placeholder="Enter username"
                    />
                </InputContainer>
                <InputContainer>
                    <Label>Email</Label>
                    <Input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Enter email" />
                </InputContainer>
                <InputContainer>
                    <Label>New Password</Label>
                    <Input type="password" name="password" value={formData.password} onChange={handleChange} />
                </InputContainer>
                <Button type="submit">Update Profile</Button>
            </Form>
        </ProfileContainer>
    );
};

export default UserEditProfile;
