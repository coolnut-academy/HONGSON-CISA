"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import {
    ExamItem,
    MediaType,
    QuestionType,
    ChoiceOption,
    DragItem,
    DropZone,
    MatchItem,
    MatchPair,
    StimulusContent,
    StimulusType
} from "@/types";
import {
    Loader2,
    Save,
    ArrowLeft,
    FileText,
    MonitorPlay,
    ListPlus,
    Trash2,
    Sparkles,
    AlertCircle,
    CheckCircle,
    Plus,
    X,
    GripVertical,
    ChevronDown,
    ChevronUp,
    Image as ImageIcon,
    Globe,
    ExternalLink
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
                        className="flex-1 px-3 py-2 rounded-lg bg-slate-100/80 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-700 text-[var(--text-primary)] text-sm shadow-inner transition-colors focus:bg-white dark:focus:bg-slate-900"
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
    backgroundImageUrl,
    onDragItemsChange,
    onDropZonesChange,
    onBackgroundChange
}: {
    dragItems: DragItem[];
    dropZones: DropZone[];
    backgroundImageUrl?: string;
    onDragItemsChange: (items: DragItem[]) => void;
    onDropZonesChange: (zones: DropZone[]) => void;
    onBackgroundChange: (url: string) => void;
}) {
    const addDragItem = () => {
        onDragItemsChange([...dragItems, { id: generateId(), text: '' }]);
    };

    const addDropZone = () => {
        onDropZonesChange([...dropZones, { id: generateId(), label: '', correctItemId: '' }]);
    };

    const updateDragItem = (id: string, updates: Partial<DragItem>) => {
        onDragItemsChange(dragItems.map(d => d.id === id ? { ...d, ...updates } : d));
    };

    return (
        <div className="space-y-6">
            {/* Background Image Config */}
            <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">
                    🖼️ รูปภาพพื้นหลัง (Optional)
                </label>
                <div className="flex gap-2 mb-2">
                    <input
                        type="url"
                        value={backgroundImageUrl || ''}
                        onChange={(e) => onBackgroundChange(e.target.value)}
                        placeholder="https://example.com/diagram.png"
                        className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white shadow-inner"
                    />
                </div>
                {backgroundImageUrl && (
                    <div className="mt-2 p-2 bg-slate-900 rounded-lg">
                        <img
                            src={backgroundImageUrl}
                            alt="Background Preview"
                            className="max-h-48 rounded object-contain mx-auto"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                    </div>
                )}
                <p className="text-xs text-slate-500 mt-1">
                    ใส่ URL ของรูปภาพโจทย์หรือแผนภาพ เพื่อให้นักเรียนลากคำตอบไปวางบนตำแหน่งที่ถูกต้อง
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Draggable Items Editor */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                            📦 ตัวเลือกคำตอบ (Draggables)
                        </label>
                        <span className="text-xs text-slate-400">รูปภาพ + ป้ายชื่อ</span>
                    </div>

                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                        {dragItems.map((item, idx) => (
                            <div key={item.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm relative group transition-all hover:border-[var(--accent-primary)]">
                                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button
                                        type="button"
                                        onClick={() => onDragItemsChange(dragItems.filter(d => d.id !== item.id))}
                                        className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X size={14} />
                                    </button>
                                </div>

                                <div className="flex items-start gap-3">
                                    <div className="mt-2 cursor-move text-slate-400">
                                        <GripVertical size={16} />
                                    </div>

                                    <div className="flex-1 space-y-2.5">
                                        {/* Label Input */}
                                        <div>
                                            <input
                                                type="text"
                                                value={item.text}
                                                onChange={(e) => updateDragItem(item.id, { text: e.target.value })}
                                                placeholder={`ป้ายชื่อคำตอบ ${idx + 1}`}
                                                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                            />
                                        </div>

                                        {/* Image URL Input */}
                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-md ${item.imageUrl ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <ImageIcon size={14} />
                                            </div>
                                            <input
                                                type="url"
                                                value={item.imageUrl || ''}
                                                onChange={(e) => updateDragItem(item.id, { imageUrl: e.target.value })}
                                                placeholder="URL รูปภาพ (ไม่บังคับ)"
                                                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                            />
                                        </div>

                                        {/* Preview */}
                                        {item.imageUrl && (
                                            <div className="flex items-center gap-3 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/50">
                                                <div className="w-16 h-16 bg-white rounded border border-slate-200 flex items-center justify-center overflow-hidden">
                                                    <img
                                                        src={item.imageUrl}
                                                        alt="preview"
                                                        className="w-full h-full object-contain"
                                                        onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                                                    />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-slate-500">Preview</p>
                                                    <p className="text-[10px] text-slate-400 truncate">{item.text || 'No Label'}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}

                        <button
                            type="button"
                            onClick={addDragItem}
                            className="w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 text-slate-500 hover:text-[var(--accent-primary)] transition-all text-sm font-medium"
                        >
                            <Plus size={16} />
                            <span>เพิ่มตัวเลือกคำตอบ</span>
                        </button>
                    </div>
                </div>

                {/* Drop Zones Editor */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <label className="text-sm font-medium text-[var(--text-secondary)]">
                            🎯 ช่องวาง (Drop Zones)
                        </label>
                        <span className="text-xs text-slate-400">ข้อความเท่านั้น</span>
                    </div>

                    <div className="space-y-2">
                        {dropZones.map((zone, idx) => (
                            <div key={zone.id} className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl space-y-2">
                                <div className="flex items-center gap-2">
                                    <input
                                        type="text"
                                        value={zone.label}
                                        onChange={(e) => onDropZonesChange(
                                            dropZones.map(z => z.id === zone.id ? { ...z, label: e.target.value } : z)
                                        )}
                                        placeholder={`ป้ายชื่อช่องวาง ${idx + 1}`}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-sm shadow-sm transition-colors focus:border-[var(--accent-primary)]"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onDropZonesChange(dropZones.filter(z => z.id !== zone.id))}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                                <div className="flex items-center gap-2 bg-white dark:bg-slate-950 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                                    <CheckCircle size={14} className="text-emerald-500" />
                                    <span className="text-xs text-slate-500 whitespace-nowrap">เฉลย:</span>
                                    <select
                                        value={zone.correctItemId}
                                        onChange={(e) => onDropZonesChange(
                                            dropZones.map(z => z.id === zone.id ? { ...z, correctItemId: e.target.value } : z)
                                        )}
                                        className="flex-1 text-xs bg-transparent border-none p-0 focus:ring-0 text-slate-700 dark:text-slate-300 font-medium"
                                    >
                                        <option value="">-- เลือกคำตอบที่ถูกต้อง --</option>
                                        {dragItems.map(item => (
                                            <option key={item.id} value={item.id}>
                                                {item.text || '(ไม่มีป้ายชื่อ)'} {item.imageUrl ? '(มีรูป)' : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addDropZone}
                            className="w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 hover:border-emerald-500 hover:bg-emerald-50 text-slate-500 hover:text-emerald-600 transition-all text-sm font-medium"
                        >
                            <Plus size={16} />
                            <span>เพิ่มช่องวาง</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Stimulus type options
const STIMULUS_TYPE_OPTIONS: { value: StimulusType | 'none'; label: string; icon: typeof MonitorPlay }[] = [
    { value: 'none', label: 'ไม่มีสื่อประกอบ', icon: FileText },
    { value: 'simulation', label: 'Simulation URL', icon: MonitorPlay },
    { value: 'image', label: 'รูปภาพ (URL)', icon: ImageIcon },
    { value: 'iframe', label: 'หน้าเว็บ (iframe)', icon: Globe },
    { value: 'text', label: 'ข้อความเพิ่มเติม', icon: FileText },
];

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
        <div className="p-4 rounded-xl bg-slate-100/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 space-y-3">
            <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-amber-400" />
                <span className="text-sm font-medium text-slate-300">สื่อประกอบคำถาม (Stimulus)</span>
            </div>

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
                                : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-300 dark:hover:bg-slate-600'
                                }`}
                        >
                            <Icon size={14} />
                            <span>{opt.label}</span>
                        </button>
                    );
                })}
            </div>

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
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 shadow-inner"
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
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 shadow-inner"
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
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 shadow-inner"
                            />
                        </div>
                    )}
                    {currentType === 'text' && (
                        <div>
                            <label className="text-xs text-slate-400 mb-1 block">ข้อความเพิ่มเติม</label>
                            <textarea
                                value={currentStimulus.content}
                                onChange={(e) => updateContent(e.target.value)}
                                placeholder="ข้อความหรือข้อมูลเพิ่มเติม..."
                                rows={3}
                                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 shadow-inner"
                            />
                        </div>
                    )}
                    <div>
                        <label className="text-xs text-slate-400 mb-1 block">คำอธิบายสื่อ (Caption) - ไม่บังคับ</label>
                        <input
                            type="text"
                            value={currentStimulus.caption || ''}
                            onChange={(e) => updateCaption(e.target.value)}
                            placeholder="เช่น: รูปที่ 1 แสดง..."
                            className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-600 text-sm text-slate-900 dark:text-white placeholder:text-slate-500 shadow-inner"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Matching Editor
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

    const updateLeft = (id: string, updates: Partial<MatchItem>) => {
        onLeftChange(leftColumn.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    const updateRight = (id: string, updates: Partial<MatchPair>) => {
        onRightChange(rightColumn.map(item => item.id === id ? { ...item, ...updates } : item));
    };

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column (Questions/Prompts) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <label className="text-sm font-semibold text-[var(--text-secondary)]">
                            📌 คอลัมน์ซ้าย (รายการหลัก)
                        </label>
                        <span className="text-xs text-slate-400">รูปภาพ + ข้อความ</span>
                    </div>

                    <div className="space-y-3">
                        {leftColumn.map((item, idx) => (
                            <div key={item.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm group hover:border-[var(--accent-primary)] transition-all">
                                <div className="flex items-start gap-3 relative">
                                    <div className="mt-2 w-6 flex-shrink-0 flex items-center justify-center">
                                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 flex items-center justify-center">
                                            {idx + 1}
                                        </span>
                                    </div>

                                    <div className="flex-1 space-y-2.5">
                                        <div className="pr-8">
                                            <input
                                                type="text"
                                                value={item.text}
                                                onChange={(e) => updateLeft(item.id, { text: e.target.value })}
                                                placeholder={`ข้อความรายการ ${idx + 1}`}
                                                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-md ${item.imageUrl ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <ImageIcon size={14} />
                                            </div>
                                            <input
                                                type="url"
                                                value={item.imageUrl || ''}
                                                onChange={(e) => updateLeft(item.id, { imageUrl: e.target.value })}
                                                placeholder="URL รูปภาพ (ไม่บังคับ)"
                                                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 focus:border-[var(--accent-primary)] focus:bg-white transition-all"
                                            />
                                        </div>

                                        {item.imageUrl && (
                                            <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/50 flex justify-center">
                                                <img
                                                    src={item.imageUrl}
                                                    alt="preview"
                                                    className="max-h-24 rounded object-contain"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                                                />
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onLeftChange(leftColumn.filter(l => l.id !== item.id))}
                                        className="absolute top-0 right-0 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addLeft}
                            className="w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 hover:border-[var(--accent-primary)] hover:bg-[var(--accent-primary)]/5 text-slate-500 hover:text-[var(--accent-primary)] transition-all text-sm font-medium"
                        >
                            <Plus size={16} />
                            <span>เพิ่มรายการซ้าย</span>
                        </button>
                    </div>
                </div>

                {/* Right Column (Answers) */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-700">
                        <label className="text-sm font-semibold text-[var(--text-secondary)]">
                            🧩 คอลัมน์ขวา (ตัวเลือกคำตอบ)
                        </label>
                        <span className="text-xs text-slate-400">รูปภาพ + ป้ายชื่อ</span>
                    </div>

                    <div className="space-y-3">
                        {rightColumn.map((pair, idx) => (
                            <div key={pair.id} className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm group hover:border-[var(--accent-success)] transition-all">
                                <div className="flex items-start gap-3 relative">
                                    <div className="mt-2 w-6 flex-shrink-0 flex items-center justify-center">
                                        <span className="w-5 h-5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-500 flex items-center justify-center">
                                            {String.fromCharCode(65 + idx)}
                                        </span>
                                    </div>

                                    <div className="flex-1 space-y-2.5">
                                        <div className="pr-8">
                                            <input
                                                type="text"
                                                value={pair.text}
                                                onChange={(e) => updateRight(pair.id, { text: e.target.value })}
                                                placeholder={`คำตอบ ${String.fromCharCode(65 + idx)}`}
                                                className="w-full px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-sm focus:border-[var(--accent-success)] focus:bg-white transition-all"
                                            />
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <div className={`p-1.5 rounded-md ${pair.imageUrl ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                <ImageIcon size={14} />
                                            </div>
                                            <input
                                                type="url"
                                                value={pair.imageUrl || ''}
                                                onChange={(e) => updateRight(pair.id, { imageUrl: e.target.value })}
                                                placeholder="URL รูปภาพ (ไม่บังคับ)"
                                                className="flex-1 px-3 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 focus:border-[var(--accent-success)] focus:bg-white transition-all"
                                            />
                                        </div>

                                        {pair.imageUrl && (
                                            <div className="mt-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/50 flex justify-center">
                                                <img
                                                    src={pair.imageUrl}
                                                    alt="preview"
                                                    className="max-h-24 rounded object-contain"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                                                />
                                            </div>
                                        )}

                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle size={14} className="text-emerald-500" />
                                                <span className="text-xs text-slate-500 whitespace-nowrap">คู่กับ:</span>
                                                <select
                                                    value={pair.correctMatchId}
                                                    onChange={(e) => updateRight(pair.id, { correctMatchId: e.target.value })}
                                                    className="flex-1 text-xs bg-transparent border-none p-0 focus:ring-0 text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
                                                >
                                                    <option value="">-- เลือกคู่ที่ถูกต้อง --</option>
                                                    {leftColumn.map((item, i) => (
                                                        <option key={item.id} value={item.id}>
                                                            {i + 1}. {item.text || '(ว่าง)'} {item.imageUrl ? '(มีรูป)' : ''}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => onRightChange(rightColumn.filter(r => r.id !== pair.id))}
                                        className="absolute top-0 right-0 p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={addRight}
                            className="w-full py-2 flex items-center justify-center gap-2 rounded-lg border border-dashed border-slate-300 hover:border-[var(--accent-success)] hover:bg-[var(--accent-success)]/10 text-slate-500 hover:text-emerald-600 transition-all text-sm font-medium"
                        >
                            <Plus size={16} />
                            <span>เพิ่มตัวเลือกขวา</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CreateExamPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { isLoading: isAuthLoading, isAuthorized } = useRoleProtection(['admin', 'super_admin']);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
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
        timeLimit: 90
    });

    const [items, setItems] = useState<ExamItem[]>([
        {
            id: generateId(),
            question: "",
            questionType: 'extended_response',
            score: 10,
            rubricPrompt: "",
            options: [
                { id: generateId(), text: '', isCorrect: false },
                { id: generateId(), text: '', isCorrect: false }
            ],
            dragItems: [],
            dropZones: [],
            leftColumn: [],
            rightColumn: [],
            backgroundImageUrl: ""
        }
    ]);

    useEffect(() => {
        if (items.length > 0 && expandedItems.size === 0) {
            setExpandedItems(new Set([items[0].id]));
        }
    }, []);

    const competencyOptions = useMemo(() => getAllCompetencyOptions(), []);
    const subCompetencyOptions = useMemo(
        () => getSubCompetencyOptions(formData.competencyId),
        [formData.competencyId]
    );

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
            questionType: 'extended_response',
            score: 10,
            rubricPrompt: "",
            options: [
                { id: generateId(), text: '', isCorrect: false },
                { id: generateId(), text: '', isCorrect: false }
            ],
            dragItems: [],
            dropZones: [],
            leftColumn: [],
            rightColumn: [],
            backgroundImageUrl: ""
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
        if (!user) return;

        const hasEmptyItems = items.some(item => !item.question.trim());
        if (hasEmptyItems) {
            setError("กรุณากรอกคำถามสำหรับทุกข้อย่อย");
            return;
        }

        if (formData.mediaType === 'simulation' && !formData.mediaUrl.trim()) {
            setError("กรุณาใส่ URL ของ Simulation");
            return;
        }

        setLoading(true);
        setError(null);

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
                timeLimit: formData.timeLimit || null,
                createdAt: serverTimestamp(),
                createdBy: user.uid,
            });

            router.push("/admin/dashboard");
        } catch (err) {
            console.error("Error creating exam:", err);
            setError("เกิดข้อผิดพลาดในการสร้างข้อสอบ");
        } finally {
            setLoading(false);
        }
    };

    if (isAuthLoading || !isAuthorized) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="animate-spin text-[var(--accent-primary)]" size={48} />
                <p className="text-[var(--text-secondary)]">Checking permissions...</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/dashboard"
                    className="p-2 rounded-xl hover:bg-[var(--glass-bg)] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    <ArrowLeft size={24} />
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)]">📝 สร้างข้อสอบใหม่ (Admin)</h1>
                    <p className="text-[var(--text-secondary)]">ออกแบบข้อสอบ PISA-Style พร้อมเครื่องมือครบครัน</p>
                </div>
            </div>

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

                        {/* Hierarchical Competency Selection */}
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
                                required
                            />
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

                        <GlassInput
                            label="เวลาในการทำข้อสอบ (นาที)"
                            name="timeLimit"
                            type="number"
                            value={formData.timeLimit.toString()}
                            onChange={handleChange}
                            min={0}
                            hint="ใส่ 0 หากไม่จำกัดเวลา"
                        />
                    </div>
                </GlassCard>

                {/* Stimulus Section */}
                <GlassCard hover={false}>
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 text-[var(--accent-success)]">
                            <FileText size={20} />
                        </div>
                        <h2 className="text-lg font-semibold text-[var(--text-primary)]">สถานการณ์/ข้อมูลตั้งต้น (Stimulus)</h2>
                    </div>

                    <div className="mb-6">
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
                                <span className="font-semibold">Text Scenario</span>
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
                                <span className="font-semibold">Simulation</span>
                            </button>
                        </div>
                    </div>

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
                            <GlassInput
                                label="Simulation URL"
                                name="mediaUrl"
                                value={formData.mediaUrl}
                                onChange={handleChange}
                                placeholder="https://phet.colorado.edu/sims/html/..."
                                required
                            />
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
                                    <div
                                        role="button"
                                        tabIndex={0}
                                        onClick={() => toggleItemExpand(item.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                toggleItemExpand(item.id);
                                            }
                                        }}
                                        className="w-full flex items-center justify-between p-4 hover:bg-slate-800/50 transition-colors cursor-pointer"
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
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {items.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={(e) => { e.stopPropagation(); removeItem(item.id); }}
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-colors relative z-10"
                                                    title="ลบข้อนี้"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                        </div>
                                    </div>

                                    {isExpanded && (
                                        <div className="p-5 pt-0 space-y-4 border-t border-slate-700/50">
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

                                            <GlassSelect
                                                label="หมวดหมู่ (PISA Categories)"
                                                value={item.category || ''}
                                                onChange={(e) => handleItemChange(item.id, { category: e.target.value })}
                                                options={CATEGORY_OPTIONS}
                                            />

                                            <StimulusEditor
                                                stimulusContent={item.stimulusContent}
                                                onChange={(content) => handleItemChange(item.id, { stimulusContent: content })}
                                            />

                                            <GlassTextarea
                                                label="คำถาม"
                                                value={item.question}
                                                onChange={(e) => handleItemChange(item.id, { question: e.target.value })}
                                                rows={2}
                                                placeholder="คำถามที่ต้องการให้นักเรียนตอบ..."
                                                required
                                            />

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
                                                    backgroundImageUrl={item.backgroundImageUrl}
                                                    onDragItemsChange={(dragItems) => handleItemChange(item.id, { dragItems })}
                                                    onDropZonesChange={(dropZones) => handleItemChange(item.id, { dropZones })}
                                                    onBackgroundChange={(url) => handleItemChange(item.id, { backgroundImageUrl: url })}
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

                <div className="flex items-center justify-end gap-4 pt-4">
                    <Link href="/admin/dashboard">
                        <GlassButton variant="ghost" type="button">
                            ยกเลิก
                        </GlassButton>
                    </Link>
                    <GlassButton
                        type="submit"
                        variant="primary"
                        loading={loading}
                        icon={<Save size={18} />}
                    >
                        สร้างข้อสอบ (PISA)
                    </GlassButton>
                </div>
            </form>
        </div>
    );
}
