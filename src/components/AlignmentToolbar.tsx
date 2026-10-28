'use client';

import React from 'react';
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  ArrowUp,
  Minus,
  ArrowDown,
  Maximize2,
  Minimize2,
  BookmarkPlus,
} from 'lucide-react';
import { JRXMLElement } from '../types/jrxml';

interface AlignmentToolbarProps {
  selectedElement: JRXMLElement;
  columnWidth: number;
  bandHeight: number;
  onUpdateElement: (updates: Partial<JRXMLElement>) => void;
  compact?: boolean;
  onSaveAsComponent?: () => void;
}

export const AlignmentToolbar: React.FC<AlignmentToolbarProps> = ({
  selectedElement,
  columnWidth,
  bandHeight,
  onUpdateElement,
  compact = false,
  onSaveAsComponent,
}) => {
  const rel = selectedElement.reportElement;
  const currentW = rel.width;
  const currentH = rel.height;

  // Horizontal Alignment
  const alignLeft = () => {
    onUpdateElement({
      reportElement: { ...rel, x: 0 },
    });
  };

  const alignCenterH = () => {
    const newX = Math.max(0, Math.round((columnWidth - currentW) / 2));
    onUpdateElement({
      reportElement: { ...rel, x: newX },
    });
  };

  const alignRight = () => {
    const newX = Math.max(0, columnWidth - currentW);
    onUpdateElement({
      reportElement: { ...rel, x: newX },
    });
  };

  // Vertical Alignment
  const alignTop = () => {
    onUpdateElement({
      reportElement: { ...rel, y: 0 },
    });
  };

  const alignCenterV = () => {
    const newY = Math.max(0, Math.round((bandHeight - currentH) / 2));
    onUpdateElement({
      reportElement: { ...rel, y: newY },
    });
  };

  const alignBottom = () => {
    const newY = Math.max(0, bandHeight - currentH);
    onUpdateElement({
      reportElement: { ...rel, y: newY },
    });
  };

  // Full Width & Height
  const stretchWidth = () => {
    onUpdateElement({
      reportElement: { ...rel, x: 0, width: columnWidth },
    });
  };

  const stretchHeight = () => {
    onUpdateElement({
      reportElement: { ...rel, y: 0, height: bandHeight },
    });
  };

  return (
    <div className={`flex items-center space-x-1 ${compact ? 'text-[10px]' : 'text-xs'}`}>
      {/* Horizontal Alignment Group */}
      <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 space-x-0.5">
        <button
          type="button"
          onClick={alignLeft}
          title="Alinhar à Esquerda (X = 0)"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={alignCenterH}
          title="Centralizar Horizontalmente na Página"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={alignRight}
          title="Alinhar à Direita"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Vertical Alignment Group */}
      <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 space-x-0.5">
        <button
          type="button"
          onClick={alignTop}
          title="Alinhar ao Topo da Banda (Y = 0)"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <ArrowUp className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={alignCenterV}
          title="Centralizar Verticalmente na Banda"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={alignBottom}
          title="Alinhar à Base da Banda"
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition"
        >
          <ArrowDown className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Stretch / Expand */}
      <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 space-x-0.5">
        <button
          type="button"
          onClick={stretchWidth}
          title="Expandir para Largura Total da Página (100%)"
          className="px-1.5 py-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded transition flex items-center space-x-1"
        >
          <Maximize2 className="w-3 h-3" />
          <span className="text-[10px]">100%</span>
        </button>
      </div>

      {/* Save Selection as Block */}
      {onSaveAsComponent && (
        <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 space-x-0.5">
          <button
            type="button"
            onClick={onSaveAsComponent}
            title="Salvar como Componente no Catálogo"
            className="px-1.5 py-1 text-amber-400 hover:text-amber-300 hover:bg-slate-800 rounded transition flex items-center space-x-1"
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span className="text-[10px]">Salvar Bloco</span>
          </button>
        </div>
      )}
    </div>
  );
};
