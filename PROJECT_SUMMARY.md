# Hongson-CISA Application Summary - Technical Handover

**Project:** Hongson-CISA (Competency & Integrated Skills Assessment Platform)  
**Version:** 1.0.0 (Phase 1-6 Complete)  
**Last Updated:** 2026-01-29  

---

## 1. Project Overview
Hongson-CISA is an enterprise-grade web application designed to assess student core competencies based on the PISA (Programme for International Student Assessment) framework. It facilitates the testing of 2,000+ students across 6 key scientific competencies using real-world scenarios.

**Key features:**
- Role-Based Access Control (RBAC) for Students, Admins, and Super Admins.
- Digital Exam Runner with split-screen scenario/question view.
- **AI-Powered Grading:** Automated grading and feedback generation using Google Vertex AI (Gemini 1.5 Flash).

---

## 2. Technology Stack

### Frontend (The Shell)
- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS + Framer Motion (for animations)
- **Icons:** Lucide React
- **State/Context:** React Context API (`AuthContext`)

### Database & Auth (The Core)
- **Platform:** Google Firebase
- **Authentication:** Firebase Auth (Google Provider)
- **Database:** Cloud Firestore (NoSQL)

### Backend & AI (The Brain)
- **Runtime:** Cloud Functions for Firebase (2nd Gen)
- **AI Model:** Google Vertex AI (`gemini-1.5-flash`)
- **SDKs:** `firebase-admin`, `@google-cloud/vertexai`

---

## 3. Database Schema (Firestore)

### Collection: `users`
Stores user profiles and RBAC data.
*Pattern: Document ID matches Auth UID for direct lookup.*
```typescript
interface UserData {
  uid: string;
  email: string;
  photoURL: string;
  role: 'student' | 'admin' | 'super_admin';
  
  // Student Fields
  studentId?: string;       // e.g. "660101" (Primary Key for imports)
  firstName?: string;       // Thai first name
  lastName?: string;        // Thai last name
  classRoom?: string;       // e.g. "4/1"
  
  // Admin Fields
  assignedCompetency?: string; // e.g. "Creative Thinking" (Restricts Exam Creation)
}
```

### Collection: `exams`
Stores the test definitions.
```typescript
interface Exam {
  id: string;               // Auto-ID
  title: string;
  competency: string;       // One of 6 Core Competencies
  scenario: string;         // Long text / Stimulus material
  question: string;         // The actual question prompt
  rubricPrompt: string;     // Instructions for AI (Hidden from student)
  isActive: boolean;
  createdBy: string;        // Admin UID
  createdAt: Timestamp;
}
```

### Collection: `submissions`
Stores student answers and AI grading results.
```typescript
interface Submission {
  id: string;               // Auto-ID
  examId: string;
  studentId: string;        // User UID
  studentName: string;      // Cached name for easy reporting
  classRoom: string;        // Cached classroom
  competency: string;       // Cached competency for stats
  answer: string;           // Student's text answer
  
  // Grading Status
  status: 'pending' | 'graded' | 'error';
  score: number | null;     // 0-10
  feedback: string | null;  // AI Generated Feedback (Thai)
  submittedAt: Timestamp;
  gradedAt?: Timestamp;
}
```

---

## 4. Key Workflows & Logic

### A. Authentication & Profile Merge
- **Trigger:** When `useAuth` loads or a user logs in via Google.
- **Logic:**
  1. Check if a document exists in `users/{uid}`.
  2. **If Exists:** Merge Firestore data (role, studentId) into the Auth User object.
  3. **If New:** Create a default document with `role: 'student'`.

### B. Exam Creation (RBAC)
- **Super Admin:** Can create exams for *any* competency.
- **Admin:** Can *only* create exams for their `assignedCompetency`. The frontend dropdown is programmatically disabled/pre-selected based on this field.

### C. Student Import (Batch Processing)
- **Strategy:** Uses a CSV file (studentId, name, class).
- **Process:**
  1. Parse CSV on client using `papaparse`.
  2. Loop through rows and construct `setDoc` operations.
  3. **Batching:** Firestore allows max 500 writes per batch. We chunk data into **batches of 400** to be safe.
  4. **Key:** Uses `studentId` (or mapped email) to update existing records or create pending profiles.

### D. AI Grading System (Cloud Function)
- **Function Name:** `gradeExamBatch` (Callable)
- **Trigger:** Manually triggered by Super Admin via `/admin/ai-control`.
- **Logic:**
  1. Fetch `pending` submissions (Limit ~20-50 per run).
  2. For each submission, lazy-load the parent `Exam` document (cached).
  3. **Prompt Construction:** Combines Scenario + Question + Student Answer + Rubric into a structured prompt for Gemini.
  4. **AI Call:** `vertexAI.generateContent(prompt)` requesting JSON output.
  5. **Update:** Writes `score`, `feedback`, and `status: 'graded'` back to Firestore.

---

## 5. Security Architecture

### Firestore Rules (Summary)
- **Read:**
  - `users`: Users can read their own profile. Admins/Super Admins can read all.
  - `exams`: Authenticated users can read active exams.
  - `submissions`: Students read their own. Admins read all.
- **Write:**
  - `users`: Only Super Admin (or dev tools) can change roles.
  - `exams`: Only Admins/Super Admins.
  - `submissions`: Students can create (create-only, no update after submit). Cloud Functions (Admin SDK) handle grading updates.

### Frontend Protection
- **Hook:** `useRoleProtection(allowedRoles[])`
- **Behavior:** Redirects unauthorized users to `/unauthorized` (distinct from Login to prevent loop).

---

## 6. Known Issues & Fixes

### ESLint Deployment Error
- **Issue:** Deployment failed because `functions/package.json` used `eslint --ext .js,.ts`, but the `--ext` flag is deprecated in newer ESLint versions.
- **Fix:**
  1. Updated `functions/package.json` to `"lint": "eslint ."`.
  2. Removed the linting step from `firebase.json` (`predeploy`) to ensure unblocked deployments during rapid iterations.

### Infinite Redirect Loop
- **Issue:** Users with invalid/empty roles caused a loop between `/` and `/login`.
- **Fix:** Added a default case in `app/page.tsx` to redirect invalid roles to `/unauthorized`.

---

## 7. Environment Variables (`.env.local`)

```env
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
```

---

*This document serves as the primary architectural reference for the Hongson-CISA project.*
