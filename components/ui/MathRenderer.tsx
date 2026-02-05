"use client";

import 'katex/dist/katex.min.css';
import Latex from 'react-latex-next';
import React from 'react';

interface MathRendererProps {
    text: string;
    inline?: boolean;
    className?: string;
}

export default function MathRenderer({ text, inline = false, className = '' }: MathRendererProps) {
    if (!text) return null;

    // Provide default delimiters if not present? 
    // react-latex-next handles $...$ and $$...$$ automatically.
    // If the user types plain text, it renders as plain text.
    // If the user types $E=mc^2$, it renders as math.

    return (
        <span className={`math-renderer ${className}`}>
            <Latex>{text}</Latex>
        </span>
    );
}
