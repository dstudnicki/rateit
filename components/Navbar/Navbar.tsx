"use client";
import Link from "next/link";
import styled from "styled-components";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";

const Nav = styled.nav`
font-size: 18px;
padding: 40px;
`;
const MainNav = styled.ul`
list-style-type: none;
display: flex;
justify-content: space-evenly;
align-items: center;
padding: 0;
`;

const LeftGroup = styled.ul`
list-style-type: none;
display: flex;
align-items: center;
gap: 2.5rem;
`;

const RightGroup = styled.ul`
list-style-type: none;
display: flex;
align-items: center;
gap: 0.5rem;
`;

const NavLi = styled.li`
text-align: center;
`;

const Button = styled.button`
display: inline-flex;
justify-content: center;
align-items: center;
padding: 0.5rem 1rem;
font-size: medium;
background-color: #1d1c24;
color: #fff;
border: none;
border-radius: 0.375rem;
cursor: pointer;
`;

const ButtonOutline = styled.button`
display: inline-flex;
justify-content: center;
align-items: center;
padding: 0.5rem 1rem;
font-size: medium;
background-color: #ffffff;
border: 1px solid #e1e0e9;
border-radius: 0.375rem;
cursor: pointer;
box-shadow: 0 0 10px 0 rgba(0, 0, 0, 0.1);
`;

const Navbar = () => {
    const { logout, user, fetchMyProfile } = useAuth();
    const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

    const handleAuthentication = async () => {
        const token = localStorage.getItem("token");
        if (token) {
            await fetchMyProfile();
            setIsAuthenticated(true);
        } else {
            setIsAuthenticated(false);
        }
    };

    const handleLogout = () => {
        logout();
        handleAuthentication();
    };

    useEffect(() => {
        const onStorageChange = () => handleAuthentication();
        if (user) {
            fetchMyProfile();
        }
        handleAuthentication();

        window.addEventListener("storage", onStorageChange);

        return () => {
            window.removeEventListener("storage", onStorageChange);
        };
    }, []);

    return (
        <Nav>
            <MainNav>
                <LeftGroup>
                    <NavLi>
                        <Link href="/">Home</Link>
                    </NavLi>
                    <NavLi>
                        <Link href="/posts">Posts</Link>
                    </NavLi>
                    <NavLi>
                        <Link href="/photos">Photos</Link>
                    </NavLi>
                    <NavLi>
                        <Link href="/posts/add">Add Post</Link>
                    </NavLi>
                    <NavLi>
                        <Link href="/photos/upload">Upload Photo</Link>
                    </NavLi>
                </LeftGroup>
                <RightGroup>
                    {isAuthenticated ? (
                        <>
                            <NavLi>
                                <Link href={user?.username || "#"}>Profile</Link>
                            </NavLi>
                            <NavLi>
                                <Button onClick={handleLogout}>Log out</Button>
                            </NavLi>
                        </>
                    ) : (
                        <>
                            <NavLi>
                                <Link href="/login">
                                    <Button>Login</Button>
                                </Link>
                            </NavLi>
                            <NavLi>
                                <Link href="/register">
                                    <ButtonOutline>Register</ButtonOutline>
                                </Link>
                            </NavLi>
                        </>
                    )}
                </RightGroup>
            </MainNav>
        </Nav>
    );
};

export default Navbar;
