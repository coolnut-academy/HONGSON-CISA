"use client";

import { CheckCircle } from "lucide-react";

interface ExtendedResponseProps {
    value: string;
    onChange: (value: string) => void;
    minCharacters?: number;
    placeholder?: string;
    disabled?: boolean;
}

export default function ExtendedResponse({
    value,
    onChange,
    minCharacters = 200,
    placeholder = "พิมพ์คำตอบอย่างละเอียดของคุณที่นี่...",
    disabled = false
}: ExtendedResponseProps) {
    const characterCount = value.length;
    const hasMinimum = characterCount >= minCharacters;
    const progress = Math.min(100, (characterCount / minCharacters) * 100);

    return (
        <div className="space-y-3">
            {/* Guidelines */}
            <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <p className="text-sm text-slate-400">
                    💡 คำแนะนำ: อธิบายอย่างละเอียด โดยอ้างอิงหลักฐาน/ข้อมูล รวมถึงเหตุผลทางวิทยาศาสตร์
                </p>
            </div>

            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                rows={10}
                className={`w-full p-5 rounded-xl bg-slate-800/80 border-2 transition-all resize-y text-white placeholder-slate-500 leading-relaxed ${hasMinimum
                        ? 'border-emerald-500/50 focus:border-emerald-500'
                        : 'border-slate-700 focus:border-indigo-500'
                    } focus:ring-4 focus:ring-indigo-500/20 outline-none ${disabled ? 'opacity-60 cursor-not-allowed' : ''
                    }`}
            />

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${hasMinimum ? 'bg-emerald-500' : 'bg-indigo-500'
                            }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {hasMinimum ? (
                            <>
                                <CheckCircle className="w-4 h-4 text-emerald-400" />
                                <span className="text-sm text-emerald-400">ตอบครบถ้วน</span>
                            </>
                        ) : (
                            <span className="text-sm text-slate-500">
                                ต้องการอย่างน้อย {minCharacters} ตัวอักษร
                            </span>
                        )}
                    </div>
                    <span className={`text-sm font-medium ${hasMinimum ? 'text-emerald-400' : 'text-slate-400'
                        }`}>
                        {characterCount} ตัวอักษร
                    </span>
                </div>
            </div>
        </div>
    );
}
