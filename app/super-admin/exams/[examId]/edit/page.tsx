"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { Exam, ExamItem, MediaType } from "@/types";
import {
    Loader2,
    Save,
    ArrowLeft,
    FileText,
    MonitorPlay,
    ListPlus,
    Trash2,
    Link2,
    Sparkles,
    AlertCircle,
    ExternalLink,
    Eye,
    CheckCircle
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput, GlassTextarea, GlassSelect } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import {
    COMPETENCIES_DATA,
    getAllCompetencyOptions,
    getSubCompetencyOptions,
    getCompetencyById,
    getSubCompetencyById,
} from "@/lib/data/competencies";

const generateItemId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function EditExamPage() {
    const params = useParams();
    const examId = params?.examId as string;
    const router = useRouter();
    const { user } = useAuth();
    const { isLoading: isAuthLoading } = useRoleProtection(['super_admin']);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        title: "",
        competency: "",
        competencyId: "",
        subCompetencyId: "",
        scenario: "",
        mediaType: "text" as MediaType,
        mediaUrl: "",
        isActive: true
    });

    const [items, setItems] = useState<ExamItem[]>([]);
    const [originalData, setOriginalData] = useState<Exam | null>(null);

    const competencyOptions = useMemo(() => getAllCompetencyOptions(), []);
    const subCompetencyOptions = useMemo(
        () => getSubCompetencyOptions(formData.competencyId),
        [formData.competencyId]
    );

    useEffect(() => {
        async function fetchExam() {
            if (!examId) return;

            try {
                const docRef = doc(db, "exams", examId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = { id: docSnap.id, ...docSnap.data() } as Exam;
                    setOriginalData(data);

                    setFormData({
                        title: data.title || "",
                        competency: data.competency || "",
                        competencyId: data.competencyId || "",
                        subCompetencyId: data.subCompetencyId || "",
                        scenario: data.scenario || "",
                        mediaType: data.mediaType || "text",
                        mediaUrl: data.mediaUrl || "",
                        isActive: data.isActive ?? true
                    });

                    // Ensure all items have IDs
                    const itemsWithIds = (data.items || []).map(item => ({
                        ...item,
                        id: item.id || generateItemId()
                    }));
                    setItems(itemsWithIds);
                } else {
                    setError("ไม่พบข้อสอบที่ต้องการแก้ไข");
                }
            } catch (err) {
                console.error("Error fetching exam:", err);
                setError("เกิดข้อผิดพลาดในการโหลดข้อมูล");
            } finally {
                setLoading(false);
            }
        }

        if (!isAuthLoading) {
            fetchExam();
        }
    }, [examId, isAuthLoading]);

    const handleCompetencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const competencyId = e.target.value;
        const competency = getCompetencyById(competencyId);
        setFormData(prev => ({
            ...prev,
            competencyId,
            subCompetencyId: "",
            competency: competency?.description || ""
        }));
    };

    const handleSubCompetencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const subCompetencyId = e.target.value;
        const competency = getCompetencyById(formData.competencyId);
        const subCompetency = getSubCompetencyById(formData.competencyId, subCompetencyId);

        const competencyString = subCompetency
            ? `${competency?.description} - ${subCompetency.title}`
            : competency?.description || "";

        setFormData(prev => ({
            ...prev,
            subCompetencyId,
            competency: competencyString
        }));
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleMediaTypeChange = (type: MediaType) => {
        setFormData(prev => ({ ...prev, mediaType: type }));
    };

    const handleItemChange = (itemId: string, field: keyof ExamItem, value: string | number) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, [field]: value } : item
        ));
    };

    const addItem = () => {
        setItems(prev => [...prev, { id: generateItemId(), question: "", score: 10, rubricPrompt: "" }]);
    };

    const removeItem = (itemId: string) => {
        if (items.length <= 1) return;
        setItems(prev => prev.filter(item => item.id !== itemId));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !examId) return;

        const hasEmptyItems = items.some(item => !item.question.trim() || !item.rubricPrompt.trim());
        if (hasEmptyItems) {
            setError("กรุณากรอกคำถามและเกณฑ์การตรวจสำหรับทุกข้อย่อย");
            return;
        }

        if (formData.mediaType === 'simulation' && !formData.mediaUrl.trim()) {
            setError("กรุณาใส่ URL ของ Simulation");
            return;
        }

        setSaving(true);
        setError(null);

        try {
            await updateDoc(doc(db, "exams", examId), {
                title: formData.title,
                competency: formData.competency,
                competencyId: formData.competencyId,
                subCompetencyId: formData.subCompetencyId,
                scenario: formData.scenario,
                mediaType: formData.mediaType,
                mediaUrl: formData.mediaType === 'simulation' ? formData.mediaUrl : "",
                items: items,
                isActive: formData.isActive,
                updatedAt: serverTimestamp(),
                updatedBy: user.uid,
            });

            setSuccessMessage("บันทึกการแก้ไขสำเร็จ!");
            setTimeout(() => {
                router.push("/super-admin/exams");
            }, 1500);
        } catch (err) {
            console.error("Error updating exam:", err);
            setError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        } finally {
            setSaving(false);
        }
    };

    if (isAuthLoading || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-[var(--accent-primary)]" size={48} />
                <p className="text-[var(--text-secondary)]">กำลังโหลดข้อมูลข้อสอบ...</p>
            </div>
        );
    }

    if (error && !originalData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <AlertCircle className="text-red-500" size={48} />
                <p className="text-red-500 font-medium">{error}</p>
                <Link href="/super-admin/exams">
                    <GlassButton variant="ghost" icon={<ArrowLeft size={18} />}>
                        กลับไปหน้าคลังข้อสอบ
                    </GlassButton>
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/super-admin/exams"
                    className="p-2 rounded-xl hover:bg-[var(--glass-bg)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">✏️ แก้ไขข้อสอบ</h1>
                    <p className="text-[var(--text-secondary)] line-clamp-1">{originalData?.title}</p>
                </div>
                <GlassBadge variant={formData.isActive ? "success" : "secondary"}>
                    {formData.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                </GlassBadge>
            </div>

            {/* Success Message */}
            {successMessage && (
                <GlassCard hover={false} className="border-emerald-500/50 bg-emerald-500/5">
                    <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle size={24} />
                        <p className="font-medium">{successMessage}</p>
                    </div>
                </GlassCard>
            )}

            {/* Error Message */}
            {error && (
                <GlassCard hover={false} className="border-red-500/50 bg-red-500/5">
                    <div className="flex items-center gap-3 text-red-500">
                        <AlertCircle size={24} />
                        <p className="font-medium">{error}</p>
                    </div>
                </GlassCard>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Basic Info */}
                <GlassCard hover={false}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-500/5 text-[var(--accent-primary)]">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">ข้อมูลพื้นฐาน</h2>
                    </div>

                    <div className="space-y-6">
                        <GlassInput
                            label="ชื่อข้อสอบ"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="เช่น วิเคราะห์ภาวะโลกร้อน"
                            required
                        />

                        {/* Active Toggle */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                            <div>
                                <p className="font-medium text-[var(--text-primary)]">สถานะการใช้งาน</p>
                                <p className="text-sm text-[var(--text-tertiary)]">
                                    เปิดหรือปิดข้อสอบนี้ (นักเรียนจะไม่เห็นถ้าปิดใช้งาน)
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData(prev => ({ ...prev, isActive: !prev.isActive }))}
                                className={`relative w-14 h-8 rounded-full transition-all ${formData.isActive
                                    ? "bg-emerald-500"
                                    : "bg-slate-400"
                                    }`}
                            >
                                <span className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-md transition-all ${formData.isActive ? "left-7" : "left-1"
                                    }`} />
                            </button>
                        </div>

                        {/* Competency Selection */}
                        <div className="p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={16} className="text-[var(--accent-primary)]" />
                                <span className="text-sm font-medium text-[var(--text-secondary)]">
                                    สมรรถนะ (CBE Thailand)
                                </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <GlassSelect
                                    label="สมรรถนะหลัก"
                                    name="competencyId"
                                    value={formData.competencyId}
                                    onChange={handleCompetencyChange}
                                    options={[
                                        { value: "", label: "-- เลือกสมรรถนะหลัก --" },
                                        ...competencyOptions
                                    ]}
                                />

                                <GlassSelect
                                    label="สมรรถนะย่อย"
                                    name="subCompetencyId"
                                    value={formData.subCompetencyId}
                                    onChange={handleSubCompetencyChange}
                                    disabled={!formData.competencyId}
                                    options={[
                                        { value: "", label: formData.competencyId ? "-- เลือกสมรรถนะย่อย --" : "เลือกสมรรถนะหลักก่อน" },
                                        ...subCompetencyOptions
                                    ]}
                                />
                            </div>

                            {formData.competency && (
                                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <p className="text-sm text-blue-600 dark:text-blue-400">
                                        <span className="font-medium">สมรรถนะที่เลือก:</span> {formData.competency}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </GlassCard>

                {/* Stimulus Section */}
                <GlassCard hover={false}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-[var(--accent-success)]">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">สถานการณ์/Stimulus</h2>
                        <GlassBadge variant="secondary">PISA-Style</GlassBadge>
                    </div>

                    {/* Media Type Toggle */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                            ประเภท Stimulus
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => handleMediaTypeChange('text')}
                                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${formData.mediaType === 'text'
                                    ? 'border-blue-500 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                                    : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                                    }`}
                            >
                                <FileText size={24} />
                                <div className="text-left">
                                    <p className="font-semibold">Text Scenario</p>
                                    <p className="text-xs opacity-70">สถานการณ์แบบข้อความ</p>
                                </div>
                            </button>
                            <button
                                type="button"
                                onClick={() => handleMediaTypeChange('simulation')}
                                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${formData.mediaType === 'simulation'
                                    ? 'border-purple-500 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                    : 'border-[var(--glass-border)] bg-[var(--glass-bg)] text-[var(--text-secondary)] hover:border-[var(--text-tertiary)]'
                                    }`}
                            >
                                <MonitorPlay size={24} />
                                <div className="text-left">
                                    <p className="font-semibold">Simulation</p>
                                    <p className="text-xs opacity-70">URL ภายนอก (เช่น PhET)</p>
                                </div>
                            </button>
                        </div>
                    </div>

                    {/* Conditional Content */}
                    {formData.mediaType === 'text' ? (
                        <GlassTextarea
                            label="สถานการณ์/ข้อมูลตั้งต้น"
                            name="scenario"
                            value={formData.scenario}
                            onChange={handleChange}
                            rows={8}
                            placeholder="อธิบายปรากฏการณ์ทางวิทยาศาสตร์..."
                            required
                        />
                    ) : (
                        <div className="space-y-4">
                            <div className="relative">
                                <GlassInput
                                    label="Simulation URL"
                                    name="mediaUrl"
                                    value={formData.mediaUrl}
                                    onChange={handleChange}
                                    placeholder="https://phet.colorado.edu/sims/html/..."
                                    required
                                />
                                <Link2 className="absolute right-4 top-9 text-[var(--text-tertiary)]" size={18} />
                            </div>

                            {/* Preview Link */}
                            {formData.mediaUrl && (
                                <div className="flex items-center gap-2">
                                    <a
                                        href={formData.mediaUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 text-sm text-purple-500 hover:text-purple-600 transition-colors"
                                    >
                                        <ExternalLink size={14} />
                                        เปิดดู Simulation ในแท็บใหม่
                                    </a>
                                </div>
                            )}

                            <GlassTextarea
                                label="คำอธิบายเพิ่มเติม (Optional)"
                                name="scenario"
                                value={formData.scenario}
                                onChange={handleChange}
                                rows={3}
                                placeholder="คำแนะนำสำหรับนักเรียนในการใช้งาน Simulation..."
                            />
                        </div>
                    )}
                </GlassCard>

                {/* Items Section */}
                <GlassCard hover={false}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500/20 to-indigo-500/5 text-indigo-500">
                                <ListPlus size={20} />
                            </div>
                            <h2 className="text-lg font-semibold text-[var(--text-primary)]">คำถามย่อย (Items)</h2>
                            <GlassBadge variant="secondary">{items.length} ข้อ</GlassBadge>
                        </div>
                        <GlassButton
                            type="button"
                            variant="ghost"
                            size="sm"
                            icon={<ListPlus size={16} />}
                            onClick={addItem}
                        >
                            เพิ่มข้อย่อย
                        </GlassButton>
                    </div>

                    <div className="space-y-6">
                        {items.map((item, index) => (
                            <div
                                key={item.id}
                                className="p-5 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] relative group"
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-2">
                                        <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-sm font-bold">
                                            {index + 1}
                                        </span>
                                        <span className="text-sm font-medium text-[var(--text-secondary)]">
                                            ข้อย่อยที่ {index + 1}
                                        </span>
                                    </div>
                                    {items.length > 1 && (
                                        <button
                                            type="button"
                                            onClick={() => removeItem(item.id)}
                                            className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                            title="ลบข้อนี้"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="md:col-span-3">
                                            <GlassTextarea
                                                label="คำถาม"
                                                value={item.question}
                                                onChange={(e) => handleItemChange(item.id, 'question', e.target.value)}
                                                rows={2}
                                                placeholder="คำถามที่ต้องการให้นักเรียนตอบ..."
                                                required
                                            />
                                        </div>
                                        <div>
                                            <GlassInput
                                                label="คะแนนเต็ม"
                                                type="number"
                                                value={item.score.toString()}
                                                onChange={(e) => handleItemChange(item.id, 'score', parseInt(e.target.value) || 0)}
                                                min={1}
                                                max={100}
                                                required
                                            />
                                        </div>
                                    </div>

                                    <GlassTextarea
                                        label="เกณฑ์การตรวจ AI (Rubric Prompt)"
                                        value={item.rubricPrompt}
                                        onChange={(e) => handleItemChange(item.id, 'rubricPrompt', e.target.value)}
                                        rows={3}
                                        placeholder="คำสั่งสำหรับ AI..."
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <button
                        type="button"
                        onClick={addItem}
                        className="mt-4 w-full p-4 rounded-xl border-2 border-dashed border-[var(--glass-border)] text-[var(--text-tertiary)] hover:border-indigo-500/50 hover:text-indigo-500 transition-all flex items-center justify-center gap-2"
                    >
                        <ListPlus size={20} />
                        เพิ่มคำถามย่อยใหม่
                    </button>
                </GlassCard>

                {/* Actions */}
                <div className="flex items-center justify-between gap-4 pt-4">
                    <Link href="/super-admin/exams">
                        <GlassButton variant="ghost" type="button" icon={<ArrowLeft size={18} />}>
                            ยกเลิก
                        </GlassButton>
                    </Link>
                    <div className="flex gap-3">
                        <Link href={`/student/exam/${examId}`} target="_blank">
                            <GlassButton variant="ghost" type="button" icon={<Eye size={18} />}>
                                ดูตัวอย่าง
                            </GlassButton>
                        </Link>
                        <GlassButton
                            type="submit"
                            variant="primary"
                            loading={saving}
                            icon={<Save size={18} />}
                        >
                            บันทึกการแก้ไข
                        </GlassButton>
                    </div>
                </div>
            </form>
        </div>
    );
}
