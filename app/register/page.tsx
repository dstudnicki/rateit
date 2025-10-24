// REGISTER PAGE
"use client";
import React, { useState } from "react";
import styled from "styled-components";
import { useAuth } from "@/hooks/useAuth";
import Link from "next/link";

const RegisterContainer = styled.div`
    max-width: 27rem;
    margin: 100px auto;
    padding: 1.5rem;
    border: 1px solid;
    border-radius: 1rem;
    border-color: #e1e0e9;
    box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
`;

const RegisterSection = styled.div`
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

const RegisterContent = styled.div`
    display: flex;
    justify-content: center;
    gap: 0.5rem;
`;

const Register = () => {
    const { register } = useAuth();
    const { login } = useAuth();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await register(email, password);
            await login(email, password);
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    return (
        <RegisterContainer>
            <RegisterSection>
                <h1>Register</h1>
                <p>Provide your credentials below to register your account</p>
            </RegisterSection>
            <Form onSubmit={handleSubmit}>
                {/* <InputContainer>
                    <Label>Username</Label>
                    <Input type="text" value={username} onChange={(e) => setUsername(e.target.value)} />
                </InputContainer> */}
                <InputContainer>
                    <Label>Email</Label>
                    <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="johndoe@example.com"
                    />
                </InputContainer>
                <InputContainer>
                    <Label>Password</Label>
                    <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                </InputContainer>
                <Button type="submit">Register</Button>
                <RegisterContent>
                    Already have an account?
                    <Link href="/login">Sign in</Link>
                </RegisterContent>
            </Form>
        </RegisterContainer>
    );
};

export default Register;
