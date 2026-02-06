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
import { GripVertical, X, Image as ImageIcon, Type } from "lucide-react";

interface DragDropProps {
    dragItems: DragItem[];
    dropZones: DropZone[];
    placements: Record<string, string>;
    onChange: (placements: Record<string, string>) => void;
    disabled?: boolean;
}

// ──────────────────────────────────────────────
// IMPROVED ITEM CARD - รองรับทั้งรูปภาพและตัวอักษร
// ──────────────────────────────────────────────
const ITEM_DIMENSIONS = "w-[140px] h-[140px] sm:w-[150px] sm:h-[150px]";

function DragItemCard({
    item,
    isOverlay = false,
    isPlaced = false
}: {
    item: DragItem;
    isOverlay?: boolean;
    isPlaced?: boolean;
}) {
    const hasImage = !!item.imageUrl;
    
    // Dynamic styles using CSS variables
    const baseStyles = "relative flex flex-col items-center justify-between p-3 rounded-xl transition-all border-2 overflow-hidden select-none";
    
    const getStateStyles = () => {
        if (isOverlay) {
            return {
                borderColor: 'var(--exam-primary)',
                backgroundColor: 'var(--exam-surface)',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                transform: 'scale(1.05)',
            };
        }
        if (isPlaced) {
            return {
                borderColor: 'var(--exam-success)',
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
            };
        }
        return {
            borderColor: 'var(--exam-secondary)',
            backgroundColor: 'var(--exam-surface)',
        };
    };

    const stateStyle = getStateStyles();

    return (
        <div 
            className={`${ITEM_DIMENSIONS} ${baseStyles}`}
            style={stateStyle}
        >
            {/* Drag Handle Indicator */}
            {!isPlaced && (
                <div 
                    className="absolute top-2 right-2 opacity-30"
                    style={{ color: 'var(--exam-text-muted)' }}
                >
                    <GripVertical className="w-4 h-4" />
                </div>
            )}

            {/* Content Container - รองรับทั้งรูปและตัวอักษร */}
            <div 
                className="flex-1 w-full flex items-center justify-center overflow-hidden mb-2 relative rounded-lg"
                style={{ backgroundColor: hasImage ? 'transparent' : 'var(--exam-background)' }}
            >
                {hasImage ? (
                    <img
                        src={item.imageUrl}
                        alt={item.text}
                        className="w-full h-full object-contain pointer-events-none"
                        onError={(e) => {
                            // Fallback to text if image fails to load
                            (e.target as HTMLImageElement).style.display = 'none';
                        }}
                    />
                ) : (
                    // Text-only display with icon
                    <div className="flex flex-col items-center justify-center text-center p-2">
                        <Type 
                            className="w-6 h-6 mb-1 opacity-40" 
                            style={{ color: 'var(--exam-text-muted)' }} 
                        />
                        <span 
                            className="text-xs line-clamp-3"
                            style={{ color: 'var(--exam-text)' }}
                        >
                            {item.text}
                        </span>
                    </div>
                )}
            </div>

            {/* Label Container */}
            <div 
                className="w-full text-center px-1 py-1.5 rounded-lg"
                style={{
                    backgroundColor: isOverlay ? 'var(--exam-primary)' : 'var(--exam-background)',
                    color: isOverlay ? 'white' : 'var(--exam-text)',
                }}
            >
                <p 
                    className="text-xs font-medium truncate w-full" 
                    title={item.text}
                >
                    {item.text}
                </p>
            </div>
        </div>
    );
}

