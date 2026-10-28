'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  SlidersHorizontal,
  Layers,
  Palette as PaletteIcon,
  Check,
  Sparkles,
  Info,
  Maximize2,
  CheckSquare,
  Square,
  Eye,
  CornerDownRight,
} from 'lucide-react';
import { BandType } from '../types/jrxml';
import {
  SankhyaCatalogComponent,
  ComponentCustomProps,
  ComponentTheme,
} from '../engine/sankhya-components';
import { SankhyaComponentPreview } from './SankhyaComponentPreview';

interface ComponentCustomizerModalProps {
  isOpen: boolean;
  component: SankhyaCatalogComponent | null;
  columnWidth: number;
  onClose: () => void;
  onInsert: (component: SankhyaCatalogComponent, customProps: ComponentCustomProps) => void;
}

const BAND_OPTIONS: { key: BandType; label: string; desc: string }[] = [
  { key: 'title', label: 'Title (Cabeçalho do Relatório)', desc: 'Impresso apenas na 1ª página' },
  { key: 'pageHeader', label: 'Page Header (Cabeçalho de Página)', desc: 'Impresso no topo de todas as páginas' },
  { key: 'columnHeader', label: 'Column Header (Cabeçalho das Colunas)', desc: 'Rótulos dos itens e colunas' },
  { key: 'detail', label: 'Detail (Linhas de Detalhe)', desc: 'Repetido para cada registro retornado' },
  { key: 'columnFooter', label: 'Column Footer (Rodapé de Colunas)', desc: 'Base antes do rodapé' },
  { key: 'pageFooter', label: 'Page Footer (Rodapé da Página)', desc: 'Rodapé fixo em todas as páginas' },
  { key: 'summary', label: 'Summary (Resumo / Totais)', desc: 'Impresso no fim do relatório após os dados' },
];

const PRESET_BORDER_COLORS = [
  { label: 'Cinza Suave', value: '#CBD5E1' },
  { label: 'Ardósia', value: '#94A3B8' },
  { label: 'Grafite', value: '#0F172A' },
  { label: 'Azul Sankhya', value: '#0284C7' },
  { label: 'Esmeralda', value: '#059669' },
  { label: 'Rubi', value: '#DC2626' },
];

const PRESET_BG_COLORS = [
  { label: 'Cinza DANFE (#F8FAFC)', value: '#F8FAFC' },
  { label: 'Branco Puro (#FFFFFF)', value: '#FFFFFF' },
  { label: 'Cinza Frio (#F1F5F9)', value: '#F1F5F9' },
  { label: 'Transparente', value: 'transparent' },
];

