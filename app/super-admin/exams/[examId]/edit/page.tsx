"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import {
    Exam,
    ExamItem,
    MediaType,
    QuestionType,
    ChoiceOption,
    DragItem,
    DropZone,
    MatchItem,
    MatchPair,
    StimulusType,
    StimulusContent
} from "@/types";
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
    CheckCircle,
    Clock,
    Plus,
    X,
    GripVertical,
    ChevronDown,
    ChevronUp,
    Image,
    Globe
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassInput, GlassTextarea, GlassSelect } from "@/components/ui/GlassInput";
import { GlassButton } from "@/components/ui/GlassButton";
import { GlassBadge } from "@/components/ui/GlassBadge";
import {
    getAllCompetencyOptions,
    getSubCompetencyOptions,
    getCompetencyById,
    getSubCompetencyById,
} from "@/lib/data/competencies";

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const QUESTION_TYPE_OPTIONS: { value: QuestionType; label: string; description: string }[] = [
    { value: 'multiple_choice', label: 'เลือกตอบ (1 ข้อ)', description: 'เลือกคำตอบที่ถูกต้อง 1 ข้อ' },
    { value: 'multiple_select', label: 'เลือกหลายข้อ', description: 'เลือกได้มากกว่า 1 ข้อ' },
    { value: 'drag_drop', label: 'ลาก-วาง', description: 'ลากคำตอบไปวางในตำแหน่ง' },
    { value: 'matching', label: 'จับคู่', description: 'จับคู่รายการซ้าย-ขวา' },
    { value: 'checklist', label: 'เลือกรายการ', description: 'เลือกรายการที่ถูกต้อง' },
    { value: 'short_response', label: 'ตอบสั้น', description: 'เขียนอธิบายสั้นๆ 3-5 บรรทัด' },
    { value: 'extended_response', label: 'เขียนอธิบาย', description: 'เขียนอธิบายอย่างละเอียด' },
];

const CATEGORY_OPTIONS = [
    { value: '', label: '-- ไม่ระบุหมวด --' },
    { value: 'หมวดที่ 1: ทำความเข้าใจปรากฏการณ์', label: 'หมวด 1: ทำความเข้าใจปรากฏการณ์' },
    { value: 'หมวดที่ 2: วิเคราะห์ข้อมูล', label: 'หมวด 2: วิเคราะห์ข้อมูล' },
    { value: 'หมวดที่ 3: การอ่านและตีความกราฟ', label: 'หมวด 3: อ่านและตีความกราฟ' },
    { value: 'หมวดที่ 4: การเลือกแบบจำลอง', label: 'หมวด 4: เลือกแบบจำลอง' },
    { value: 'หมวดที่ 5: การตัดสินใจเชิงระบบ', label: 'หมวด 5: ตัดสินใจเชิงระบบ' },
];

