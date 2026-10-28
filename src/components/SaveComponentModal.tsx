'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  BookmarkPlus,
  Check,
  Sparkles,
  Layers,
  Tag,
  AlignLeft,
  Layout,
  Table2,
  Receipt,
  Barcode,
  FileCheck2,
  Square,
  Palette as PaletteIcon,
  MousePointerClick,
  Plus,
} from 'lucide-react';
import { BandType, JRXMLElement } from '../types/jrxml';
import {
  ComponentCategory,
  ComponentScaffoldType,
  SCAFFOLD_OPTIONS,
  generateScaffoldElements,
} from '../engine/sankhya-components';

interface SaveComponentModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedElements: JRXMLElement[];
  defaultBand: BandType;
  columnWidth?: number;
  initialMode?: 'scaffold' | 'selection';
  onConfirmSave: (data: {
    title: string;
    category: ComponentCategory;
    categoryLabel: string;
    description: string;
    band: BandType;
    height: number;
    badge: string;
    elements: JRXMLElement[];
  }) => void;
}

const CATEGORY_OPTIONS: { id: ComponentCategory; label: string }[] = [
  { id: 'custom', label: 'Meus Blocos (Personalizado)' },
  { id: 'fiscal', label: 'Fiscal & Vendas' },
  { id: 'finance', label: 'Financeiro' },
  { id: 'stock', label: 'Estoque & Logística' },
  { id: 'structural', label: 'Estruturais / Assinaturas' },
];

const BAND_OPTIONS: { key: BandType; label: string }[] = [
  { key: 'title', label: 'Title (Cabeçalho do Relatório)' },
  { key: 'pageHeader', label: 'Page Header (Cabeçalho da Página)' },
  { key: 'columnHeader', label: 'Column Header (Cabeçalho de Colunas)' },
  { key: 'detail', label: 'Detail (Linhas de Detalhe)' },
  { key: 'columnFooter', label: 'Column Footer (Rodapé de Colunas)' },
  { key: 'pageFooter', label: 'Page Footer (Rodapé da Página)' },
  { key: 'summary', label: 'Summary (Resumo / Totais)' },
];

const COLOR_PRESETS = [
  { name: 'Verde Sankhya', color: '#059669' },
  { name: 'Azul', color: '#0284C7' },
  { name: 'Roxo', color: '#7C3AED' },
  { name: 'Laranja', color: '#D97706' },
  { name: 'Grafite', color: '#334155' },
];

const SCAFFOLD_SHORT_TITLES: Record<ComponentScaffoldType, string> = {
  'card-info': 'Card Informativo',
  'table-grid': 'Tabela / Grade Resumo',
  'totalizer': 'Totalizador',
  'barcode-label': 'Etiqueta Barcode',
  'signature-box': 'Assinatura & Termo',
  'blank-box': 'Quadro Delimitador Vazio',
};

const getScaffoldIcon = (type: ComponentScaffoldType) => {
  switch (type) {
    case 'card-info':
      return <Layout className="w-4 h-4 text-emerald-400" />;
    case 'table-grid':
      return <Table2 className="w-4 h-4 text-sky-400" />;
    case 'totalizer':
      return <Receipt className="w-4 h-4 text-amber-400" />;
    case 'barcode-label':
      return <Barcode className="w-4 h-4 text-purple-400" />;
    case 'signature-box':
      return <FileCheck2 className="w-4 h-4 text-indigo-400" />;
    case 'blank-box':
      return <Square className="w-4 h-4 text-slate-400" />;
    default:
      return <Layout className="w-4 h-4 text-slate-400" />;
  }
};

