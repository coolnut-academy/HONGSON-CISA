"use client";

import { useState } from "react";
import { DragItem, DropZone } from "@/types";
import {
    DndContext,
    DragEndEvent,
    DragOverlay,
    DragStartEvent,
    useDraggable,
    useDroppable,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors,
} from "@dnd-kit/core";
import { GripVertical, X, Image as ImageIcon } from "lucide-react";

interface DragDropProps {
    dragItems: DragItem[];
    dropZones: DropZone[];
    placements: Record<string, string>; // dropZoneId -> dragItemId
    onChange: (placements: Record<string, string>) => void;
    disabled?: boolean;
}

// ──────────────────────────────────────────────
// 1. STANDARDIZED ITEM CARD (CORE UI)
// ──────────────────────────────────────────────
const ITEM_DIMENSIONS = "w-[150px] h-[150px]"; // Fixed standard size

function DragItemCard({
    item,
    isOverlay = false,
    isPlaced = false
}: {
    item: DragItem;
    isOverlay?: boolean;
    isPlaced?: boolean;
}) {
    // Styles based on state (Default vs Overlay vs Placed)
    const baseStyles = "relative flex flex-col items-center justify-between p-3 rounded-xl transition-all border-2 overflow-hidden bg-white select-none";

    const stateStyles = isOverlay
        ? "border-accent-primary shadow-xl scale-105 z-50 bg-indigo-50/90 backdrop-blur-sm"
        : isPlaced
            ? "border-accent-success/50 bg-emerald-50/50"
            : "border-glass-border hover:border-accent-primary/60 hover:shadow-md cursor-grab active:cursor-grabbing";

    return (
        <div className={`${ITEM_DIMENSIONS} ${baseStyles} ${stateStyles}`}>
            {/* Drag Handle Indicator */}
            {!isPlaced && (
                <div className="absolute top-2 right-2 text-slate-300">
                    <GripVertical className="w-4 h-4" />
                </div>
            )}

            {/* Image Container - Fixed Constraint */}
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden mb-2 relative">
                {item.imageUrl ? (
                    <img
                        src={item.imageUrl}
                        alt={item.text}
                        className="w-full h-full object-contain pointer-events-none"
                    />
                ) : (
                    // Fallback placeholder if no image
                    <div className="w-full h-full flex items-center justify-center bg-slate-50 rounded-lg border border-slate-100/50">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                    </div>
                )}
            </div>

            {/* Label Container - Truncated, One Line */}
            <div className={`w-full text-center px-1 py-1.5 rounded-lg ${isOverlay ? 'bg-accent-primary text-white' : 'bg-slate-100 text-text-secondary'}`}>
                <p className="text-xs font-semibold truncate w-full" title={item.text}>
                    {item.text}
                </p>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// 2. DRAGGABLE COMPONENT
// ──────────────────────────────────────────────
function DraggableItem({ item, isPlaced }: { item: DragItem; isPlaced: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
        disabled: isPlaced,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0 : 1, // Hide original when dragging (overlay takes over)
    } : undefined;

    if (isPlaced) {
        // Placeholder for when item is moved out
        return <div className={`${ITEM_DIMENSIONS} rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/30`} />;
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            // Use tabindex to allow keyboard focus
            tabIndex={0}
            className="focus:outline-none focus:ring-2 focus:ring-accent-primary rounded-xl"
        >
            <DragItemCard item={item} />
        </div>
    );
}

// ──────────────────────────────────────────────
// 3. DROP ZONE COMPONENT
// ──────────────────────────────────────────────
function DroppableZone({
    zone,
    placedItem,
    onRemove,
    disabled
}: {
    zone: DropZone;
    placedItem?: DragItem;
    onRemove: () => void;
    disabled?: boolean;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: zone.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all min-h-[180px]
                ${isOver
                    ? 'border-accent-primary bg-accent-primary/5 shadow-[0_0_20px_rgba(14,97,113,0.1)] scale-[1.02]'
                    : placedItem
                        ? 'border-accent-success/40 bg-white/60'
                        : 'border-dashed border-slate-300 bg-slate-50/50 hover:border-slate-400'
                }`}
        >
            {/* Zone Label */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 shadow-sm z-10">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">{zone.label}</span>
            </div>

            {/* Content */}
            {placedItem ? (
                <div className="relative group">
                    <DragItemCard item={placedItem} isPlaced />

                    {/* Remove Action */}
                    {!disabled && (
                        <button
                            type="button"
                            onClick={onRemove}
                            className="absolute -top-2 -right-2 p-1.5 rounded-full bg-white border border-slate-200 text-slate-400 hover:text-accent-danger hover:border-accent-danger shadow-md transition-all opacity-0 group-hover:opacity-100 md:opacity-100"
                            aria-label={`Remove ${placedItem.text} from ${zone.label}`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-slate-400 opacity-60">
                    <div className="w-12 h-12 rounded-full border-2 border-dashed border-slate-300 mb-2" />
                    <span className="text-xs font-medium">วางคำตอบ</span>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────
// 4. MAIN CONTAINER
// ──────────────────────────────────────────────
export default function DragDrop({
    dragItems,
    dropZones,
    placements,
    onChange,
    disabled = false
}: DragDropProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 5, // Slightly less for faster response
            },
        })
    );

    const placedItemIds = new Set(Object.values(placements));
    const activeItem = dragItems.find(item => item.id === activeId);

    const handleDragStart = (event: DragStartEvent) => {
        if (disabled) return;
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const dragItemId = active.id as string;
        const dropZoneId = over.id as string;

        // Valid drop
        if (dropZones.some(z => z.id === dropZoneId)) {
            const newPlacements = { ...placements };

            // If item already placed elsewhere, remove it
            Object.keys(newPlacements).forEach(key => {
                if (newPlacements[key] === dragItemId) {
                    delete newPlacements[key];
                }
            });

            // If zone already has item, can handle swap logic here if desired
            // For now, simple replace
            newPlacements[dropZoneId] = dragItemId;
            onChange(newPlacements);
        }
    };

    const handleRemove = (dropZoneId: string) => {
        if (disabled) return;
        const newPlacements = { ...placements };
        delete newPlacements[dropZoneId];
        onChange(newPlacements);
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-8 select-none">
                {/* 1. Source / Bank Area */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-text-secondary">ตัวเลือกคำตอบ ({dragItems.length})</p>
                    </div>

                    <div className="p-6 rounded-2xl bg-slate-50/50 border border-slate-200 min-h-[180px]">
                        <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                            {dragItems.map(item => (
                                <DraggableItem
                                    key={item.id}
                                    item={item}
                                    isPlaced={placedItemIds.has(item.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Target / Drop Zones */}
                <div className="space-y-3">
                    <p className="text-sm font-semibold text-text-secondary">พื้นที่ว่างสำหรับวางคำตอบ</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {dropZones.map(zone => {
                            const placedItem = dragItems.find(item => placements[zone.id] === item.id);
                            return (
                                <DroppableZone
                                    key={zone.id}
                                    zone={zone}
                                    placedItem={placedItem}
                                    onRemove={() => handleRemove(zone.id)}
                                    disabled={disabled}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Drag Overlay (Follows Cursor) */}
            <DragOverlay dropAnimation={{
                duration: 250,
                easing: 'cubic-bezier(0.18, 0.67, 0.6, 1.22)',
            }}>
                {activeItem && (
                    <DragItemCard item={activeItem} isOverlay />
                )}
            </DragOverlay>
        </DndContext>
    );
}
