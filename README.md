# Hongson-CISA: Competency-Based Assessment Platform

ระบบวัดและประเมินผลสมรรถนะผู้เรียนตามแนวทาง PISA ด้วย AI (Hongson-CISA)

## 📋 ภาพรวมระบบ (System Overview)

**Hongson-CISA** คือแพลตฟอร์มประเมินสมรรถนะทางวิทยาศาสตร์ที่ออกแบบตามกรอบ PISA โดยใช้ AI (Gemini) ในการตรวจข้อสอบอัตนัยและประเมินสมรรถนะ 4 มิติ ระบบรองรับการทำงานแบบ Real-time พร้อม Interface ที่ออกแบบมาสำหรับการสอบที่มี Simulation และ Scenario ซับซ้อน

---

## 🏛️ สถาปัตยกรรมระบบ: 5 เสาหลัก (The 5 Architectural Pillars)

โปรเจคนี้สร้างบน **5 เสาหลักหลัก** ที่แยกความรับผิดชอบชัดเจน:

### เสาที่ 1: Frontend Framework (Next.js 16 + React 19)
**บทบาท:** ส่วนแสดงผลและประสบการณ์ผู้ใช้

```
Tech Stack:
├── Next.js 16 (App Router) - SSR/SSG Framework
├── React 19 - UI Library
├── TypeScript 5 - Type Safety
└── Lucide React - Icon System
```

**จุดเด่นที่ใช้:**
- **App Router:** ใช้ File-based routing ของ Next.js 16
- **Server/Client Components:** แยกการทำงานระหว่าง Server และ Client อย่างชัดเจน
- **Type Safety:** ใช้ TypeScript กำหนด Interface สำหรับ Exam, Submission, User อย่างเข้มงวด

---

### เสาที่ 2: Backend & Infrastructure (Firebase Ecosystem)
**บทบาท:** ระบบฝั่งเซิร์ฟเวอร์, ฐานข้อมูล, และ Authentication

```
Firebase Stack:
├── Authentication - JWT-based Auth + Role Management
├── Firestore (NoSQL) - Real-time Database
├── Cloud Functions - Serverless API
└── Storage - เก็บไฟล์แนบ (รูปภาพในโจทย์)
```

**Data Architecture:**
```
Firestore Collections:
├── users (students, admins, super_admins)
├── exams (ข้อสอบ + items)
├── submissions (คำตอบ + ผลประเมิน)
└── submission_archives (ข้อมูลถาวร)
```

**จุดเด่น:**
- **Real-time Updates:** ใช้ Firestore onSnapshot สำหรับข้อมูลแบบ Real-time
- **Role-based Access:** 3 ระดับ (student, admin, super_admin) ควบคุมสิทธิ์ผ่าน Firestore Rules
- **Offline Support:** Firestore รองรับการทำงานแบบ Offline ช่วย backup ข้อมูลชั่วคราว

---

### เสาที่ 3: AI Assessment Engine (Google Gemini API)
**บทบาท:** ระบบตรวจข้อสอบและประเมินสมรรถนะอัตโนมัติ

```
AI Pipeline:
├── Content Analysis - วิเคราะห์คำตอบอัตนัย
├── Score Calculation - ให้คะแนนตาม Rubric
├── Feedback Generation - สร้างข้อเสนอแนะ
└── Competency Assessment - ประเมิน 4 มิติ
```

**Competency Evaluation (4 Dimensions):**
1. **Understanding** (การเข้าใจปรากฏการณ์) - คะแนน 1-4
2. **System Thinking** (การเชื่อมโยงความสัมพันธ์) - คะแนน 1-4
3. **Technology** (เทคโนโลยี) - คะแนน 1-4
4. **Attributes** (คุณลักษณะ) - คะแนน 1-4

**Scoring Algorithm:**
```typescript
// คำนวณค่าเฉลี่ยและปัดเศษตามกฎ (≥0.5 ปัดขึ้น)
const average = Math.round((u + s + t + a) / 4);
```

---

### เสาที่ 4: State Management & Data Flow
**บทบาท:** การจัดการ State และการไหลของข้อมูลในแอป

```
State Architecture:
├── AuthContext - จัดการ Authentication State
├── Local Storage - Auto-save ระหว่างทำข้อสอบ
├── React Hooks - useState, useEffect สำหรับ Local State
└── Firestore Real-time - Sync ข้อมูลกับ Server
```

**Key Patterns:**
- **Context API:** ใช้ AuthContext กระจายข้อมูลผู้ใช้ทั้งแอป
- **Auto-save Mechanism:** บันทึกคำตอบลง LocalStorage ทุก 30 วินาที
- **Optimistic UI:** แสดงผลทันทีก่อนรอ Response จาก Server

---

### เสาที่ 5: UI/UX Design System (Tailwind + Glassmorphism)
**บทบาท:** ระบบการออกแบบ Interface และประสบการณ์ผู้ใช้

