"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
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
    loginWithStudentId: (studentId: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true, // Default to true to prevent premature redirection
    signInWithGoogle: async () => { },
    loginWithStudentId: async () => { },
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
            // Cast error to any to access message property safely in this context
            const errorMessage = (error as any).message || "Unknown error occurred.";
            alert(`Error signing in with Google: ${errorMessage}`);
        }
    };

    const loginWithStudentId = async (studentId: string) => {
        const email = `${studentId}@cisa.school`;
        const password = `${studentId}`; // Simple password policy as discussed

        try {
            // Try to login
            await signInWithEmailAndPassword(auth, email, password);
        } catch (error: any) {
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                // If login fails (user likely doesn't exist or wrong pass), try to register 
                // We assume "wrong-password" means "user not found" in this auto-reg flow if we stick to ID=Password.
                // However, if a user actually exists and the ID=Password is correct, but they changed it... wait, they can't change it here.
                // BUT, if we want to "Auto Register", we should check if the error is "user-not-found" (or invalid-credential in new firebase SDK).
                // Let's try to CREATE the user.
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                    // Check for pre-registered data
                    let userData: any = {
                        uid: userCredential.user.uid,
                        email: email,
                        role: 'student',
                        studentId: studentId,
                        firstName: "นักเรียน",
                        lastName: studentId,
                        createdAt: serverTimestamp(),
                    };

                    try {
                        const preRegRef = doc(db, "pre_registered_students", studentId);
                        const preRegSnap = await getDoc(preRegRef);

                        if (preRegSnap.exists()) {
                            const preData = preRegSnap.data();
                            userData = {
                                ...userData,
                                firstName: preData.firstName || userData.firstName,
                                lastName: preData.lastName || userData.lastName,
                                classRoom: preData.classRoom || null,
                                // Maintain any other pre-set data
                            };
                        }
                    } catch (preRegError) {
                        console.error("Error fetching pre-reg data", preRegError);
                        // Continue with default data
                    }

                    // Create Firestore doc
                    const userDocRef = doc(db, "users", userCredential.user.uid);
                    await setDoc(userDocRef, userData);
                } catch (createError: any) {
                    console.error("Error creating student user", createError);
                    throw createError; // Rethrow to handle in UI
                }
            } else {
                console.error("Error signing in with Student ID", error);
                throw error;
            }
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
                        // NEW USER LOGIC (Google Login Case mainly)
                        // Note: Student Login flow above handles its own creation, but if somehow we end up here
                        // (e.g. they created via console), we default.

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
        <AuthContext.Provider value={{ user, loading, signInWithGoogle, loginWithStudentId, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
