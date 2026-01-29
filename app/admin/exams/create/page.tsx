"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { Loader2, Save, ArrowLeft, FileText, Cpu, MonitorPlay, ListPlus, Trash2, Lightbulb, Link2, ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput, GlassTextarea, GlassSelect } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import { ExamItem, MediaType } from "@/types";
import { 
    COMPETENCIES_DATA, 
    getAllCompetencyOptions, 
    getSubCompetencyOptions, 
    getCompetencyById, 
    getSubCompetencyById,
    type SubCompetency 
} from "@/lib/data/competencies";

const LEGACY_COMPETENCIES = [
    { value: "1. อธิบายหลักการทางวิทยาศาสตร์", label: "1. อธิบายหลักการทางวิทยาศาสตร์" },
    { value: "2. การแปลความหมายข้อมูล", label: "2. การแปลความหมายข้อมูล" },
    { value: "3. การออกแบบการสืบค้น", label: "3. การออกแบบการสืบค้น" },
    { value: "4. การให้เหตุผลโต้แย้ง", label: "4. การให้เหตุผลโต้แย้ง" },
    { value: "5. ผลกระทบต่อสังคม", label: "5. ผลกระทบต่อสังคม" },
    { value: "6. ธรรมชาติของวิทยาศาสตร์", label: "6. ธรรมชาติของวิทยาศาสตร์" },
];

const generateItemId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

