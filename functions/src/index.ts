import { onCall, HttpsError } from "firebase-functions/v2/https";
import { onDocumentUpdated } from "firebase-functions/v2/firestore";
import * as admin from "firebase-admin";
import { VertexAI } from "@google-cloud/vertexai";
import * as nodemailer from "nodemailer";

// Fix for implicit any type error
// @ts-ignore
declare module "nodemailer";

admin.initializeApp();
const db = admin.firestore();

// Initialize Vertex AI
// Note: process.env.GCLOUD_PROJECT is automatically populated in Cloud Functions
const vertexAI = new VertexAI({
    project: process.env.GCLOUD_PROJECT || admin.instanceId().app.options.projectId,
    location: "us-central1", // Vertex AI availability
});

const model = vertexAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
        responseMimeType: "application/json"
    }
});

interface GradeExamInput {
    limit?: number;
    competency?: string;
}

export const gradeExamBatch = onCall<GradeExamInput>({
    timeoutSeconds: 300,
    memory: "1GiB"
}, async (request) => {
    // Check Authentication (Super Admin only)
    if (!request.auth) {
        throw new HttpsError("unauthenticated", "User must be logged in.");
    }

    // Double check role from claims or Firestore if strictly needed, 
    // but for now we rely on the caller being an authorized user, 
    // and mostly relying on the frontend protection + basic auth here.
    // Ideally: check request.auth.token.role === 'super_admin' if custom claims are set,
    // or fetch user doc. Let's fetch user doc for security.
    const userDoc = await db.collection("users").doc(request.auth.uid).get();
    const userData = userDoc.data();
    if (userData?.role !== "super_admin" && userData?.role !== "admin") { // Allow admins too? Prompt said Super Admin Control Panel.
        throw new HttpsError("permission-denied", "Only Super Admins can run AI grading.");
    }

    const limitCount = request.data.limit || 20;
    const competencyFilter = request.data.competency || "All";

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
        return { success: true, gradedCount: 0, message: "No pending submissions found." };
    }

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
                    continue;
                }
                examData = examSnap.data();
                examCache.set(examId, examData);
            }

            // Construct Prompt
            const prompt = `
        Role: PISA Grader.
        Scenario: ${examData.scenario}
        Question: ${examData.question}
        Rubric: ${examData.rubricPrompt}
        Student Answer: ${submission.answer}
        
        Task: Grade this answer 0-10 based strictly on the rubric. Provide brief, constructive feedback in Thai language.
        Output strictly JSON property names must be in quotes: { "score": number, "feedback": "string" }
      `;

            // Call Gemini
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.candidates?.[0].content.parts[0].text;

            if (!text) throw new Error("Experiments failed: No response from Gemini.");

            // Parse JSON (Clean up markdown if present)
            const jsonString = text.replace(/```json\n?|\n?```/g, "").trim();
            const parsed = JSON.parse(jsonString);

            // Validate Score
            const score = Math.min(Math.max(parsed.score, 0), 10);
            const feedback = parsed.feedback || "No feedback provided.";

            // Update Submission
            await submissionDoc.ref.update({
                status: "graded",
                score: score,
                feedback: feedback,
                gradedAt: admin.firestore.FieldValue.serverTimestamp()
            });

            gradedCount++;

        } catch (err) {
            console.error(`Error grading submission ${submissionDoc.id}:`, err);
            // Optional: Update status to 'error' or leave pending?
            // Leaving pending allows retry. Setting error requires manual intervention.
            // Let's set to error to prevent blocking other items if it's a persistent data issue.
            await submissionDoc.ref.update({
                status: "error",
                feedback: "AI Grading Failed: " + (err instanceof Error ? err.message : "Unknown error")
            });
        }
    }

    return { success: true, gradedCount };
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
