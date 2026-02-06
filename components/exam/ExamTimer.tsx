"use client";

import { useEffect, useState, useCallback } from "react";
import { Clock, AlertTriangle, Pause } from "lucide-react";

interface ExamTimerProps {
    timeLimitMinutes: number;
    startTime: Date;
    onTimeUp: () => void;
    onAutoSave?: () => void;
    paused?: boolean;
    isLightMode?: boolean;
}

export default function ExamTimer({
    timeLimitMinutes,
    startTime,
    onTimeUp,
    onAutoSave,
    paused = false,
    isLightMode = false
}: ExamTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState<number>(timeLimitMinutes * 60);
    const [hasWarned10, setHasWarned10] = useState(false);
    const [hasWarned5, setHasWarned5] = useState(false);
    const [hasWarned1, setHasWarned1] = useState(false);

    useEffect(() => {
        if (paused) return;

        const calculateTimeRemaining = () => {
            const now = new Date();
            const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
            const remaining = Math.max(0, timeLimitMinutes * 60 - elapsed);
            return remaining;
        };

        const interval = setInterval(() => {
            const remaining = calculateTimeRemaining();
            setTimeRemaining(remaining);

            // Warnings
            if (remaining <= 600 && remaining > 599 && !hasWarned10) {
                setHasWarned10(true);
                // Trigger auto-save
                onAutoSave?.();
                showNotification("⏰ เหลือเวลาอีก 10 นาที", "warning");
            }
            if (remaining <= 300 && remaining > 299 && !hasWarned5) {
                setHasWarned5(true);
                onAutoSave?.();
                showNotification("⚠️ เหลือเวลาอีก 5 นาที!", "warning");
            }
            if (remaining <= 60 && remaining > 59 && !hasWarned1) {
                setHasWarned1(true);
                onAutoSave?.();
                showNotification("🚨 เหลือเวลาอีก 1 นาที! กำลังบันทึกอัตโนมัติ", "danger");
            }

            // Time's up
            if (remaining <= 0) {
                clearInterval(interval);
                onTimeUp();
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime, timeLimitMinutes, paused, hasWarned10, hasWarned5, hasWarned1, onTimeUp, onAutoSave]);

    const showNotification = (message: string, type: 'warning' | 'danger') => {
        // Browser notification if permitted
        if (Notification.permission === 'granted') {
            new Notification(message);
        }
        // Also show alert
        alert(message);
    };

    // Format time
    const formatTime = (seconds: number) => {
        const hrs = Math.floor(seconds / 3600);
        const mins = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // Calculate color based on time remaining
    const getTimerColor = () => {
        if (timeRemaining <= 60) return isLightMode ? 'text-red-600 animate-pulse' : 'text-red-400 animate-pulse';
        if (timeRemaining <= 300) return isLightMode ? 'text-red-600' : 'text-red-400';
        if (timeRemaining <= 600) return isLightMode ? 'text-amber-600' : 'text-amber-400';
        return isLightMode ? 'text-emerald-600' : 'text-emerald-400';
    };

    const getTimerBg = () => {
        if (isLightMode) {
            if (timeRemaining <= 60) return 'bg-red-50 border-red-200';
            if (timeRemaining <= 300) return 'bg-red-50 border-red-200';
            if (timeRemaining <= 600) return 'bg-amber-50 border-amber-200';
            return 'bg-slate-100 border-slate-200';
        } else {
            if (timeRemaining <= 60) return 'bg-red-500/20 border-red-500/50';
            if (timeRemaining <= 300) return 'bg-red-500/10 border-red-500/30';
            if (timeRemaining <= 600) return 'bg-amber-500/10 border-amber-500/30';
            return 'bg-slate-800/80 border-slate-700/50';
        }
    };
    
    const getProgressBg = () => {
        return isLightMode ? 'text-slate-300' : 'text-slate-700';
    };

    const progressPercent = (timeRemaining / (timeLimitMinutes * 60)) * 100;

    return (
        <div className={`flex items-center gap-3 px-4 py-2 rounded-xl border transition-all ${getTimerBg()}`}>
            {/* Icon */}
            {timeRemaining <= 60 ? (
                <AlertTriangle className={`w-5 h-5 ${getTimerColor()}`} />
            ) : (
                <Clock className={`w-5 h-5 ${getTimerColor()}`} />
            )}

            {/* Time Display */}
            <div className="flex flex-col">
                <span className={`font-mono text-lg font-bold ${getTimerColor()}`}>
                    {formatTime(timeRemaining)}
                </span>
                <span className={`text-[10px] uppercase tracking-wider ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    เหลือ
                </span>
            </div>

            {/* Progress Ring (hidden on mobile) */}
            <div className="hidden md:block relative w-10 h-10">
                <svg className="w-10 h-10 -rotate-90">
                    <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className={getProgressBg()}
                    />
                    <circle
                        cx="20"
                        cy="20"
                        r="16"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeDasharray={`${progressPercent} 100`}
                        strokeLinecap="round"
                        className={getTimerColor()}
                    />
                </svg>
            </div>

            {/* Paused indicator */}
            {paused && (
                <div className={`flex items-center gap-1 ${isLightMode ? 'text-amber-600' : 'text-amber-400'}`}>
                    <Pause className="w-4 h-4" />
                    <span className="text-xs">หยุดชั่วคราว</span>
                </div>
            )}
        </div>
    );
}
