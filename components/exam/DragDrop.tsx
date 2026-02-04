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
import { GripVertical, X } from "lucide-react";

interface DragDropProps {
    dragItems: DragItem[];
    dropZones: DropZone[];
    placements: Record<string, string>; // dropZoneId -> dragItemId
    onChange: (placements: Record<string, string>) => void;
    disabled?: boolean;
}

// Draggable Item Component
function DraggableItem({ item, isPlaced }: { item: DragItem; isPlaced: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
        disabled: isPlaced,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    if (isPlaced) return null;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500/20 to-indigo-500/20 border-2 border-purple-500/50 text-white cursor-grab active:cursor-grabbing transition-all ${isDragging ? 'opacity-50 scale-105 shadow-xl shadow-purple-500/30' : 'hover:border-purple-400'
                }`}
        >
            <GripVertical className="w-5 h-5 text-purple-400 flex-shrink-0" />
            <span className="text-sm font-medium">{item.text}</span>
        </div>
    );
}

// Droppable Zone Component
function DroppableZone({
    zone,
    placedItem,
    onRemove
}: {
    zone: DropZone;
    placedItem?: DragItem;
    onRemove: () => void;
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: zone.id,
    });

    return (
        <div
            ref={setNodeRef}
            className={`relative min-h-[80px] p-4 rounded-xl border-2 border-dashed transition-all ${isOver
                    ? 'bg-indigo-500/20 border-indigo-400 shadow-lg shadow-indigo-500/20'
                    : placedItem
                        ? 'bg-emerald-500/10 border-emerald-500/50'
                        : 'bg-slate-800/30 border-slate-600 hover:border-slate-500'
                }`}
        >
            {/* Zone Label */}
            <div className="absolute -top-3 left-4 px-2 bg-slate-900">
                <span className="text-xs font-medium text-slate-400">{zone.label}</span>
            </div>

            {/* Content */}
            {placedItem ? (
                <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-500/20 border border-emerald-500/50">
                        <span className="text-sm text-emerald-300">{placedItem.text}</span>
                    </div>
                    <button
                        type="button"
                        onClick={onRemove}
                        className="p-1.5 rounded-lg hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <div className="flex items-center justify-center h-full min-h-[48px]">
                    <span className="text-sm text-slate-500">
                        {isOver ? 'วางที่นี่' : 'ลากมาวางที่นี่'}
                    </span>
                </div>
            )}
        </div>
    );
}

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
                distance: 8,
            },
        })
    );

    // Get which items are already placed
    const placedItemIds = new Set(Object.values(placements));

    const handleDragStart = (event: DragStartEvent) => {
        setActiveId(event.active.id as string);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over) return;

        const dragItemId = active.id as string;
        const dropZoneId = over.id as string;

        // Check if dropping on a valid zone
        if (dropZones.some(z => z.id === dropZoneId)) {
            // Remove from any previous zone
            const newPlacements = { ...placements };
            Object.keys(newPlacements).forEach(key => {
                if (newPlacements[key] === dragItemId) {
                    delete newPlacements[key];
                }
            });

            // Place in new zone
            newPlacements[dropZoneId] = dragItemId;
            onChange(newPlacements);
        }
    };

    const handleRemove = (dropZoneId: string) => {
        const newPlacements = { ...placements };
        delete newPlacements[dropZoneId];
        onChange(newPlacements);
    };

    const activeItem = dragItems.find(item => item.id === activeId);

    if (disabled) {
        return (
            <div className="space-y-4 opacity-70">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {dropZones.map(zone => {
                        const placedItem = dragItems.find(item => placements[zone.id] === item.id);
                        return (
                            <div key={zone.id} className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
                                <p className="text-sm text-slate-400 mb-2">{zone.label}</p>
                                <p className="text-white">{placedItem?.text || '-'}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-6">
                {/* Available Items */}
                <div>
                    <p className="text-sm text-slate-400 mb-3">ลากคำตอบไปวางในช่องที่ถูกต้อง:</p>
                    <div className="flex flex-wrap gap-3">
                        {dragItems.map(item => (
                            <DraggableItem
                                key={item.id}
                                item={item}
                                isPlaced={placedItemIds.has(item.id)}
                            />
                        ))}
                    </div>
                </div>

                {/* Drop Zones */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {dropZones.map(zone => {
                        const placedItem = dragItems.find(item => placements[zone.id] === item.id);
                        return (
                            <DroppableZone
                                key={zone.id}
                                zone={zone}
                                placedItem={placedItem}
                                onRemove={() => handleRemove(zone.id)}
                            />
                        );
                    })}
                </div>

                {/* Progress */}
                <div className="text-right text-sm text-slate-500">
                    วางแล้ว {Object.keys(placements).length} / {dropZones.length} ช่อง
                </div>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
                {activeItem && (
                    <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white shadow-xl shadow-purple-500/40 cursor-grabbing">
                        <GripVertical className="w-5 h-5" />
                        <span className="text-sm font-medium">{activeItem.text}</span>
                    </div>
                )}
            </DragOverlay>
        </DndContext>
    );
}
