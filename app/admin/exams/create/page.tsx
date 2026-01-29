"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Save, ArrowLeft, FileText, Cpu } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput, GlassTextarea, GlassSelect } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";

const COMPETENCIES = [
    { value: "1. อธิบายหลักการทางวิทยาศาสตร์", label: "1. อธิบายหลักการทางวิทยาศาสตร์" },
    { value: "2. การแปลความหมายข้อมูล", label: "2. การแปลความหมายข้อมูล" },
    { value: "3. การออกแบบการสืบค้น", label: "3. การออกแบบการสืบค้น" },
    { value: "4. การให้เหตุผลโต้แย้ง", label: "4. การให้เหตุผลโต้แย้ง" },
    { value: "5. ผลกระทบต่อสังคม", label: "5. ผลกระทบต่อสังคม" },
    { value: "6. ธรรมชาติของวิทยาศาสตร์", label: "6. ธรรมชาติของวิทยาศาสตร์" },
];

export default function CreateExamPage() {
    const { user } = useAuth();
    const { isLoading, isAuthorized } = useRoleProtection(['admin', 'super_admin']);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        competency: "",
        scenario: "",
        question: "",
        rubricPrompt: "",
        isActive: true
    });

    useEffect(() => {
        if (user) {
            if (user.role === 'admin' && user.assignedCompetency) {
                setFormData(prev => ({ ...prev, competency: user.assignedCompetency! }));
            } else if (user.role === 'super_admin' && !formData.competency) {
                setFormData(prev => ({ ...prev, competency: COMPETENCIES[0].value }));
            }
        }
    }, [user]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, "exams"), {
                ...formData,
                createdBy: user.uid,
                createdAt: serverTimestamp(),
            });

            router.push("/admin/dashboard");
        } catch (error) {
            console.error("Error creating exam:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading || !isAuthorized) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="animate-spin text-[var(--accent-primary)]" size={48} />
            </div>
        );
    }

    const isCompetencyDisabled = user?.role === 'admin';

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link 
                    href="/admin/dashboard" 
                    className="p-2 rounded-xl hover:bg-[var(--glass-bg)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">สร้างข้อสอบใหม่</h1>
                    <p className="text-[var(--text-secondary)]">ออกแบบสถานการณ์และคำถามสำหรับประเมินสมรรถนะ</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <GlassCard hover={false}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-[var(--accent-primary)]">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">ข้อมูลพื้นฐาน</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <GlassInput
                            label="ชื่อข้อสอบ"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="เช่น วิเคราะห์ภาวะโลกร้อน"
                            required
                        />

                        <div className="space-y-2">
                            <GlassSelect
                                label="สมรรถนะที่ต้องการวัด"
                                name="competency"
                                value={formData.competency}
                                onChange={handleChange}
                                disabled={isCompetencyDisabled}
                                options={COMPETENCIES}
                                required
                            />
                            {isCompetencyDisabled && (
                                <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                                    <GlassBadge variant="warning">ล็อก</GlassBadge>
                                    ตามสมรรถนะที่ได้รับมอบหมาย
                                </p>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Scenario & Question */}
                <GlassCard hover={false}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-[var(--accent-success)]">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">เนื้อหาข้อสอบ</h2>
                    </div>

                    <div className="space-y-6">
                        <GlassTextarea
                            label="สถานการณ์/เนื้อหากระตุ้น"
                            name="scenario"
                            value={formData.scenario}
                            onChange={handleChange}
                            rows={8}
                            placeholder="อธิบายปรากฏการณ์ทางวิทยาศาสตร์ การทดลอง หรือสถานการณ์ที่นักเรียนจะต้องวิเคราะห์..."
                            required
                        />

                        <GlassTextarea
                            label="คำถามสำหรับประเมิน"
                            name="question"
                            value={formData.question}
                            onChange={handleChange}
                            rows={3}
                            placeholder="คำถามที่ต้องการให้นักเรียนตอบ..."
                            required
                        />
                    </div>
                </GlassCard>

                {/* AI Rubric */}
                <GlassCard hover={false}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 text-[var(--accent-secondary)]">
                            <Cpu size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">เกณฑ์การตรวจ AI</h2>
                        <GlassBadge variant="secondary">ใช้ภายใน</GlassBadge>
                    </div>

                    <GlassTextarea
                        label="คำสั่งสำหรับ AI ให้คะแนน"
                        name="rubricPrompt"
                        value={formData.rubricPrompt}
                        onChange={handleChange}
                        rows={4}
                        placeholder="คำแนะนำสำหรับ AI: เช่น 'ให้คะแนนเต็ม 10 ถ้านักเรียนกล่าวถึงการอนุรักษ์โมเมนตัม และอธิบายหลักการได้ถูกต้อง...'"
                        hint="คำสั่งนี้จะถูกส่งให้ AI เพื่อใช้ในการตรวจและให้คะแนนคำตอบของนักเรียน"
                        required
                    />
                </GlassCard>

                {/* Actions */}
                <div className="flex items-center justify-end gap-4 pt-4">
                    <Link href="/admin/dashboard">
                        <GlassButton variant="ghost" type="button">
                            ยกเลิก
                        </GlassButton>
                    </Link>
                    <GlassButton
                        type="submit"
                        variant="primary"
                        loading={isSubmitting}
                        icon={<Save size={18} />}
                    >
                        สร้างข้อสอบ
                    </GlassButton>
                </div>
            </form>
        </div>
    );
}