export const SaveComponentModal: React.FC<SaveComponentModalProps> = ({
  isOpen,
  onClose,
  selectedElements,
  defaultBand,
  columnWidth = 555,
  initialMode,
  onConfirmSave,
}) => {
  const [mode, setMode] = useState<'scaffold' | 'selection'>(
    initialMode || (selectedElements.length > 0 ? 'selection' : 'scaffold')
  );
  const [selectedScaffold, setSelectedScaffold] = useState<ComponentScaffoldType>('card-info');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ComponentCategory>('custom');
  const [band, setBand] = useState<BandType>(defaultBand);
  const [primaryColor, setPrimaryColor] = useState('#059669');
  const [description, setDescription] = useState('');
  const [badge, setBadge] = useState('Personalizado');

  useEffect(() => {
    if (isOpen) {
      const targetMode = initialMode || (selectedElements.length > 0 ? 'selection' : 'scaffold');
      setMode(targetMode);
      setBand(defaultBand);
      if (targetMode === 'scaffold' && !title) {
        setTitle(SCAFFOLD_SHORT_TITLES[selectedScaffold]);
      }
    }
  }, [isOpen, initialMode, defaultBand, selectedElements.length, selectedScaffold, title]);

  if (!isOpen) return null;

  const handleSaveSelection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedElements.length === 0) return;

    // Normalize coordinates so the block starts at x: 0 or preserves relative offsets
    const minX = Math.min(...selectedElements.map((el) => el.reportElement.x));
    const minY = Math.min(...selectedElements.map((el) => el.reportElement.y));
    const maxY = Math.max(...selectedElements.map((el) => el.reportElement.y + el.reportElement.height));
    const computedHeight = Math.max(30, maxY - minY + 10);

    const normalizedElements: JRXMLElement[] = selectedElements.map((el) => {
      const clone = JSON.parse(JSON.stringify(el));
      clone.reportElement.x = Math.max(0, clone.reportElement.x - minX);
      clone.reportElement.y = Math.max(0, clone.reportElement.y - minY);
      return clone;
    });

    const categoryItem = CATEGORY_OPTIONS.find((c) => c.id === category);

    onConfirmSave({
      title: title.trim(),
      category,
      categoryLabel: categoryItem?.label || 'Meus Blocos',
      description: description.trim() || 'Bloco customizado reutilizável do usuário.',
      band,
      height: computedHeight,
      badge: badge.trim() || 'Personalizado',
      elements: normalizedElements,
    });

    setTitle('');
    setDescription('');
    onClose();
  };

  const handleCreateScaffold = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || SCAFFOLD_SHORT_TITLES[selectedScaffold];
    if (!finalTitle) return;

    const scaffoldOpt = SCAFFOLD_OPTIONS.find((s) => s.type === selectedScaffold);
    const elements = generateScaffoldElements(selectedScaffold, {
      title: finalTitle,
      primaryColor,
      columnWidth: columnWidth > 0 ? columnWidth : 555,
      band,
    });

    const categoryItem = CATEGORY_OPTIONS.find((c) => c.id === category);

    onConfirmSave({
      title: finalTitle,
      category,
      categoryLabel: categoryItem?.label || 'Meus Blocos',
      description: description.trim() || scaffoldOpt?.description || 'Componente criado a partir de scaffold.',
      band,
      height: scaffoldOpt?.height || 50,
      badge: badge.trim() || 'Personalizado',
      elements,
    });

    setTitle('');
    setDescription('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150 select-none">
      <div
        className="w-full max-w-xl max-h-[90vh] bg-slate-900 border border-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <BookmarkPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Criador de Componentes</h2>
              <p className="text-[11px] text-slate-400">
                {mode === 'scaffold'
                  ? 'Gere um bloco estruturado do zero e salve-o diretamente no catálogo.'
                  : `Transforme os ${selectedElements.length} elemento(s) selecionado(s) em um bloco do catálogo.`}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
            title="Fechar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Tabs */}
        <div className="flex border-b border-slate-800 bg-slate-950/50 px-5 pt-2">
          <button
            type="button"
            onClick={() => {
              setMode('scaffold');
              if (!title) setTitle(SCAFFOLD_SHORT_TITLES[selectedScaffold]);
            }}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              mode === 'scaffold'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Criar do Zero</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('selection')}
            className={`pb-2.5 px-3 text-xs font-semibold flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              mode === 'selection'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookmarkPlus className="w-3.5 h-3.5" />
            <span>Salvar da Folha</span>
            {selectedElements.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
                {selectedElements.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab 1: Criar do Zero (Scaffold) */}
        {mode === 'scaffold' && (
          <form onSubmit={handleCreateScaffold} className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {/* 2x3 Scaffold Grid */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                <Layout className="w-3.5 h-3.5 text-emerald-400" />
                <span>Escolha a Estrutura Base (Scaffold)</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SCAFFOLD_OPTIONS.map((scaffold) => {
                  const isSelected = selectedScaffold === scaffold.type;
                  const shortTitle = SCAFFOLD_SHORT_TITLES[scaffold.type] || scaffold.title;
                  return (
                    <div
                      key={scaffold.type}
                      onClick={() => {
                        setSelectedScaffold(scaffold.type);
                        if (!title || Object.values(SCAFFOLD_SHORT_TITLES).includes(title)) {
                          setTitle(shortTitle);
                        }
                      }}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition flex flex-col justify-between ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-emerald-950/20 text-emerald-300'
                          : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/60 text-slate-300'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <div className="p-1 rounded bg-slate-900 border border-slate-800">
                            {getScaffoldIcon(scaffold.type)}
                          </div>
                          <span className="text-[10px] font-mono text-slate-500">
                            {scaffold.height}px
                          </span>
                        </div>
                        <div className="font-semibold text-slate-100 text-[11px] leading-tight">
                          {shortTitle}
                        </div>
                        <p className="text-[10px] text-slate-400 mt-1 line-clamp-2 leading-tight">
                          {scaffold.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Component Title */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Nome do Componente *</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Tabela Resumo de Vendas"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Category and Target Band in 2 Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Category */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                  <Tag className="w-3.5 h-3.5 text-sky-400" />
                  <span>Categoria no Catálogo</span>
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as ComponentCategory)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {CATEGORY_OPTIONS.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Band */}
              <div className="space-y-1">
                <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                  <Layers className="w-3.5 h-3.5 text-amber-400" />
                  <span>Banda Alvo Sugerida</span>
                </label>
                <select
                  value={band}
                  onChange={(e) => setBand(e.target.value as BandType)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                >
                  {BAND_OPTIONS.map((b) => (
                    <option key={b.key} value={b.key}>
                      {b.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Primary Color Selector */}
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                <PaletteIcon className="w-3.5 h-3.5 text-pink-400" />
                <span>Cor Primária Rápida</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {COLOR_PRESETS.map((cp) => {
                  const isSelected = primaryColor.toLowerCase() === cp.color.toLowerCase();
                  return (
                    <button
                      key={cp.color}
                      type="button"
                      onClick={() => setPrimaryColor(cp.color)}
                      className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 ring-2 ring-emerald-500/20 bg-slate-800 text-white'
                          : 'border-slate-800 bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/20 flex items-center justify-center"
                        style={{ backgroundColor: cp.color }}
                      >
                        {isSelected && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                      </span>
                      <span>{cp.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description (Optional) */}
            <div className="space-y-1">
              <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                <span>Descrição Breve (Opcional)</span>
              </label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explique o propósito deste componente..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
              />
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!title.trim()}
                className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-emerald-950/50 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar e Salvar no Catálogo</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 2: Salvar da Folha (Selection) */}
        {mode === 'selection' && (
          <div className="flex-1 overflow-y-auto p-5 text-xs">
            {selectedElements.length > 0 ? (
              <form onSubmit={handleSaveSelection} className="space-y-4">
                {/* Component Title */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Título do Componente *</span>
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Meu Cabeçalho de Nota Especial"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Category Selection */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                    <Tag className="w-3.5 h-3.5 text-sky-400" />
                    <span>Categoria no Catálogo</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ComponentCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {CATEGORY_OPTIONS.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Target Band */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                    <Layers className="w-3.5 h-3.5 text-amber-400" />
                    <span>Banda Sugerida</span>
                  </label>
                  <select
                    value={band}
                    onChange={(e) => setBand(e.target.value as BandType)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  >
                    {BAND_OPTIONS.map((b) => (
                      <option key={b.key} value={b.key}>
                        {b.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Badge Label */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                    <Tag className="w-3.5 h-3.5 text-purple-400" />
                    <span>Badge / Etiqueta do Card</span>
                  </label>
                  <input
                    type="text"
                    value={badge}
                    onChange={(e) => setBadge(e.target.value)}
                    placeholder="Ex: Minha Empresa / Vendas"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1">
                  <label className="font-semibold text-slate-200 flex items-center space-x-1.5 text-xs">
                    <AlignLeft className="w-3.5 h-3.5 text-slate-400" />
                    <span>Descrição Breve (Opcional)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Explique onde este bloco deve ser usado..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 text-xs placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={!title.trim()}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold flex items-center space-x-1.5 transition shadow-lg shadow-emerald-950/50 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Salvar em Meus Blocos</span>
                  </button>
                </div>
              </form>
            ) : (
              /* Empty selection alert */
              <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center text-center space-y-3 my-4">
                <div className="p-3 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <MousePointerClick className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-sm">Nenhum elemento selecionado na folha</h3>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm leading-relaxed">
                    Para salvar elementos existentes, selecione-os no canvas ou crie um componente novo a partir de um dos nossos modelos estruturais.
                  </p>
                </div>
                <div className="flex items-center space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                  >
                    Fechar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('scaffold');
                      if (!title) setTitle(SCAFFOLD_SHORT_TITLES[selectedScaffold]);
                    }}
                    className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center space-x-1.5 transition shadow-md shadow-emerald-950/50 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Alternar para Criar do Zero</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
