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
        const email = `${studentId}@hongsoncisa.com`;
        const password = `hongsoncisa${studentId}`; // Prefix ensures 6+ char minimum for Firebase

        // First, try to fetch pre-registered data (before auth attempt)
        let preRegData: any = null;
        try {
            console.log(`[Auth] Attempting to fetch pre-registered data for: ${studentId}`);
            const preRegRef = doc(db, "pre_registered_students", studentId);
            const preRegSnap = await getDoc(preRegRef);

            if (preRegSnap.exists()) {
                preRegData = preRegSnap.data();
                console.log(`[Auth] Found pre-registered data:`, preRegData);
            } else {
                console.log(`[Auth] No pre-registered data found for: ${studentId}`);
            }
        } catch (preRegError) {
            console.warn("[Auth] Error fetching pre-reg data (might be rules/permission issue):", preRegError);
            // Continue anyway - we'll use default data
        }

        try {
            // Try to login
            await signInWithEmailAndPassword(auth, email, password);
            console.log(`[Auth] Existing user signed in: ${email}`);
        } catch (error: any) {
            if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
                // User doesn't exist, create new account
                console.log(`[Auth] Creating new user: ${email}`);
                try {
                    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

                    // Build user data - prioritize pre-registered data
                    const userData: any = {
                        uid: userCredential.user.uid,
                        email: email,
                        role: 'student',
                        studentId: studentId,
                        firstName: preRegData?.firstName || studentId,
                        lastName: preRegData?.lastName || '',
                        classRoom: preRegData?.classRoom || null,
                        createdAt: serverTimestamp(),
                    };

                    console.log(`[Auth] Creating user document with data:`, userData);

                    // Create Firestore doc
                    const userDocRef = doc(db, "users", userCredential.user.uid);
                    await setDoc(userDocRef, userData);

                    console.log(`[Auth] User document created successfully`);
                } catch (createError: any) {
                    console.error("[Auth] Error creating student user:", createError);
                    throw createError;
                }
            } else {
                console.error("[Auth] Error signing in with Student ID:", error);
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

                        // Check if this is a student email (from Student ID login)
                        const isStudentEmail = firebaseUser.email?.endsWith('@hongsoncisa.com');
                        const defaultRole = isStudentEmail ? 'student' : 'general_user';

                        // Extract student ID from email if it's a student
                        const studentId = isStudentEmail
                            ? firebaseUser.email?.replace('@hongsoncisa.com', '')
                            : undefined;

                        const newUserData: AppUser = {
                            uid: firebaseUser.uid,
                            email: firebaseUser.email,
                            photoURL: firebaseUser.photoURL,
                            role: defaultRole,
                            firstName: firebaseUser.displayName?.split(' ')[0] || (isStudentEmail ? studentId : "User") || "User",
                            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || "",
                            studentId: studentId,
                        };

                        await setDoc(userDocRef, {
                            uid: newUserData.uid,
                            email: newUserData.email,
                            role: newUserData.role,
                            photoURL: newUserData.photoURL,
                            firstName: newUserData.firstName,
                            lastName: newUserData.lastName,
                            studentId: newUserData.studentId || null,
                            createdAt: serverTimestamp(),
                        });

                        setUser(newUserData);
                    }
                } catch (error) {
                    console.error("Error fetching user data from Firestore:", error);
                    // Also check for student email in error fallback
                    const isStudentEmail = firebaseUser.email?.endsWith('@hongsoncisa.com');
                    setUser({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        photoURL: firebaseUser.photoURL,
                        role: isStudentEmail ? 'student' : 'general_user',
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
