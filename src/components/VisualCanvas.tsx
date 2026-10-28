'use client';

import React, { useRef, useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import {
  JRXMLReport,
  JRXMLBand,
  JRXMLElement,
  JRXMLStaticText,
  JRXMLTextField,
  JRXMLLine,
  JRXMLRectangle,
  JRXMLImage,
  JRXMLBarcode,
  JRXMLSubreport,
  JRXMLChart,
  JRXMLCrosstab,
  BandType,
  ElementType,
} from '../types/jrxml';
import { BarcodeVisual } from '../engine/barcode';
import { SVGChart } from '../engine/chart';
import { CrosstabVisual } from '../engine/crosstab';
import {
  GripHorizontal,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Copy,
  Trash2,
  Plus,
  Minus,
  Eye,
  Layers,
  FolderGit2,
  BarChart3,
  PieChart,
  LineChart,
  HelpCircle,
  Info,
} from 'lucide-react';
import { SmartBlockDefinition, SMART_BLOCKS } from '../engine/blocks';
import {
  SANKHYA_COMPONENT_CATALOG,
  SankhyaCatalogComponent,
  ComponentCustomProps,
  getCustomComponents,
  customBlockToCatalogComponent,
} from '../engine/sankhya-components';
import { SmartGridToolbar } from './SmartGridToolbar';
import { SmartGridOverlay } from './SmartGridOverlay';
import { CanvasZoomControls } from './CanvasZoomControls';
import {
  BandLayoutPreset,
  calculateBandSlots,
  findSlotAtPosition,
  PT_PER_MM,
} from '../engine/smart-grid';

// Informações Amigáveis e Explicações das Bandas Sankhya
export const SANKHYA_BAND_INFO: Record<
  string,
  { label: string; sublabel: string; description: string; color: string }
> = {
  title: {
    label: 'Capa / Início',
    sublabel: 'Aparece apenas na 1ª página',
    description: 'Imprime uma única vez no início do relatório (Ideal para título principal e capa).',
    color: 'bg-emerald-700 text-emerald-100',
  },
  pageHeader: {
    label: 'Cabeçalho da Página',
    sublabel: 'Repete no topo de todas as páginas',
    description: 'Dados da empresa, CNPJ, logotipo e destinatário no topo de cada folha.',
    color: 'bg-blue-700 text-blue-100',
  },
  columnHeader: {
    label: 'Títulos das Colunas',
    sublabel: 'Cabeçalho da tabela de itens',
    description: 'Rótulos das colunas (Código, Descrição, Qtd, Vlr Unit, Total).',
    color: 'bg-cyan-700 text-cyan-100',
  },
  detail: {
    label: 'Linhas do Documento (Itens)',
    sublabel: 'Repete para cada produto ou registro',
    description: 'Banda dinâmica principal: gera uma linha visual para cada item retornado pelo banco.',
    color: 'bg-emerald-600 text-white',
  },
  columnFooter: {
    label: 'Rodapé da Tabela',
    sublabel: 'Final da grade de produtos',
    description: 'Fim dos itens em cada página.',
    color: 'bg-slate-700 text-slate-200',
  },
  pageFooter: {
    label: 'Rodapé da Página',
    sublabel: 'Repete no rodapé de todas as páginas',
    description: 'Numeração de página (Página X de Y), data de emissão e rodapé institucional.',
    color: 'bg-purple-700 text-purple-100',
  },
  summary: {
    label: 'Totais e Encerramento',
    sublabel: 'Totais gerais, impostos e assinaturas',
    description: 'Imprime após a última linha de itens com os totais somados, impostos e canhoto.',
    color: 'bg-amber-700 text-amber-100',
  },
  groupHeader: {
    label: 'Quebra de Grupo',
    sublabel: 'Início do agrupamento',
    description: 'Separação visual por Cliente, Vendedor ou Fornecedor antes dos itens.',
    color: 'bg-teal-700 text-teal-100',
  },
  groupFooter: {
    label: 'Subtotal do Grupo',
    sublabel: 'Soma específica desta quebra',
    description: 'Totalizador específico calculado para o grupo antes de iniciar o próximo.',
    color: 'bg-orange-700 text-orange-100',
  },
};

// Dynamically import Moveable to prevent SSR window issues
const Moveable = dynamic(() => import('react-moveable'), { ssr: false });

interface VisualCanvasProps {
  report: JRXMLReport;
  activeBand: string;
  setActiveBand: (band: any) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  onUpdateElement: (bandKey: string, elementId: string, updates: Partial<JRXMLElement>) => void;
  onUpdateBandHeight: (bandKey: string, height: number) => void;
  onAddElementAt: (
    type: ElementType,
    position: { x: number; y: number },
    targetBand: BandType,
    presetExpression?: string,
    defaultText?: string
  ) => void;
  onAddSmartBlock: (block: SmartBlockDefinition) => void;
  onAddCatalogComponent: (component: SankhyaCatalogComponent, customProps?: ComponentCustomProps) => void;
  onMoveElementToBand?: (sourceBandKey: string, targetBandKey: BandType, elementId: string, newY?: number) => void;
  onDuplicateElement: (bandKey: string, elementId: string) => void;
  onDeleteElement: (bandKey: string, elementId: string) => void;
  zoom: number;
  setZoom?: (zoom: number | ((prev: number) => number)) => void;
  snapGrid: number;
}

export const VisualCanvas: React.FC<VisualCanvasProps> = ({
  report,
  activeBand,
  setActiveBand,
  selectedElementId,
  setSelectedElementId,
  onUpdateElement,
  onUpdateBandHeight,
  onMoveElementToBand,
  onAddElementAt,
  onAddSmartBlock,
  onAddCatalogComponent,
  onDuplicateElement,
  onDeleteElement,
  zoom,
  setZoom,
  snapGrid,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const elementRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const [mounted, setMounted] = useState(false);
  const [dragOverBand, setDragOverBand] = useState<BandType | null>(null);

  // In-place text editing
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState<string>('');

  // Dragging state for band height resize
  const [bandResizeState, setBandResizeState] = useState<{
    bandKey: string;
    startY: number;
    initialH: number;
  } | null>(null);

  // Smart Grid Canva State
  const [bandPresets, setBandPresets] = useState<Record<string, BandLayoutPreset>>({
    title: '1-col',
    pageHeader: '1-col',
    columnHeader: '1-col',
    detail: '1-col',
    columnFooter: '1-col',
    pageFooter: '1-col',
    summary: '1-col',
  });
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [showRulersMm, setShowRulersMm] = useState<boolean>(false);
  const [gridOverlayVisible, setGridOverlayVisible] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const snap = (val: number): number => {
    if (snapGrid <= 1) return Math.round(val);
    return Math.round(val / snapGrid) * snapGrid;
  };

  // Band Height Resize Listener
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (bandResizeState) {
        const deltaY = (e.clientY - bandResizeState.startY) / zoom;
        const newHeight = Math.max(10, snap(bandResizeState.initialH + deltaY));
        onUpdateBandHeight(bandResizeState.bandKey, newHeight);
      }
    };

    const handleMouseUp = () => {
      setBandResizeState(null);
    };

    if (bandResizeState) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [bandResizeState, zoom, snapGrid, onUpdateBandHeight]);

  // Fit to screen width (Canva/Figma-style)
  const handleFitWidth = useCallback(() => {
    if (!containerRef.current || !report.pageWidth) return;
    const availableWidth = Math.max(300, containerRef.current.clientWidth - 80);
    const fitRatio = availableWidth / report.pageWidth;
    const optimalZoom = Math.min(2.5, Math.max(0.25, Math.round(fitRatio * 100) / 100));
    setZoom?.(optimalZoom);
  }, [report.pageWidth, setZoom]);

  // Support wheel zoom: Ctrl / Cmd + wheel, or trackpad pinch
  useEffect(() => {
    const container = containerRef.current;
    if (!container || !setZoom) return;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const zoomDelta = -e.deltaY * 0.002;
        setZoom((prevZoom) => {
          const nextZoom = Math.min(2.5, Math.max(0.25, Math.round((prevZoom + zoomDelta) * 100) / 100));
          return nextZoom;
        });
      }
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [setZoom]);

  // Keyboard shortcuts for zoom (Cmd/Ctrl + +, -, 0, 9)
  useEffect(() => {
    if (!setZoom) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && (e.key === '=' || e.key === '+')) {
        e.preventDefault();
        setZoom((z) => Math.min(2.5, Math.round((z + 0.1) * 10) / 10));
      } else if ((e.ctrlKey || e.metaKey) && e.key === '-') {
        e.preventDefault();
        setZoom((z) => Math.max(0.25, Math.round((z - 0.1) * 10) / 10));
      } else if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        setZoom(1.0);
      } else if ((e.ctrlKey || e.metaKey) && (e.key === '9' || (e.shiftKey && e.key === '1'))) {
        e.preventDefault();
        handleFitWidth();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setZoom, handleFitWidth]);

  // Handle Drag & Drop from Palette into specific band
  const handleBandDrop = (
    e: React.DragEvent<HTMLDivElement>,
    targetBand: BandType,
    isFreeArea = false
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverBand(null);
    setHoveredSlotId(null);

    try {
      const dataStr = e.dataTransfer.getData('application/json') || e.dataTransfer.getData('text/plain');
      if (!dataStr) return;
      const data = JSON.parse(dataStr);

      const bandRect = e.currentTarget.getBoundingClientRect();
      const dropX = Math.max(0, snap((e.clientX - bandRect.left) / zoom));
      const dropY = isFreeArea ? undefined : Math.max(0, snap((e.clientY - bandRect.top) / zoom));

      const curBand = report.bands[targetBand];
      const curBandHeight = curBand?.height || 30;
      const slots = calculateBandSlots(bandPresets[targetBand] || '1-col', report.columnWidth, curBandHeight);
      const slot = dropY !== undefined ? findSlotAtPosition(slots, dropX, dropY) : null;
      const targetSlotWidth = slot ? slot.width : report.columnWidth;
      const targetSlotX = slot ? slot.x : 0;

      if (data.kind === 'sankhya-catalog-component' || data.kind === 'sankhya-custom-component') {
        let comp = SANKHYA_COMPONENT_CATALOG.find((c) => c.id === data.componentId);
        if (!comp) {
          const customList = getCustomComponents().map(customBlockToCatalogComponent);
          comp = customList.find((c) => c.id === data.componentId);
        }
        if (comp) {
          onAddCatalogComponent(comp, {
            targetBand,
            slotWidth: targetSlotWidth,
            slotX: targetSlotX,
            dropY: slot ? slot.y : dropY,
          } as any);
        }
      } else if (data.kind === 'smart-block') {
        const block = SMART_BLOCKS.find((b) => b.id === data.blockId);
        if (block) {
          onAddSmartBlock(block);
        }
      } else if (data.kind === 'element') {
        const existingElements = curBand?.elements || [];
        const existingMaxY = existingElements.length > 0
          ? Math.max(...existingElements.map((el) => el.reportElement.y + el.reportElement.height))
          : 0;
        const elemX = slot ? slot.x : dropX;
        const elemY = isFreeArea ? (existingMaxY > 0 ? existingMaxY + 10 : 10) : (slot ? slot.y : (dropY ?? 10));

        onAddElementAt(
          data.type as ElementType,
          { x: elemX, y: elemY },
          targetBand,
          data.presetExpression,
          data.defaultText
        );
      }
    } catch (err) {
      console.error('Falha ao processar drop no canvas:', err);
    }
  };

  // Dynamic Bands Ordering (including Groups headers & footers)
  const allCanvasBands = useMemo(() => {
    const list: {
      key: string;
      rawKey: string;
      band: JRXMLBand;
      label: string;
      sublabel?: string;
      description?: string;
      badgeColor?: string;
    }[] = [];

    const getInfo = (rawKey: string, fallbackTitle?: string) => {
      const info = SANKHYA_BAND_INFO[rawKey];
      if (info) return info;
      return {
        label: fallbackTitle || rawKey,
        sublabel: '',
        description: '',
        color: 'bg-slate-700 text-slate-200',
      };
    };

    if (report.bands.title) {
      const info = getInfo('title', report.bands.title.title);
      list.push({ key: 'title', rawKey: 'title', band: report.bands.title, label: info.label, sublabel: info.sublabel, description: info.description, badgeColor: info.color });
    }
    if (report.bands.pageHeader) {
      const info = getInfo('pageHeader', report.bands.pageHeader.title);
      list.push({ key: 'pageHeader', rawKey: 'pageHeader', band: report.bands.pageHeader, label: info.label, sublabel: info.sublabel, description: info.description, badgeColor: info.color });
    }
    if (report.bands.columnHeader) {
      const info = getInfo('columnHeader', report.bands.columnHeader.title);
      list.push({ key: 'columnHeader', rawKey: 'columnHeader', band: report.bands.columnHeader, label: info.label, sublabel: info.sublabel, description: info.description, badgeColor: info.color });
    }

    // Groups Header Bands (rendered BEFORE detail)
    if (report.groups) {
      for (const g of report.groups) {
        if (g.headerBand) {
          const info = getInfo('groupHeader', g.headerBand.title);
          list.push({
            key: `group-header-${g.id}`,
            rawKey: 'groupHeader',
            band: g.headerBand,
            label: `Agrupamento: ${g.label || g.name}`,
            sublabel: 'Início da quebra',
            description: info.description,
            badgeColor: info.color,
          });
        }
      }
    }

    // Detail Band
    if (report.bands.detail) {
      const info = getInfo('detail', report.bands.detail.title);
      list.push({ key: 'detail', rawKey: 'detail', band: report.bands.detail, label: info.label, sublabel: info.sublabel, description: info.description, badgeColor: info.color });
    }

    // Groups Footer Bands (rendered AFTER detail, in reverse order)
    if (report.groups) {
      for (let i = report.groups.length - 1; i >= 0; i--) {
        const g = report.groups[i];
        if (g.footerBand) {
          const info = getInfo('groupFooter', g.footerBand.title);
          list.push({
            key: `group-footer-${g.id}`,
            rawKey: 'groupFooter',
            band: g.footerBand,
            label: `Subtotal: ${g.label || g.name}`,
            sublabel: 'Soma do grupo',
            description: info.description,
            badgeColor: info.color,
          });
        }
      }
    }

    if (report.bands.columnFooter) {
      const info = getInfo('columnFooter', report.bands.columnFooter.title);
      list.push({ key: 'columnFooter', rawKey: 'columnFooter', band: report.bands.columnFooter, label: info.label, sublabel: info.sublabel, description: info.description, badgeColor: info.color });
    }
    if (report.bands.pageFooter) {
      const info = getInfo('pageFooter', report.bands.pageFooter.title);
      list.push({ key: 'pageFooter', rawKey: 'pageFooter', band: report.bands.pageFooter, label: info.label, sublabel: info.sublabel, description: info.description, badgeColor: info.color });
    }
    if (report.bands.summary) {
      const info = getInfo('summary', report.bands.summary.title);
      list.push({ key: 'summary', rawKey: 'summary', band: report.bands.summary, label: info.label, sublabel: info.sublabel, description: info.description, badgeColor: info.color });
    }

    return list;
  }, [report.bands, report.groups]);

  // Calculate remaining empty space at bottom of sheet
  const remainingHeight = useMemo(() => {
    const totalBandsH = allCanvasBands.reduce((acc, b) => acc + b.band.height + 20, 0);
    const printableH = (report.pageHeight || 842) - (report.topMargin || 20) - (report.bottomMargin || 20);
    return Math.max(0, printableH - totalBandsH);
  }, [allCanvasBands, report.pageHeight, report.topMargin, report.bottomMargin]);

  // Find selected element across all bands and groups
  let selectedElem: JRXMLElement | null = null;
  let selectedElemBand: JRXMLBand | null = null;
  let selectedElemBandKey: string = activeBand;

  for (const b of allCanvasBands) {
    const found = b.band.elements.find((el) => el.id === selectedElementId);
    if (found) {
      selectedElem = found;
      selectedElemBand = b.band;
      selectedElemBandKey = b.key;
      break;
    }
  }

  const selectedTarget = selectedElementId ? elementRefs.current.get(selectedElementId) : null;

  // Magnetic guidelines for react-moveable
  const guidelineElements = useMemo(() => {
    if (!selectedElemBand || !selectedElementId) return [];
    const elements: HTMLElement[] = [];
    selectedElemBand.elements.forEach((el) => {
      if (el.id !== selectedElementId) {
        const dom = elementRefs.current.get(el.id);
        if (dom) elements.push(dom);
      }
    });
    return elements;
  }, [selectedElemBand, selectedElementId]);

  return (
    <div className="flex-1 min-w-0 relative overflow-hidden flex flex-col bg-slate-950 select-none">
      {/* Scrollable Canvas Viewport */}
      <div
        ref={containerRef}
        className="w-full h-full canvas-grid overflow-auto flex flex-col items-center p-8 relative"
        onClick={(e) => {
          if (e.target === containerRef.current) {
            setSelectedElementId(null);
            setEditingElementId(null);
          }
        }}
      >
        {/* Zoomed Container */}
      <div
        style={{
          transform: `scale(${zoom})`,
          transformOrigin: 'top center',
          width: `${report.pageWidth}px`,
        }}
        className="transition-transform duration-75 pb-16"
      >
        {/* Printable Paper Card */}
        <div
          className="report-paper text-slate-900 rounded shadow-2xl relative flex flex-col bg-white"
          style={{
            width: `${report.pageWidth}px`,
            minHeight: `${report.pageHeight}px`,
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            const fallbackBand = (report.bands.summary ? 'summary' : 'detail') as BandType;
            handleBandDrop(e, fallbackBand, true);
          }}
        >
          {/* Top Margin Header */}
          <div
            className="w-full bg-slate-100/60 border-b border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-mono shrink-0"
            style={{ height: `${report.topMargin}px` }}
          >
            Margem Superior ({report.topMargin}px)
          </div>

          {/* Printable Columns Area with Left and Right Margins */}
          <div className="relative flex flex-1 w-full">
            {/* Left Margin Guide */}
            <div
              className="bg-slate-100/40 border-r border-dashed border-slate-300 shrink-0 flex items-center justify-center"
              style={{ width: `${report.leftMargin}px` }}
            >
              <span className="text-[9px] text-slate-400 font-mono -rotate-90">
                {report.leftMargin}px
              </span>
            </div>

            {/* Printable Content Column */}
            <div
              className="flex-1 relative bg-white flex flex-col"
              style={{ width: `${report.columnWidth}px` }}
            >
              {allCanvasBands.map((bandItem) => {
                const band = bandItem.band;
                const key = bandItem.key;

                const isActive = activeBand === key || activeBand === bandItem.rawKey;
                const isDragOver = dragOverBand === key;
                const slots = calculateBandSlots(bandPresets[key] || '1-col', report.columnWidth, band.height);

                return (
                  <div
                    key={key}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveBand(key);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.dataTransfer.dropEffect = 'copy';
                      if (dragOverBand !== key) setDragOverBand(key as BandType);
                      const bandRect = e.currentTarget.getBoundingClientRect();
                      const dropX = Math.max(0, snap((e.clientX - bandRect.left) / zoom));
                      const dropY = Math.max(0, snap((e.clientY - bandRect.top) / zoom));
                      const slot = findSlotAtPosition(slots, dropX, dropY);
                      setHoveredSlotId(slot ? slot.id : null);
                    }}
                    onDragLeave={(e) => {
                      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
                      setDragOverBand(null);
                      setHoveredSlotId(null);
                    }}
                    onDrop={(e) => {
                      setHoveredSlotId(null);
                      handleBandDrop(e, key as BandType);
                    }}
                    className="w-full select-none"
                  >
                    {/* Band Header Separator Bar (Slim & Professional - Never covers elements) */}
                    <div
                      className={`w-full h-5 px-2 flex items-center justify-between text-[10px] select-none cursor-pointer border-t border-b transition-colors ${
                        isDragOver
                          ? 'bg-emerald-600 text-white border-emerald-500 font-semibold animate-pulse'
                          : isActive
                          ? 'bg-slate-800 text-emerald-300 border-slate-700 font-medium'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600 border-slate-300'
                      }`}
                      title={bandItem.description}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold uppercase tracking-wider text-[9px]">
                          {bandItem.label}
                        </span>
                        {bandItem.sublabel && (
                          <span className="opacity-70 font-normal hidden sm:inline text-[9px]">
                            • {bandItem.sublabel}
                          </span>
                        )}
                        {key === 'detail' && report.styles?.some((s) => s.name === 'Zebra') && (
                          <span className="px-1.5 py-0.5 rounded bg-indigo-600 text-white text-[8px] font-semibold flex items-center space-x-1">
                            <Layers className="w-2.5 h-2.5" />
                            <span>Zebrado</span>
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-2 text-[9px] font-mono opacity-80">
                        <span>
                          {band.height}px
                          {showRulersMm && ` • ${(band.height / PT_PER_MM).toFixed(1)}mm`}
                        </span>
                      </div>
                    </div>

                    {/* Band Elements Canvas (Exact Printable Area) */}
                    <div
                      className={`relative w-full bg-white border-b border-dashed transition-all ${
                        isDragOver
                          ? 'border-emerald-500 ring-2 ring-emerald-500/50 bg-emerald-50/20'
                          : isActive
                          ? 'border-emerald-500/60 bg-emerald-50/5'
                          : 'border-slate-300'
                      }`}
                      style={{ height: `${band.height}px` }}
                    >
                      <SmartGridOverlay
                        slots={slots}
                        hoveredSlotId={dragOverBand === key ? hoveredSlotId : null}
                        visible={gridOverlayVisible || isDragOver}
                        showMm={showRulersMm}
                      />

                      <div className="relative w-full h-full">
                        {band.elements.map((elem) => {
                        const isSelected = selectedElementId === elem.id;
                        const isEditing = editingElementId === elem.id;
                        const rel = elem.reportElement;

                        return (
                          <div
                            key={elem.id}
                            ref={(el) => {
                              if (el) elementRefs.current.set(elem.id, el);
                              else elementRefs.current.delete(elem.id);
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveBand(key);
                              setSelectedElementId(elem.id);
                            }}
                            onDoubleClick={(e) => {
                              e.stopPropagation();
                              if (elem.type === 'staticText') {
                                setEditingElementId(elem.id);
                                setEditingText((elem as JRXMLStaticText).text || '');
                              } else if (elem.type === 'textField') {
                                setEditingElementId(elem.id);
                                setEditingText((elem as JRXMLTextField).expression || '');
                              }
                            }}
                            className={`absolute select-none ${
                              isSelected && !isEditing
                                ? 'z-20'
                                : 'hover:outline hover:outline-1 hover:outline-sky-400 z-10'
                            }`}
                            style={{
                              left: `${rel.x}px`,
                              top: `${rel.y}px`,
                              width: `${rel.width}px`,
                              height: `${rel.height}px`,
                              backgroundColor:
                                rel.mode === 'Opaque' && rel.backcolor
                                  ? rel.backcolor
                                  : 'transparent',
                              color: rel.forecolor || '#0f172a',
                            }}
                          >
                            {/* Canva-style Floating Quick Toolbar on Selection */}
                            {isSelected && !isEditing && (
                              <FloatingQuickToolbar
                                elem={elem}
                                bandKey={key}
                                onUpdateElement={onUpdateElement}
                                onDuplicate={() => onDuplicateElement(key, elem.id)}
                                onDelete={() => onDeleteElement(key, elem.id)}
                                onStartEdit={() => {
                                  if (elem.type === 'staticText') {
                                    setEditingElementId(elem.id);
                                    setEditingText((elem as JRXMLStaticText).text || '');
                                  } else if (elem.type === 'textField') {
                                    setEditingElementId(elem.id);
                                    setEditingText((elem as JRXMLTextField).expression || '');
                                  }
                                }}
                              />
                            )}

                            {/* In-place Editing Input vs Regular Content */}
                            {isEditing ? (
                              <div className="w-full h-full bg-white ring-2 ring-emerald-500 rounded p-0.5 z-40">
                                <input
                                  type="text"
                                  autoFocus
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      e.currentTarget.blur();
                                    } else if (e.key === 'Escape') {
                                      setEditingElementId(null);
                                    }
                                  }}
                                  onBlur={() => {
                                    if (elem.type === 'staticText') {
                                      onUpdateElement(key, elem.id, { text: editingText } as any);
                                    } else if (elem.type === 'textField') {
                                      onUpdateElement(key, elem.id, { expression: editingText } as any);
                                    }
                                    setEditingElementId(null);
                                  }}
                                  className="w-full h-full bg-transparent border-0 text-slate-900 font-sans text-xs focus:outline-none px-1"
                                />
                              </div>
                            ) : (
                              <RenderElementContent elem={elem} />
                            )}

                            {/* Conditional Display Indicator Badge */}
                            {rel.printWhenExpression && (
                              <div
                                className="absolute -top-2.5 -right-2.5 z-30 bg-amber-500 text-slate-950 rounded-full w-5 h-5 shadow-md flex items-center justify-center pointer-events-none ring-1 ring-slate-950"
                                title={`Regra de exibição ativa: ${rel.printWhenExpression}`}
                              >
                                <Eye className="w-3 h-3 text-slate-950" />
                              </div>
                            )}

                            {/* Zebra Style Indicator Badge */}
                            {rel.style === 'Zebra' && (
                              <div
                                className="absolute -top-2.5 -left-2.5 z-30 bg-indigo-500 text-white rounded-full w-5 h-5 shadow-md flex items-center justify-center pointer-events-none ring-1 ring-slate-950"
                                title="Estilo Zebra (Linhas alternadas)"
                              >
                                <Layers className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Band Resize Grip Handle (Bottom border) */}
                    <div
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        setActiveBand(key);
                        setBandResizeState({
                          bandKey: key,
                          startY: e.clientY,
                          initialH: band.height,
                        });
                      }}
                      className="absolute -bottom-1.5 left-0 right-0 h-3 cursor-row-resize flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity z-20 group"
                    >
                      <div className="bg-emerald-600 text-white rounded-full px-2 py-0.5 text-[8px] font-mono flex items-center space-x-0.5 shadow">
                        <GripHorizontal className="w-2.5 h-2.5" />
                        <span>Ajustar Altura</span>
                      </div>
                    </div>
                    </div>
                  </div>
                );
              })}

              {/* Lower Page Natural Clean Space (Accepts drop gracefully) */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  if (dragOverBand !== 'summary') setDragOverBand('summary');
                }}
                onDragLeave={() => setDragOverBand(null)}
                onDrop={(e) => {
                  const fallbackBand = (report.bands.summary ? 'summary' : 'detail') as BandType;
                  handleBandDrop(e, fallbackBand, true);
                }}
                onClick={() => setActiveBand('summary')}
                className={`flex-1 w-full bg-white transition-colors ${
                  dragOverBand === 'summary' ? 'bg-emerald-50/20' : ''
                }`}
                style={{ minHeight: `${Math.max(0, remainingHeight)}px` }}
              />
            </div>

            {/* Right Margin Guide */}
            <div
              className="bg-slate-100/40 border-l border-dashed border-slate-300 shrink-0 flex items-center justify-center"
              style={{ width: `${report.rightMargin}px` }}
            >
              <span className="text-[9px] text-slate-400 font-mono rotate-90">
                {report.rightMargin}px
              </span>
            </div>
          </div>

          {/* Bottom Margin Footer (Pinned to True Bottom) */}
          <div
            className="w-full bg-slate-100/60 border-t border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400 font-mono shrink-0 mt-auto"
            style={{ height: `${report.bottomMargin}px` }}
          >
            Margem Inferior ({report.bottomMargin}px)
          </div>
        </div>
      </div>

      {/* react-moveable High-Performance Canvas Engine */}
      {mounted && selectedTarget && selectedElem && (
        <Moveable
          target={selectedTarget}
          draggable={true}
          resizable={true}
          snappable={true}
          snapThreshold={5}
          isDisplaySnapDigit={true}
          isDisplayGridGuidelines={snapGrid > 0}
          snapDirections={{
            top: true,
            left: true,
            bottom: true,
            right: true,
            center: true,
            middle: true,
          }}
          elementSnapDirections={{
            top: true,
            left: true,
            bottom: true,
            right: true,
            center: true,
            middle: true,
          }}
          elementGuidelines={guidelineElements}
          bounds={{
            left: 0,
            top: 0,
            right: report.columnWidth,
          }}
          zoom={zoom}
          renderDirections={['nw', 'n', 'ne', 'w', 'e', 'sw', 's', 'se']}
          origin={false}
          edge={false}
          className="ireport-moveable-controller"
          onDrag={(e) => {
            e.target.style.left = `${e.left}px`;
            e.target.style.top = `${e.top}px`;
          }}
          onDragEnd={(e) => {
            if (e.lastEvent && selectedElem && selectedElemBand) {
              const finalX = Math.max(0, snap(e.lastEvent.left));
              const finalY = Math.max(0, snap(e.lastEvent.top));
              const finalW = Math.max(15, selectedElem.reportElement.width);
              const finalH = Math.max(10, selectedElem.reportElement.height);

              // 1. Auto-expand band height if dragged near or beyond bottom of the current band
              const requiredH = finalY + finalH + 15;
              if (requiredH > selectedElemBand.height) {
                onUpdateBandHeight(selectedElemBandKey as BandType, snap(requiredH));
              }

              // 2. Check if dragged far down into a lower band
              if (e.lastEvent.top > selectedElemBand.height + 25 && onMoveElementToBand) {
                const currentIndex = allCanvasBands.findIndex((b) => b.key === selectedElemBandKey);
                if (currentIndex >= 0 && currentIndex < allCanvasBands.length - 1) {
                  const nextBands = allCanvasBands.slice(currentIndex + 1);
                  let accumulatedOffset = selectedElemBand.height;
                  for (const nb of nextBands) {
                    accumulatedOffset += 20; // separator bar height
                    if (e.lastEvent.top < accumulatedOffset + nb.band.height) {
                      const relY = Math.max(0, snap(e.lastEvent.top - accumulatedOffset));
                      onMoveElementToBand(selectedElemBandKey, nb.key as BandType, selectedElem.id, relY);
                      return;
                    }
                    accumulatedOffset += nb.band.height;
                  }
                  // If dragged beyond all lower bands, place in the last band (summary)
                  const lastBand = nextBands[nextBands.length - 1];
                  onMoveElementToBand(selectedElemBandKey, lastBand.key as BandType, selectedElem.id, 10);
                  return;
                }
              }

              onUpdateElement(selectedElemBandKey, selectedElem.id, {
                reportElement: {
                  ...selectedElem.reportElement,
                  x: finalX,
                  y: finalY,
                  width: finalW,
                  height: finalH,
                },
              });
            }
          }}
          onResizeStart={(e) => {
            e.setOrigin(["%", "%"]);
            if (e.dragStart && selectedElem) {
              e.dragStart.set([selectedElem.reportElement.x, selectedElem.reportElement.y]);
            }
          }}
          onResize={(e) => {
            e.target.style.width = `${e.width}px`;
            e.target.style.height = `${e.height}px`;
            if (e.drag && typeof e.drag.left === "number") e.target.style.left = `${e.drag.left}px`;
            if (e.drag && typeof e.drag.top === "number") e.target.style.top = `${e.drag.top}px`;
          }}
          onResizeEnd={(e) => {
            if (selectedElem) {
              const target = e.target as HTMLElement;
              const rawW = parseFloat(target.style.width) || e.lastEvent?.width || selectedElem.reportElement.width;
              const rawH = parseFloat(target.style.height) || e.lastEvent?.height || selectedElem.reportElement.height;
              const rawX = (target.style.left ? parseFloat(target.style.left) : undefined) ?? e.lastEvent?.drag?.left ?? selectedElem.reportElement.x;
              const rawY = (target.style.top ? parseFloat(target.style.top) : undefined) ?? e.lastEvent?.drag?.top ?? selectedElem.reportElement.y;
              const finalW = Math.max(15, snap(rawW));
              const finalH = Math.max(10, snap(rawH));
              const finalX = Math.max(0, snap(rawX));
              const finalY = Math.max(0, snap(rawY));

              if (selectedElemBand) {
                const requiredH = finalY + finalH + 15;
                if (requiredH > selectedElemBand.height) {
                  onUpdateBandHeight(selectedElemBandKey as BandType, snap(requiredH));
                }
              }

              onUpdateElement(selectedElemBandKey, selectedElem.id, {
                reportElement: { ...selectedElem.reportElement, width: finalW, height: finalH, x: finalX, y: finalY }
              });
            }
          }}
        />
      )}
      </div>

      {/* Smart Grid Single Discrete Floating Toolbar (Top-right HUD) */}
      <div className="absolute top-4 right-6 z-30 pointer-events-none">
        <SmartGridToolbar
          activePreset={bandPresets[activeBand] || '1-col'}
          onSelectPreset={(p) => setBandPresets((prev) => ({ ...prev, [activeBand]: p }))}
          showRuler={showRulersMm}
          onToggleRuler={() => setShowRulersMm((prev) => !prev)}
          gridVisible={gridOverlayVisible}
          onToggleGrid={() => setGridOverlayVisible((prev) => !prev)}
          compact={true}
          className="pointer-events-auto shadow-xl"
        />
      </div>

      {/* Floating Canva/Figma-Style Zoom Controls (Bottom Right HUD) */}
      {setZoom && (
        <div className="absolute bottom-6 right-6 z-30 pointer-events-auto">
          <CanvasZoomControls
            zoom={zoom}
            onZoomChange={setZoom}
            onFitWidth={handleFitWidth}
          />
        </div>
      )}
    </div>
  );
};

