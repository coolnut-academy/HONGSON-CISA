"use client";

import { ChoiceOption } from "@/types";
import { Circle, CheckCircle } from "lucide-react";

interface MultipleChoiceProps {
    options: ChoiceOption[];
    selectedOptionId?: string;
    onChange: (optionId: string) => void;
    disabled?: boolean;
}

export default function MultipleChoice({
    options,
    selectedOptionId,
    onChange,
    disabled = false
}: MultipleChoiceProps) {
    return (
        <div className="space-y-3">
            {options.map((option, index) => {
                const isSelected = selectedOptionId === option.id;
                const letter = String.fromCharCode(65 + index); // A, B, C, D...

                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => !disabled && onChange(option.id)}
                        disabled={disabled}
                        className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left group ${isSelected
                                ? 'bg-indigo-500/20 border-indigo-500 shadow-lg shadow-indigo-500/20'
                                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600 hover:bg-slate-800'
                            } ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {/* Option Letter Circle */}
                        <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-all ${isSelected
                                ? 'bg-indigo-500 text-white'
                                : 'bg-slate-700 text-slate-400 group-hover:bg-slate-600'
                            }`}>
                            {letter}
                        </div>

                        {/* Option Text */}
                        <div className="flex-1 pt-2">
                            <p className={`text-base leading-relaxed ${isSelected ? 'text-white' : 'text-slate-300'
                                }`}>
                                {option.text}
                            </p>
                        </div>

                        {/* Selection Indicator */}
                        <div className="flex-shrink-0 pt-2">
                            {isSelected ? (
                                <CheckCircle className="w-6 h-6 text-indigo-400" />
                            ) : (
                                <Circle className="w-6 h-6 text-slate-600 group-hover:text-slate-500" />
                            )}
                        </div>
                    </button>
                );
            })}
        </div>
    );
}
