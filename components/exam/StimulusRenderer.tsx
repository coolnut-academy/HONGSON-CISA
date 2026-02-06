"use client";

import { useMemo } from "react";
import { StimulusContent, GraphConfig } from "@/types";
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";
import Image from "next/image";
import MathRenderer from "@/components/ui/MathRenderer";

interface StimulusRendererProps {
    stimuli: StimulusContent[];
    randomSeed?: number;
    generatedValues?: Record<string, number>;
    onValuesGenerated?: (values: Record<string, number>) => void;
    isLightMode?: boolean;
}

// Seeded random number generator
function seededRandom(seed: number) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

// Parse and evaluate formula with variables
function evaluateFormula(formula: string, variables: Record<string, number>, x: number): number {
    try {
        // Simple formula parser - replace variables
        let expr = formula.toLowerCase()
            .replace(/t/g, String(x))
            .replace(/x/g, String(x));

        // Replace known variables
        Object.entries(variables).forEach(([name, value]) => {
            const regex = new RegExp(name.toLowerCase(), 'g');
            expr = expr.replace(regex, String(value));
        });

        // Evaluate (safe since we control the input)
        // eslint-disable-next-line no-eval
        return eval(expr);
    } catch {
        return 0;
    }
}

// Table Component
function TableStimulus({ 
    content, 
    caption,
    isLightMode = false 
}: { 
    content: string; 
    caption?: string;
    isLightMode?: boolean;
}) {
    const tableData = useMemo(() => {
        try {
            return JSON.parse(content);
        } catch {
            return { headers: [], rows: [] };
        }
    }, [content]);

    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        {tableData.headers?.map((header: string, i: number) => (
                            <th
                                key={i}
                                className={`px-4 py-3 text-left text-sm font-semibold border ${
                                    isLightMode 
                                        ? 'text-slate-800 bg-slate-100 border-slate-200' 
                                        : 'text-white bg-slate-700/80 border-slate-600'
                                }`}
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {tableData.rows?.map((row: string[], rowIndex: number) => (
                        <tr key={rowIndex} className={isLightMode ? 'hover:bg-slate-50' : 'hover:bg-slate-700/30'}>
                            {row.map((cell: string, cellIndex: number) => (
                                <td
                                    key={cellIndex}
                                    className={`px-4 py-3 text-sm border ${
                                        isLightMode 
                                            ? 'text-slate-700 border-slate-200' 
                                            : 'text-slate-300 border-slate-700/50'
                                    }`}
                                >
                                    {cell}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
            {caption && (
                <p className={`text-xs mt-2 italic ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    {caption}
                </p>
            )}
        </div>
    );
}

// Graph Component
function GraphStimulus({
    content,
    caption,
    randomSeed,
    generatedValues,
    onValuesGenerated,
    isLightMode = false
}: {
    content: string;
    caption?: string;
    randomSeed?: number;
    generatedValues?: Record<string, number>;
    onValuesGenerated?: (values: Record<string, number>) => void;
    isLightMode?: boolean;
}) {
    const graphData = useMemo(() => {
        try {
            const config: GraphConfig = JSON.parse(content);

            // Generate random values if needed
            let variables: Record<string, number> = generatedValues || {};

            if (config.randomVariables && !generatedValues) {
                const seed = randomSeed || Date.now();
                config.randomVariables.forEach((rv, index) => {
                    const range = rv.max - rv.min;
                    const step = rv.step || 1;
                    const steps = Math.floor(range / step);
                    const randomValue = rv.min + Math.floor(seededRandom(seed + index) * steps) * step;
                    variables[rv.name] = randomValue;
                });

                // Report generated values
                onValuesGenerated?.(variables);
            }

            // Generate data points
            const datasets = config.datasets.map(ds => {
                if (ds.dataPoints) {
                    return {
                        label: ds.label,
                        color: ds.color,
                        data: ds.dataPoints
                    };
                }

                if (ds.formula) {
                    // Generate points from formula
                    const points = [];
                    for (let x = 0; x <= 10; x += 0.5) {
                        const y = evaluateFormula(ds.formula, variables, x);
                        points.push({ x, y });
                    }
                    return {
                        label: ds.label,
                        color: ds.color,
                        data: points
                    };
                }

                return { label: ds.label, color: ds.color, data: [] };
            });

            return {
                ...config,
                datasets,
                variables
            };
        } catch {
            return null;
        }
    }, [content, randomSeed, generatedValues, onValuesGenerated]);

    if (!graphData) {
        return <p className="text-red-500">Error loading graph</p>;
    }

    // Combine all data points for the chart
    const chartData = graphData.datasets[0]?.data.map((point: any, i: number) => {
        const dataPoint: any = { x: point.x };
        graphData.datasets.forEach((ds: any, dsIndex: number) => {
            dataPoint[ds.label] = ds.data[i]?.y ?? 0;
        });
        return dataPoint;
    }) || [];

    const axisColor = isLightMode ? '#64748b' : '#94a3b8';
    const gridColor = isLightMode ? '#e2e8f0' : '#334155';
    const tooltipBg = isLightMode ? '#ffffff' : '#1e293b';
    const tooltipBorder = isLightMode ? '#e2e8f0' : '#334155';
    const tooltipColor = isLightMode ? '#1e293b' : '#f1f5f9';

    return (
        <div className="space-y-3">
            <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                    <XAxis
                        dataKey="x"
                        stroke={axisColor}
                        label={{ 
                            value: `${graphData.xAxis.label}${graphData.xAxis.unit ? ` (${graphData.xAxis.unit})` : ''}`, 
                            position: 'bottom', 
                            fill: axisColor 
                        }}
                    />
                    <YAxis
                        stroke={axisColor}
                        label={{ 
                            value: `${graphData.yAxis.label}${graphData.yAxis.unit ? ` (${graphData.yAxis.unit})` : ''}`, 
                            angle: -90, 
                            position: 'insideLeft', 
                            fill: axisColor 
                        }}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: tooltipBg,
                            border: `1px solid ${tooltipBorder}`,
                            borderRadius: '8px',
                            color: tooltipColor
                        }}
                    />
                    <Legend />
                    {graphData.datasets.map((ds: any, i: number) => (
                        <Line
                            key={i}
                            type="monotone"
                            dataKey={ds.label}
                            stroke={ds.color}
                            strokeWidth={2}
                            dot={{ fill: ds.color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    ))}
                </LineChart>
            </ResponsiveContainer>

            {/* Show generated variables if any */}
            {Object.keys(graphData.variables || {}).length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {Object.entries(graphData.variables).map(([name, value]) => (
                        <span 
                            key={name} 
                            className={`px-2 py-1 rounded text-xs ${
                                isLightMode 
                                    ? 'bg-slate-100 text-slate-600' 
                                    : 'bg-slate-700/50 text-slate-400'
                            }`}
                        >
                            {name} = {value as number}
                        </span>
                    ))}
                </div>
            )}

            {caption && (
                <p className={`text-xs italic ${isLightMode ? 'text-slate-500' : 'text-slate-500'}`}>
                    {caption}
                </p>
            )}
        </div>
    );
}

export default function StimulusRenderer({
    stimuli,
    randomSeed,
    generatedValues,
    onValuesGenerated,
    isLightMode = false
}: StimulusRendererProps) {
    if (!stimuli || stimuli.length === 0) return null;

    const cardClass = isLightMode 
        ? 'bg-white border-slate-200' 
        : 'bg-slate-800/50 border-slate-700/50';
    
    const textClass = isLightMode ? 'text-slate-700' : 'text-slate-300';
    const captionClass = isLightMode ? 'text-slate-500' : 'text-slate-500';
    const iframeBg = isLightMode ? 'bg-slate-100' : 'bg-slate-900';
    const iframeBorder = isLightMode ? 'border-slate-200' : 'border-slate-700';

    return (
        <div className="space-y-4">
            {stimuli.map((stimulus, index) => (
                <div key={index} className={`rounded-xl border overflow-hidden ${cardClass}`}>
                    {stimulus.type === 'text' && (
                        <div className="p-4">
                            <p className={`leading-relaxed whitespace-pre-wrap ${textClass}`}>
                                <MathRenderer text={stimulus.content} />
                            </p>
                            {stimulus.caption && (
                                <p className={`text-xs mt-2 italic ${captionClass}`}>{stimulus.caption}</p>
                            )}
                        </div>
                    )}

                    {stimulus.type === 'image' && (
                        <div className="p-4">
                            <div className={`relative w-full aspect-video rounded-lg overflow-hidden ${iframeBg}`}>
                                <Image
                                    src={stimulus.content}
                                    alt={stimulus.caption || 'Stimulus image'}
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            {stimulus.caption && (
                                <p className={`text-xs mt-2 italic text-center ${captionClass}`}>{stimulus.caption}</p>
                            )}
                        </div>
                    )}

                    {stimulus.type === 'table' && (
                        <div className="p-4">
                            <TableStimulus 
                                content={stimulus.content} 
                                caption={stimulus.caption} 
                                isLightMode={isLightMode}
                            />
                        </div>
                    )}

                    {stimulus.type === 'graph' && (
                        <div className="p-4">
                            <GraphStimulus
                                content={stimulus.content}
                                caption={stimulus.caption}
                                randomSeed={randomSeed}
                                generatedValues={generatedValues}
                                onValuesGenerated={onValuesGenerated}
                                isLightMode={isLightMode}
                            />
                        </div>
                    )}

                    {stimulus.type === 'simulation' && stimulus.content && (
                        <div className="p-4 space-y-3">
                            <div className={`relative w-full aspect-video rounded-lg overflow-hidden ${iframeBg} border ${iframeBorder}`}>
                                <iframe
                                    src={stimulus.content}
                                    className="w-full h-full"
                                    allowFullScreen
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    title={stimulus.caption || 'Simulation'}
                                />
                            </div>
                            {stimulus.caption && (
                                <p className={`text-xs italic text-center ${captionClass}`}>{stimulus.caption}</p>
                            )}
                        </div>
                    )}

                    {stimulus.type === 'iframe' && stimulus.content && (
                        <div className="p-4 space-y-3">
                            <div className={`relative w-full aspect-video rounded-lg overflow-hidden ${iframeBg} border ${iframeBorder}`}>
                                <iframe
                                    src={stimulus.content}
                                    className="w-full h-full"
                                    allowFullScreen
                                    title={stimulus.caption || 'Embedded content'}
                                    sandbox="allow-scripts allow-same-origin allow-forms"
                                />
                            </div>
                            {stimulus.caption && (
                                <p className={`text-xs italic text-center ${captionClass}`}>{stimulus.caption}</p>
                            )}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
}
