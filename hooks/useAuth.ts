import { useState, useEffect } from "react";
import axios from "axios";
import { redirect } from "next/navigation";

export const useAuth = () => {
    const [user, setUser] = useState<{ _id: string; username: string; email: string } | null>(null);

    // Login function
    const login = async (username: string, email: string, password: string) => {
        try {
            const { data } = await axios.post("api/auth/login", { username, email, password });
            const token = data.token;
            const expirationTime = Date.now() + 3600 * 1000;
            localStorage.setItem("token", token);
            localStorage.setItem("tokenExpiration", expirationTime.toString());
            setTokenExpiry();
            await fetchMyProfile(username);
            redirect("/");
        } catch (error) {
            console.error("Login failed:", error);
        }
    };

    const register = async (username: string, email: string, password: string) => {
        try {
            await axios.post("api/auth/register", { username, email, password });
        } catch (error) {
            console.error("Registration failed:", error);
        }
    };

    const fetchMyProfile = async (username: string) => {
        try {
            const { data } = await axios.get(`/api/user/${username}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                },
            });
            setUser(data.user);
        } catch (error) {
            console.error("Failed to fetch your profile:", error);
        }
    };

    const fetchUserByUsername = async (username: string) => {
        try {
            const { data } = await axios.get(`/api/user/${username}`);
            return data;
        } catch (error) {
            console.error("Failed to fetch user by username:", error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem("token");
        setUser(null);
    };

    const setTokenExpiry = () => {
        const expirationTime = parseInt(localStorage.getItem("tokenExpiration") || "0", 10);
        if (expirationTime) {
            const remainingTime = expirationTime - Date.now();
            if (remainingTime > 0) {
                setTimeout(() => {
                    logout();
                    console.log("Token expired. User logged out.");
                }, remainingTime);
            } else {
                logout();
            }
        }
    };

    useEffect(() => {
        setTokenExpiry();
    }, []);

    return { user, login, register, logout, fetchMyProfile, fetchUserByUsername };
};