// Component for editing choice options
function ChoiceOptionsEditor({
    options,
    onChange,
    allowMultipleCorrect = false
}: {
    options: ChoiceOption[];
    onChange: (options: ChoiceOption[]) => void;
    allowMultipleCorrect?: boolean;
}) {
    const addOption = () => {
        onChange([...options, { id: generateId(), text: '', isCorrect: false }]);
    };

    const updateOption = (id: string, field: keyof ChoiceOption, value: any) => {
        onChange(options.map(opt => {
            if (opt.id === id) {
                return { ...opt, [field]: value };
            }
            // For single choice, uncheck others
            if (!allowMultipleCorrect && field === 'isCorrect' && value === true) {
                return { ...opt, isCorrect: false };
            }
            return opt;
        }));
    };

    const removeOption = (id: string) => {
        if (options.length <= 2) return;
        onChange(options.filter(opt => opt.id !== id));
    };

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-[var(--text-secondary)]">ตัวเลือก</label>
            {options.map((option, idx) => (
                <div key={option.id} className="flex items-center gap-2">
                    <span className="w-6 text-center text-sm text-slate-500">{String.fromCharCode(65 + idx)}</span>
                    <input
                        type="text"
                        value={option.text}
                        onChange={(e) => updateOption(option.id, 'text', e.target.value)}
                        placeholder={`ตัวเลือก ${String.fromCharCode(65 + idx)}`}
                        className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-[var(--text-primary)] text-sm"
                    />
                    <label className="flex items-center gap-1">
                        <input
                            type={allowMultipleCorrect ? "checkbox" : "radio"}
                            name={`correct_${options[0]?.id}`}
                            checked={option.isCorrect || false}
                            onChange={(e) => updateOption(option.id, 'isCorrect', e.target.checked)}
                            className="w-4 h-4"
                        />
                        <span className="text-xs text-slate-500">ถูก</span>
                    </label>
                    {options.length > 2 && (
                        <button
                            type="button"
                            onClick={() => removeOption(option.id)}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                        >
                            <X size={16} />
                        </button>
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={addOption}
                className="flex items-center gap-1 text-sm text-indigo-500 hover:text-indigo-600"
            >
                <Plus size={14} /> เพิ่มตัวเลือก
            </button>
        </div>
    );
}

// Component for editing drag & drop items
function DragDropEditor({
    dragItems,
    dropZones,
    onDragItemsChange,
    onDropZonesChange
}: {
    dragItems: DragItem[];
    dropZones: DropZone[];
    onDragItemsChange: (items: DragItem[]) => void;
    onDropZonesChange: (zones: DropZone[]) => void;
}) {
    const addDragItem = () => {
        onDragItemsChange([...dragItems, { id: generateId(), text: '' }]);
    };

    const addDropZone = () => {
        onDropZonesChange([...dropZones, { id: generateId(), label: '', correctItemId: '' }]);
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">คำตอบที่ลากได้</label>
                {dragItems.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2">
                        <GripVertical size={14} className="text-slate-500" />
                        <input
                            type="text"
                            value={item.text}
                            onChange={(e) => onDragItemsChange(
                                dragItems.map(d => d.id === item.id ? { ...d, text: e.target.value } : d)
                            )}
                            placeholder={`คำตอบ ${idx + 1}`}
                            className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => onDragItemsChange(dragItems.filter(d => d.id !== item.id))}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addDragItem} className="text-sm text-indigo-500">
                    <Plus size={14} className="inline" /> เพิ่มคำตอบ
                </button>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">ช่องวาง</label>
                {dropZones.map((zone, idx) => (
                    <div key={zone.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={zone.label}
                                onChange={(e) => onDropZonesChange(
                                    dropZones.map(z => z.id === zone.id ? { ...z, label: e.target.value } : z)
                                )}
                                placeholder={`ป้ายช่อง ${idx + 1}`}
                                className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => onDropZonesChange(dropZones.filter(z => z.id !== zone.id))}
                                className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <select
                            value={zone.correctItemId}
                            onChange={(e) => onDropZonesChange(
                                dropZones.map(z => z.id === zone.id ? { ...z, correctItemId: e.target.value } : z)
                            )}
                            className="w-full px-2 py-1 rounded text-xs bg-slate-700 border border-slate-600"
                        >
                            <option value="">-- คำตอบที่ถูก --</option>
                            {dragItems.map(item => (
                                <option key={item.id} value={item.id}>{item.text || '(ว่าง)'}</option>
                            ))}
                        </select>
                    </div>
                ))}
                <button type="button" onClick={addDropZone} className="text-sm text-indigo-500">
                    <Plus size={14} className="inline" /> เพิ่มช่องวาง
                </button>
            </div>
        </div>
    );
}

// Stimulus type options for each question
const STIMULUS_TYPE_OPTIONS: { value: StimulusType | 'none'; label: string; icon: typeof MonitorPlay }[] = [
    { value: 'none', label: 'ไม่มีสื่อประกอบ', icon: FileText },
    { value: 'simulation', label: 'Simulation URL', icon: MonitorPlay },
    { value: 'image', label: 'รูปภาพ (URL)', icon: Image },
    { value: 'iframe', label: 'หน้าเว็บ (iframe)', icon: Globe },
    { value: 'text', label: 'ข้อความเพิ่มเติม', icon: FileText },
];

// Component for editing stimulus content per question item
function StimulusEditor({
    stimulusContent,
    onChange
}: {
    stimulusContent?: StimulusContent[];
    onChange: (content: StimulusContent[] | undefined) => void;
}) {
    const currentStimulus = stimulusContent?.[0];
    const currentType: StimulusType | 'none' = currentStimulus?.type || 'none';

    const handleTypeChange = (type: StimulusType | 'none') => {
        if (type === 'none') {
            onChange(undefined);
        } else {
            onChange([{ type, content: '', caption: '' }]);
        }
    };

    const updateContent = (content: string) => {
        if (currentStimulus) {
            onChange([{ ...currentStimulus, content }]);
        }
    };

    const updateCaption = (caption: string) => {
        if (currentStimulus) {
            onChange([{ ...currentStimulus, caption }]);
        }
    };

    return (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700 space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-sm font-medium text-slate-300">สื่อประกอบคำถาม (Stimulus)</span>
            </div>

            {/* Type selector */}
            <div className="flex flex-wrap gap-2">
                {STIMULUS_TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = currentType === opt.value;
                    return (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => handleTypeChange(opt.value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all ${isSelected
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                                }`}
                        >
                            <Icon size={14} />
                            <span>{opt.label}</span>
                        </button>
                    );
                })}
            </div>

            {/* Content editor based on type */}
            {currentType !== 'none' && currentStimulus && (
                <div className="space-y-3 mt-3">
                    {currentType === 'simulation' && (
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">URL Simulation (เช่น PhET)</label>
                            <input
                                type="url"
                                value={currentStimulus.content}
                                onChange={(e) => updateContent(e.target.value)}
                                placeholder="https://phet.colorado.edu/sims/html/..."
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm text-white placeholder:text-slate-500"
                            />
                        </div>
                    )}

                    {currentType === 'image' && (
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">URL รูปภาพ</label>
                            <input
                                type="url"
                                value={currentStimulus.content}
                                onChange={(e) => updateContent(e.target.value)}
                                placeholder="https://example.com/image.png"
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm text-white placeholder:text-slate-500"
                            />
                            {currentStimulus.content && (
                                <div className="mt-2 p-2 bg-slate-900 rounded-lg">
                                    <img
                                        src={currentStimulus.content}
                                        alt="Preview"
                                        className="max-h-32 rounded object-contain mx-auto"
                                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                                    />
                                </div>
                            )}
                        </div>
                    )}

                    {currentType === 'iframe' && (
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">URL หน้าเว็บที่ต้องการ embed</label>
                            <input
                                type="url"
                                value={currentStimulus.content}
                                onChange={(e) => updateContent(e.target.value)}
                                placeholder="https://example.com/page"
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm text-white placeholder:text-slate-500"
                            />
                            <p className="text-xs text-slate-500 mt-1">
                                หมายเหตุ: บางเว็บไซต์อาจไม่อนุญาตให้ฝังใน iframe
                            </p>
                        </div>
                    )}

                    {currentType === 'text' && (
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">ข้อความเพิ่มเติม</label>
                            <textarea
                                value={currentStimulus.content}
                                onChange={(e) => updateContent(e.target.value)}
                                placeholder="ข้อความหรือข้อมูลเพิ่มเติมสำหรับคำถามข้อนี้..."
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm text-white placeholder:text-slate-500"
                            />
                        </div>
                    )}

                    {/* Caption field for all types */}
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">คำอธิบายสื่อ (Caption) - ไม่บังคับ</label>
                        <input
                            type="text"
                            value={currentStimulus.caption || ''}
                            onChange={(e) => updateCaption(e.target.value)}
                            placeholder="เช่น: รูปที่ 1 แสดงวิถีการเคลื่อนที่..."
                            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-600 text-sm text-white placeholder:text-slate-500"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Component for editing matching pairs
function MatchingEditor({
    leftColumn,
    rightColumn,
    onLeftChange,
    onRightChange
}: {
    leftColumn: MatchItem[];
    rightColumn: MatchPair[];
    onLeftChange: (items: MatchItem[]) => void;
    onRightChange: (pairs: MatchPair[]) => void;
}) {
    const addLeft = () => {
        onLeftChange([...leftColumn, { id: generateId(), text: '' }]);
    };

    const addRight = () => {
        onRightChange([...rightColumn, { id: generateId(), text: '', correctMatchId: '' }]);
    };

    return (
        <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">รายการ (ซ้าย)</label>
                {leftColumn.map((item, idx) => (
                    <div key={item.id} className="flex items-center gap-2">
                        <span className="w-5 text-center text-xs text-slate-500">{idx + 1}</span>
                        <input
                            type="text"
                            value={item.text}
                            onChange={(e) => onLeftChange(
                                leftColumn.map(l => l.id === item.id ? { ...l, text: e.target.value } : l)
                            )}
                            placeholder={`รายการ ${idx + 1}`}
                            className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm"
                        />
                        <button
                            type="button"
                            onClick={() => onLeftChange(leftColumn.filter(l => l.id !== item.id))}
                            className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                        >
                            <X size={16} />
                        </button>
                    </div>
                ))}
                <button type="button" onClick={addLeft} className="text-sm text-indigo-500">
                    <Plus size={14} className="inline" /> เพิ่มรายการ
                </button>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--text-secondary)]">คำตอบ (ขวา)</label>
                {rightColumn.map((pair, idx) => (
                    <div key={pair.id} className="space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="w-5 text-center text-xs text-slate-500">{String.fromCharCode(65 + idx)}</span>
                            <input
                                type="text"
                                value={pair.text}
                                onChange={(e) => onRightChange(
                                    rightColumn.map(r => r.id === pair.id ? { ...r, text: e.target.value } : r)
                                )}
                                placeholder={`คำตอบ ${String.fromCharCode(65 + idx)}`}
                                className="flex-1 px-3 py-2 rounded-lg bg-[var(--glass-bg)] border border-[var(--glass-border)] text-sm"
                            />
                            <button
                                type="button"
                                onClick={() => onRightChange(rightColumn.filter(r => r.id !== pair.id))}
                                className="p-1 text-red-500 hover:bg-red-500/10 rounded"
                            >
                                <X size={16} />
                            </button>
                        </div>
                        <select
                            value={pair.correctMatchId}
                            onChange={(e) => onRightChange(
                                rightColumn.map(r => r.id === pair.id ? { ...r, correctMatchId: e.target.value } : r)
                            )}
                            className="w-full px-2 py-1 rounded text-xs bg-slate-700 border border-slate-600"
                        >
                            <option value="">-- ตรงกับรายการ --</option>
                            {leftColumn.map((item, i) => (
                                <option key={item.id} value={item.id}>{i + 1}. {item.text || '(ว่าง)'}</option>
                            ))}
                        </select>
                    </div>
                ))}
                <button type="button" onClick={addRight} className="text-sm text-indigo-500">
                    <Plus size={14} className="inline" /> เพิ่มคำตอบ
                </button>
            </div>
        </div>
    );
}

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
    const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

    const [formData, setFormData] = useState({
        title: "",
        competency: "",
        competencyId: "",
        subCompetencyId: "",
        scenario: "",
        mediaType: "text" as MediaType,
        mediaUrl: "",
        isActive: true,
        timeLimit: 0 // 0 = no limit
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
                        isActive: data.isActive ?? true,
                        timeLimit: data.timeLimit || 0
                    });

                    // Ensure all items have IDs and questionType
                    const itemsWithIds = (data.items || []).map(item => ({
                        ...item,
                        id: item.id || generateId(),
                        questionType: item.questionType || 'extended_response' as QuestionType,
                        options: item.options || [],
                        dragItems: item.dragItems || [],
                        dropZones: item.dropZones || [],
                        leftColumn: item.leftColumn || [],
                        rightColumn: item.rightColumn || []
                    }));
                    setItems(itemsWithIds);

                    // Expand first item by default
                    if (itemsWithIds.length > 0) {
                        setExpandedItems(new Set([itemsWithIds[0].id]));
                    }
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

    const handleItemChange = (itemId: string, updates: Partial<ExamItem>) => {
        setItems(prev => prev.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
        ));
    };

    const addItem = () => {
        const newId = generateId();
        setItems(prev => [...prev, {
            id: newId,
            question: "",
            questionType: 'extended_response' as QuestionType,
            score: 10,
            rubricPrompt: "",
            options: [
                { id: generateId(), text: '', isCorrect: false },
                { id: generateId(), text: '', isCorrect: false },
                { id: generateId(), text: '', isCorrect: false },
                { id: generateId(), text: '', isCorrect: false }
            ],
            dragItems: [],
            dropZones: [],
            leftColumn: [],
            rightColumn: []
        }]);
        setExpandedItems(prev => new Set([...prev, newId]));
    };

    const removeItem = (itemId: string) => {
        if (items.length <= 1) return;
        setItems(prev => prev.filter(item => item.id !== itemId));
        setExpandedItems(prev => {
            const next = new Set(prev);
            next.delete(itemId);
            return next;
        });
    };

    const toggleItemExpand = (itemId: string) => {
        setExpandedItems(prev => {
            const next = new Set(prev);
            if (next.has(itemId)) {
                next.delete(itemId);
            } else {
                next.add(itemId);
            }
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !examId) return;

        const hasEmptyItems = items.some(item => !item.question.trim());
        if (hasEmptyItems) {
            setError("กรุณากรอกคำถามสำหรับทุกข้อย่อย");
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
                timeLimit: formData.timeLimit || null,
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
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">✏️ แก้ไขข้อสอบ PISA-Style</h1>
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
                            placeholder="เช่น วิเคราะห์การเคลื่อนที่แบบโพรเจกไทล์"
                            required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Active Toggle */}
                            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                <div>
                                    <p className="font-medium text-[var(--text-primary)]">สถานะ</p>
                                    <p className="text-xs text-[var(--text-tertiary)]">เปิด/ปิดการใช้งาน</p>
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

                            {/* Time Limit */}
                            <div className="p-4 rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)]">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock size={16} className="text-amber-500" />
                                    <span className="text-sm font-medium text-[var(--text-primary)]">เวลาจำกัด (นาที)</span>
                                </div>
                                <input
                                    type="number"
                                    name="timeLimit"
                                    value={formData.timeLimit || ''}
                                    onChange={(e) => setFormData(prev => ({
                                        ...prev,
                                        timeLimit: parseInt(e.target.value) || 0
                                    }))}
                                    placeholder="0 = ไม่จำกัดเวลา"
                                    min={0}
                                    max={300}
                                    className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-white"
                                />
                                <p className="text-xs text-slate-500 mt-1">เช่น 90 สำหรับข้อสอบ PISA</p>
                            </div>
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

                    <div className="space-y-4">
                        {items.map((item, index) => {
                            const isExpanded = expandedItems.has(item.id);

                            return (
                                <div
                                    key={item.id}
                                    className="rounded-xl bg-[var(--glass-bg)] border border-[var(--glass-border)] overflow-hidden"
                                >
                                    {/* Item Header */}
                                    <button
                                        type="button"
                                        onClick={() => toggleItemExpand(item.id)}
                                        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-indigo-500/20 text-indigo-500 flex items-center justify-center text-sm font-bold">
                                                {index + 1}
                                            </span>
                                            <div className="text-left">
                                                <p className="font-medium text-[var(--text-primary)] line-clamp-1">
                                                    {item.question || '(ยังไม่ได้ใส่คำถาม)'}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <GlassBadge variant="secondary" className="text-xs">
                                                        {QUESTION_TYPE_OPTIONS.find(t => t.value === item.questionType)?.label || 'เขียนอธิบาย'}
                                                    </GlassBadge>
                                                    <span className="text-xs text-slate-500">{item.score} คะแนน</span>
                                                    {item.category && (
                                                        <span className="text-xs text-purple-400">{item.category.split(':')[0]}</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors"
                                                    title="ลบข้อนี้"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </button>

                                    {/* Item Content (Expanded) */}
                                    {isExpanded && (
                                        <div className="p-5 pt-0 space-y-4 border-t border-slate-700/50">
                                            {/* Question Type & Score */}
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
                                                <div className="md:col-span-2">
                                                    <GlassSelect
                                                        label="ประเภทคำถาม"
                                                        value={item.questionType}
                                                        onChange={(e) => handleItemChange(item.id, {
                                                            questionType: e.target.value as QuestionType
                                                        })}
                                                        options={QUESTION_TYPE_OPTIONS.map(t => ({
                                                            value: t.value,
                                                            label: `${t.label} - ${t.description}`
                                                        }))}
                                                    />
                                                </div>
                                                <GlassInput
                                                    label="คะแนนเต็ม"
                                                    type="number"
                                                    value={item.score.toString()}
                                                    onChange={(e) => handleItemChange(item.id, {
                                                        score: parseInt(e.target.value) || 0
                                                    })}
                                                    min={1}
                                                    max={100}
                                                    required
                                                />
                                            </div>

                                            {/* Category */}
                                            <GlassSelect
                                                label="หมวดหมู่ (PISA Categories)"
                                                value={item.category || ''}
                                                onChange={(e) => handleItemChange(item.id, { category: e.target.value })}
                                                options={CATEGORY_OPTIONS}
                                            />

                                            {/* Stimulus Editor for per-question media */}
                                            <StimulusEditor
                                                stimulusContent={item.stimulusContent}
                                                onChange={(content) => handleItemChange(item.id, { stimulusContent: content })}
                                            />

                                            {/* Question */}
                                            <GlassTextarea
                                                label="คำถาม"
                                                value={item.question}
                                                onChange={(e) => handleItemChange(item.id, { question: e.target.value })}
                                                rows={2}
                                                placeholder="คำถามที่ต้องการให้นักเรียนตอบ..."
                                                required
                                            />

                                            {/* Question Type Specific Editors */}
                                            {(item.questionType === 'multiple_choice' || item.questionType === 'checklist') && (
                                                <ChoiceOptionsEditor
                                                    options={item.options || []}
                                                    onChange={(options) => handleItemChange(item.id, { options })}
                                                    allowMultipleCorrect={false}
                                                />
                                            )}

                                            {item.questionType === 'multiple_select' && (
                                                <ChoiceOptionsEditor
                                                    options={item.options || []}
                                                    onChange={(options) => handleItemChange(item.id, { options })}
                                                    allowMultipleCorrect={true}
                                                />
                                            )}

                                            {item.questionType === 'drag_drop' && (
                                                <DragDropEditor
                                                    dragItems={item.dragItems || []}
                                                    dropZones={item.dropZones || []}
                                                    onDragItemsChange={(dragItems) => handleItemChange(item.id, { dragItems })}
                                                    onDropZonesChange={(dropZones) => handleItemChange(item.id, { dropZones })}
                                                />
                                            )}

                                            {item.questionType === 'matching' && (
                                                <MatchingEditor
                                                    leftColumn={item.leftColumn || []}
                                                    rightColumn={item.rightColumn || []}
                                                    onLeftChange={(leftColumn) => handleItemChange(item.id, { leftColumn })}
                                                    onRightChange={(rightColumn) => handleItemChange(item.id, { rightColumn })}
                                                />
                                            )}

                                            {item.questionType === 'short_response' && (
                                                <GlassInput
                                                    label="จำนวนตัวอักษรสูงสุด"
                                                    type="number"
                                                    value={(item.maxCharacters || 500).toString()}
                                                    onChange={(e) => handleItemChange(item.id, {
                                                        maxCharacters: parseInt(e.target.value) || 500
                                                    })}
                                                    min={100}
                                                    max={2000}
                                                />
                                            )}

                                            {/* Rubric Prompt */}
                                            <GlassTextarea
                                                label="เกณฑ์การตรวจ AI (Rubric Prompt)"
                                                value={item.rubricPrompt}
                                                onChange={(e) => handleItemChange(item.id, { rubricPrompt: e.target.value })}
                                                rows={3}
                                                placeholder="คำสั่งสำหรับ AI ในการตรวจคำตอบ..."
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
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