export const ComponentCustomizerModal: React.FC<ComponentCustomizerModalProps> = ({
  isOpen,
  component,
  columnWidth,
  onClose,
  onInsert,
}) => {
  const [targetBand, setTargetBand] = useState<BandType>('detail');
  const [theme, setTheme] = useState<ComponentTheme>('classic');
  const [borderWidth, setBorderWidth] = useState<number>(1);
  const [borderColor, setBorderColor] = useState<string>('#CBD5E1');
  const [backgroundColor, setBackgroundColor] = useState<string>('#F8FAFC');
  const [fieldToggles, setFieldToggles] = useState<Record<string, boolean>>({});

  // Reset/initialize state whenever a new component is opened
  useEffect(() => {
    if (component) {
      setTargetBand(component.band);
      setTheme('classic');
      setBorderWidth(1);
      setBorderColor('#CBD5E1');
      setBackgroundColor('#F8FAFC');

      const initialToggles: Record<string, boolean> = {};
      if (component.configurableFields) {
        component.configurableFields.forEach((f) => {
          initialToggles[f.key] = f.defaultValue;
        });
      }
      setFieldToggles(initialToggles);
    }
  }, [component]);

  if (!isOpen || !component) return null;

  const handleSelectTheme = (newTheme: ComponentTheme) => {
    setTheme(newTheme);
    if (newTheme === 'classic') {
      setBackgroundColor('#F8FAFC');
      setBorderColor('#CBD5E1');
      setBorderWidth(1);
    } else if (newTheme === 'minimal') {
      setBackgroundColor('transparent');
      setBorderColor('#E2E8F0');
      setBorderWidth(0.5);
    } else if (newTheme === 'contrast') {
      setBackgroundColor('#FFFFFF');
      setBorderColor('#000000');
      setBorderWidth(1);
    } else if (newTheme === 'corporate') {
      setBackgroundColor('#F0F9FF');
      setBorderColor('#0284C7');
      setBorderWidth(1);
    }
  };

  const handleToggleField = (key: string) => {
    setFieldToggles((prev) => ({
      ...prev,
      [key]: prev[key] === false ? true : false,
    }));
  };

  const currentCustomProps: ComponentCustomProps = {
    theme,
    targetBand,
    borderWidth,
    borderColor,
    backgroundColor,
    fieldToggles,
  };

  const handleConfirmInsert = () => {
    onInsert(component, currentCustomProps);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm font-semibold text-slate-100">{component.title}</h2>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-emerald-400 border border-slate-700">
                  {component.badge}
                </span>
                <span className="text-[10px] text-slate-400">• {component.categoryLabel}</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{component.description}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: Split 2 Columns */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden min-h-0">
          {/* LEFT: Realtime Live Visual Preview (7 cols) */}
          <div className="lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-slate-800 bg-slate-950/40 p-4 overflow-hidden">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5">
                <Eye className="w-3.5 h-3.5 text-emerald-400" />
                <span>Prévia Visual em Tempo Real</span>
              </span>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>JRXML Fiel (W: {columnWidth}px)</span>
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 mb-3">
              Representação exata que será impressa e inserida no relatório com fontes, caixas e fórmulas.
            </p>

            {/* Scrollable Preview Area */}
            <div className="flex-1 overflow-auto rounded-lg bg-slate-950/80 border border-slate-800/90 p-4 flex items-center justify-center">
              <SankhyaComponentPreview
                component={component}
                customProps={currentCustomProps}
                columnWidth={columnWidth}
                mode="full"
                className="shadow-xl"
              />
            </div>
          </div>

          {/* RIGHT: Props Customization Controls (5 cols) */}
          <div className="lg:col-span-5 flex flex-col overflow-y-auto p-4 space-y-4 bg-slate-900 text-xs">
            {/* 1. Target Band Selection */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                <span>Banda de Destino</span>
              </label>
              <select
                value={targetBand}
                onChange={(e) => setTargetBand(e.target.value as BandType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              >
                {BAND_OPTIONS.map((opt) => (
                  <option key={opt.key} value={opt.key}>
                    {opt.label} {opt.key === component.band ? '(Padrão)' : ''}
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-slate-400 pl-0.5">
                {BAND_OPTIONS.find((b) => b.key === targetBand)?.desc}
              </p>
            </div>

            {/* 2. Style Theme Preset */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                <PaletteIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span>Estilo Visual & Tema</span>
              </label>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleSelectTheme('classic')}
                  className={`p-2 rounded-lg border text-left transition flex flex-col space-y-1 ${
                    theme === 'classic'
                      ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="font-semibold text-[11px] text-emerald-300">DANFE Oficial</span>
                  <span className="text-[9px] text-slate-400 leading-tight">Fundo #F8FAFC, bordas #CBD5E1</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme('minimal')}
                  className={`p-2 rounded-lg border text-left transition flex flex-col space-y-1 ${
                    theme === 'minimal'
                      ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="font-semibold text-[11px] text-sky-300">Moderno Flat</span>
                  <span className="text-[9px] text-slate-400 leading-tight">Transparente, divisórias finas</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme('contrast')}
                  className={`p-2 rounded-lg border text-left transition flex flex-col space-y-1 ${
                    theme === 'contrast'
                      ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="font-semibold text-[11px] text-amber-300">Econômico P&amp;B</span>
                  <span className="text-[9px] text-slate-400 leading-tight">Branco #FFFFFF, bordas pretas</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTheme('corporate')}
                  className={`p-2 rounded-lg border text-left transition flex flex-col space-y-1 ${
                    theme === 'corporate'
                      ? 'bg-slate-800 border-emerald-500 ring-1 ring-emerald-500/50 text-white'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <span className="font-semibold text-[11px] text-cyan-300">Corporativo Sankhya</span>
                  <span className="text-[9px] text-slate-400 leading-tight">Acentos e bordas em azul #0284C7</span>
                </button>
              </div>

              {/* Advanced Borders & Colors Controls */}
              <div className="space-y-2 pt-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-slate-300">Espessura da Borda:</span>
                  <div className="flex items-center space-x-1">
                    {[0, 0.5, 1, 1.5, 2].map((w) => (
                      <button
                        key={w}
                        type="button"
                        onClick={() => setBorderWidth(w)}
                        className={`px-2 py-0.5 rounded text-[10px] font-mono transition ${
                          borderWidth === w
                            ? 'bg-emerald-600 text-white font-bold'
                            : 'bg-slate-950 text-slate-400 hover:bg-slate-800'
                        }`}
                      >
                        {w}px
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-300 block">Cor da Borda:</span>
                  <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                    {PRESET_BORDER_COLORS.map((bc) => (
                      <button
                        key={bc.value}
                        type="button"
                        onClick={() => setBorderColor(bc.value)}
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                          borderColor === bc.value ? 'ring-2 ring-emerald-400 scale-110' : 'border-slate-700'
                        }`}
                        style={{ backgroundColor: bc.value }}
                        title={bc.label}
                      >
                        {borderColor === bc.value && (
                          <Check className={`w-3 h-3 ${bc.value === '#0F172A' ? 'text-white' : 'text-slate-950'}`} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[11px] text-slate-300 block">Fundo dos Elementos:</span>
                  <div className="grid grid-cols-2 gap-1">
                    {PRESET_BG_COLORS.map((bg) => (
                      <button
                        key={bg.value}
                        type="button"
                        onClick={() => setBackgroundColor(bg.value)}
                        className={`px-2 py-1 rounded text-[10px] text-left truncate border transition ${
                          backgroundColor === bg.value
                            ? 'bg-slate-800 border-emerald-500 text-emerald-300 font-medium'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {bg.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Fields & Sections Toggles */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="font-semibold text-slate-200 flex items-center justify-between text-xs">
                <span className="flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  <span>Campos e Seções Visíveis</span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {component.configurableFields?.length || 0} opções
                </span>
              </label>

              {component.configurableFields && component.configurableFields.length > 0 ? (
                <div className="space-y-1.5 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  {component.configurableFields.map((field) => {
                    const isChecked = fieldToggles[field.key] !== false;
                    return (
                      <div
                        key={field.key}
                        onClick={() => handleToggleField(field.key)}
                        className="flex items-center justify-between py-1 px-1.5 rounded hover:bg-slate-800/70 transition cursor-pointer select-none"
                      >
                        <span className={`text-[11px] ${isChecked ? 'text-slate-200 font-medium' : 'text-slate-500 line-through'}`}>
                          {field.label}
                        </span>

                        <div className="flex items-center space-x-1">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-600 shrink-0" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-950/50 border border-slate-800/60 text-slate-400 text-[11px] flex items-start space-x-1.5">
                  <Info className="w-3.5 h-3.5 text-sky-400 mt-0.5 shrink-0" />
                  <span>Este componente possui estrutura fixa unificada com ajustes de tema e banda disponíveis.</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
            <CornerDownRight className="w-3.5 h-3.5 text-emerald-400" />
            <span>
              Destino: <strong className="text-slate-200 font-mono">{targetBand}</strong> • Tema: <strong className="text-slate-200 capitalize">{theme}</strong>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition font-medium text-xs"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirmInsert}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center space-x-1.5 transition shadow-lg shadow-emerald-950/50"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Inserir no Relatório</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
