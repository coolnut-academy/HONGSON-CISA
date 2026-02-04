"use client";

import { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useRoleProtection } from "@/hooks/useRoleProtection";
import { db } from "@/lib/firebase";
import { doc, getDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Exam, Submission, QuestionAnswer, ExamItem } from "@/types";
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
    Save
} from "lucide-react";
import Link from "next/link";

// Import exam components
import {
    MultipleChoice,
    MultipleSelect,
    DragDrop,
    Matching,
    Checklist,
    ShortResponse,
    ExtendedResponse,
    ExamTimer,
    StimulusRenderer
} from "@/components/exam";

export default function ExamPage() {
    const params = useParams();
    const examId = params?.examId as string;
    const router = useRouter();
    const { user } = useAuth();
    const { isLoading: isAuthLoading, isAuthorized } = useRoleProtection(['student']);

    const [exam, setExam] = useState<Exam | null>(null);
    const [loadingExam, setLoadingExam] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [answers, setAnswers] = useState<Record<string, QuestionAnswer>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentItemIndex, setCurrentItemIndex] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showInstructions, setShowInstructions] = useState(true);
    const [examStartTime, setExamStartTime] = useState<Date | null>(null);
    const [generatedValues, setGeneratedValues] = useState<Record<string, number>>({});
    const [randomSeed] = useState(() => Math.floor(Math.random() * 1000000));
    const [isSaving, setIsSaving] = useState(false);
    const lastSaveRef = useRef<Date | null>(null);

    useEffect(() => {
        async function fetchExam() {
            if (!examId) return;

            try {
                const docRef = doc(db, "exams", examId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as Exam;
                    if (data.isActive) {
                        const examData = { id: docSnap.id, ...data };
                        setExam(examData);

                        // Initialize answers structure based on question types
                        if (data.items && data.items.length > 0) {
                            const initialAnswers: Record<string, QuestionAnswer> = {};
                            data.items.forEach(item => {
                                initialAnswers[item.id] = createEmptyAnswer(item.questionType || 'extended_response');
                            });
                            setAnswers(initialAnswers);
                        }
                    } else {
                        setError("แบบทดสอบนี้ปิดใช้งานอยู่ในขณะนี้");
                    }
                } else {
                    setError("ไม่พบแบบทดสอบ");
                }
            } catch (err) {
                console.error("Error fetching exam:", err);
                setError("เกิดข้อผิดพลาดในการโหลดข้อมูลแบบทดสอบ");
            } finally {
                setLoadingExam(false);
            }
        }

        fetchExam();
    }, [examId]);

    // Create empty answer based on question type
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
            case 'short_response':
            case 'extended_response':
            default:
                return { ...baseAnswer, textAnswer: '' };
        }
    };

    // Start exam timer when instructions are dismissed
    const handleStartExam = useCallback(() => {
        setShowInstructions(false);
        setExamStartTime(new Date());

        // Request notification permission for timer warnings
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Fullscreen handler
    const toggleFullscreen = useCallback(() => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().then(() => {
                setIsFullscreen(true);
            }).catch(err => {
                console.error("Fullscreen error:", err);
            });
        } else {
            document.exitFullscreen().then(() => {
                setIsFullscreen(false);
            });
        }
    }, []);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Handle answer changes for different question types
    const handleAnswerChange = useCallback((itemId: string, answer: Partial<QuestionAnswer>) => {
        setAnswers(prev => ({
            ...prev,
            [itemId]: {
                ...prev[itemId],
                ...answer
            }
        }));
    }, []);

    // Auto-save function
    const handleAutoSave = useCallback(async () => {
        if (!user || !exam || isSaving) return;

        // Don't save too frequently
        if (lastSaveRef.current) {
            const timeSinceLastSave = Date.now() - lastSaveRef.current.getTime();
            if (timeSinceLastSave < 30000) return; // At least 30 seconds between saves
        }

        setIsSaving(true);
        try {
            // Save to localStorage as backup
            const saveData = {
                examId: exam.id,
                answers,
                savedAt: new Date().toISOString(),
                randomSeed,
                generatedValues
            };
            localStorage.setItem(`exam_autosave_${exam.id}_${user.uid}`, JSON.stringify(saveData));
            lastSaveRef.current = new Date();
            console.log('Auto-saved at', new Date().toLocaleTimeString());
        } catch (err) {
            console.error('Auto-save failed:', err);
        } finally {
            setIsSaving(false);
        }
    }, [user, exam, answers, isSaving, randomSeed, generatedValues]);

    // Auto-save every 2 minutes
    useEffect(() => {
        if (!examStartTime || !exam) return;

        const interval = setInterval(handleAutoSave, 120000); // 2 minutes
        return () => clearInterval(interval);
    }, [examStartTime, exam, handleAutoSave]);

    const totalMaxScore = useMemo(() => {
        if (!exam?.items) return 0;
        return exam.items.reduce((sum, item) => sum + item.score, 0);
    }, [exam]);

    const answeredCount = useMemo(() => {
        if (!exam?.items) return 0;

        return exam.items.filter(item => {
            const answer = answers[item.id];
            if (!answer) return false;

            switch (item.questionType || 'extended_response') {
                case 'multiple_choice':
                    return !!answer.selectedOptionId;
                case 'multiple_select':
                case 'checklist':
                    return (answer.selectedOptionIds?.length || 0) > 0;
                case 'drag_drop':
                    return Object.keys(answer.dragDropPlacements || {}).length > 0;
                case 'matching':
                    return Object.keys(answer.matchingPairs || {}).length > 0;
                case 'short_response':
                case 'extended_response':
                default:
                    return (answer.textAnswer?.trim().length || 0) > 0;
            }
        }).length;
    }, [answers, exam]);

    const currentItem = exam?.items?.[currentItemIndex];
    const isFirstItem = currentItemIndex === 0;
    const isLastItem = exam?.items ? currentItemIndex === exam.items.length - 1 : true;

    // Get current category
    const currentCategory = currentItem?.category;
    const showCategoryHeader = useMemo(() => {
        if (!currentCategory || currentItemIndex === 0) return false;
        const prevItem = exam?.items?.[currentItemIndex - 1];
        return prevItem?.category !== currentCategory;
    }, [currentCategory, currentItemIndex, exam?.items]);

    const goToNextItem = () => {
        if (exam?.items && currentItemIndex < exam.items.length - 1) {
            setCurrentItemIndex(prev => prev + 1);
        }
    };

    const goToPrevItem = () => {
        if (currentItemIndex > 0) {
            setCurrentItemIndex(prev => prev - 1);
        }
    };

    // Submit handler (also used for auto-submit)
    const handleSubmit = useCallback(async (isAutoSubmit: boolean = false) => {
        if (!user || !exam) return;

        if (!isAutoSubmit) {
            const unansweredItems = exam.items.filter(item => {
                const answer = answers[item.id];
                if (!answer) return true;

                switch (item.questionType || 'extended_response') {
                    case 'multiple_choice':
                        return !answer.selectedOptionId;
                    case 'multiple_select':
                    case 'checklist':
                        return (answer.selectedOptionIds?.length || 0) === 0;
                    case 'drag_drop':
                        return Object.keys(answer.dragDropPlacements || {}).length === 0;
                    case 'matching':
                        return Object.keys(answer.matchingPairs || {}).length === 0;
                    default:
                        return (answer.textAnswer?.trim().length || 0) === 0;
                }
            });

            if (unansweredItems.length > 0) {
                const confirmSubmit = confirm(
                    `คุณยังไม่ได้ตอบคำถาม ${unansweredItems.length} ข้อ คุณแน่ใจหรือไม่ที่จะส่ง?`
                );
                if (!confirmSubmit) return;
            } else {
                if (!confirm("คุณแน่ใจหรือไม่ที่จะส่งคำตอบ? เมื่อส่งแล้วจะไม่สามารถแก้ไขได้")) {
                    return;
                }
            }
        }

        setIsSubmitting(true);

        try {
            const studentName = (user.firstName && user.lastName)
                ? `${user.firstName} ${user.lastName}`
                : (user.email?.split('@')[0] || "Unknown Student");

            const initialItemScores: Record<string, number> = {};
            exam.items.forEach(item => {
                initialItemScores[item.id] = 0;
            });

            // Calculate time spent
            const timeSpentSeconds = examStartTime
                ? Math.floor((Date.now() - examStartTime.getTime()) / 1000)
                : 0;

            const submissionData: Submission = {
                examId: exam.id!,
                studentId: user.uid,
                studentName: studentName,
                classRoom: user.classRoom || "N/A",
                competency: exam.competency,
                answers: answers,
                itemScores: initialItemScores,
                status: 'pending',
                score: null,
                feedback: null,
                submittedAt: serverTimestamp(),
                startedAt: examStartTime,
                timeSpentSeconds,
                autoSubmitted: isAutoSubmit,
                randomSeed,
                generatedValues
            };

            await addDoc(collection(db, "submissions"), submissionData);

            // Clear auto-save
            localStorage.removeItem(`exam_autosave_${exam.id}_${user.uid}`);

            // Exit fullscreen before redirect
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }

            if (isAutoSubmit) {
                alert("⏰ หมดเวลา! ระบบได้ส่งคำตอบของคุณโดยอัตโนมัติแล้ว กำลังรอการประเมินจาก AI...");
            } else {
                alert("ส่งคำตอบสำเร็จ! ระบบกำลังรอการประเมินจาก AI...");
            }
            router.push("/student/dashboard");
        } catch (err) {
            console.error("Error submitting answer:", err);
            alert("เกิดข้อผิดพลาดในการส่งคำตอบ กรุณาลองใหม่อีกครั้ง");
        } finally {
            setIsSubmitting(false);
        }
    }, [user, exam, answers, examStartTime, randomSeed, generatedValues, router]);

    // Time up handler
    const handleTimeUp = useCallback(() => {
        handleAutoSave();
        handleSubmit(true);
    }, [handleAutoSave, handleSubmit]);

    // Render question based on type
    const renderQuestionInput = (item: ExamItem) => {
        const answer = answers[item.id] || createEmptyAnswer(item.questionType || 'extended_response');
        const questionType = item.questionType || 'extended_response';

        switch (questionType) {
            case 'multiple_choice':
                return (
                    <MultipleChoice
                        options={item.options || []}
                        selectedOptionId={answer.selectedOptionId}
                        onChange={(optionId) => handleAnswerChange(item.id, { selectedOptionId: optionId })}
                    />
                );

            case 'multiple_select':
                return (
                    <MultipleSelect
                        options={item.options || []}
                        selectedOptionIds={answer.selectedOptionIds || []}
                        onChange={(optionIds) => handleAnswerChange(item.id, { selectedOptionIds: optionIds })}
                    />
                );

            case 'drag_drop':
                return (
                    <DragDrop
                        dragItems={item.dragItems || []}
                        dropZones={item.dropZones || []}
                        placements={answer.dragDropPlacements || {}}
                        onChange={(placements) => handleAnswerChange(item.id, { dragDropPlacements: placements })}
                    />
                );

            case 'matching':
                return (
                    <Matching
                        leftColumn={item.leftColumn || []}
                        rightColumn={item.rightColumn || []}
                        matchingPairs={answer.matchingPairs || {}}
                        onChange={(pairs) => handleAnswerChange(item.id, { matchingPairs: pairs })}
                    />
                );

            case 'checklist':
                return (
                    <Checklist
                        options={item.options || []}
                        selectedOptionIds={answer.selectedOptionIds || []}
                        onChange={(optionIds) => handleAnswerChange(item.id, { selectedOptionIds: optionIds })}
                    />
                );

            case 'short_response':
                return (
                    <ShortResponse
                        value={answer.textAnswer || ''}
                        onChange={(value) => handleAnswerChange(item.id, { textAnswer: value })}
                        maxCharacters={item.maxCharacters || 500}
                    />
                );

            case 'extended_response':
            default:
                return (
                    <ExtendedResponse
                        value={answer.textAnswer || ''}
                        onChange={(value) => handleAnswerChange(item.id, { textAnswer: value })}
                    />
                );
        }
    };

    // Check if current question is answered
    const isCurrentQuestionAnswered = useMemo(() => {
        if (!currentItem) return false;
        const answer = answers[currentItem.id];
        if (!answer) return false;

        switch (currentItem.questionType || 'extended_response') {
            case 'multiple_choice':
                return !!answer.selectedOptionId;
            case 'multiple_select':
            case 'checklist':
                return (answer.selectedOptionIds?.length || 0) > 0;
            case 'drag_drop':
                return Object.keys(answer.dragDropPlacements || {}).length > 0;
            case 'matching':
                return Object.keys(answer.matchingPairs || {}).length > 0;
            default:
                return (answer.textAnswer?.trim().length || 0) > 0;
        }
    }, [currentItem, answers]);

    if (isAuthLoading || loadingExam) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 gap-4">
                <div className="relative">
                    <div className="w-20 h-20 rounded-full border-4 border-blue-500/20 border-t-blue-500 animate-spin" />
                    <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-400" size={32} />
                </div>
                <p className="text-slate-400 text-lg animate-pulse">กำลังโหลดแบบทดสอบ...</p>
            </div>
        );
    }

    if (!isAuthorized) return null;

    if (error || !exam) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
                <div className="text-center max-w-md bg-slate-800/80 backdrop-blur-xl p-10 rounded-3xl border border-slate-700/50 shadow-2xl">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-500/20 flex items-center justify-center">
                        <AlertCircle className="w-10 h-10 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-3">ไม่สามารถเข้าถึงได้</h1>
                    <p className="text-slate-400 mb-8">{error || "เกิดข้อผิดพลาดบางอย่าง"}</p>
                    <Link
                        href="/student/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-white font-medium transition-colors"
                    >
                        <ArrowLeft size={20} /> กลับสู่หน้าหลัก
                    </Link>
                </div>
            </div>
        );
    }

    const isSimulation = exam.mediaType === 'simulation';

    return (
        <div className={`fixed inset-0 flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 ${isFullscreen ? 'z-50' : ''}`}>
            {/* Top Bar */}
            <header className="flex-shrink-0 h-16 px-4 md:px-6 flex items-center justify-between bg-slate-900/90 backdrop-blur-xl border-b border-slate-700/50">
                <div className="flex items-center gap-4">
                    {!isFullscreen && (
                        <Link
                            href="/student/dashboard"
                            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                        >
                            <ArrowLeft size={22} />
                        </Link>
                    )}
                    <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-xl ${isSimulation ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {isSimulation ? <MonitorPlay size={22} /> : <BookOpen size={22} />}
                        </div>
                        <div className="hidden sm:block">
                            <h1 className="font-bold text-white text-lg leading-tight line-clamp-1 max-w-[300px]" title={exam.title}>
                                {exam.title}
                            </h1>
                            <p className="text-xs text-slate-400 line-clamp-1">{exam.competency}</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    {/* Timer */}
                    {examStartTime && exam.timeLimit && (
                        <ExamTimer
                            timeLimitMinutes={exam.timeLimit}
                            startTime={examStartTime}
                            onTimeUp={handleTimeUp}
                            onAutoSave={handleAutoSave}
                        />
                    )}

                    {/* Progress Indicator (when no timer) */}
                    {!exam.timeLimit && (
                        <div className="hidden md:flex items-center gap-3 px-4 py-2 rounded-xl bg-slate-800/80 border border-slate-700/50">
                            <div className="text-center">
                                <p className="text-xl font-bold text-blue-400">{answeredCount}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">ตอบแล้ว</p>
                            </div>
                            <div className="w-px h-8 bg-slate-700" />
                            <div className="text-center">
                                <p className="text-xl font-bold text-slate-400">{exam.items?.length || 0}</p>
                                <p className="text-[10px] text-slate-500 uppercase tracking-wider">ทั้งหมด</p>
                            </div>
                        </div>
                    )}

                    {/* Auto-save indicator */}
                    {isSaving && (
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Save className="w-3 h-3 animate-pulse" />
                            <span>กำลังบันทึก...</span>
                        </div>
                    )}

                    {/* Fullscreen Toggle */}
                    <button
                        onClick={toggleFullscreen}
                        className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
                        title={isFullscreen ? "ออกจากโหมดเต็มหน้าจอ" : "โหมดเต็มหน้าจอ"}
                    >
                        {isFullscreen ? <Minimize2 size={22} /> : <Maximize2 size={22} />}
                    </button>
                </div>
            </header>

            {/* Instructions Modal */}
            {showInstructions && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="w-full max-w-lg bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-6 bg-gradient-to-r from-blue-500/20 to-purple-500/20 border-b border-slate-700/50">
                            <div className="flex items-center gap-4">
                                <div className="p-3 rounded-2xl bg-blue-500/30">
                                    <Info size={28} className="text-blue-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-white">คำแนะนำการทำแบบทดสอบ</h2>
                                    <p className="text-sm text-slate-400">{exam.title}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 space-y-4">
                            {exam.timeLimit && (
                                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                                    <Clock className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-white font-medium">เวลาจำกัด {exam.timeLimit} นาที</p>
                                        <p className="text-sm text-slate-400">ระบบจะส่งคำตอบอัตโนมัติเมื่อหมดเวลา</p>
                                    </div>
                                </div>
                            )}
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-blue-400 font-bold text-sm">1</div>
                                <div>
                                    <p className="text-white font-medium">อ่านสถานการณ์/ดู Simulation ทางซ้าย</p>
                                    <p className="text-sm text-slate-400">ศึกษาข้อมูลให้เข้าใจก่อนตอบคำถาม</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-blue-400 font-bold text-sm">2</div>
                                <div>
                                    <p className="text-white font-medium">ตอบคำถามทีละข้อทางขวา</p>
                                    <p className="text-sm text-slate-400">รูปแบบคำถามหลากหลาย: เลือกตอบ, ลาก-วาง, จับคู่, เขียนอธิบาย</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-blue-400 font-bold text-sm">3</div>
                                <div>
                                    <p className="text-white font-medium">กดโหมดเต็มหน้าจอเพื่อความสะดวก</p>
                                    <p className="text-sm text-slate-400">ช่วยให้คุณโฟกัสกับข้อสอบได้มากขึ้น</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-8 h-8 rounded-lg bg-slate-700/50 flex items-center justify-center text-emerald-400 font-bold text-sm">✓</div>
                                <div>
                                    <p className="text-white font-medium">กดส่งคำตอบเมื่อเสร็จสิ้น</p>
                                    <p className="text-sm text-slate-400">ระบบจะตรวจให้อัตโนมัติด้วย AI</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-900/50 flex justify-end">
                            <button
                                onClick={handleStartExam}
                                className="px-8 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50"
                            >
                                เริ่มทำแบบทดสอบ
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left Panel: Stimulus */}
                <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full bg-slate-900 border-b md:border-b-0 md:border-r border-slate-700/50">
                    {/* Stimulus Header */}
                    <div className="flex-shrink-0 px-5 py-4 border-b border-slate-700/50 bg-slate-800/50">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${isSimulation ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                                {isSimulation ? <MonitorPlay size={20} /> : <BookOpen size={20} />}
                            </div>
                            <div>
                                <h2 className="font-semibold text-white">
                                    {isSimulation ? 'Simulation' : 'สถานการณ์'}
                                </h2>
                                <p className="text-xs text-slate-500">ศึกษาข้อมูลนี้เพื่อตอบคำถาม</p>
                            </div>
                        </div>
                    </div>

                    {/* Stimulus Content */}
                    <div className="flex-1 overflow-hidden">
                        {isSimulation ? (
                            <div className="h-full flex flex-col">
                                <iframe
                                    src={exam.mediaUrl}
                                    className="flex-1 w-full border-0"
                                    sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    title={exam.title}
                                />
                                {exam.scenario && (
                                    <div className="flex-shrink-0 p-4 bg-slate-800/50 border-t border-slate-700/50">
                                        <p className="text-sm text-slate-300 leading-relaxed">{exam.scenario}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="h-full overflow-y-auto p-6 md:p-8">
                                <div className="prose prose-invert prose-lg max-w-none">
                                    {exam.scenario.split('\n').map((paragraph, idx) => (
                                        <p key={idx} className="text-slate-300 leading-loose mb-4 last:mb-0">
                                            {paragraph}
                                        </p>
                                    ))}
                                </div>

                                {/* Question-specific stimulus */}
                                {currentItem?.stimulusContent && (
                                    <div className="mt-6">
                                        <StimulusRenderer
                                            stimuli={currentItem.stimulusContent}
                                            randomSeed={randomSeed}
                                            generatedValues={generatedValues}
                                            onValuesGenerated={setGeneratedValues}
                                        />
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Panel: Questions */}
                <div className="w-full md:w-1/2 flex flex-col h-1/2 md:h-full bg-slate-800/30">
                    {/* Question Header */}
                    <div className="flex-shrink-0 px-5 py-4 border-b border-slate-700/50 bg-slate-800/50">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400">
                                    <PenTool size={20} />
                                </div>
                                <div>
                                    <h2 className="font-semibold text-white">
                                        คำถามข้อที่ {currentItemIndex + 1}
                                    </h2>
                                    <p className="text-xs text-slate-500">
                                        {currentItem?.score} คะแนน • {currentItem?.questionType === 'multiple_choice' ? 'เลือกตอบ' :
                                            currentItem?.questionType === 'multiple_select' ? 'เลือกได้หลายข้อ' :
                                                currentItem?.questionType === 'drag_drop' ? 'ลาก-วาง' :
                                                    currentItem?.questionType === 'matching' ? 'จับคู่' :
                                                        currentItem?.questionType === 'checklist' ? 'เลือกรายการ' :
                                                            currentItem?.questionType === 'short_response' ? 'ตอบสั้น' :
                                                                'เขียนอธิบาย'}
                                    </p>
                                </div>
                            </div>

                            {/* Question Navigation Pills */}
                            <div className="hidden md:flex items-center gap-1">
                                {exam.items?.map((item, idx) => {
                                    const answer = answers[item.id];
                                    let hasAnswer = false;

                                    if (answer) {
                                        switch (item.questionType || 'extended_response') {
                                            case 'multiple_choice':
                                                hasAnswer = !!answer.selectedOptionId;
                                                break;
                                            case 'multiple_select':
                                            case 'checklist':
                                                hasAnswer = (answer.selectedOptionIds?.length || 0) > 0;
                                                break;
                                            case 'drag_drop':
                                                hasAnswer = Object.keys(answer.dragDropPlacements || {}).length > 0;
                                                break;
                                            case 'matching':
                                                hasAnswer = Object.keys(answer.matchingPairs || {}).length > 0;
                                                break;
                                            default:
                                                hasAnswer = (answer.textAnswer?.trim().length || 0) > 0;
                                        }
                                    }

                                    const isCurrent = idx === currentItemIndex;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setCurrentItemIndex(idx)}
                                            className={`w-8 h-8 rounded-lg text-sm font-bold transition-all ${isCurrent
                                                ? 'bg-indigo-500 text-white scale-110'
                                                : hasAnswer
                                                    ? 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                                                    : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700'
                                                }`}
                                            title={hasAnswer ? `ข้อ ${idx + 1} - ตอบแล้ว` : `ข้อ ${idx + 1}`}
                                        >
                                            {hasAnswer ? '✓' : idx + 1}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-3 h-1.5 bg-slate-700/50 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                                style={{ width: `${((currentItemIndex + 1) / (exam.items?.length || 1)) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Category Header (if new category) */}
                    {currentCategory && (
                        <div className="px-5 py-3 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border-b border-slate-700/50">
                            <p className="text-sm font-medium text-indigo-300">
                                📚 {currentCategory}
                            </p>
                        </div>
                    )}

                    {/* Question Content */}
                    {currentItem && (
                        <div className="flex-1 overflow-y-auto p-6">
                            {/* Question Text */}
                            <div className="mb-6 p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/5 border border-indigo-500/20">
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
                                        <span className="text-indigo-400 font-bold">{currentItemIndex + 1}</span>
                                    </div>
                                    <p className="text-white font-medium leading-relaxed text-lg pt-1">
                                        {currentItem.question}
                                    </p>
                                </div>
                            </div>

                            {/* Question-specific stimulus (embedded in right panel if no simulation) */}
                            {currentItem.stimulusContent && !isSimulation && (
                                <div className="mb-6">
                                    <StimulusRenderer
                                        stimuli={currentItem.stimulusContent}
                                        randomSeed={randomSeed}
                                        generatedValues={generatedValues}
                                        onValuesGenerated={setGeneratedValues}
                                    />
                                </div>
                            )}

                            {/* Answer Input */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-medium text-slate-400">
                                        คำตอบของคุณ
                                    </label>
                                    {isCurrentQuestionAnswered && (
                                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                                            <CheckCircle size={12} /> บันทึกแล้ว
                                        </span>
                                    )}
                                </div>

                                {renderQuestionInput(currentItem)}
                            </div>
                        </div>
                    )}

                    {/* Bottom Navigation */}
                    <div className="flex-shrink-0 p-4 md:p-6 bg-slate-900/80 backdrop-blur-xl border-t border-slate-700/50">
                        <div className="flex items-center justify-between gap-4">
                            {/* Previous Button */}
                            <button
                                onClick={goToPrevItem}
                                disabled={isFirstItem}
                                className={`flex items-center gap-2 px-5 py-3 rounded-xl font-medium transition-all ${isFirstItem
                                    ? 'bg-slate-800/50 text-slate-600 cursor-not-allowed'
                                    : 'bg-slate-700 text-white hover:bg-slate-600'
                                    }`}
                            >
                                <ChevronLeft size={20} />
                                <span className="hidden sm:inline">ก่อนหน้า</span>
                            </button>

                            {/* Mobile Question Pills */}
                            <div className="flex md:hidden items-center gap-1 overflow-x-auto px-2">
                                {exam.items?.map((item, idx) => {
                                    const answer = answers[item.id];
                                    let hasAnswer = false;

                                    if (answer) {
                                        switch (item.questionType || 'extended_response') {
                                            case 'multiple_choice':
                                                hasAnswer = !!answer.selectedOptionId;
                                                break;
                                            case 'multiple_select':
                                            case 'checklist':
                                                hasAnswer = (answer.selectedOptionIds?.length || 0) > 0;
                                                break;
                                            case 'drag_drop':
                                                hasAnswer = Object.keys(answer.dragDropPlacements || {}).length > 0;
                                                break;
                                            case 'matching':
                                                hasAnswer = Object.keys(answer.matchingPairs || {}).length > 0;
                                                break;
                                            default:
                                                hasAnswer = (answer.textAnswer?.trim().length || 0) > 0;
                                        }
                                    }

                                    const isCurrent = idx === currentItemIndex;
                                    return (
                                        <button
                                            key={item.id}
                                            onClick={() => setCurrentItemIndex(idx)}
                                            className={`flex-shrink-0 w-7 h-7 rounded text-xs font-bold transition-all ${isCurrent
                                                ? 'bg-indigo-500 text-white'
                                                : hasAnswer
                                                    ? 'bg-emerald-500/20 text-emerald-400'
                                                    : 'bg-slate-700/50 text-slate-500'
                                                }`}
                                        >
                                            {hasAnswer ? '✓' : idx + 1}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Next/Submit Button */}
                            {isLastItem ? (
                                <button
                                    onClick={() => handleSubmit(false)}
                                    disabled={isSubmitting || answeredCount === 0}
                                    className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none hover:-translate-y-0.5"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            <span className="hidden sm:inline">กำลังส่ง...</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send size={20} />
                                            <span className="hidden sm:inline">ส่งคำตอบ</span>
                                            <span className="text-emerald-200">({answeredCount}/{exam.items?.length})</span>
                                        </>
                                    )}
                                </button>
                            ) : (
                                <button
                                    onClick={goToNextItem}
                                    className="flex items-center gap-2 px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-medium rounded-xl transition-all"
                                >
                                    <span className="hidden sm:inline">ถัดไป</span>
                                    <ChevronRight size={20} />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
