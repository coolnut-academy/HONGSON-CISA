"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Exam, QuestionAnswer, ExamItem } from "@/types";
import {
    Loader2,
    Send,
    AlertCircle,
    ArrowLeft,
    BookOpen,
    PenTool,
    MonitorPlay,
    Maximize2,
    Minimize2,
    CheckCircle,
    Clock,
    Info,
    ChevronLeft,
    ChevronRight,
    Save,
    Settings,
    Type,
    RotateCcw,
    ChevronDown,
    ChevronUp,
    Lightbulb,
    X,
    ZoomIn,
    ZoomOut,
    Eye,
    EyeOff,
    LayoutGrid,
    Square,
    CheckSquare,
} from "lucide-react";
import Link from "next/link";

import {
    MultipleChoice,
    MultipleSelect,
    DragDrop,
    Matching,
    Checklist,
    ShortResponse,
    ExtendedResponse,
    ExamTimer,
    StimulusRenderer,
} from "@/components/exam";
import MathRenderer from "@/components/ui/MathRenderer";

interface ProfessionalExamLayoutProps {
    exam: Exam;
    examId: string;
    onSubmit: (answers: Record<string, QuestionAnswer>, timeSpentSeconds: number) => Promise<void>;
    isSubmitting: boolean;
}

const createEmptyAnswer = (questionType: string): QuestionAnswer => {
    const baseAnswer: QuestionAnswer = { type: questionType as any };
    switch (questionType) {
        case 'multiple_choice':
            return { ...baseAnswer, selectedOptionId: undefined };
        case 'multiple_select':
        case 'checklist':
            return { ...baseAnswer, selectedOptionIds: [] };
        case 'drag_drop':
            return { ...baseAnswer, dragDropPlacements: {} };
        case 'matching':
            return { ...baseAnswer, matchingPairs: {} };
        default:
            return { ...baseAnswer, textAnswer: '' };
    }
};

// Tooltip Component
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
    const [show, setShow] = useState(false);
    return (
        <div className="relative" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {children}
            {show && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-1.5 bg-slate-800 text-slate-200 text-xs rounded-lg shadow-xl border border-slate-700 whitespace-nowrap z-50">
                    {text}
                </div>
            )}
        </div>
    );
}