export default function CreateExamPage() {
    const { user } = useAuth();
    const { isLoading, isAuthorized } = useRoleProtection(['admin', 'super_admin']);
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

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

    const competencyOptions = useMemo(() => getAllCompetencyOptions(), []);
    const subCompetencyOptions = useMemo(
        () => getSubCompetencyOptions(formData.competencyId),
        [formData.competencyId]
    );

    const selectedSubCompetency = useMemo((): SubCompetency | undefined => {
        if (!formData.competencyId || !formData.subCompetencyId) return undefined;
        return getSubCompetencyById(formData.competencyId, formData.subCompetencyId);
    }, [formData.competencyId, formData.subCompetencyId]);

    const [items, setItems] = useState<ExamItem[]>([
        { id: generateItemId(), question: "", score: 10, rubricPrompt: "" }
    ]);

    useEffect(() => {
        if (user) {
            if (user.role === 'admin' && user.assignedCompetency) {
                setFormData(prev => ({ ...prev, competency: user.assignedCompetency! }));
            } else if (user.role === 'super_admin' && !formData.competencyId && COMPETENCIES_DATA.length > 0) {
                const firstCompetency = COMPETENCIES_DATA[0];
                setFormData(prev => ({ 
                    ...prev, 
                    competencyId: firstCompetency.id,
                    competency: firstCompetency.description
                }));
            }
        }
    }, [user]);

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

    const applyRecommendedMedia = () => {
        if (selectedSubCompetency) {
            const recommended = selectedSubCompetency.recommendedMedia;
            if (recommended === 'simulation' || recommended === 'text') {
                setFormData(prev => ({ ...prev, mediaType: recommended }));
            } else if (recommended === 'hybrid') {
                setFormData(prev => ({ ...prev, mediaType: 'simulation' }));
            }
        }
    };

    const isHybridMode = selectedSubCompetency?.recommendedMedia === 'hybrid';

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

    const researchSuggestion = useMemo(() => {
        if (!selectedSubCompetency) return null;
        
        const iconMap: Record<string, typeof MonitorPlay> = {
            simulation: MonitorPlay,
            text: FileText,
            image: FileText,
            hybrid: MonitorPlay
        };
        
        return {
            type: selectedSubCompetency.recommendedMedia,
            message: selectedSubCompetency.researchTip,
            icon: iconMap[selectedSubCompetency.recommendedMedia] || FileText,
            subCompetencyTitle: selectedSubCompetency.title,
            isHybrid: selectedSubCompetency.recommendedMedia === 'hybrid'
        };
    }, [selectedSubCompetency]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        const hasEmptyItems = items.some(item => !item.question.trim() || !item.rubricPrompt.trim());
        if (hasEmptyItems) {
            alert("กรุณากรอกคำถามและเกณฑ์การตรวจสำหรับทุกข้อย่อย");
            return;
        }

        if (formData.mediaType === 'simulation' && !formData.mediaUrl.trim()) {
            alert("กรุณาใส่ URL ของ Simulation");
            return;
        }

        setIsSubmitting(true);

        try {
            await addDoc(collection(db, "exams"), {
                title: formData.title,
                competency: formData.competency,
                competencyId: formData.competencyId,
                subCompetencyId: formData.subCompetencyId,
                scenario: formData.scenario,
                mediaType: formData.mediaType,
                mediaUrl: formData.mediaType === 'simulation' ? formData.mediaUrl : "",
                items: items,
                isActive: formData.isActive,
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
                    <p className="text-[var(--text-secondary)]">ออกแบบชุดสถานการณ์และคำถามย่อยแบบ PISA</p>
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

                    <div className="space-y-6">
                        <GlassInput
                            label="ชื่อข้อสอบ"
                            name="title"
                            value={formData.title}
                            onChange={handleChange}
                            placeholder="เช่น วิเคราะห์ภาวะโลกร้อน"
                            required
                        />

                        {/* Hierarchical Competency Selection */}
                        <div className="p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                            <div className="flex items-center gap-2 mb-4">
                                <Sparkles size={16} className="text-[var(--accent-primary)]" />
                                <span className="text-sm font-medium text-[var(--text-secondary)]">
                                    เลือกสมรรถนะแบบลำดับชั้น (CBE Thailand)
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Level 1: Main Competency */}
                                <div className="space-y-2">
                                    <GlassSelect
                                        label="สมรรถนะหลัก"
                                        name="competencyId"
                                        value={formData.competencyId}
                                        onChange={handleCompetencyChange}
                                        disabled={isCompetencyDisabled}
                                        options={[
                                            { value: "", label: "-- เลือกสมรรถนะหลัก --" },
                                            ...competencyOptions
                                        ]}
                                        required
                                    />
                                    {isCompetencyDisabled && (
                                        <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-1">
                                            <GlassBadge variant="warning">ล็อก</GlassBadge>
                                            ตามสมรรถนะที่ได้รับมอบหมาย
                                        </p>
                                    )}
                                </div>

                                {/* Level 2: Sub-Competency */}
                                <div className="space-y-2">
                                    <GlassSelect
                                        label="สมรรถนะย่อย"
                                        name="subCompetencyId"
                                        value={formData.subCompetencyId}
                                        onChange={handleSubCompetencyChange}
                                        disabled={!formData.competencyId}
                                        options={[
                                            { value: "", label: formData.competencyId ? "-- เลือกสมรรถนะย่อย --" : "กรุณาเลือกสมรรถนะหลักก่อน" },
                                            ...subCompetencyOptions
                                        ]}
                                        required
                                    />
                                </div>
                            </div>

                            {/* Selected Competency Display */}
                            {formData.competency && formData.subCompetencyId && (
                                <div className="mt-4 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20">
                                    <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400">
                                        <ChevronRight size={14} />
                                        <span className="font-medium">สมรรถนะที่เลือก:</span>
                                    </div>
                                    <p className="mt-1 text-sm text-[var(--text-primary)]">
                                        {formData.competency}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Research-based Teacher Assistant Card */}
                    {researchSuggestion && (
                        <div className="mt-6 p-5 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/5 border border-amber-500/20">
                            <div className="flex items-start gap-4">
                                <div className="p-3 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400">
                                    <Lightbulb size={24} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <h4 className="text-base font-semibold text-amber-700 dark:text-amber-300">
                                            ผู้ช่วยครู (Teacher Assistant)
                                        </h4>
                                        <GlassBadge variant="warning">AI Suggestion</GlassBadge>
                                    </div>
                                    
                                    <div className="mb-3">
                                        <p className="text-xs text-amber-600/70 dark:text-amber-400/70 mb-1">
                                            สำหรับสมรรถนะย่อย: {researchSuggestion.subCompetencyTitle}
                                        </p>
                                        <p className="text-sm text-amber-600/90 dark:text-amber-400/90 leading-relaxed">
                                            {researchSuggestion.message}
                                        </p>
                                    </div>

                                    <div className="flex items-center gap-3 pt-3 border-t border-amber-500/20">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-amber-600/70 dark:text-amber-400/70">แนะนำ:</span>
                                            <GlassBadge variant={researchSuggestion.type === 'hybrid' ? 'warning' : researchSuggestion.type === 'simulation' ? 'primary' : 'secondary'}>
                                                {researchSuggestion.type === 'hybrid' ? 'Hybrid' : researchSuggestion.type === 'simulation' ? 'Simulation' : researchSuggestion.type === 'text' ? 'Text' : 'Image'}
                                            </GlassBadge>
                                        </div>
                                        
                                        {((researchSuggestion.type === 'hybrid' && formData.mediaType !== 'simulation') ||
                                          (researchSuggestion.type !== 'hybrid' && formData.mediaType !== researchSuggestion.type && 
                                           (researchSuggestion.type === 'simulation' || researchSuggestion.type === 'text'))) && (
                                            <button
                                                type="button"
                                                onClick={applyRecommendedMedia}
                                                className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-700 dark:text-amber-300 text-xs font-medium transition-colors flex items-center gap-1.5"
                                            >
                                                <Sparkles size={12} />
                                                {researchSuggestion.type === 'hybrid' ? 'Use Hybrid Format' : 'Apply Recommendation'}
                                            </button>
                                        )}
                                        
                                        {((researchSuggestion.type === 'hybrid' && formData.mediaType === 'simulation') ||
                                          (researchSuggestion.type !== 'hybrid' && formData.mediaType === researchSuggestion.type)) && (
                                            <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                                ✓ ใช้งานอยู่แล้ว
                                            </span>
                                        )}
                                    </div>

                                    {/* Hybrid Mode Warning */}
                                    {researchSuggestion.isHybrid && formData.mediaType === 'simulation' && (
                                        <div className="mt-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
                                            <p className="text-xs text-orange-700 dark:text-orange-300 flex items-start gap-2">
                                                <span className="text-orange-500 mt-0.5">⚠️</span>
                                                <span>
                                                    <strong>Hybrid Mode:</strong> สมรรถนะนี้ต้องการแนวทางแบบผสม กรุณาตรวจสอบว่าคุณได้ใส่ <strong>ข้อความอธิบายบริบท (Scenario)</strong> อย่างละเอียดพร้อมกับ URL ของ Simulation เพื่อกำหนดบริบทได้อย่างถูกต้อง
                                                </span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </GlassCard>

                {/* Stimulus Section */}
                <GlassCard hover={false}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-[var(--accent-success)]">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">สิ่งเร้า (Stimulus)</h2>
                        <GlassBadge variant="secondary">PISA-Style</GlassBadge>
                    </div>

                    {/* Media Type Toggle */}
                    <div className="mb-6">
                        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-3">
                            ประเภทสิ่งเร้า
                        </label>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => handleMediaTypeChange('text')}
                                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                    formData.mediaType === 'text'
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
                                className={`flex-1 flex items-center justify-center gap-3 p-4 rounded-xl border-2 transition-all ${
                                    formData.mediaType === 'simulation'
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
                            label="สถานการณ์/เนื้อหากระตุ้น"
                            name="scenario"
                            value={formData.scenario}
                            onChange={handleChange}
                            rows={8}
                            placeholder="อธิบายปรากฏการณ์ทางวิทยาศาสตร์ การทดลอง หรือสถานการณ์ที่นักเรียนจะต้องวิเคราะห์..."
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
                            <p className="text-xs text-[var(--text-tertiary)] flex items-center gap-2">
                                <MonitorPlay size={14} />
                                รองรับ PhET, Gizmos หรือ Simulation อื่นๆ ที่อนุญาตให้ฝังใน iframe
                            </p>
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

                {/* Items Section (Dynamic List) */}
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
                                        placeholder="คำสั่งสำหรับ AI: เช่น 'ให้คะแนนเต็มถ้านักเรียนอธิบายหลักการได้ถูกต้อง...'"
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

                {/* Summary */}
                <GlassCard hover={false}>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-500/5 text-[var(--accent-secondary)]">
                            <Cpu size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">สรุปข้อสอบ</h2>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="p-4 rounded-xl bg-[var(--glass-bg)]">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">{items.length}</p>
                            <p className="text-xs text-[var(--text-tertiary)]">จำนวนข้อ</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--glass-bg)]">
                            <p className="text-2xl font-bold text-[var(--text-primary)]">
                                {items.reduce((sum, item) => sum + item.score, 0)}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">คะแนนรวม</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--glass-bg)]">
                            <p className="text-2xl font-bold text-[var(--text-primary)] capitalize">
                                {formData.mediaType === 'text' ? 'Text' : 'Sim'}
                            </p>
                            <p className="text-xs text-[var(--text-tertiary)]">ประเภทสิ่งเร้า</p>
                        </div>
                        <div className="p-4 rounded-xl bg-[var(--glass-bg)]">
                            <p className="text-2xl font-bold text-emerald-500">✓</p>
                            <p className="text-xs text-[var(--text-tertiary)]">พร้อมใช้งาน</p>
                        </div>
                    </div>
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