// ──────────────────────────────────────────────
// DRAGGABLE COMPONENT
// ──────────────────────────────────────────────
function DraggableItem({ item, isPlaced }: { item: DragItem; isPlaced: boolean }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: item.id,
        disabled: isPlaced,
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0 : 1,
    } : undefined;

    if (isPlaced) {
        return (
            <div 
                className={`${ITEM_DIMENSIONS} rounded-xl border-2 border-dashed`}
                style={{
                    borderColor: 'var(--exam-secondary)',
                    backgroundColor: 'rgba(100, 116, 139, 0.05)',
                }}
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            {...listeners}
            {...attributes}
            tabIndex={0}
            className="focus:outline-none focus:ring-2 focus:ring-offset-2 rounded-xl cursor-grab active:cursor-grabbing"
            style={{
                ...style,
                outline: 'none',
            }}
        >
            <DragItemCard item={item} />
        </div>
    );
}

// ──────────────────────────────────────────────
// DROP ZONE COMPONENT
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

    const getZoneStyle = () => {
        if (isOver) {
            return {
                borderColor: 'var(--exam-primary)',
                backgroundColor: 'rgba(37, 99, 235, 0.05)',
                boxShadow: '0 0 0 4px rgba(37, 99, 235, 0.1)',
            };
        }
        if (placedItem) {
            return {
                borderColor: 'var(--exam-success)',
                backgroundColor: 'rgba(16, 185, 129, 0.03)',
            };
        }
        return {
            borderColor: 'var(--exam-secondary)',
            backgroundColor: 'var(--exam-surface)',
        };
    };

    return (
        <div
            ref={setNodeRef}
            className="relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all min-h-[180px]"
            style={getZoneStyle()}
        >
            {/* Zone Label */}
            <div 
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full shadow-sm z-10"
                style={{
                    backgroundColor: 'var(--exam-surface)',
                    border: '1px solid var(--exam-secondary)',
                }}
            >
                <span 
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: 'var(--exam-text-muted)' }}
                >
                    {zone.label}
                </span>
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
                            className="absolute -top-2 -right-2 p-1.5 rounded-full shadow-md transition-all opacity-0 group-hover:opacity-100 md:opacity-100 hover:scale-110"
                            style={{
                                backgroundColor: 'var(--exam-surface)',
                                border: '1px solid var(--exam-secondary)',
                                color: 'var(--exam-text-muted)',
                            }}
                            onMouseEnter={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--exam-error)';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--exam-error)';
                            }}
                            onMouseLeave={(e) => {
                                (e.currentTarget as HTMLButtonElement).style.color = 'var(--exam-text-muted)';
                                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--exam-secondary)';
                            }}
                            aria-label={`Remove ${placedItem.text} from ${zone.label}`}
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            ) : (
                <div 
                    className="flex flex-col items-center justify-center"
                    style={{ color: 'var(--exam-text-muted)' }}
                >
                    <div 
                        className="w-12 h-12 rounded-full border-2 border-dashed mb-2"
                        style={{ borderColor: 'var(--exam-secondary)' }}
                    />
                    <span className="text-xs font-medium">ลากมาวางที่นี่</span>
                </div>
            )}
        </div>
    );
}

// ──────────────────────────────────────────────
// MAIN CONTAINER
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
                distance: 5,
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
                {/* Source / Bank Area */}
                <div className="space-y-3">
                    <div 
                        className="flex items-center justify-between text-sm font-medium"
                        style={{ color: 'var(--exam-text-muted)' }}
                    >
                        <span>ตัวเลือก ({dragItems.length - placedItemIds.size})</span>
                        <span>ลากไปวางในช่องด้านล่าง</span>
                    </div>

                    <div 
                        className="p-6 rounded-2xl min-h-[160px]"
                        style={{
                            backgroundColor: 'var(--exam-background)',
                            border: '1px solid var(--exam-secondary)',
                        }}
                    >
                        <div className="flex flex-wrap gap-4 justify-center sm:justify-start">
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

                {/* Target / Drop Zones */}
                <div className="space-y-3">
                    <p 
                        className="text-sm font-medium"
                        style={{ color: 'var(--exam-text-muted)' }}
                    >
                        พื้นที่วางคำตอบ
                    </p>
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

            {/* Drag Overlay */}
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
