export type UserRole = 'student' | 'admin' | 'super_admin' | 'general_user';

export interface AppUser {
    // Mandatory fields
    uid: string;
    email: string | null;
    role: UserRole;
    photoURL: string | null;

    // Student specific fields (Optional, will match CSV later)
    studentId?: string;
    title?: string;
    firstName?: string;
    lastName?: string;
    classRoom?: string;

    // Admin specific fields (Optional)
    assignedCompetency?: string;
}

export interface Exam {
    id?: string;
    title: string;
    competency: string; // Must match one of the 6 competencies
    scenario: string;
    question: string;
    rubricPrompt: string;
    isActive: boolean;
    createdBy: string;
    createdAt: any; // Using any for Firestore Timestamp/FieldValue compatibility
}

export interface Submission {
    id?: string;
    examId: string;
    studentId: string; // auth uid
    studentName: string; // Combined First Last
    classRoom: string;
    competency: string;
    answer: string;
    status: 'pending' | 'graded' | 'error';
    score: number | null;
    feedback: string | null;
    submittedAt: any;
    gradedAt?: any;
}
