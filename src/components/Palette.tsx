'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Type,
  Variable,
  Minus,
  Square,
  Image as ImageIcon,
  Layers,
  ChevronDown,
  ChevronRight,
  Search,
  Sparkles,
  GripVertical,
  PackageCheck,
  Receipt,
  Truck,
  FileCheck2,
  Plus,
  Barcode,
  QrCode,
  FolderGit2,
  BarChart3,
  PieChart,
  LineChart,
  Table2,
  SlidersHorizontal,
  BookmarkPlus,
  Trash2,
} from 'lucide-react';
import { ElementType, BandType, JRXMLReport } from '../types/jrxml';
import { SANKHYA_PRESETS } from '../engine/presets';
import {
  SANKHYA_COMPONENT_CATALOG,
  SankhyaCatalogComponent,
  ComponentCategory,
  getCustomComponents,
  deleteCustomComponent,
  customBlockToCatalogComponent,
} from '../engine/sankhya-components';
import { SankhyaComponentPreview } from './SankhyaComponentPreview';

interface PaletteProps {
  onAddElement: (
    type: ElementType,
    presetExpression?: string,
    defaultText?: string,
    targetBand?: BandType,
    position?: { x: number; y: number }
  ) => void;
  onAddCatalogComponent: (component: SankhyaCatalogComponent) => void;
  onCustomizeComponent?: (component: SankhyaCatalogComponent) => void;
  onOpenCreateComponent?: (mode?: 'scaffold' | 'selection') => void;
  report: JRXMLReport;
  activeBand: BandType;
  setActiveBand: (band: BandType) => void;
  selectedElementId: string | null;
  onSelectElement: (id: string, band: BandType) => void;
}

