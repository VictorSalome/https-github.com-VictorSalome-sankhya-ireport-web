'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Maximize2, Check, ChevronUp } from 'lucide-react';

export interface CanvasZoomControlsProps {
  zoom: number;
  onZoomChange: (zoom: number | ((prev: number) => number)) => void;
  onFitWidth?: () => void;
  className?: string;
}

const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];

export const CanvasZoomControls: React.FC<CanvasZoomControlsProps> = ({
  zoom,
  onZoomChange,
  onFitWidth,
  className = '',
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside
  useEffect(() => {
    if (!menuOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const zoomPercent = Math.round(zoom * 100);

  const handleZoomOut = () => {
    onZoomChange((z) => Math.max(0.25, Math.round((z - 0.1) * 10) / 10));
  };

  const handleZoomIn = () => {
    onZoomChange((z) => Math.min(2.5, Math.round((z + 0.1) * 10) / 10));
  };

  const handleSelectPreset = (preset: number) => {
    onZoomChange(preset);
    setMenuOpen(false);
  };

  return (
    <div
      ref={containerRef}
      className={`relative inline-flex items-center rounded-lg bg-slate-900/90 backdrop-blur-md border border-slate-800 shadow-xl p-1 text-slate-200 select-none ${className}`}
      role="toolbar"
      aria-label="Controles de Zoom do Canvas"
    >
      {/* Zoom Out Button [-] */}
      <button
        type="button"
        onClick={handleZoomOut}
        disabled={zoom <= 0.25}
        title="Reduzir Zoom (-10% / Ctrl + -)"
        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ZoomOut className="w-3.5 h-3.5" />
      </button>

      {/* Percentage Display & Quick Menu Trigger [ % ] */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setMenuOpen((prev) => !prev)}
          title="Opções de Zoom"
          className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 text-xs font-mono font-medium text-slate-200 hover:text-white transition-colors"
        >
          <span className="w-10 text-center">{zoomPercent}%</span>
          <ChevronUp
            className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
              menuOpen ? 'rotate-180 text-emerald-400' : ''
            }`}
          />
        </button>

        {/* Quick Zoom Presets Dropdown (Opens Above) */}
        {menuOpen && (
          <div className="absolute bottom-full mb-2 right-0 w-44 rounded-lg bg-slate-900/95 backdrop-blur-md border border-slate-800 shadow-2xl p-1.5 z-50 text-xs animate-in fade-in duration-100">
            <div className="px-2 py-1 text-[10px] font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-800/80 mb-1">
              Nível de Visualização
            </div>
            {ZOOM_PRESETS.map((preset) => {
              const presetPct = Math.round(preset * 100);
              const isCurrent = Math.abs(zoom - preset) < 0.02;
              return (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handleSelectPreset(preset)}
                  className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-left transition-colors ${
                    isCurrent
                      ? 'bg-emerald-600/20 text-emerald-300 font-medium'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <span className="font-mono">{presetPct}%</span>
                  {preset === 1.0 && <span className="text-[10px] text-slate-500 font-sans">Padrão</span>}
                  {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                </button>
              );
            })}

            {onFitWidth && (
              <>
                <div className="h-px bg-slate-800 my-1" />
                <button
                  type="button"
                  onClick={() => {
                    onFitWidth();
                    setMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-2 px-2 py-1.5 rounded text-left text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                >
                  <Maximize2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>Ajustar à Largura</span>
                </button>
              </>
            )}
          </div>
        )}
      </div>

      {/* Zoom In Button [+] */}
      <button
        type="button"
        onClick={handleZoomIn}
        disabled={zoom >= 2.5}
        title="Aumentar Zoom (+10% / Ctrl + +)"
        className="p-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
      >
        <ZoomIn className="w-3.5 h-3.5" />
      </button>

      {/* Fit to Screen Button */}
      {onFitWidth && (
        <>
          <div className="h-4 w-px bg-slate-800 mx-0.5" />
          <button
            type="button"
            onClick={onFitWidth}
            title="Ajustar à Largura da Tela (Fit)"
            className="flex items-center space-x-1 px-2 py-1 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors text-xs"
          >
            <Maximize2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline font-medium text-[11px]">Ajustar</span>
          </button>
        </>
      )}
    </div>
  );
};
