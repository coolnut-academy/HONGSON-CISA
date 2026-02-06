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
            <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-100">
                <p className="text-sm text-indigo-800">
                    💡 คำแนะนำ: อธิบายอย่างละเอียด โดยอ้างอิงหลักฐาน/ข้อมูล รวมถึงเหตุผลทางวิทยาศาสตร์
                </p>
            </div>

            <textarea
                value={value}
                onChange={(e) => onChange(e.target.value)}
                disabled={disabled}
                placeholder={placeholder}
                rows={10}
                className={`
                    w-full p-5 rounded-xl bg-white border-2 transition-all resize-y 
                    text-slate-900 placeholder-slate-400 leading-relaxed
                    focus:ring-4 focus:ring-indigo-500/10 outline-none
                    ${hasMinimum
                        ? 'border-emerald-400 focus:border-emerald-500 hover:border-emerald-400'
                        : 'border-slate-200 focus:border-indigo-500 hover:border-slate-300'
                    }
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}
                `}
            />

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                    <div
                        className={`h-full transition-all duration-300 ${
                            hasMinimum ? 'bg-emerald-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${progress}%` }}
                    />
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {hasMinimum ? (
                            <>
                                <CheckCircle className="w-4 h-4 text-emerald-600" />
                                <span className="text-sm text-emerald-600 font-medium">ตอบครบถ้วน</span>
                            </>
                        ) : (
                            <span className="text-sm text-slate-500">
                                ต้องการอย่างน้อย {minCharacters} ตัวอักษร
                            </span>
                        )}
                    </div>
                    <span className={`text-sm font-medium ${
                        hasMinimum ? 'text-emerald-600' : 'text-slate-500'
                    }`}>
                        {characterCount} ตัวอักษร
                    </span>
                </div>
            </div>
        </div>
    );
}
