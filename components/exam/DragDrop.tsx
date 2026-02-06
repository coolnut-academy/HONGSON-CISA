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
    placements: Record<string, string>;
    onChange: (placements: Record<string, string>) => void;
    disabled?: boolean;
}

// Draggable Tag/Pill - สำหรับตัวเลือกด้านบน
function DraggableTag({
    item,
    isPlaced,
}: {
    item: DragItem;
    isPlaced: boolean;
}) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
        disabled: isPlaced,
    });

    const style = transform
        ? {
              transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
              opacity: isDragging ? 0.5 : 1,
          }
        : undefined;

    if (isPlaced) {
        return (
            <div className="px-6 py-3 rounded-2xl border-2 border-dashed border-slate-600 bg-slate-800/30 text-slate-500 text-sm">
                วางแล้ว
            </div>
        );
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            style={style}
            className="group flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-indigo-500/50 rounded-2xl cursor-grab active:cursor-grabbing transition-all duration-200"
        >
            <span className="text-slate-200 text-sm font-medium whitespace-nowrap">{item.text}</span>
            <GripVertical className="w-4 h-4 text-slate-500 group-hover:text-slate-400" />
        </div>
    );
}

// Item ใน Drop Zone - แสดงเมื่อวางแล้ว
function PlacedItem({
    item,
    onRemove,
    disabled,
}: {
    item: DragItem;
    onRemove: () => void;
    disabled?: boolean;
}) {
    return (
        <div className="flex items-center gap-3 px-5 py-3 bg-emerald-500/10 border border-emerald-500/40 rounded-2xl">
            <span className="text-emerald-400 text-sm font-medium">{item.text}</span>
            {!disabled && (
                <button
                    type="button"
                    onClick={onRemove}
                    className="p-1 hover:bg-emerald-500/20 rounded-full text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                    <X className="w-4 h-4" />
                </button>
            )}
        </div>
    );
}

// Drop Zone Card
function DropZoneCard({
    zone,
    placedItem,
    onRemove,
    disabled,
}: {
    zone: DropZone;
    placedItem?: DragItem;
    onRemove: () => void;
    disabled?: boolean;
}) {
    const { isOver, setNodeRef } = useDroppable({ id: zone.id });

    return (
        <div
            ref={setNodeRef}
            className={`
                relative flex flex-col items-center justify-center 
                min-h-[140px] p-6 rounded-3xl border-2 transition-all duration-200
                ${isOver
                    ? "bg-indigo-500/10 border-indigo-500 shadow-lg shadow-indigo-500/20"
                    : placedItem
                    ? "bg-emerald-500/5 border-emerald-500/30"
                    : "bg-slate-800/30 border-slate-700 hover:border-slate-600"
                }
            `}
        >
            {/* Zone Label - แบบ pill ด้านบน */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-slate-800 border border-slate-600 rounded-full">
                <span className="text-xs font-medium text-slate-300 whitespace-nowrap">{zone.label}</span>
            </div>

            {/* Content */}
            {placedItem ? (
                <PlacedItem item={placedItem} onRemove={onRemove} disabled={disabled} />
            ) : (
                <div className="flex flex-col items-center justify-center text-slate-500">
                    <div className="w-10 h-10 rounded-full border-2 border-dashed border-slate-600 mb-2 flex items-center justify-center">
                        <span className="text-lg">+</span>
                    </div>
                    <span className="text-xs">ลากมาวางที่นี่</span>
                </div>
            )}
        </div>
    );
}

// Drag Overlay - ตอนลาก
function DragOverlayItem({ item }: { item: DragItem }) {
    return (
        <div className="flex items-center gap-2 px-5 py-3 bg-indigo-600 border-2 border-indigo-400 rounded-2xl shadow-2xl shadow-indigo-500/50">
            <span className="text-white text-sm font-medium whitespace-nowrap">{item.text}</span>
            <GripVertical className="w-4 h-4 text-indigo-300" />
        </div>
    );
}

export default function DragDrop({
    dragItems,
    dropZones,
    placements,
    onChange,
    disabled = false,
}: DragDropProps) {
    const [activeId, setActiveId] = useState<string | null>(null);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 5 },
        })
    );

    const placedItemIds = new Set(Object.values(placements));
    const activeItem = dragItems.find((item) => item.id === activeId);

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

        if (dropZones.some((z) => z.id === dropZoneId)) {
            const newPlacements = { ...placements };
            // ลบจาก zone เดิมถ้ามี
            Object.keys(newPlacements).forEach((key) => {
                if (newPlacements[key] === dragItemId) delete newPlacements[key];
            });
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

    const availableCount = dragItems.length - placedItemIds.size;

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
        >
            <div className="space-y-8 select-none">
                {/* Source Items - Tags/Pills */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-slate-400">
                            ตัวเลือก ({availableCount})
                        </span>
                        <span className="text-xs text-slate-500">ลากไปวางในช่องด้านล่าง</span>
                    </div>

                    <div className="p-5 bg-slate-900/50 border border-slate-800 rounded-2xl">
                        <div className="flex flex-wrap gap-3">
                            {dragItems.map((item) => (
                                <DraggableTag
                                    key={item.id}
                                    item={item}
                                    isPlaced={placedItemIds.has(item.id)}
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Drop Zones - Cards */}
                <div className="space-y-3">
                    <p className="text-sm font-medium text-slate-400">พื้นที่วางคำตอบ</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {dropZones.map((zone) => {
                            const placedItem = dragItems.find(
                                (item) => placements[zone.id] === item.id
                            );
                            return (
                                <DropZoneCard
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

            <DragOverlay>
                {activeItem && <DragOverlayItem item={activeItem} />}
            </DragOverlay>
        </DndContext>
    );
}