// Layout Toggle Checkbox
function LayoutToggle({ 
    icon: Icon, 
    label, 
    checked, 
    onChange,
    color = "indigo"
}: { 
    icon: any; 
    label: string; 
    checked: boolean; 
    onChange: () => void;
    color?: "indigo" | "purple" | "emerald";
}) {
    const colorClasses = {
        indigo: "text-indigo-400 border-indigo-500/30 bg-indigo-500/10",
        purple: "text-purple-400 border-purple-500/30 bg-purple-500/10",
        emerald: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10",
    };

    return (
        <button
            onClick={onChange}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all ${
                checked 
                    ? colorClasses[color] 
                    : "text-slate-500 border-slate-700 bg-slate-800/30 opacity-60"
            }`}
        >
            {checked ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
            <Icon className="w-4 h-4" />
            <span className="text-xs font-medium">{label}</span>
        </button>
    );
}

// Font Size Slider
function FontSizeSlider({ label, value, onChange, min = 12, max = 24 }: { label: string; value: number; onChange: (val: number) => void; min?: number; max?: number }) {
    const percentage = ((value - min) / (max - min)) * 100;
    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{label}</span>
                <span className="text-xs font-mono text-indigo-400">{value}px</span>
            </div>
            <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                <div className="absolute h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all" style={{ width: `${percentage}%` }} />
                <input type="range" min={min} max={max} value={value} onChange={(e) => onChange(Number(e.target.value))} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
        </div>
    );
}

export default function ProfessionalExamLayout({ exam, examId, onSubmit, isSubmitting }: ProfessionalExamLayoutProps) {
    const router = useRouter();
    const { user } = useAuth();

    const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>(() => {
        const initialAnswers: Record<string, QuestionAnswer> = {};
        exam.items?.forEach((item) => {
            initialAnswers[item.id] = createEmptyAnswer(item.questionType || 'extended_response');
        });
        return initialAnswers;
    });

    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [examStartTime, setExamStartTime] = useState<Date | null>(null);
    const [generatedValues, setGeneratedValues] = useState<Record<string, number>>({});
    const [randomSeed] = useState(() => Math.floor(Math.random() * 1000000));
    const [isSaving, setIsSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const [showSettings, setShowSettings] = useState(false);

    // Layout States - 3 ส่วน
    const [showSimulation, setShowSimulation] = useState(true);
    const [showScenario, setShowScenario] = useState(true);
    const [showQuestions, setShowQuestions] = useState(true);

    // Font Size States
    const [scenarioFontSize, setScenarioFontSize] = useState(16);
    const [questionFontSize, setQuestionFontSize] = useState(18);
    const [choiceFontSize, setChoiceFontSize] = useState(16);

    const isSimulation = exam.mediaType === 'simulation';
    const currentItem = exam.items?.[currentItemIndex];
    const isFirstItem = currentItemIndex === 0;
    const isLastItem = exam.items ? currentItemIndex === exam.items.length - 1 : true;

    // คำนวณ layout
    const leftPanelVisible = showSimulation || showScenario;
    const leftPanelWidth = showQuestions ? (showSimulation && showScenario ? 50 : 60) : 100;

    const handleStartExam = useCallback(() => {
        setShowInstructions(false);
        setExamStartTime(new Date());
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(console.error);
        } else {
            document.exitFullscreen();
        }
    }, []);

    useEffect(() => {
        const handler = () => setIsFullscreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', handler);
        return () => document.removeEventListener('fullscreenchange', handler);
    }, []);

    const handleAnswerChange = useCallback((itemId: string, answer: Partial<QuestionAnswer>) => {
        setAnswers((prev) => ({ ...prev, [itemId]: { ...prev[itemId], ...answer } }));
    }, []);

    const handleAutoSave = useCallback(async () => {
        if (!user || !exam || isSaving) return;
        setIsSaving(true);
        try {
            const saveData = { examId: exam.id, answers, savedAt: new Date().toISOString(), randomSeed, generatedValues, currentItemIndex };
            localStorage.setItem(`exam_autosave_${exam.id}_${user.uid}`, JSON.stringify(saveData));
            setLastSaved(new Date());
        } catch (err) {
            console.error('Auto-save failed:', err);
        } finally {
            setIsSaving(false);
        }
    }, [user, exam, answers, isSaving, randomSeed, generatedValues, currentItemIndex]);

    useEffect(() => {
        if (!examStartTime || !exam) return;
        const interval = setInterval(handleAutoSave, 60000);
        return () => clearInterval(interval);
    }, [examStartTime, exam, handleAutoSave]);

    useEffect(() => {
        if (!examStartTime) return;
        const timeout = setTimeout(() => handleAutoSave(), 3000);
        return () => clearTimeout(timeout);
    }, [answers, examStartTime, handleAutoSave]);

    const answeredCount = exam.items?.filter((item) => {
        const answer = answers[item.id];
        if (!answer) return false;
        switch (item.questionType || 'extended_response') {
            case 'multiple_choice': return !!answer.selectedOptionId;
            case 'multiple_select': case 'checklist': return (answer.selectedOptionIds?.length || 0) > 0;
            case 'drag_drop': return Object.keys(answer.dragDropPlacements || {}).length > 0;
            case 'matching': return Object.keys(answer.matchingPairs || {}).length > 0;
            default: return (answer.textAnswer?.trim().length || 0) > 0;
        }
    }).length || 0;

    const isCurrentQuestionAnswered = (() => {
        if (!currentItem) return false;
        const answer = answers[currentItem.id];
        if (!answer) return false;
        switch (currentItem.questionType || 'extended_response') {
            case 'multiple_choice': return !!answer.selectedOptionId;
            case 'multiple_select': case 'checklist': return (answer.selectedOptionIds?.length || 0) > 0;
            case 'drag_drop': return Object.keys(answer.dragDropPlacements || {}).length > 0;
            case 'matching': return Object.keys(answer.matchingPairs || {}).length > 0;
            default: return (answer.textAnswer?.trim().length || 0) > 0;
        }
    })();

    const goToNextItem = () => {
        if (exam.items && currentItemIndex < exam.items.length - 1) {
            setCurrentItemIndex((prev) => prev + 1);
        }
    };

    const goToPrevItem = () => {
        if (currentItemIndex > 0) {
            setCurrentItemIndex((prev) => prev - 1);
        }
    };

    const handleSubmit = useCallback(async () => {
        if (!examStartTime) return;
        const timeSpentSeconds = Math.floor((Date.now() - examStartTime.getTime()) / 1000);
        await onSubmit(answers, timeSpentSeconds);
    }, [examStartTime, answers, onSubmit]);

    const handleTimeUp = useCallback(() => {
        handleAutoSave();
        if (examStartTime) {
            const timeSpentSeconds = Math.floor((Date.now() - examStartTime.getTime()) / 1000);
            onSubmit(answers, timeSpentSeconds);
        }
    }, [examStartTime, answers, onSubmit, handleAutoSave]);

    const renderQuestionInput = (item: ExamItem) => {
        const answer = answers[item.id] || createEmptyAnswer(item.questionType || 'extended_response');
        switch (item.questionType || 'extended_response') {
            case 'multiple_choice':
                return <MultipleChoice options={item.options || []} selectedOptionId={answer.selectedOptionId} onChange={(optionId) => handleAnswerChange(item.id, { selectedOptionId: optionId })} fontSize={choiceFontSize} />;
            case 'multiple_select':
                return <MultipleSelect options={item.options || []} selectedOptionIds={answer.selectedOptionIds || []} onChange={(optionIds) => handleAnswerChange(item.id, { selectedOptionIds: optionIds })} fontSize={choiceFontSize} />;
            case 'drag_drop':
                return <DragDrop dragItems={item.dragItems || []} dropZones={item.dropZones || []} placements={answer.dragDropPlacements || {}} onChange={(placements) => handleAnswerChange(item.id, { dragDropPlacements: placements })} />;
            case 'matching':
                return <Matching leftColumn={item.leftColumn || []} rightColumn={item.rightColumn || []} matchingPairs={answer.matchingPairs || {}} onChange={(pairs) => handleAnswerChange(item.id, { matchingPairs: pairs })} />;
            case 'checklist':
                return <Checklist options={item.options || []} selectedOptionIds={answer.selectedOptionIds || []} onChange={(optionIds) => handleAnswerChange(item.id, { selectedOptionIds: optionIds })} fontSize={choiceFontSize} />;
            case 'short_response':
                return <ShortResponse value={answer.textAnswer || ''} onChange={(value) => handleAnswerChange(item.id, { textAnswer: value })} maxCharacters={item.maxCharacters || 500} />;
            default:
                return <ExtendedResponse value={answer.textAnswer || ''} onChange={(value) => handleAnswerChange(item.id, { textAnswer: value })} />;
        }
    };

    return (
        <div className={`fixed inset-0 flex flex-col bg-slate-950 ${isFullscreen ? 'z-50' : ''}`}>
            {/* Header */}
            <header className="flex-shrink-0 h-14 px-4 flex items-center justify-between bg-slate-900 border-b border-slate-800">
                <div className="flex items-center gap-4">
                    {!isFullscreen && (
                        <Tooltip text="กลับสู่หน้าหลัก">
                            <Link href="/student/dashboard" className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                                <ArrowLeft size={20} />
                            </Link>
                        </Tooltip>
                    )}
                    
                    {/* Layout Toggles - Checkbox style */}
                    <div className="flex items-center gap-2">
                        {isSimulation && (
                            <LayoutToggle icon={MonitorPlay} label="Simulation" checked={showSimulation} onChange={() => setShowSimulation(!showSimulation)} color="purple" />
                        )}
                        <LayoutToggle icon={BookOpen} label="สถานการณ์" checked={showScenario} onChange={() => setShowScenario(!showScenario)} color="indigo" />
                        <LayoutToggle icon={PenTool} label="ข้อสอบ" checked={showQuestions} onChange={() => setShowQuestions(!showQuestions)} color="emerald" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {examStartTime && exam.timeLimit && (
                        <ExamTimer timeLimitMinutes={exam.timeLimit} startTime={examStartTime} onTimeUp={handleTimeUp} onAutoSave={handleAutoSave} />
                    )}

                    {/* Auto-save */}
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50">
                        {isSaving ? (
                            <><Save className="w-3.5 h-3.5 text-indigo-400 animate-pulse" /><span className="text-xs text-slate-400">กำลังบันทึก...</span></>
                        ) : lastSaved ? (
                            <><CheckCircle className="w-3.5 h-3.5 text-emerald-400" /><span className="text-xs text-slate-500">{lastSaved.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}</span></>
                        ) : (
                            <><Save className="w-3.5 h-3.5 text-slate-500" /><span className="text-xs text-slate-500">รอบันทึก</span></>
                        )}
                    </div>

                    {/* Settings */}
                    <div className="relative">
                        <button onClick={() => setShowSettings(!showSettings)} className={`p-2 rounded-lg transition-all ${showSettings ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}>
                            <Settings size={20} />
                        </button>
                        {showSettings && (
                            <div className="absolute right-0 top-10 w-56 bg-slate-900 rounded-xl shadow-2xl border border-slate-700 p-4 z-[200]">
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="font-semibold text-slate-200 text-sm">ตั้งค่า</h3>
                                    <button onClick={() => setShowSettings(false)} className="text-slate-500 hover:text-slate-300"><X size={16} /></button>
                                </div>
                                <div className="space-y-3">
                                    <FontSizeSlider label="สถานการณ์" value={scenarioFontSize} onChange={setScenarioFontSize} />
                                    <FontSizeSlider label="คำถาม" value={questionFontSize} onChange={setQuestionFontSize} />
                                    <FontSizeSlider label="ตัวเลือก" value={choiceFontSize} onChange={setChoiceFontSize} />
                                </div>
                            </div>
                        )}
                    </div>

                    <Tooltip text={isFullscreen ? "ออกจากโหมดเต็มหน้าจอ" : "โหมดเต็มหน้าจอ"}>
                        <button onClick={toggleFullscreen} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all">
                            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
                        </button>
                    </Tooltip>
                </div>
            </header>

            {/* Instructions Modal */}
            {showInstructions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                    <div className="w-full max-w-xl bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
                        <div className="p-6 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-slate-700">
                            <h2 className="text-xl font-bold text-slate-100 flex items-center gap-3">
                                <Info className="text-indigo-400 w-6 h-6" /> 
                                คำแนะนำการทำแบบทดสอบ
                            </h2>
                        </div>
                        
                        <div className="p-6 space-y-4">
                            {/* Fullscreen Warning - PROMINENT */}
                            <div className="relative overflow-hidden rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/50 p-4">
                                <div className="absolute top-0 right-0 p-2">
                                    <Maximize2 className="w-12 h-12 text-emerald-500/20" />
                                </div>
                                <div className="flex items-start gap-4 relative">
                                    <div className="p-3 bg-emerald-500/20 rounded-xl flex-shrink-0">
                                        <Maximize2 className="w-8 h-8 text-emerald-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-emerald-400 font-bold text-lg mb-1">แนะนำให้ใช้โหมดเต็มหน้าจอ</h3>
                                        <p className="text-emerald-300/80 text-sm leading-relaxed">
                                            กดปุ่ม <b>"เริ่มสอบแบบเต็มหน้าจอ"</b> เพื่อประสบการณ์การสอบที่ดีที่สุด <br/>
                                            หรือกด <b>F11</b> บนคีย์บอร์ด
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {exam.timeLimit && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                    <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-slate-200 font-medium">เวลาจำกัด {exam.timeLimit} นาที</p>
                                        <p className="text-sm text-slate-400">ระบบจะส่งคำตอบอัตโนมัติเมื่อหมดเวลา</p>
                                    </div>
                                </div>
                            )}
                            
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <p className="text-slate-300"><b>☑️ Checkbox</b> ควบคุมการแสดงผล</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <p className="text-slate-300"><b>⚙️ ตั้งค่า</b> ปรับขนาดตัวอักษร</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <p className="text-slate-300"><b>← →</b> เปลี่ยนข้อด้วยคีย์บอร์ด</p>
                                </div>
                                <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700">
                                    <p className="text-slate-300"><b>💾</b> บันทึกอัตโนมัติทุก 1 นาที</p>
                                </div>
                            </div>
                        </div>
                        
                        <div className="p-6 bg-slate-950 flex flex-col sm:flex-row gap-3">
                            <button 
                                onClick={() => {
                                    document.documentElement.requestFullscreen().catch(() => {});
                                    handleStartExam();
                                }} 
                                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-500/25"
                            >
                                <Maximize2 size={20} />
                                เริ่มสอบแบบเต็มหน้าจอ
                            </button>
                            <button 
                                onClick={handleStartExam} 
                                className="flex-1 sm:flex-none px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl transition-all"
                            >
                                เริ่มสอบปกติ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content - 3 Layout */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel - Simulation + Scenario */}
                {leftPanelVisible && (
                    <div 
                        className="flex flex-col bg-slate-900 border-r border-slate-800 transition-all duration-300"
                        style={{ width: `${leftPanelWidth}%` }}
                    >
                        {/* Simulation - Top */}
                        {showSimulation && isSimulation && (
                            <div className={`flex flex-col ${showScenario ? 'h-1/2 border-b border-slate-800' : 'h-full'}`}>
                                <div className="flex-shrink-0 px-3 py-2 bg-slate-800/50 border-b border-slate-800 flex items-center gap-2">
                                    <MonitorPlay size={16} className="text-purple-400" />
                                    <span className="text-sm font-medium text-slate-300">Simulation</span>
                                </div>
                                <div className="flex-1 bg-black">
                                    <iframe
                                        src={exam.mediaUrl}
                                        className="w-full h-full border-0"
                                        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        title={exam.title}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Scenario - Bottom */}
                        {showScenario && (
                            <div className={`flex flex-col ${showSimulation ? 'h-1/2' : 'h-full'}`}>
                                <div className="flex-shrink-0 px-3 py-2 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <BookOpen size={16} className="text-indigo-400" />
                                        <span className="text-sm font-medium text-slate-300">สถานการณ์</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <button onClick={() => setScenarioFontSize(Math.max(12, scenarioFontSize - 1))} className="p-1 rounded hover:bg-slate-700 text-slate-500"><ZoomOut size={14} /></button>
                                        <span className="text-xs text-slate-500 w-10 text-center">{scenarioFontSize}px</span>
                                        <button onClick={() => setScenarioFontSize(Math.min(24, scenarioFontSize + 1))} className="p-1 rounded hover:bg-slate-700 text-slate-500"><ZoomIn size={14} /></button>
                                    </div>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4" style={{ fontSize: `${scenarioFontSize}px` }}>
                                    {exam.scenario ? (
                                        <div className="prose prose-invert max-w-none">
                                            {exam.scenario.split('\n').map((para, i) => (
                                                <p key={i} className="text-slate-300 leading-relaxed mb-3 last:mb-0">{para}</p>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-slate-500 text-center py-8">ไม่มีข้อมูลสถานการณ์</p>
                                    )}
                                    {currentItem?.stimulusContent && (
                                        <div className="mt-4">
                                            <StimulusRenderer stimuli={currentItem.stimulusContent} randomSeed={randomSeed} generatedValues={generatedValues} onValuesGenerated={setGeneratedValues} />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Right Panel - Questions */}
                {showQuestions && (
                    <div className="flex-1 flex flex-col bg-slate-950 min-w-0">
                        {/* Question Header */}
                        <div className="flex-shrink-0 px-4 py-3 border-b border-slate-800 bg-slate-900/50">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <PenTool size={18} className="text-indigo-400" />
                                    <div>
                                        <h2 className="font-semibold text-slate-200 text-sm">คำถามข้อที่ {currentItemIndex + 1}</h2>
                                        <p className="text-xs text-slate-500">{currentItem?.score} คะแนน</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {exam.items?.slice(0, 8).map((item, idx) => {
                                        const answer = answers[item.id];
                                        let hasAnswer = false;
                                        if (answer) {
                                            switch (item.questionType || 'extended_response') {
                                                case 'multiple_choice': hasAnswer = !!answer.selectedOptionId; break;
                                                case 'multiple_select': case 'checklist': hasAnswer = (answer.selectedOptionIds?.length || 0) > 0; break;
                                                case 'drag_drop': hasAnswer = Object.keys(answer.dragDropPlacements || {}).length > 0; break;
                                                case 'matching': hasAnswer = Object.keys(answer.matchingPairs || {}).length > 0; break;
                                                default: hasAnswer = (answer.textAnswer?.trim().length || 0) > 0;
                                            }
                                        }
                                        return (
                                            <button key={item.id} onClick={() => setCurrentItemIndex(idx)} className={`w-7 h-7 rounded text-xs font-bold transition-all ${idx === currentItemIndex ? 'bg-indigo-600 text-white' : hasAnswer ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                                {idx + 1}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="mt-2 h-1 bg-slate-800 rounded-full overflow-hidden">
                                <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all" style={{ width: `${((currentItemIndex + 1) / (exam.items?.length || 1)) * 100}%` }} />
                            </div>
                        </div>

                        {/* Question Content */}
                        {currentItem && (
                            <div className="flex-1 overflow-y-auto p-4">
                                <div className="mb-4 p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
                                    <div className="flex items-start gap-3">
                                        <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                                            <span className="text-indigo-400 font-bold text-sm">{currentItemIndex + 1}</span>
                                        </div>
                                        <p className="text-slate-100 font-medium leading-relaxed flex-1" style={{ fontSize: `${questionFontSize}px` }}>
                                            <MathRenderer text={currentItem.question} />
                                        </p>
                                    </div>
                                    <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-end gap-2">
                                        <span className="text-xs text-slate-500">ขนาด:</span>
                                        <button onClick={() => setQuestionFontSize(Math.max(14, questionFontSize - 1))} className="p-1 rounded hover:bg-slate-700 text-slate-400"><ZoomOut size={14} /></button>
                                        <span className="text-xs text-slate-400 w-8 text-center">{questionFontSize}px</span>
                                        <button onClick={() => setQuestionFontSize(Math.min(24, questionFontSize + 1))} className="p-1 rounded hover:bg-slate-700 text-slate-400"><ZoomIn size={14} /></button>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-sm font-medium text-slate-400">คำตอบของคุณ</label>
                                        {isCurrentQuestionAnswered && (
                                            <span className="flex items-center gap-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-full">
                                                <CheckCircle size={12} /> บันทึกแล้ว
                                            </span>
                                        )}
                                    </div>
                                    {renderQuestionInput(currentItem)}
                                </div>
                            </div>
                        )}

                        {/* Bottom Navigation */}
                        <div className="flex-shrink-0 p-4 bg-slate-900/50 border-t border-slate-800">
                            <div className="flex items-center justify-between gap-4">
                                <button onClick={goToPrevItem} disabled={isFirstItem} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition-all ${isFirstItem ? 'bg-slate-800 text-slate-600 cursor-not-allowed' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                                    <ChevronLeft size={20} />
                                    <span className="hidden sm:inline">ก่อนหน้า</span>
                                </button>

                                {isLastItem ? (
                                    <button onClick={handleSubmit} disabled={isSubmitting || answeredCount === 0} className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-all disabled:opacity-50">
                                        {isSubmitting ? <><Loader2 className="w-5 h-5 animate-spin" /><span>กำลังส่ง...</span></> : <><Send size={20} /><span>ส่งคำตอบ</span><span className="text-emerald-200">({answeredCount}/{exam.items?.length})</span></>}
                                    </button>
                                ) : (
                                    <button onClick={goToNextItem} className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-all">
                                        <span className="hidden sm:inline">ถัดไป</span>
                                        <ChevronRight size={20} />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
