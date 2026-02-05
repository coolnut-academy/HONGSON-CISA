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

// =============== QUESTION TYPES ===============
export type QuestionType =
    | 'multiple_choice'      // เลือก 1 ข้อ
    | 'multiple_select'      // เลือกได้หลายข้อ
    | 'drag_drop'            // ลาก-วาง
    | 'matching'             // จับคู่
    | 'checklist'            // เลือกหลายข้อแบบ checkbox
    | 'short_response'       // เขียนสั้น 3-5 บรรทัด
    | 'extended_response';   // เขียนยาว

// Option for choice-based questions
export interface ChoiceOption {
    id: string;
    text: string;
    isCorrect?: boolean;  // For auto-grading
}

// Drag & Drop structures
export interface DragItem {
    id: string;
    text: string;
    imageUrl?: string; // Optional image URL
}

export interface DropZone {
    id: string;
    label: string;
    correctItemId: string;
}

// Matching structures
export interface MatchItem {
    id: string;
    text: string;
    imageUrl?: string; // Optional image URL
}

export interface MatchPair {
    id: string;
    text: string;
    correctMatchId: string; // ID of MatchItem it should match to
    imageUrl?: string; // Optional image URL
}

// Stimulus content types
export type StimulusType = 'image' | 'table' | 'graph' | 'text' | 'simulation' | 'iframe';

export interface StimulusContent {
    type: StimulusType;
    content: string;  // URL for image/simulation/iframe, JSON string for table/graph, text for text
    caption?: string;
}

// Graph data for dynamic generation
export interface GraphConfig {
    type: 'line' | 'scatter' | 'bar';
    xAxis: { label: string; unit?: string };
    yAxis: { label: string; unit?: string };
    datasets: {
        label: string;
        color: string;
        // For random generation: formula or data points
        formula?: string; // e.g., "y = -9.8 * t + v0" with variables
        dataPoints?: { x: number; y: number }[];
    }[];
    randomVariables?: {
        name: string;
        min: number;
        max: number;
        step?: number;
    }[];
}

export interface ExamItem {
    id: string;
    question: string;
    questionType: QuestionType;
    score: number; // Max score for this item
    rubricPrompt: string;
    category?: string; // e.g., "หมวดที่ 1: ทำความเข้าใจปรากฏการณ์"

    // Stimulus for this specific question (optional)
    stimulusContent?: StimulusContent[];

    // For multiple_choice and multiple_select
    options?: ChoiceOption[];

    // For drag_drop
    dragItems?: DragItem[];
    dropZones?: DropZone[];
    backgroundImageUrl?: string;

    // For matching
    leftColumn?: MatchItem[];
    rightColumn?: MatchPair[];

    // For short_response character limit
    maxCharacters?: number;

    // For graph stimulus with random values
    graphConfig?: GraphConfig;
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
    timeLimit?: number; // Time limit in minutes (e.g., 90)
}

// =============== ANSWER TYPES ===============
// Generic answer structure to support all question types
export interface QuestionAnswer {
    type: QuestionType;
    // For text-based answers (short_response, extended_response)
    textAnswer?: string;
    // For single choice (multiple_choice)
    selectedOptionId?: string;
    // For multiple choices (multiple_select, checklist)
    selectedOptionIds?: string[];
    // For drag_drop: map dropZoneId -> dragItemId
    dragDropPlacements?: Record<string, string>;
    // For matching: map leftItemId -> rightItemId
    matchingPairs?: Record<string, string>;
}

export interface Submission {
    id?: string;
    examId: string;
    studentId: string; // auth uid
    studentName: string; // Combined First Last
    classRoom: string;
    competency: string;
    answers: Record<string, QuestionAnswer>; // Map itemId -> structured answer
    itemScores: Record<string, number>; // Map itemId -> score (filled after grading)
    status: 'pending' | 'graded' | 'error';
    score: number | null; // Total score (sum of itemScores)
    feedback: string | null;
    submittedAt: any;
    gradedAt?: any;
    // Timer tracking
    startedAt?: any;
    timeSpentSeconds?: number;
    autoSubmitted?: boolean; // True if submitted by timer
    // Random values used for graph generation (for consistent grading)
    randomSeed?: number;
    generatedValues?: Record<string, number>;
    detailedFeedback?: Record<string, string>; // Map itemId -> feedback
}
