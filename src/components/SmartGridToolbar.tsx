'use client';

import React from 'react';
import {
  Columns,
  Grid,
  LayoutGrid,
  Ruler,
  SplitSquareVertical,
} from 'lucide-react';
import { BandLayoutPreset } from '../engine/smart-grid';

export interface SmartGridToolbarProps {
  activePreset?: BandLayoutPreset | null;
  onSelectPreset: (preset: BandLayoutPreset) => void;
  showRuler: boolean;
  onToggleRuler: () => void;
  gridVisible?: boolean;
  onToggleGrid?: () => void;
  compact?: boolean;
  className?: string;
}

interface PresetOption {
  preset: BandLayoutPreset;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PRESET_OPTIONS: PresetOption[] = [
  {
    preset: '1-col',
    label: '1',
    description: '1 Coluna Única (100% de largura)',
    icon: Grid,
  },
  {
    preset: '2-col-50-50',
    label: '50/50',
    description: '2 Colunas Iguais (50% / 50%)',
    icon: Columns,
  },
  {
    preset: '2-col-33-67',
    label: '33/67',
    description: '2 Colunas Assimétricas (33% / 67%)',
    icon: SplitSquareVertical,
  },
  {
    preset: '2-col-67-33',
    label: '67/33',
    description: '2 Colunas Assimétricas (67% / 33%)',
    icon: SplitSquareVertical,
  },
  {
    preset: '3-col-equal',
    label: '3 Col',
    description: '3 Colunas Iguais',
    icon: Columns,
  },
  {
    preset: '4-grid-2x2',
    label: '2×2',
    description: '4 Quadrantes (2 colunas × 2 linhas)',
    icon: LayoutGrid,
  },
];

export const SmartGridToolbar: React.FC<SmartGridToolbarProps> = ({
  activePreset,
  onSelectPreset,
  showRuler,
  onToggleRuler,
  gridVisible = false,
  onToggleGrid,
  compact = true,
  className = '',
}) => {
  return (
    <div
      className={`inline-flex items-center rounded-md bg-slate-900/80 backdrop-blur-md border border-slate-800/80 p-0.5 shadow-md select-none transition-all pointer-events-auto ${className}`}
      role="toolbar"
      aria-label="Barra de Grade Inteligente"
    >
      {/* Grade Toggle */}
      {onToggleGrid && (
        <>
          <button
            type="button"
            onClick={onToggleGrid}
            title={gridVisible ? 'Ocultar Grade Inteligente' : 'Exibir Grade Inteligente'}
            className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
              gridVisible
                ? 'bg-emerald-600 text-white font-medium shadow-xs shadow-emerald-950'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Grid className="w-3 h-3" />
            <span className="leading-none">Grade</span>
          </button>
          <div className="h-3 w-px bg-slate-800 mx-0.5" />
        </>
      )}

      {/* Layout Presets Buttons */}
      <div className="flex items-center space-x-0.5">
        {PRESET_OPTIONS.map((item) => {
          const Icon = item.icon;
          const isActive = activePreset === item.preset;

          return (
            <button
              key={item.preset}
              type="button"
              onClick={() => onSelectPreset(item.preset)}
              title={item.description}
              className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] transition-all ${
                isActive
                  ? 'bg-emerald-600/90 text-white font-medium shadow-xs shadow-emerald-950 ring-1 ring-emerald-400/50'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
              }`}
            >
              <Icon className="w-3 h-3 shrink-0" />
              <span className="font-mono leading-none text-[9.5px]">{item.label}</span>
            </button>
          );
        })}
      </div>

      <div className="h-3 w-px bg-slate-800 mx-0.5" />

      {/* Millimeter Ruler Toggle */}
      <button
        type="button"
        onClick={onToggleRuler}
        title={showRuler ? 'Ocultar Réguas em Milímetros' : 'Exibir Réguas em Milímetros (mm)'}
        className={`flex items-center space-x-1 px-1.5 py-0.5 rounded text-[10px] transition-colors ${
          showRuler
            ? 'bg-cyan-600/90 text-white font-medium ring-1 ring-cyan-400/50 shadow-xs'
            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
        }`}
      >
        <Ruler className="w-3 h-3 shrink-0" />
        <span className="font-mono font-medium leading-none text-[9.5px]">mm</span>
      </button>
    </div>
  );
};
