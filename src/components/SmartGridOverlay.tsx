'use client';

import React from 'react';
import { LayoutSlot, PT_PER_MM } from '../engine/smart-grid';

export interface SmartGridOverlayProps {
  slots: LayoutSlot[];
  hoveredSlotId?: string | null;
  visible?: boolean;
  showDimensions?: boolean;
  showMm?: boolean;
  interactive?: boolean;
  onSlotClick?: (slot: LayoutSlot) => void;
  onSlotHover?: (slotId: string | null) => void;
  className?: string;
}

export const SmartGridOverlay: React.FC<SmartGridOverlayProps> = ({
  slots,
  hoveredSlotId,
  visible = true,
  showDimensions = true,
  showMm = true,
  className = '',
}) => {
  if (!visible || !slots || slots.length === 0) {
    return null;
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-10 ${className}`}
      aria-label="Sobreposição de Grade Inteligente"
    >
      {slots.map((slot) => {
        const isHovered = hoveredSlotId === slot.id;
        const mmW = (slot.width / PT_PER_MM).toFixed(1);
        const mmH = (slot.height / PT_PER_MM).toFixed(1);
        const pxW = Math.round(slot.width);
        const pxH = Math.round(slot.height);

        return (
          <div
            key={slot.id}
            style={{
              left: `${slot.x}px`,
              top: `${slot.y}px`,
              width: `${slot.width}px`,
              height: `${slot.height}px`,
            }}
            className={`absolute transition-all duration-100 border pointer-events-none ${
              isHovered
                ? 'border-emerald-500 bg-emerald-500/10 ring-2 ring-emerald-400 z-20'
                : 'border-dashed border-slate-200/60 bg-transparent'
            }`}
          >
            {/* O badge com medidas (px e mm) aparece APENAS quando isHovered === true durante arraste */}
            {isHovered && showDimensions && (
              <div className="absolute top-1 left-1.5 px-1.5 py-0.5 rounded text-[9px] font-mono shadow-sm flex items-center space-x-1.5 select-none transition-colors border backdrop-blur-xs bg-slate-900/95 text-emerald-300 border-emerald-500/60 shadow-emerald-950/40 ring-1 ring-emerald-500/30 pointer-events-none">
                <span className="font-semibold text-emerald-400">{slot.label}</span>
                <span className="text-slate-500">•</span>
                <span>
                  {pxW}×{pxH}px
                </span>
                {showMm && (
                  <>
                    <span className="text-slate-500">•</span>
                    <span className="text-cyan-300 font-sans">
                      {mmW}×{mmH} mm
                    </span>
                  </>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