```
Design System:
├── Tailwind CSS 4 - Utility-first Styling
├── Custom Glassmorphism Theme - ดีไซน์โปร่งใส
├── Responsive Design - รองรับ Desktop/Tablet/Mobile
└── Accessibility - รองรับการเข้าถึงทุกกลุ่ม
```

**3-Panel Exam Layout:**
```
┌─────────────────────────────────────┐
│  Simulation Panel  │  Questions     │
│  (Top-Left)        │  (Right -      │
├────────────────────┤   Full Height) │
│  Scenario Panel    │                │
│  (Bottom-Left)     │                │
└─────────────────────────────────────┘
```

**Interactive Features:**
- **Collapsible Panels:** นักเรียนซ่อน/แสดงแต่ละ panel ได้
- **Font Size Slider:** ปรับขนาดตัวอักษร 14-24px
- **Drag & Drop:** จัดเรียงคำตอบแบบลากวาง
- **Print Report:** ระบบพิมพ์รายงานสมรรถนะเป็น PDF

---

## 🗂️ โครงสร้างโปรเจค (Project Structure)

```
HONGSON-CISA/
├── app/                          # Next.js App Router
│   ├── student/
│   │   ├── exam/[examId]/        # หน้าทำข้อสอบ (3-Panel Layout)
│   │   ├── result/[submissionId]/# หน้าผลสอบ + พิมพ์รายงาน
│   │   └── dashboard             # หน้าหลักนักเรียน
│   ├── admin/                    # Admin Dashboard
│   ├── super-admin/              # Super Admin Controls
│   └── api/                      # API Routes (ถ้ามี)
│
├── components/                   # React Components
│   ├── exam/                     # คอมโพเนนต์หน้าสอบ
│   │   ├── ProfessionalExamLayout.tsx  # Layout 3 หน้าต่าง
│   │   └── SimulationViewer.tsx        # แสดง Simulation
│   └── ui/                       # UI Components ทั่วไป
│
├── context/
│   └── AuthContext.tsx           # จัดการ Authentication State
│
├── hooks/
│   └── useRoleProtection.ts      # Hook ตรวจสอบสิทธิ์
│
├── lib/
│   └── firebase.ts               # Firebase Configuration
│
├── functions/                    # Firebase Cloud Functions
│   └── src/
│       └── assessCompetency.ts   # ฟังก์ชันประเมินสมรรถนะ
│
├── types/
│   └── index.ts                  # TypeScript Interfaces
│
├── assessments/                  # ข้อมูลข้อสอบตัวอย่าง
└── public/                       # Static Assets
```

---

## 🚀 เริ่มต้นใช้งาน (Getting Started)

### 1. ติดตั้ง Dependencies
```bash
npm install
```

### 2. ตั้งค่า Environment Variables
สร้างไฟล์ `.env.local`:
```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Gemini API (สำหรับตรวจข้อสอบ)
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Run Development Server
```bash
npm run dev
```

เข้าถึงได้ที่: `http://localhost:3000`

### 4. Build for Production
```bash
npm run build
```

---

## 🎯 ฟีเจอร์หลัก (Core Features)

### สำหรับนักเรียน (Student)
- [x] ระบบทำข้อสอบ 3-Panel (Simulation + Scenario + Questions)
- [x] Auto-save คำตอบลง LocalStorage
- [x] ปรับขนาดตัวอักษร (Font Size Slider)
- [x] ดูผลสอบพร้อม AI Feedback
- [x] พิมพ์รายงานสมรรถนะ (Competency Report)

### สำหรับครู/Admin
- [x] สร้างข้อสอบพร้อม Scenario และ Simulation
- [x] จัดการนักเรียน (Import CSV)
- [x] ดูผลสอบรายบุคคลและสถิติ

### สำหรับ Super Admin
- [x] ควบคุมการตั้งค่า AI
- [x] จัดการระบบทั้งหมด

---

## 🧠 ระบบประเมินสมรรถนะ (Competency Assessment)

ระบบประเมินผลตามกรอบสมรรถนะ 4 มิติ:

| มิติ | คำอธิบาย | เกณฑ์ |
|------|---------|--------|
| **Understanding** | ความเข้าใจทฤษฎีและหลักการ | 1-4 คะแนน |
| **System Thinking** | การเชื่อมโยงและวิเคราะห์เชิงระบบ | 1-4 คะแนน |
| **Technology** | ทักษะการใช้เทคโนโลยีและเครื่องมือ | 1-4 คะแนน |
| **Attributes** | คุณลักษณะและทัศนคติ | 1-4 คะแนน |

**ระดับผลประเมิน:**
- 4 = เหนือความคาดหมาย (Advanced)
- 3 = สามารถ (Proficient) 
- 2 = กำลังพัฒนา (Developing)
- 1 = เริ่มต้น (Starting)

---

## 📄 License & Credits

**พัฒนาโดย:** นายสาธิต ศิริวัชน์  
**สังกัด:** โครงการ Hongson-CISA  
**ลิขสิทธิ์:** © 2026 สงวนลิขสิทธิ์

---

*เอกสารฉบับนี้จัดทำขึ้นสำหรับนักพัฒนา (Developers) และผู้ดูแลระบบ*