// Canva-style Floating Action Toolbar
function FloatingQuickToolbar({
  elem,
  bandKey,
  onUpdateElement,
  onDuplicate,
  onDelete,
  onStartEdit,
}: {
  elem: JRXMLElement;
  bandKey: string;
  onUpdateElement: (bandKey: string, elementId: string, updates: Partial<JRXMLElement>) => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
}) {
  const isText = elem.type === 'staticText' || elem.type === 'textField';
  const te = (elem as any).textElement || {};
  const font = te.font || {};
  const currentSize = font.size || 10;

  const quickColors = ['#0F172A', '#0284C7', '#059669', '#DC2626', '#64748B', '#FFFFFF'];

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      className="absolute -top-11 left-0 bg-slate-900 border border-slate-700/80 shadow-2xl rounded-lg p-1 flex items-center space-x-1 z-40 text-slate-200 select-none animate-in fade-in duration-100"
    >
      {isText && (
        <>
          {/* Double Click Edit Hint / Button */}
          <button
            onClick={onStartEdit}
            className="px-2 py-0.5 text-[10px] font-medium bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded transition"
            title="Editar Texto Diretamente (ou dê Duplo Clique)"
          >
            Editar
          </button>

          <div className="h-3.5 w-px bg-slate-800" />

          {/* Font Size - + */}
          <div className="flex items-center space-x-0.5 bg-slate-950 px-1 py-0.5 rounded border border-slate-800 text-[10px]">
            <button
              onClick={() => {
                const newSize = Math.max(6, currentSize - 1);
                onUpdateElement(bandKey, elem.id, {
                  textElement: { ...te, font: { ...font, size: newSize } },
                } as any);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-100"
              title="Diminuir Fonte"
            >
              <Minus className="w-2.5 h-2.5" />
            </button>
            <span className="font-mono text-slate-200 px-0.5">{currentSize}</span>
            <button
              onClick={() => {
                const newSize = Math.min(72, currentSize + 1);
                onUpdateElement(bandKey, elem.id, {
                  textElement: { ...te, font: { ...font, size: newSize } },
                } as any);
              }}
              className="p-0.5 text-slate-400 hover:text-slate-100"
              title="Aumentar Fonte"
            >
              <Plus className="w-2.5 h-2.5" />
            </button>
          </div>

          {/* Bold */}
          <button
            onClick={() => {
              onUpdateElement(bandKey, elem.id, {
                textElement: { ...te, font: { ...font, isBold: !font.isBold } },
              } as any);
            }}
            className={`p-1 rounded transition ${
              font.isBold ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:text-slate-100'
            }`}
            title="Negrito"
          >
            <Bold className="w-3 h-3" />
          </button>

          {/* Italic */}
          <button
            onClick={() => {
              onUpdateElement(bandKey, elem.id, {
                textElement: { ...te, font: { ...font, isItalic: !font.isItalic } },
              } as any);
            }}
            className={`p-1 rounded transition ${
              font.isItalic ? 'bg-slate-800 text-emerald-400' : 'text-slate-400 hover:text-slate-100'
            }`}
            title="Itálico"
          >
            <Italic className="w-3 h-3" />
          </button>

          {/* Align */}
          <button
            onClick={() => {
              const currentAlign = te.textAlignment || 'Left';
              const nextAlign =
                currentAlign === 'Left' ? 'Center' : currentAlign === 'Center' ? 'Right' : 'Left';
              onUpdateElement(bandKey, elem.id, {
                textElement: { ...te, textAlignment: nextAlign },
              } as any);
            }}
            className="p-1 rounded text-slate-400 hover:text-slate-100"
            title="Alternar Alinhamento (Esquerda/Centro/Direita)"
          >
            {te.textAlignment === 'Center' ? (
              <AlignCenter className="w-3 h-3 text-emerald-400" />
            ) : te.textAlignment === 'Right' ? (
              <AlignRight className="w-3 h-3 text-emerald-400" />
            ) : (
              <AlignLeft className="w-3 h-3" />
            )}
          </button>

          {/* Quick Color Swatches */}
          <div className="flex items-center space-x-1 pl-1">
            {quickColors.map((color) => (
              <button
                key={color}
                onClick={() => {
                  onUpdateElement(bandKey, elem.id, {
                    reportElement: { ...elem.reportElement, forecolor: color },
                  });
                }}
                style={{ backgroundColor: color }}
                className="w-3.5 h-3.5 rounded-full border border-slate-600 hover:scale-110 transition-transform"
                title={`Cor: ${color}`}
              />
            ))}
          </div>

          <div className="h-3.5 w-px bg-slate-800" />
        </>
      )}

      {/* Duplicate */}
      <button
        onClick={onDuplicate}
        className="p-1 text-slate-400 hover:text-sky-400 rounded transition"
        title="Duplicar Elemento (Ctrl+D)"
      >
        <Copy className="w-3 h-3" />
      </button>

      {/* Delete */}
      <button
        onClick={onDelete}
        className="p-1 text-slate-400 hover:text-rose-400 rounded transition"
        title="Excluir Elemento"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// Limpeza inteligente de expressões Java/Groovy do Sankhya para visualização legível no canvas
function cleanSankhyaExpression(rawExpr?: string): string {
  if (!rawExpr) return '$F{CAMPO}';
  const expr = rawExpr.trim();

  // Aliases amigáveis de campos clássicos do Sankhya
  if (expr.includes('NOMEPARC')) return 'Razão Social';
  if (expr.includes('CODPARC')) return 'Cód. Parceiro';
  if (expr.includes('VLRNOTA')) return 'Total Nota';
  if (expr.includes('NUNOTA')) return 'Nro Único';
  if (expr.includes('NUMNOTA')) return 'Nota Fiscal';
  if (expr.includes('DTNEG')) return 'Data Negoc.';
  if (expr.includes('DESCRPROD')) return 'Descr. Produto';
  if (expr.includes('CODPROD')) return 'Cód. Produto';
  if (expr.includes('QTDNEG')) return 'Qtd';
  if (expr.includes('VLRUNIT')) return 'Vlr. Unit.';
  if (expr.includes('VLRTOT')) return 'Vlr. Total';
  if (expr.includes('NOME_REL')) return '$P{NOME_REL}';

  // Se contiver $F{...}, $P{...} ou $V{...}, extrai e exibe diretamente o campo
  // Ex: br.com.sankhya.modelcore.report.CustomReportUtils.str($F{Descr.Parceiro}) -> $F{Descr.Parceiro}
  const match = expr.match(/\$[FPV]\{[^}]+\}/);
  if (match) {
    return match[0];
  }

  // Paginação comum
  if (expr.includes('PAGE_NUMBER')) {
    return 'Pág. $V{PAGE}';
  }

  // Remove pacotes Java longos (ex: br.com.sankhya.modelcore.profile.ApplicationProfile.getInstance()...)
  let cleaned = expr.replace(/^[a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+\.([a-zA-Z0-9_]+)/, '$1');
  cleaned = cleaned.replace(/^"|"$/g, '');

  return cleaned.length > 25 ? cleaned.slice(0, 22) + '...' : cleaned;
}

// Component to render specific element types inside the canvas
function RenderElementContent({ elem }: { elem: JRXMLElement }) {
  switch (elem.type) {
    case 'staticText': {
      const st = elem as JRXMLStaticText;
      const te = st.textElement;
      const font = te?.font;

      const alignMap: Record<string, string> = {
        Left: 'text-left',
        Center: 'text-center',
        Right: 'text-right',
        Justified: 'text-justify',
      };

      const valigMap: Record<string, string> = {
        Top: 'items-start',
        Middle: 'items-center',
        Bottom: 'items-end',
      };

      return (
        <div
          className={`w-full h-full flex overflow-hidden px-0.5 leading-tight select-none ${
            alignMap[te?.textAlignment || 'Left'] || 'text-left'
          } ${valigMap[te?.verticalAlignment || 'Top'] || 'items-start'}`}
          style={{
            fontFamily: font?.fontName || 'inherit',
            fontSize: font?.size ? `${font.size}px` : '10px',
            fontWeight: font?.isBold ? 'bold' : 'normal',
            fontStyle: font?.isItalic ? 'italic' : 'normal',
            textDecoration: font?.isUnderline ? 'underline' : 'none',
          }}
          title={st.text || 'Texto Estático'}
        >
          <span className="w-full truncate block">{st.text || 'Texto'}</span>
        </div>
      );
    }

    case 'textField': {
      const tf = elem as JRXMLTextField;
      const te = tf.textElement;
      const font = te?.font;

      const alignMap: Record<string, string> = {
        Left: 'text-left',
        Center: 'text-center',
        Right: 'text-right',
        Justified: 'text-justify',
      };

      const valigMap: Record<string, string> = {
        Top: 'items-start',
        Middle: 'items-center',
        Bottom: 'items-end',
      };

      const cleanLabel = cleanSankhyaExpression(tf.expression);

      return (
        <div
          className={`w-full h-full flex overflow-hidden px-0.5 leading-tight select-none ${
            alignMap[te?.textAlignment || 'Left'] || 'text-left'
          } ${valigMap[te?.verticalAlignment || 'Top'] || 'items-start'}`}
          style={{
            fontFamily: font?.fontName || 'inherit',
            fontSize: font?.size ? `${font.size}px` : '9px',
            fontWeight: font?.isBold ? 'bold' : 'normal',
            fontStyle: font?.isItalic ? 'italic' : 'normal',
            textDecoration: font?.isUnderline ? 'underline' : 'none',
          }}
          title={tf.expression || '$F{CAMPO}'}
        >
          <span className="w-full truncate block text-slate-800 font-mono text-[9px]">
            {cleanLabel}
          </span>
        </div>
      );
    }

    case 'line': {
      const ln = elem as JRXMLLine;
      const strokeWidth = ln.penWidth || 1;
      const strokeColor = ln.penColor || elem.reportElement.forecolor || '#000000';

      return (
        <svg className="w-full h-full overflow-visible pointer-events-none">
          <line
            x1="0"
            y1="0"
            x2={elem.reportElement.width}
            y2={elem.reportElement.height > 1 ? elem.reportElement.height : 0}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
          />
        </svg>
      );
    }

    case 'rectangle': {
      const rc = elem as JRXMLRectangle;
      const borderWidth = rc.penWidth !== undefined ? rc.penWidth : 1;
      const borderColor = rc.penColor || '#cbd5e1';

      return (
        <div
          className="w-full h-full pointer-events-none"
          style={{
            borderRadius: rc.radius ? `${rc.radius}px` : '0px',
            borderWidth: `${borderWidth}px`,
            borderColor,
            borderStyle: 'solid',
          }}
        />
      );
    }

    case 'image': {
      const img = elem as JRXMLImage;
      return (
        <div className="w-full h-full border border-dashed border-pink-400 bg-pink-50/50 flex flex-col items-center justify-center text-pink-700 text-[9px] p-1 text-center font-mono overflow-hidden">
          <span>[LOGO]</span>
          <span className="truncate w-full">{img.expression}</span>
        </div>
      );
    }

    case 'barcode': {
      const bc = elem as JRXMLBarcode;
      const cleanVal = bc.expression.replace(/["'$FP{}]/g, '') || '35261012345678000195550010000284011000284010';
      return (
        <div className="w-full h-full relative flex items-center justify-center overflow-hidden bg-white/40 border border-slate-300 rounded p-1">
          <BarcodeVisual
            type={bc.barcodeType}
            value={cleanVal}
            width={bc.reportElement.width - 8}
            height={bc.reportElement.height - 8}
            textPosition={bc.textPosition}
            forecolor={bc.reportElement.forecolor || '#000000'}
          />
        </div>
      );
    }

    case 'subreport': {
      const sr = elem as JRXMLSubreport;
      const fileNameMatch = sr.subreportExpression.match(/["']([^"']+)["']/);
      const fileName = fileNameMatch ? fileNameMatch[1] : 'sub_itens.jasper';

      return (
        <div className="w-full h-full relative rounded border-2 border-dashed border-indigo-400 bg-indigo-50/70 p-1.5 flex flex-col justify-between overflow-hidden">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <FolderGit2 className="w-3.5 h-3.5 text-indigo-700" />
              <span className="font-semibold text-[10px] text-indigo-900 truncate">
                Sub-relatório: {fileName}
              </span>
            </div>
            <span className="text-[9px] bg-indigo-200/80 text-indigo-800 font-mono px-1 rounded">
              &lt;subreport&gt;
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[9px] text-indigo-700 font-mono truncate">
            {sr.parameters && sr.parameters.length > 0 ? (
              sr.parameters.map((p, idx) => (
                <span key={idx} className="bg-white/80 px-1 py-0.5 rounded border border-indigo-200">
                  {p.name}={p.expression}
                </span>
              ))
            ) : (
              <span className="italic text-indigo-500">Sem parâmetros passados</span>
            )}
          </div>
        </div>
      );
    }

    case 'chart': {
      const ch = elem as JRXMLChart;
      return (
        <div className="w-full h-full relative rounded border border-emerald-500/50 bg-white shadow-sm overflow-hidden flex flex-col pointer-events-none">
          <div className="absolute top-1 right-1 z-10 bg-slate-900/80 text-emerald-400 text-[8px] font-mono px-1.5 py-0.5 rounded shadow flex items-center space-x-1">
            {ch.chartType === 'pieChart' && <PieChart className="w-2.5 h-2.5" />}
            {ch.chartType === 'lineChart' && <LineChart className="w-2.5 h-2.5" />}
            {(!ch.chartType || ch.chartType === 'barChart') && <BarChart3 className="w-2.5 h-2.5" />}
            <span>
              {ch.chartType === 'pieChart' ? 'Pizza' : ch.chartType === 'lineChart' ? 'Linhas' : 'Barras'}
            </span>
          </div>
          <SVGChart
            type={ch.chartType || 'barChart'}
            title={ch.title}
            width={ch.reportElement.width}
            height={ch.reportElement.height}
            isShowLegend={ch.isShowLegend !== false}
            isShowLabels={ch.isShowLabels !== false}
            isDarkCanvas={false}
          />
        </div>
      );
    }

    case 'crosstab': {
      const ct = elem as JRXMLCrosstab;
      return (
        <div className="w-full h-full pointer-events-none shadow-sm rounded overflow-hidden">
          <CrosstabVisual
            crosstab={ct}
            width={ct.reportElement.width}
            height={ct.reportElement.height}
            isDarkCanvas={false}
          />
        </div>
      );
    }
  }
}