export const Palette: React.FC<PaletteProps> = ({
  onAddElement,
  onAddCatalogComponent,
  onCustomizeComponent,
  onOpenCreateComponent,
  report,
  activeBand,
  setActiveBand,
  selectedElementId,
  onSelectElement,
}) => {
  const [tab, setTab] = useState<'catalog' | 'fields' | 'tools'>('catalog');
  const [catalogCategory, setCatalogCategory] = useState<'all' | ComponentCategory>('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  const [fieldCategory, setFieldCategory] = useState<'all' | 'parameter' | 'field' | 'system'>('all');
  const [fieldSearch, setFieldSearch] = useState('');
  const [outlineOpen, setOutlineOpen] = useState(false);

  // Custom User Blocks from localStorage
  const [customBlocks, setCustomBlocks] = useState<SankhyaCatalogComponent[]>([]);

  const loadCustomBlocks = useCallback(() => {
    const blocks = getCustomComponents();
    setCustomBlocks(blocks.map(customBlockToCatalogComponent));
  }, []);

  useEffect(() => {
    loadCustomBlocks();
    const handleUpdate = () => loadCustomBlocks();
    window.addEventListener('sankhya_custom_component_saved', handleUpdate);
    window.addEventListener('storage', handleUpdate);
    return () => {
      window.removeEventListener('sankhya_custom_component_saved', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [loadCustomBlocks]);

  // Combined Catalog Components (User Custom Blocks + Official Catalog)
  const allAvailableComponents = useMemo(() => {
    return [...customBlocks, ...SANKHYA_COMPONENT_CATALOG];
  }, [customBlocks]);

  // Filtered Catalog Components
  const filteredCatalog = useMemo(() => {
    return allAvailableComponents.filter((comp) => {
      const matchesCat =
        catalogCategory === 'all'
          ? true
          : catalogCategory === 'custom'
          ? comp.category === 'custom' || comp.isCustom
          : comp.category === catalogCategory;

      const search = catalogSearch.toLowerCase().trim();
      const matchesSearch =
        !search ||
        comp.title.toLowerCase().includes(search) ||
        comp.description.toLowerCase().includes(search) ||
        comp.badge.toLowerCase().includes(search) ||
        comp.tags.some((t) => t.toLowerCase().includes(search));
      return matchesCat && matchesSearch;
    });
  }, [allAvailableComponents, catalogCategory, catalogSearch]);

  // Filtered Variables / Fields
  const filteredPresets = useMemo(() => {
    return SANKHYA_PRESETS.filter((p) => {
      const matchesCat = fieldCategory === 'all' || p.category === fieldCategory;
      const search = fieldSearch.toLowerCase().trim();
      const matchesSearch =
        !search ||
        p.label.toLowerCase().includes(search) ||
        p.expression.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search);
      return matchesCat && matchesSearch;
    });
  }, [fieldCategory, fieldSearch]);

  const toolElements: { type: ElementType; label: string; icon: React.ReactNode; desc: string }[] = [
    {
      type: 'staticText',
      label: 'Texto Estático',
      icon: <Type className="w-4 h-4 text-emerald-400" />,
      desc: 'Rótulo ou título fixo (<staticText>)',
    },
    {
      type: 'textField',
      label: 'Campo de Dados',
      icon: <Variable className="w-4 h-4 text-sky-400" />,
      desc: 'Expressão dinâmica ($F{...}, $P{...})',
    },
    {
      type: 'line',
      label: 'Linha',
      icon: <Minus className="w-4 h-4 text-amber-400" />,
      desc: 'Linha divisória (<line>)',
    },
    {
      type: 'rectangle',
      label: 'Retângulo / Moldura',
      icon: <Square className="w-4 h-4 text-purple-400" />,
      desc: 'Fundo ou moldura (<rectangle>)',
    },
    {
      type: 'image',
      label: 'Logotipo / Imagem',
      icon: <ImageIcon className="w-4 h-4 text-pink-400" />,
      desc: 'Logotipo ou imagem dinâmica (<image>)',
    },
    {
      type: 'barcode',
      label: 'Código de Barras / QR Code',
      icon: <Barcode className="w-4 h-4 text-cyan-400" />,
      desc: 'Code 128, EAN-13, Boleto I25, QR Code (<componentElement>)',
    },
    {
      type: 'subreport',
      label: 'Sub-relatório',
      icon: <FolderGit2 className="w-4 h-4 text-indigo-400" />,
      desc: 'Relatório aninhado (<subreport> itens, parcelas)',
    },
    {
      type: 'chart',
      label: 'Gráfico JFreeChart',
      icon: <BarChart3 className="w-4 h-4 text-emerald-400" />,
      desc: 'Gráficos estatísticos (<barChart>, <pieChart>, <lineChart>)',
    },
    {
      type: 'crosstab',
      label: 'Matriz Cruzada (Crosstab)',
      icon: <Table2 className="w-4 h-4 text-purple-400" />,
      desc: 'Tabela dinâmica 2D com linhas, colunas e subtotais (<crosstab>)',
    },
  ];

  const getCategoryIcon = (category: ComponentCategory) => {
    switch (category) {
      case 'custom':
        return <BookmarkPlus className="w-3.5 h-3.5 text-pink-400" />;
      case 'fiscal':
        return <PackageCheck className="w-3.5 h-3.5 text-sky-400" />;
      case 'finance':
        return <Receipt className="w-3.5 h-3.5 text-emerald-400" />;
      case 'stock':
        return <Truck className="w-3.5 h-3.5 text-amber-400" />;
      default:
        return <FileCheck2 className="w-3.5 h-3.5 text-purple-400" />;
    }
  };

  const bandKeys: { key: BandType; label: string }[] = [
    { key: 'title', label: 'Title' },
    { key: 'pageHeader', label: 'Page Header' },
    { key: 'columnHeader', label: 'Column Header' },
    { key: 'detail', label: 'Detail' },
    { key: 'columnFooter', label: 'Column Footer' },
    { key: 'pageFooter', label: 'Page Footer' },
    { key: 'summary', label: 'Summary' },
  ];

  return (
    <aside className="w-80 shrink-0 bg-slate-900/95 border-r border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] text-xs z-20 select-none overflow-hidden">
      {/* 3 Main Tabs: Componentes Sankhya | Campos/Variáveis | Ferramentas */}
      <div className="flex border-b border-slate-800 bg-slate-950 p-1 space-x-1">
        <button
          onClick={() => setTab('catalog')}
          className={`flex-1 py-1.5 rounded-md font-semibold text-[11px] flex items-center justify-center space-x-1 transition border cursor-pointer ${
            tab === 'catalog'
              ? 'bg-slate-800 text-emerald-400 border-emerald-500/50 shadow-sm ring-1 ring-emerald-500/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Componentes Prontos do Sankhya ERP (NF-e, Boleto, Romaneio...)"
        >
          <PackageCheck className="w-3.5 h-3.5" />
          <span>Componentes</span>
        </button>

        <button
          onClick={() => setTab('fields')}
          className={`flex-1 py-1.5 rounded-md font-semibold text-[11px] flex items-center justify-center space-x-1 transition border cursor-pointer ${
            tab === 'fields'
              ? 'bg-slate-800 text-sky-400 border-sky-500/50 shadow-sm ring-1 ring-sky-500/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Campos do Banco de Dados e Parâmetros ($F{...}, $P{...})"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Campos</span>
        </button>

        <button
          onClick={() => setTab('tools')}
          className={`px-2.5 py-1.5 rounded-md font-semibold text-[11px] flex items-center justify-center space-x-1 transition border cursor-pointer ${
            tab === 'tools'
              ? 'bg-slate-800 text-amber-300 border-amber-500/50 shadow-sm ring-1 ring-amber-500/20'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="Formas Básicas (Texto, Linha, Retângulo, Imagem)"
        >
          <Type className="w-3.5 h-3.5" />
          <span>Básicos</span>
        </button>
      </div>

      {/* TAB 1: CATÁLOGO DE COMPONENTES SANKHYA */}
      {tab === 'catalog' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          {/* Header & Subtitle */}
          <div className="mb-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5 truncate">
                <PackageCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="truncate">Catálogo de Componentes</span>
              </span>
              <div className="flex items-center space-x-1.5 shrink-0">
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400">
                  {filteredCatalog.length}
                </span>
                {onOpenCreateComponent && (
                  <button
                    type="button"
                    onClick={() => onOpenCreateComponent('scaffold')}
                    className="flex items-center space-x-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[11px] font-semibold transition shadow-xs cursor-pointer"
                    title="Criar novo componente para o catálogo"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Novo Componente</span>
                  </button>
                )}
              </div>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Arraste para a folha ou clique para inserir o bloco pronto com fórmulas.
            </p>
          </div>

          {/* Category Filter Buttons */}
          <div className="grid grid-cols-5 gap-1 mb-2">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'custom', label: 'Meus' },
              { id: 'fiscal', label: 'Fiscal' },
              { id: 'finance', label: 'Financ' },
              { id: 'stock', label: 'Estoque' },
            ].map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCatalogCategory(cat.id as any)}
                className={`py-1 rounded text-[10px] font-medium transition text-center truncate ${
                  catalogCategory === cat.id
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
                title={cat.id === 'custom' ? 'Meus Blocos Personalizados' : cat.label}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              value={catalogSearch}
              onChange={(e) => setCatalogSearch(e.target.value)}
              placeholder="Buscar canhoto, imposto, cliente, boleto..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Components Cards List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {catalogCategory === 'custom' && filteredCatalog.length === 0 ? (
              <div className="p-4 rounded-xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center text-center space-y-2.5 my-4">
                <div className="p-2.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <BookmarkPlus className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-xs">Nenhum Bloco Personalizado</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-[200px] leading-relaxed">
                    Crie blocos estruturados do zero ou selecione elementos na folha para salvar.
                  </p>
                </div>
                {onOpenCreateComponent && (
                  <button
                    type="button"
                    onClick={() => onOpenCreateComponent('scaffold')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center space-x-1.5 transition shadow-md shadow-emerald-950/50 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Criar Meu Primeiro Componente</span>
                  </button>
                )}
              </div>
            ) : filteredCatalog.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center text-center space-y-3 my-4">
                <div className="p-3 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  <Search className="w-5 h-5 text-slate-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-200 text-xs">Nenhum componente encontrado</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 max-w-[220px] leading-relaxed">
                    {catalogSearch
                      ? `Nenhum resultado para "${catalogSearch}".`
                      : 'Nenhum componente nesta categoria.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setCatalogCategory('all');
                    setCatalogSearch('');
                  }}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-semibold flex items-center space-x-1.5 transition border border-slate-700 cursor-pointer shadow-xs"
                >
                  <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Limpar Filtros / Ver Todos</span>
                </button>
              </div>
            ) : (
              filteredCatalog.map((comp) => (
              <div
                key={comp.id}
                draggable={true}
                onDragStart={(e) => {
                  const payload = JSON.stringify({
                    kind: 'sankhya-catalog-component',
                    componentId: comp.id,
                    targetBand: comp.band,
                  });
                  e.dataTransfer.setData('text/plain', payload);
                  e.dataTransfer.setData('application/json', payload);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                className="p-2.5 rounded-lg bg-slate-950/70 hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/50 transition cursor-grab active:cursor-grabbing group shadow-sm flex flex-col space-y-1.5"
              >
                {/* Card Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 truncate pointer-events-none">
                    <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0 pointer-events-none" />
                    <div className="p-1 rounded bg-slate-900 border border-slate-800 pointer-events-none">
                      {getCategoryIcon(comp.category)}
                    </div>
                    <span className="font-semibold text-slate-100 text-[11px] group-hover:text-emerald-300 truncate pointer-events-none">
                      {comp.title}
                    </span>
                  </div>

                  <div className="flex items-center space-x-1 shrink-0">
                    {comp.isCustom && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteCustomComponent(comp.id);
                          loadCustomBlocks();
                        }}
                        className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-red-950/40 transition"
                        title="Excluir este bloco personalizado"
                      >
                        <Trash2 className="w-3 h-3 pointer-events-none" />
                      </button>
                    )}
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 pointer-events-none">
                      {comp.band}
                    </span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-[10px] text-slate-400 leading-snug pl-4 pointer-events-none">
                  {comp.description}
                </p>

                {/* Visual Thumbnail Preview */}
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onCustomizeComponent) {
                      onCustomizeComponent(comp);
                    }
                  }}
                  className="cursor-pointer group/thumb relative rounded border border-slate-800 hover:border-emerald-500/60 transition overflow-hidden bg-slate-950 mt-1"
                  title="Clique para ver detalhes e personalizar propriedades"
                >
                  <SankhyaComponentPreview
                    component={comp}
                    columnWidth={report.columnWidth || 555}
                    mode="thumbnail"
                  />
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/thumb:opacity-100 transition flex items-center justify-center space-x-1.5 text-[10px] text-emerald-300 font-semibold backdrop-blur-[0.5px]">
                    <SlidersHorizontal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Personalizar</span>
                  </div>
                </div>

                {/* Footer with Badge & Action Buttons */}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[9px] text-emerald-400 font-mono truncate max-w-[90px] pointer-events-none">
                    {comp.badge}
                  </span>

                  <div className="flex items-center space-x-1.5">
                    {onCustomizeComponent && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onCustomizeComponent(comp);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-[10px] font-medium flex items-center space-x-1 transition shadow-xs"
                        title="Personalizar campos, tema e banda antes de inserir"
                      >
                        <SlidersHorizontal className="w-3 h-3 text-sky-400" />
                        <span>Personalizar</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onAddCatalogComponent(comp)}
                      className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 hover:bg-emerald-600 hover:text-white border border-emerald-800/40 text-[10px] font-medium flex items-center space-x-1 transition shadow-xs"
                      title={`Inserir na banda ${comp.band}`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>Inserir</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
            )}
          </div>
        </div>
      )}

      {/* TAB 2: CAMPOS & VARIÁVEIS SANKHYA */}
      {tab === 'fields' && (
        <div className="flex-1 flex flex-col overflow-hidden p-3">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-slate-200 text-xs flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              <span>Campos & Expressões</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Arraste p/ Folha</span>
          </div>

          {/* Filter Categories */}
          <div className="flex items-center space-x-1 mb-2">
            {(['all', 'parameter', 'field', 'system'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setFieldCategory(cat)}
                className={`px-2 py-0.5 rounded text-[10px] transition capitalize ${
                  fieldCategory === cat
                    ? 'bg-sky-600 text-white font-medium'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cat === 'all' ? 'Tudo' : cat === 'parameter' ? 'Params' : cat === 'field' ? 'Campos' : 'Sis'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-2">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-slate-500" />
            <input
              type="text"
              value={fieldSearch}
              onChange={(e) => setFieldSearch(e.target.value)}
              placeholder="Filtrar PK_NUNOTA, NOMEPARC..."
              className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-2 py-1 text-[11px] text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Presets List */}
          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredPresets.length === 0 ? (
              <div className="p-6 rounded-xl border border-dashed border-slate-800 bg-slate-950/60 flex flex-col items-center justify-center text-center space-y-2.5 my-4">
                <Search className="w-5 h-5 text-slate-500" />
                <div>
                  <h4 className="font-semibold text-slate-200 text-xs">Nenhum campo encontrado</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {fieldSearch ? `Sem resultados para "${fieldSearch}".` : 'Nenhum campo nesta categoria.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setFieldCategory('all');
                    setFieldSearch('');
                  }}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-medium transition border border-slate-700 cursor-pointer shadow-xs"
                >
                  Limpar Busca
                </button>
              </div>
            ) : (
              filteredPresets.map((preset) => (
                <div
                  key={preset.expression}
                  draggable={true}
                  onDragStart={(e) => {
                    const payload = JSON.stringify({
                      kind: 'element',
                      type: 'textField',
                      presetExpression: preset.expression,
                      defaultText: preset.label,
                    });
                    e.dataTransfer.setData('text/plain', payload);
                    e.dataTransfer.setData('application/json', payload);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  onClick={() => onAddElement('textField', preset.expression, preset.label)}
                  title={`Arraste ou clique para adicionar: ${preset.expression}\n${preset.description}`}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-950/70 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 text-left transition cursor-grab active:cursor-grabbing group shadow-sm"
                >
                  <div className="flex items-center space-x-2 truncate pr-1 pointer-events-none">
                    <GripVertical className="w-3 h-3 text-slate-600 group-hover:text-slate-400 shrink-0 pointer-events-none" />
                    <div className="truncate pointer-events-none">
                      <div className="font-medium text-slate-200 group-hover:text-sky-300 text-[11px] truncate pointer-events-none">
                        {preset.label}
                      </div>
                      <div className="font-mono text-[10px] text-sky-400 truncate pointer-events-none">
                        {preset.expression}
                      </div>
                    </div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 font-mono shrink-0 pointer-events-none">
                    {preset.category === 'parameter' ? '$P' : preset.category === 'field' ? '$F' : '$V'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ELEMENTOS BÁSICOS */}
      {tab === 'tools' && (
        <div className="flex-1 flex flex-col p-3 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Formas Básicas
            </span>
            <span className="text-[10px] text-emerald-400 font-mono">Banda: {activeBand}</span>
          </div>

          <div className="grid grid-cols-1 gap-1.5">
            {toolElements.map((tool) => (
              <div
                key={tool.type}
                draggable={true}
                onDragStart={(e) => {
                  const payload = JSON.stringify({
                    kind: 'element',
                    type: tool.type,
                    defaultText: tool.type === 'staticText' ? 'Novo Rótulo' : undefined,
                  });
                  e.dataTransfer.setData('text/plain', payload);
                  e.dataTransfer.setData('application/json', payload);
                  e.dataTransfer.effectAllowed = 'copy';
                }}
                onClick={() => onAddElement(tool.type)}
                className="flex items-center space-x-2.5 p-2 rounded-lg bg-slate-800/60 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-200 transition cursor-grab active:cursor-grabbing group shadow-sm"
              >
                <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 shrink-0 pointer-events-none" />
                <div className="p-1 rounded bg-slate-900 border border-slate-800 group-hover:border-slate-700 pointer-events-none">
                  {tool.icon}
                </div>
                <div className="flex-1 truncate pointer-events-none">
                  <div className="font-medium text-slate-100 pointer-events-none">{tool.label}</div>
                  <div className="text-[10px] text-slate-400 truncate pointer-events-none">{tool.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Outline Minimizable Footer */}
      <div className="border-t border-slate-800 max-h-[160px] flex flex-col">
        <button
          onClick={() => setOutlineOpen(!outlineOpen)}
          className="flex items-center justify-between p-2 bg-slate-950 text-slate-300 font-semibold hover:bg-slate-900 transition"
        >
          <div className="flex items-center space-x-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[10px] uppercase tracking-wider">Estrutura de Bandas</span>
          </div>
          {outlineOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {outlineOpen && (
          <div className="flex-1 overflow-y-auto p-1.5 space-y-0.5 bg-slate-950/40">
            {bandKeys.map(({ key, label }) => {
              const band = report.bands[key];
              const count = band ? band.elements.length : 0;
              const isActive = activeBand === key;

              return (
                <button
                  key={key}
                  onClick={() => setActiveBand(key)}
                  className={`w-full flex items-center justify-between px-2 py-1 rounded text-left transition ${
                    isActive
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 font-medium'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <span>{label}</span>
                  <span className="text-[10px] font-mono px-1 rounded bg-slate-800 text-slate-400">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};
