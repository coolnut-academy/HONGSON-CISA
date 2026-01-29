"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    signOut,
    User as FirebaseUser
} from "firebase/auth";
import {
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import { auth, db, googleProvider } from "@/lib/firebase";
import { AppUser } from "@/types";

interface AuthContextType {
    user: AppUser | null;
    loading: boolean;
    signInWithGoogle: () => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true, // Default to true to prevent premature redirection
    signInWithGoogle: async () => { },
    logout: async () => { },
});

export const AuthContextProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    const signInWithGoogle = async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            // The onAuthStateChanged listener will handle the state update
        } catch (error) {
            console.error("Error signing in with Google", error);
            alert("Error signing in with Google. Please try again.");
        }
    };

    const logout = async () => {
        try {
            await signOut(auth);
            setUser(null);
        } catch (error) {
            console.error("Error signing out", error);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                setLoading(true);
                try {
                    const userDocRef = doc(db, "users", firebaseUser.uid);
                    const userDocSnapshot = await getDoc(userDocRef);

                    if (userDocSnapshot.exists()) {
                        // User exists, merge Firestore data with Auth data
                        const userData = userDocSnapshot.data();

                        // Construct the complete user object
                        const appUser: AppUser = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            photoURL: firebaseUser.photoURL,
                            role: (userData.role as 'student' | 'admin' | 'super_admin' | 'general_user') || 'general_user',
                            ...userData,
                        } as AppUser;

                        setUser(appUser);
                    } else {
                        // NEW USER LOGIC
                        // By default, if they are not pre-imported students (checked by checking firestore which we just did and found nothing), 
                        // we assume they are General Users (Public).

                        const newUserData: AppUser = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            photoURL: firebaseUser.photoURL,
                            role: 'general_user', // DEFAULT TO GENERAL USER
                            firstName: firebaseUser.displayName?.split(' ')[0] || "User",
                            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
                        };

                        await setDoc(userDocRef, {
                            uid: newUserData.uid,
                            email: newUserData.email,
                            role: newUserData.role,
                            photoURL: newUserData.photoURL,
                            firstName: newUserData.firstName,
                            lastName: newUserData.lastName,
                            createdAt: serverTimestamp(),
                        });

                        setUser(newUserData);
                    }
                } catch (error) {
                    console.error("Error fetching user data from Firestore:", error);
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        photoURL: firebaseUser.photoURL,
                        role: 'general_user',
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
