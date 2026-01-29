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

export interface ExamItem {
    id: string;
    question: string;
    score: number; // Max score for this item
    rubricPrompt: string;
}

export type MediaType = 'text' | 'simulation';

export interface Exam {
    id?: string;
    title: string;
    competency: string; // Display string (computed from competencyId + subCompetencyId or legacy value)
    competencyId?: string; // Main competency ID (e.g., "competency-6")
    subCompetencyId?: string; // Sub-competency ID (e.g., "sub-6-1")
    scenario: string; // Text stimulus (used when mediaType is 'text')
    mediaType: MediaType; // 'text' for text scenario, 'simulation' for external URL
    mediaUrl?: string; // External simulation URL (e.g., PhET) when mediaType is 'simulation'
    items: ExamItem[]; // Multiple sub-questions (PISA-style)
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
    answers: Record<string, string>; // Map itemId -> student answer
    itemScores: Record<string, number>; // Map itemId -> score (filled after grading)
    status: 'pending' | 'graded' | 'error';
    score: number | null; // Total score (sum of itemScores)
    feedback: string | null;
    submittedAt: any;
    gradedAt?: any;
}
