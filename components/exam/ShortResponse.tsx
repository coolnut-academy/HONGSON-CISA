"use client";

interface ShortResponseProps {
    value: string;
    onChange: (value: string) => void;
    maxCharacters?: number;
    placeholder?: string;
    disabled?: boolean;
}

export default function ShortResponse({
    value,
    onChange,
    maxCharacters = 500,
    placeholder = "พิมพ์คำตอบสั้นๆ ของคุณที่นี่ (3-5 บรรทัด)...",
    disabled = false
}: ShortResponseProps) {
    const characterCount = value.length;
    const isNearLimit = characterCount > maxCharacters * 0.8;
    const isOverLimit = characterCount > maxCharacters;

    return (
        <div className="space-y-3">
            <textarea
                value={value}
                onChange={(e) => {
                    if (e.target.value.length <= maxCharacters) {
                        onChange(e.target.value);
                    }
                }}
                disabled={disabled}
                placeholder={placeholder}
                rows={5}
                className={`
                    w-full p-4 rounded-xl bg-white border-2 transition-all resize-none 
                    text-slate-900 placeholder-slate-400 leading-relaxed
                    focus:ring-4 focus:ring-indigo-500/10 outline-none
                    ${isOverLimit
                        ? 'border-red-400 focus:border-red-500'
                        : 'border-slate-200 focus:border-indigo-500 hover:border-slate-300'
                    }
                    ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50' : ''}
                `}
            />

            <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">
                    ตอบสั้นๆ 3-5 บรรทัด
                </span>
                <span className={`font-medium ${
                    isOverLimit
                        ? 'text-red-500'
                        : isNearLimit
                            ? 'text-amber-600'
                            : 'text-slate-500'
                }`}>
                    {characterCount} / {maxCharacters}
                </span>
            </div>
        </div>
    );
}
