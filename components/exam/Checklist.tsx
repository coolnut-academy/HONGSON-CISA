"use client";

import { ChoiceOption } from "@/types";
import { CheckCircle2, Circle } from "lucide-react";

interface ChecklistProps {
    options: ChoiceOption[];
    selectedOptionIds: string[];
    onChange: (optionIds: string[]) => void;
    disabled?: boolean;
}

export default function Checklist({
    options,
    selectedOptionIds = [],
    onChange,
    disabled = false
}: ChecklistProps) {
    const handleToggle = (optionId: string) => {
        if (disabled) return;

        const isSelected = selectedOptionIds.includes(optionId);
        if (isSelected) {
            onChange(selectedOptionIds.filter(id => id !== optionId));
        } else {
            onChange([...selectedOptionIds, optionId]);
        }
    };

    return (
        <div className="space-y-2">
            <p className="text-sm text-slate-400 mb-3">
                เลือกรายการที่ถูกต้องทั้งหมด:
            </p>

            {options.map((option) => {
                const isSelected = selectedOptionIds.includes(option.id);

                return (
                    <button
                        key={option.id}
                        type="button"
                        onClick={() => handleToggle(option.id)}
                        disabled={disabled}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${isSelected
                                ? 'bg-teal-500/15 border-teal-500/50'
                                : 'bg-slate-800/30 border-slate-700/50 hover:border-slate-600'
                            } ${disabled ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                        {/* Checkbox */}
                        <div className="flex-shrink-0">
                            {isSelected ? (
                                <CheckCircle2 className="w-6 h-6 text-teal-400" />
                            ) : (
                                <Circle className="w-6 h-6 text-slate-600" />
                            )}
                        </div>

                        {/* Text */}
                        <p className={`flex-1 text-sm ${isSelected ? 'text-white' : 'text-slate-300'
                            }`}>
                            {option.text}
                        </p>
                    </button>
                );
            })}

            {/* Selected count */}
            <div className="text-right text-sm text-slate-500 mt-3">
                เลือกแล้ว {selectedOptionIds.length} รายการ
            </div>
        </div>
    );
}
