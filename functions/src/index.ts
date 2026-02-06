import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";

import * as nodemailer from "nodemailer";

// Fix for implicit any type error
// @ts-ignore
declare module "nodemailer";

admin.initializeApp();
const db = admin.firestore();

// =============== VALIDATION HELPERS ===============

/**
 * Sanitize text input to prevent XSS and injection attacks
 */
function sanitizeText(text: string | undefined): string {
    if (!text) return "";
    // Remove HTML tags and limit length
    return text
        .replace(/<[^>]*>/g, "") // Strip HTML
        .replace(/[<>\"']/g, "") // Remove dangerous characters
        .substring(0, 10000); // Max 10k chars
}

/**
 * Validate answer format based on question type
 */
function validateAnswer(answer: QuestionAnswer, item: ExamItem): { valid: boolean; error?: string; sanitized: QuestionAnswer } {
    const sanitized: QuestionAnswer = { type: item.questionType };

    switch (item.questionType) {
        case "multiple_choice": {
            if (!answer.selectedOptionId) {
                return { valid: true, sanitized }; // Allow empty
            }
            const validOption = item.options?.some((o) => o.id === answer.selectedOptionId);
            if (!validOption) {
                return { valid: false, error: `Invalid option ID for item ${item.id}`, sanitized };
            }
            sanitized.selectedOptionId = answer.selectedOptionId;
            return { valid: true, sanitized };
        }

        case "multiple_select":
        case "checklist": {
            if (!answer.selectedOptionIds || answer.selectedOptionIds.length === 0) {
                return { valid: true, sanitized: { ...sanitized, selectedOptionIds: [] } };
            }
            const validIds = answer.selectedOptionIds.filter((id) =>
                item.options?.some((o) => o.id === id)
            );
            sanitized.selectedOptionIds = validIds;
            return { valid: true, sanitized };
        }

        case "drag_drop": {
            if (!answer.dragDropPlacements || Object.keys(answer.dragDropPlacements).length === 0) {
                return { valid: true, sanitized: { ...sanitized, dragDropPlacements: {} } };
            }
            const validZones = item.dropZones?.map((z) => z.id) || [];
            const validItems = item.dragItems?.map((i) => i.id) || [];
            const sanitizedPlacements: Record<string, string> = {};

            for (const [zoneId, itemId] of Object.entries(answer.dragDropPlacements)) {
                if (validZones.includes(zoneId) && validItems.includes(itemId)) {
                    sanitizedPlacements[zoneId] = itemId;
                }
            }
            sanitized.dragDropPlacements = sanitizedPlacements;
            return { valid: true, sanitized };
        }

        case "matching": {
            if (!answer.matchingPairs || Object.keys(answer.matchingPairs).length === 0) {
                return { valid: true, sanitized: { ...sanitized, matchingPairs: {} } };
            }
            const validLeft = item.leftColumn?.map((l) => l.id) || [];
            const validRight = item.rightColumn?.map((r) => r.id) || [];
            const sanitizedPairs: Record<string, string> = {};

            for (const [leftId, rightId] of Object.entries(answer.matchingPairs)) {
                if (validLeft.includes(leftId) && validRight.includes(rightId)) {
                    sanitizedPairs[leftId] = rightId;
                }
            }
            sanitized.matchingPairs = sanitizedPairs;
            return { valid: true, sanitized };
        }

        case "short_response": {
            const text = sanitizeText(answer.textAnswer);
            const maxChars = item.maxCharacters || 500;
            if (text.length > maxChars) {
                return { valid: false, error: `Answer exceeds max characters for item ${item.id}`, sanitized };
            }
            sanitized.textAnswer = text;
            return { valid: true, sanitized };
        }

        case "extended_response": {
            const text = sanitizeText(answer.textAnswer);
            if (text.length > 10000) {
                return { valid: false, error: `Answer too long for item ${item.id}`, sanitized };
            }
            sanitized.textAnswer = text;
            return { valid: true, sanitized };
        }

        default:
            return { valid: false, error: `Unknown question type: ${item.questionType}`, sanitized };
    }
}

// =============== SUBMIT EXAM FUNCTION ===============

export const submitExam = onCall<SubmitExamInput>({
    timeoutSeconds: 60,
    memory: "512MiB",
}, async (request) => {
    console.log("[submitExam] Called by:", request.auth?.uid);

    // 1. AUTHENTICATION CHECK
    if (!request.auth) {
        console.warn("[submitExam] Unauthenticated attempt");
        throw new HttpsError("unauthenticated", "User must be logged in to submit exam.");
    }

    const studentId = request.auth.uid;

    // 2. FETCH USER DATA
    let userData: any;
    try {
        const userDoc = await db.collection("users").doc(studentId).get();
        if (!userDoc.exists) {
            throw new HttpsError("not-found", "User profile not found.");
        }
        userData = userDoc.data();

        // Verify role is student
        if (userData?.role !== "student") {
            throw new HttpsError("permission-denied", "Only students can submit exams.");
        }
    } catch (error: any) {
        console.error("[submitExam] Error fetching user:", error);
        throw new HttpsError("internal", "Failed to verify user profile.");
    }

    // 3. EXTRACT AND VALIDATE INPUT
    const { examId, answers, timeSpentSeconds, randomSeed, generatedValues } = request.data;

    if (!examId || typeof examId !== "string") {
        throw new HttpsError("invalid-argument", "Exam ID is required.");
    }

    if (!answers || typeof answers !== "object") {
        throw new HttpsError("invalid-argument", "Answers object is required.");
    }

    // 4. FETCH AND VALIDATE EXAM
    let examData: ExamData;
    try {
        const examDoc = await db.collection("exams").doc(examId).get();
        if (!examDoc.exists) {
            throw new HttpsError("not-found", "Exam not found.");
        }
        examData = examDoc.data() as ExamData;

        if (!examData.isActive) {
            throw new HttpsError("failed-precondition", "This exam is not currently active.");
        }

        if (!examData.items || examData.items.length === 0) {
            throw new HttpsError("failed-precondition", "Invalid exam structure.");
        }
    } catch (error: any) {
        if (error instanceof HttpsError) throw error;
        console.error("[submitExam] Error fetching exam:", error);
        throw new HttpsError("internal", "Failed to load exam data.");
    }

    // 5. CHECK FOR DUPLICATE SUBMISSION
    try {
        const existingSubmission = await db
            .collection("submissions")
            .where("studentId", "==", studentId)
            .where("examId", "==", examId)
            .limit(1)
            .get();

        if (!existingSubmission.empty) {
            throw new HttpsError("already-exists", "You have already submitted this exam.");
        }
    } catch (error: any) {
        if (error instanceof HttpsError) throw error;
        console.error("[submitExam] Error checking duplicates:", error);
        throw new HttpsError("internal", "Failed to verify submission status.");
    }

    // 6. VALIDATE AND SANITIZE ANSWERS
    const validatedAnswers: Record<string, QuestionAnswer> = {};
    const itemScores: Record<string, number> = {};

    for (const item of examData.items) {
        // Initialize with zero score
        itemScores[item.id] = 0;

        // Get submitted answer for this item (may be undefined)
        const submittedAnswer = answers[item.id];

        if (!submittedAnswer) {
            // No answer for this item - that's okay, treat as empty
            validatedAnswers[item.id] = { type: item.questionType };
            continue;
        }

        // Validate the answer format matches question type
        if (submittedAnswer.type !== item.questionType) {
            console.warn(`[submitExam] Type mismatch for item ${item.id}: expected ${item.questionType}, got ${submittedAnswer.type}`);
            // Force correct type
            submittedAnswer.type = item.questionType;
        }

        // Validate and sanitize
        const validation = validateAnswer(submittedAnswer, item);
        if (!validation.valid) {
            console.warn(`[submitExam] Validation failed:`, validation.error);
            // Use empty answer as fallback instead of rejecting
            validatedAnswers[item.id] = { type: item.questionType };
        } else {
            validatedAnswers[item.id] = validation.sanitized;
        }
    }

    // 7. VALIDATE AND CLAMP TIME SPENT
    let validatedTimeSpent = 0;
    if (typeof timeSpentSeconds === "number") {
        const maxTime = examData.timeLimit ? examData.timeLimit * 60 : 7200; // Default max 2 hours
        validatedTimeSpent = Math.max(0, Math.min(Math.floor(timeSpentSeconds), maxTime));
    }

    // 8. CONSTRUCT SUBMISSION DOCUMENT
    const studentName = userData.firstName && userData.lastName
        ? `${userData.firstName} ${userData.lastName}`
        : userData.studentId || studentId;

    const submissionData = {
        examId: examId,
        studentId: studentId,
        studentName: studentName,
        classRoom: userData.classRoom || "N/A",
        competency: examData.competency,
        answers: validatedAnswers,
        itemScores: itemScores,
        status: "pending",
        score: null,
        feedback: null,
        submittedAt: admin.firestore.FieldValue.serverTimestamp(),
        startedAt: validatedTimeSpent > 0
            ? new Date(Date.now() - validatedTimeSpent * 1000)
            : admin.firestore.FieldValue.serverTimestamp(),
        timeSpentSeconds: validatedTimeSpent,
        autoSubmitted: false,
        randomSeed: randomSeed || Math.floor(Math.random() * 1000000),
        generatedValues: generatedValues || {},
        // Metadata for auditing
        submittedByIp: request.rawRequest.ip || "unknown",
        userAgent: request.rawRequest.headers["user-agent"] || "unknown",
    };

    // 9. SAVE TO FIRESTORE
    try {
        const submissionRef = await db.collection("submissions").add(submissionData);
        console.log(`[submitExam] Submission created: ${submissionRef.id}`);

        return {
            success: true,
            submissionId: submissionRef.id,
            message: "Exam submitted successfully. Your answers are being processed by AI.",
        };
    } catch (error: any) {
        console.error("[submitExam] Error saving submission:", error);
        throw new HttpsError("internal", "Failed to save submission. Please try again.");
    }
});

interface GradeExamInput {
    limit?: number;
    competency?: string;
}

// =============== SUBMISSION VALIDATION TYPES ===============

interface SubmitExamInput {
    examId: string;
    answers: Record<string, QuestionAnswer>;
    timeSpentSeconds?: number;
    randomSeed?: number;
    generatedValues?: Record<string, number>;
}

interface QuestionAnswer {
    type: string;
    textAnswer?: string;
    selectedOptionId?: string;
    selectedOptionIds?: string[];
    dragDropPlacements?: Record<string, string>;
    matchingPairs?: Record<string, string>;
}

interface ExamItem {
    id: string;
    question: string;
    questionType: string;
    score: number;
    options?: Array<{ id: string; text: string }>;
    dragItems?: Array<{ id: string; text: string }>;
    dropZones?: Array<{ id: string; label: string }>;
    leftColumn?: Array<{ id: string; text: string }>;
    rightColumn?: Array<{ id: string; text: string }>;
    maxCharacters?: number;
}

interface ExamData {
    id?: string;
    title: string;
    competency: string;
    items: ExamItem[];
    isActive: boolean;
    timeLimit?: number;
}

export const gradeExamBatch = onCall<GradeExamInput>({
    timeoutSeconds: 300,
    memory: "1GiB"
}, async (request) => {
    // 0. Initial Logging
    console.log("gradeExamBatch called");

    // Check Authentication (Super Admin only)
    if (!request.auth) {
        console.warn("Unauthenticated attempt to gradeExamBatch");
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    let vertexAI;
    let model;

    // 1. Initialize Vertex AI
    try {
        console.log("Initializing Vertex AI...");
        const { VertexAI: VAI } = require("@google-cloud/vertexai");

        // Prefer GCLOUD_PROJECT Env var (set by Cloud Functions)
        // Check firebaserc or use exact project ID if known
        let project = process.env.GCLOUD_PROJECT;
        if (!project) {
            // Fallback to internal instance data
            project = admin.instanceId().app.options.projectId;
        }

        console.log(`Using Project ID: ${project}`);

        if (!project) {
            throw new Error("Could not determine Project ID from environment.");
        }

        vertexAI = new VAI({
            project: project,
            location: "us-central1",
        });

        model = vertexAI.getGenerativeModel({
            model: "gemini-2.0-flash-001",
            generationConfig: {
                responseMimeType: "application/json"
            }
        });
        console.log("Vertex AI Initialized successfully.");

    } catch (initError: any) {
        console.error("Failed to initialize Vertex AI:", initError);
        throw new HttpsError("internal", `Vertex AI Init Failed: ${initError.message}`);
    }

    try {
        // Double check role from claims or Firestore
        const userDoc = await db.collection("users").doc(request.auth.uid).get();
        const userData = userDoc.data();
        if (userData?.role !== "super_admin" && userData?.role !== "admin") {
            throw new HttpsError("permission-denied", "Only Super Admins can run AI grading.");
        }

        const limitCount = request.data.limit || 20;
        const competencyFilter = request.data.competency || "All";

        console.log(`Querying pending submissions (Limit: ${limitCount}, Filter: ${competencyFilter})`);

        // 1. Query Pending Submissions
        let submissionsQuery = db.collection("submissions")
            .where("status", "==", "pending")
            .orderBy("submittedAt", "asc") // Grade oldest first
            .limit(limitCount);

        if (competencyFilter !== "All") {
            submissionsQuery = submissionsQuery.where("competency", "==", competencyFilter);
        }

        const submissionsSnap = await submissionsQuery.get();

        if (submissionsSnap.empty) {
            console.log("No pending submissions found.");
            return { success: true, gradedCount: 0, message: "No pending submissions found." };
        }

        console.log(`Found ${submissionsSnap.size} pending submissions. Processing...`);

        let gradedCount = 0;
        const examCache = new Map<string, any>();

        // 2. Loop through submissions
        for (const submissionDoc of submissionsSnap.docs) {
            const submission = submissionDoc.data();
            const examId = submission.examId;

            try {
                // Fetch Exam Data (with caching)
                let examData = examCache.get(examId);
                if (!examData) {
                    const examSnap = await db.collection("exams").doc(examId).get();
                    if (!examSnap.exists) {
                        console.error(`Exam ${examId} not found for submission ${submissionDoc.id}`);
                        // Mark as error so we don't get stuck in loop
                        await submissionDoc.ref.update({
                            status: "error",
                            feedback: "Linked Exam not found."
                        });
                        continue;
                    }
                    examData = examSnap.data();
                    examCache.set(examId, examData);
                }

                // Check if exam is multi-item (PISA style)
                const items = examData.items || [];
                let prompt = "";

                if (items.length > 0) {
                    // --- MULTI-ITEM GRADING ---
                    let itemsContext = "";
                    let totalMaxScore = 0;

                    items.forEach((item: any, index: number) => {
                        const itemMaxScore = item.score || 10; // Default to 10 if missing
                        totalMaxScore += itemMaxScore;

                        const answerObj = submission.answers ? submission.answers[item.id] : null;

                        // Format Student Answer based on type
                        let answerText = "No answer provided";
                        if (answerObj) {
                            switch (item.questionType) {
                                case 'multiple_choice':
                                    // Find option text if possible, or just ID
                                    const opt = item.options?.find((o: any) => o.id === answerObj.selectedOptionId);
                                    answerText = opt ? `Selected Option: "${opt.text}"` : `Selected Option ID: ${answerObj.selectedOptionId}`;
                                    break;
                                case 'multiple_select':
                                case 'checklist':
                                    const selectedIds = answerObj.selectedOptionIds || [];
                                    const selectedTexts = item.options?.filter((o: any) => selectedIds.includes(o.id)).map((o: any) => o.text);
                                    answerText = selectedTexts?.length ? `Selected: ${selectedTexts.join(", ")}` : `Selected IDs: ${selectedIds.join(", ")}`;
                                    break;
                                case 'matching':
                                    // Format matching pairs
                                    const pairs = answerObj.matchingPairs || {};
                                    answerText = Object.entries(pairs).map(([leftId, rightId]) => {
                                        const left = item.leftColumn?.find((l: any) => l.id === leftId)?.text || leftId;
                                        const right = item.rightColumn?.find((r: any) => r.id === rightId)?.text || rightId;
                                        return `${left} -> ${right}`;
                                    }).join("; ");
                                    break;
                                case 'drag_drop':
                                    // Format drag placements
                                    const placements = answerObj.dragDropPlacements || {};
                                    answerText = Object.entries(placements).map(([zoneId, dragId]) => {
                                        const zone = item.dropZones?.find((z: any) => z.id === zoneId)?.label || zoneId;
                                        const drag = item.dragItems?.find((d: any) => d.id === dragId)?.text || dragId;
                                        return `${zone} contains ${drag}`;
                                    }).join("; ");
                                    break;
                                default:
                                    answerText = answerObj.textAnswer || "No text provided";
                            }
                        }

                        itemsContext += `
[Item ${index + 1}]
ID: ${item.id}
Type: ${item.questionType}
Question: ${item.question}
Rubric/Correct Answer: ${item.rubricPrompt || "Grade based on correctness"}
Student Answer: ${answerText}
Max Score: ${itemMaxScore}
----------------------------------
`;
                    });

                    prompt = `
Role: Expert PISA Assessor & Teacher.
Scenario: ${examData.scenario || "No main scenario provided."}

Task: Grade the following ${items.length} items submitted by a student.
For each item, determine the raw score (0 to Max Score) and provide **VERBOSE, DETAILED, AND EDUCATIONAL feedback** in Thai.

**Feedback Requirements:**
1. **Explain the Why:** Don't just say "Correct" or "Wrong". Explain *why* the answer is correct or incorrect based on the scenario/rubric.
2. **Improvement:** If the score is not perfect, suggest specifically what the student missed or how they can improve their answer next time.
3. **Encouraging:** Use a supportive, teacher-like tone.
4. **Detail:** The feedback should be long enough to completely understand the assessment (2-3 sentences per item).

${itemsContext}

Output strictly valid JSON with this structure:
{
  "itemResults": [
    { "id": "item_id_from_input", "score": number, "feedback": "Detailed feedback for this specific item in Thai" }
  ],
  "summaryFeedback": "Overall comprehensive summary for the student in Thai, highlighting general strengths and areas for improvement."
}
`;
                } else {
                    // --- FALLBACK: OLD SINGLE QUESTION LOGIC ---
                    prompt = `
Role: PISA Grader.
Scenario: ${examData.scenario}
Question: ${examData.question}
Rubric: ${examData.rubricPrompt}
Student Answer: ${submission.answer || "No Answer"}

Task: Grade this answer 0-10 based strictly on the rubric. Provide **detailed, constructive feedback** in Thai language.
Output strictly JSON property names must be in quotes: { "score": number, "feedback": "string" }
`;
                }

                // Call Gemini
                console.log(`Sending prompt for submission ${submissionDoc.id} (Items: ${items.length})`);
                const result = await model.generateContent(prompt);
                const response = await result.response;

                const candidates = response.candidates;
                if (!candidates || candidates.length === 0) {
                    throw new Error("Gemini returned no candidates.");
                }
                const text = candidates[0].content.parts[0].text;
                if (!text) throw new Error("Experiments failed: No text in response.");

                // Parse JSON
                const jsonString = text.replace(/```json\n?|\n?```/g, "").trim();
                let parsed;
                try {
                    parsed = JSON.parse(jsonString);
                } catch (e) {
                    console.error("JSON Parse Error. Raw Text:", text);
                    throw new Error("Failed to parse Gemini response as JSON.");
                }

                // Process Results
                if (items.length > 0) {
                    // Multi-item handling
                    const itemResults = parsed.itemResults || [];
                    const itemScores: Record<string, number> = {};
                    let rawTotal = 0;
                    let totalMaxScore = 0; // Recalculate to be safe

                    // Calculate totals
                    items.forEach((item: any) => {
                        const s = Number(item.score);
                        totalMaxScore += (isNaN(s) ? 10 : s);
                    });

                    // Map results back to items
                    const detailedFeedback: Record<string, string> = {};

                    itemResults.forEach((res: any) => {
                        if (res.id) {
                            const validScore = typeof res.score === 'number' ? res.score : Number(res.score || 0);
                            // Clamp score to max just in case AI hallucinates a higher score
                            const itemDef = items.find((i: any) => i.id === res.id);
                            const max = itemDef ? (Number(itemDef.score) || 10) : 10;
                            const clampedScore = Math.min(validScore, max);

                            itemScores[res.id] = clampedScore;
                            detailedFeedback[res.id] = res.feedback || "AI did not provide specific feedback for this item.";
                            rawTotal += clampedScore;
                        }
                    });

                    // Normalize to 10
                    let finalScore = 0;
                    if (totalMaxScore > 0) {
                        finalScore = (rawTotal / totalMaxScore) * 10;
                        // Round to 1 decimal place
                        finalScore = Math.round(finalScore * 10) / 10;
                    }

                    const finalFeedback = parsed.summaryFeedback || "No summary provided.";

                    await submissionDoc.ref.update({
                        status: "graded",
                        score: finalScore,
                        feedback: finalFeedback,
                        itemScores: itemScores,
                        detailedFeedback: detailedFeedback,
                        gradedAt: admin.firestore.FieldValue.serverTimestamp()
                    });

                } else {
                    // Single item handling
                    const score = Math.min(Math.max(parsed.score, 0), 10);
                    const feedback = parsed.feedback || "No feedback provided.";

                    await submissionDoc.ref.update({
                        status: "graded",
                        score: score,
                        feedback: feedback,
                        gradedAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                }

                gradedCount++;

            } catch (err: any) {
                console.error(`Error grading submission ${submissionDoc.id}:`, err);

                // Update status to 'error' to prevent blocking the queue
                await submissionDoc.ref.update({
                    status: "error",
                    feedback: "AI Grading Failed: " + (err instanceof Error ? err.message : "Unknown error")
                });
            }
        }

        console.log(`Batch complete. Graded: ${gradedCount}`);
        return { success: true, gradedCount };

    } catch (error: any) {
        console.error("Critical error in gradeExamBatch execution:", error);
        // Ensure any HttpsErrors are passed through properly
        if (error instanceof HttpsError) {
            throw error;
        }
        throw new HttpsError("internal", `Unexpected error: ${error.message}`);
    }
});

// --- Email Notification Trigger ---

// Configure Nodemailer Transporter
// Note: You must enable 'Less secure apps' or ideally use App Passwords for Gmail
// Set ENV vars: EMAIL_USER (your gmail) and EMAIL_PASS (your app password)
// firebase functions:config:set email.user="your@gmail.com" email.pass="your-app-password"
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

export const sendGradedEmail = onDocumentUpdated("submissions/{submissionId}", async (event) => {
    const beforeData = event.data?.before.data();
    const afterData = event.data?.after.data();

    // Only email if status changed to 'graded' from 'pending' (or null)
    if (afterData?.status === "graded" && beforeData?.status !== "graded") {
        const submissionId = event.params.submissionId;
        const studentId = afterData.studentId;
        const examTitle = afterData.competency || "Exam Result";

        try {
            // Fetch User Email
            const userDoc = await db.collection("users").doc(studentId).get();
            const userEmail = userDoc.data()?.email;

            if (!userEmail) {
                console.log("No email found for user:", studentId);
                return;
            }

            const score = afterData.score;
            let level = "Bronze";
            if (score >= 8) level = "Gold";
            else if (score >= 5) level = "Silver";

            const certLink = `https://${process.env.GCLOUD_PROJECT}.web.app/certificate/${submissionId}`;
            // Note: Replace with actual custom domain if used. web.app is default.

            const mailOptions = {
                from: `"Hongson-CISA Assessment" <${process.env.EMAIL_USER}>`,
                to: userEmail,
                subject: `🎯 ผลการทดสอบสมรรถนะ: ${examTitle} - ตรวจเสร็จสิ้นแล้ว`,
                html: `
            <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 8px; padding: 20px;">
              <h2 style="color: #2563eb;">แจ้งผลการทดสอบ / Assessment Result</h2>
              <p>สวัสดีคุณ <strong>${afterData.studentName}</strong>,</p>
              
              <p>คำตอบของคุณสำหรับการทดสอบหัวข้อ <strong>${examTitle}</strong> ได้รับการตรวจเรียบร้อยแล้วโดยระบบ AI</p>
              
              <div style="background-color: #f8fafc; padding: 15px; border-radius: 6px; margin: 20px 0;">
                <p style="margin: 5px 0;"><strong>คะแนน (Score):</strong> ${score}/10</p>
                <p style="margin: 5px 0;"><strong>ระดับ (Level):</strong> <span style="color: ${level === 'Gold' ? '#ca8a04' : level === 'Silver' ? '#64748b' : '#b45309'}; font-weight: bold;">${level}</span></p>
              </div>

              <p>คุณสามารถดูผลการประเมินโดยละเอียดและดาวน์โหลดเกียรติบัตรได้ที่ลิงก์ด้านล่าง:</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${certLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">ดูเกียรติบัตร / View Certificate</a>
              </div>
              
              <p style="font-size: 12px; color: #666; margin-top: 30px; text-align: center;">
                © 2026 Hongson-CISA. All rights reserved.<br>
                <a href="${certLink}">${certLink}</a>
              </p>
            </div>
          `
            };

            await transporter.sendMail(mailOptions);
            console.log(`Email sent to ${userEmail} for submission ${submissionId}`);

        } catch (error) {
            console.error("Error sending email:", error);
        }
    }
});
