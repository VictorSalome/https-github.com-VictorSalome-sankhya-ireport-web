'use client';

import React from 'react';
import {
  JRXMLReport,
  JRXMLElement,
  JRXMLStaticText,
  JRXMLTextField,
  JRXMLLine,
  JRXMLRectangle,
  JRXMLImage,
  JRXMLBarcode,
  BarcodeType,
  JRXMLSubreport,
  JRXMLSubreportParameter,
  JRXMLChart,
  ChartType,
  JRXMLCrosstab,
  JRXMLStyle,
  BandType,
  TextHAlign,
  TextVAlign,
} from '../types/jrxml';
import {
  Trash2,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ArrowUp,
  Minus,
  ArrowDown,
  Sparkles,
  Eye,
  EyeOff,
  Check,
  Layers,
  Palette,
  Barcode,
  QrCode,
  FolderGit2,
  BarChart3,
  PieChart,
  LineChart,
  Table2,
  DollarSign,
  FileText,
} from 'lucide-react';
import { SANKHYA_PRESETS } from '../engine/presets';
import { AlignmentToolbar } from './AlignmentToolbar';
import { SANKHYA_BAND_INFO } from './VisualCanvas';

interface PropertiesPanelProps {
  report: JRXMLReport;
  activeBand: BandType;
  selectedElementId: string | null;
  onUpdateElement: (bandKey: BandType, elementId: string, updates: Partial<JRXMLElement>) => void;
  onDeleteElement: (bandKey: BandType, elementId: string) => void;
  onUpdateReport: (updates: Partial<JRXMLReport>) => void;
  onUpdateBandHeight: (bandKey: BandType, height: number) => void;
  onOpenSubreportTab?: (subreportName: string) => void;
  onSaveAsComponent?: () => void;
  onMoveElementToBand?: (sourceBandKey: string, targetBandKey: BandType, elementId: string, newY?: number) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  report,
  activeBand,
  selectedElementId,
  onUpdateElement,
  onDeleteElement,
  onUpdateReport,
  onUpdateBandHeight,
  onOpenSubreportTab,
  onSaveAsComponent,
  onMoveElementToBand,
}) => {
  // Find selected element
  let selectedElement: JRXMLElement | null = null;
  let elementBand: BandType = activeBand;

  if (selectedElementId) {
    for (const [key, band] of Object.entries(report.bands)) {
      if (band) {
        const found = band.elements.find((el) => el.id === selectedElementId);
        if (found) {
          selectedElement = found;
          elementBand = key as BandType;
          break;
        }
      }
    }
  }

  const currentBand = report.bands[activeBand];
  const activeBandInfo = SANKHYA_BAND_INFO[activeBand] || {
    label: currentBand?.title || activeBand,
    sublabel: '',
    description: 'Banda do relatório',
    color: 'bg-slate-700 text-slate-200',
  };

  return (
    <aside className="w-80 shrink-0 bg-slate-900/95 border-l border-slate-800 flex flex-col h-[calc(100vh-3.5rem)] text-xs z-20 select-none overflow-y-auto">
      {selectedElement ? (
        /* Element Selected Properties */
        <div className="p-4 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-sky-500/20 text-sky-400 font-semibold">
                {selectedElement.type}
              </span>
              <p className="text-[10px] text-slate-400 mt-1 font-mono truncate max-w-[150px]">
                ID: {selectedElement.id.slice(0, 8)}...
              </p>
            </div>
            <button
              onClick={() => onDeleteElement(elementBand, selectedElement!.id)}
              className="p-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 rounded-md transition flex items-center space-x-1"
              title="Excluir Elemento"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="text-[11px]">Excluir</span>
            </button>
          </div>

          {/* Banda do Elemento (Mover com 1 clique para outra banda / parte inferior) */}
          <div className="py-2.5 px-3 bg-slate-900/60 rounded-md border border-slate-800">
            <label className="text-[10px] text-slate-400 block mb-1 font-medium flex items-center justify-between">
              <span>Banda do Elemento</span>
              <span className="text-[9px] text-emerald-400 font-mono font-semibold">{elementBand}</span>
            </label>
            <select
              value={elementBand}
              onChange={(e) => {
                if (onMoveElementToBand) {
                  onMoveElementToBand(elementBand, e.target.value as BandType, selectedElement!.id);
                }
              }}
              className="w-full bg-slate-950 border border-slate-800 hover:border-emerald-500 rounded px-2 py-1 text-slate-100 text-[11px] focus:outline-none focus:border-emerald-500 transition cursor-pointer"
            >
              <option value="title">Title (Capa / Topo)</option>
              <option value="pageHeader">Page Header (Cabeçalho da Página)</option>
              <option value="columnHeader">Column Header (Títulos das Colunas)</option>
              <option value="detail">Detail (Linhas de Itens)</option>
              <option value="columnFooter">Column Footer (Rodapé da Tabela)</option>
              <option value="pageFooter">Page Footer (Rodapé da Página)</option>
              <option value="summary">Summary (Totais e Encerramento / Parte Inferior)</option>
            </select>
            <p className="text-[9px] text-slate-500 mt-1">
              Alterne para mover instantaneamente para outra seção do relatório.
            </p>
          </div>

          {/* Geometry (X, Y, W, H) */}
          <div>
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Geometria (Pixels)
            </h4>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">X (Posição)</label>
                <input
                  type="number"
                  value={selectedElement.reportElement.x}
                  onChange={(e) =>
                    onUpdateElement(elementBand, selectedElement!.id, {
                      reportElement: {
                        ...selectedElement!.reportElement,
                        x: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Y (Posição)</label>
                <input
                  type="number"
                  value={selectedElement.reportElement.y}
                  onChange={(e) =>
                    onUpdateElement(elementBand, selectedElement!.id, {
                      reportElement: {
                        ...selectedElement!.reportElement,
                        y: parseInt(e.target.value, 10) || 0,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Largura (W)</label>
                <input
                  type="number"
                  value={selectedElement.reportElement.width}
                  onChange={(e) =>
                    onUpdateElement(elementBand, selectedElement!.id, {
                      reportElement: {
                        ...selectedElement!.reportElement,
                        width: parseInt(e.target.value, 10) || 10,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-[11px]"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Altura (H)</label>
                <input
                  type="number"
                  value={selectedElement.reportElement.height}
                  onChange={(e) =>
                    onUpdateElement(elementBand, selectedElement!.id, {
                      reportElement: {
                        ...selectedElement!.reportElement,
                        height: parseInt(e.target.value, 10) || 5,
                      },
                    })
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-100 font-mono text-[11px]"
                />
              </div>
            </div>

            {/* Alinhamento Rápido (Estilo Figma/Canva) */}
            <div className="pt-2">
              <label className="text-[10px] text-slate-400 block mb-1.5 font-medium">
                Alinhamento e Distribuição Rápida
              </label>
              <AlignmentToolbar
                selectedElement={selectedElement}
                columnWidth={report.columnWidth}
                bandHeight={currentBand ? currentBand.height : 50}
                onUpdateElement={(updates) => onUpdateElement(elementBand, selectedElement!.id, updates)}
                onSaveAsComponent={onSaveAsComponent}
              />
            </div>
          </div>

          {/* Element Specific Content / Expression */}
          {selectedElement.type === 'staticText' && (
            <div>
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Conteúdo de Texto
              </h4>
              <textarea
                value={(selectedElement as JRXMLStaticText).text}
                onChange={(e) =>
                  onUpdateElement(elementBand, selectedElement!.id, {
                    text: e.target.value,
                  } as any)
                }
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-100 text-[11px] font-sans focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {selectedElement.type === 'textField' && (
            <div className="space-y-2">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Expressão Jasper / Sankhya
              </h4>
              <input
                type="text"
                value={(selectedElement as JRXMLTextField).expression}
                onChange={(e) =>
                  onUpdateElement(elementBand, selectedElement!.id, {
                    expression: e.target.value,
                  } as any)
                }
                placeholder="$F{CAMPO} ou $P{PARAM}"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-sky-300 font-mono text-[11px] focus:outline-none focus:border-sky-500"
              />

              {/* Quick Presets Picker */}
              <div className="flex items-center space-x-1">
                <Sparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                <select
                  onChange={(e) => {
                    if (e.target.value) {
                      onUpdateElement(elementBand, selectedElement!.id, {
                        expression: e.target.value,
                      } as any);
                    }
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-300 text-[10px]"
                >
                  <option value="">Inserir Preset Sankhya...</option>
                  {SANKHYA_PRESETS.map((p) => (
                    <option key={p.expression} value={p.expression}>
                      {p.label} ({p.expression})
                    </option>
                  ))}
                </select>
              </div>

              {/* Pattern Formatter */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Máscara de Formatação (Pattern)
                </label>
                <div className="flex space-x-1">
                  <input
                    type="text"
                    value={(selectedElement as JRXMLTextField).pattern || ''}
                    onChange={(e) =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        pattern: e.target.value,
                      } as any)
                    }
                    placeholder="#,##0.00 ou dd/MM/yyyy"
                    className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-[10px]"
                  />
                  <button
                    onClick={() =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        pattern: '¤ #,##0.00',
                      } as any)
                    }
                    className="px-1.5 py-1 bg-slate-800 text-[10px] rounded hover:bg-slate-700 text-slate-200"
                    title="Formatar como Moeda (R$)"
                  >
                    R$
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        pattern: 'dd/MM/yyyy',
                      } as any)
                    }
                    className="px-1.5 py-1 bg-slate-800 text-[10px] rounded hover:bg-slate-700 text-slate-200"
                    title="Formatar como Data"
                  >
                    Data
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Barcode Element Properties */}
          {selectedElement.type === 'barcode' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Barcode className="w-3.5 h-3.5" />
                <span>Configuração de Código de Barras</span>
              </h4>

              {/* Barcode Type */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Padrão do Código
                </label>
                <select
                  value={(selectedElement as JRXMLBarcode).barcodeType}
                  onChange={(e) =>
                    onUpdateElement(elementBand, selectedElement!.id, {
                      barcodeType: e.target.value as BarcodeType,
                    } as any)
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-cyan-300 font-mono text-[11px]"
                >
                  <option value="Code128">Code 128 (Chave NF-e, Romaneio, Pedido)</option>
                  <option value="EAN13">EAN-13 (Código de Barras Produto / GTIN)</option>
                  <option value="Interleaved2Of5">Interleaved 2 of 5 (Boleto Bancário / FEBRABAN)</option>
                  <option value="Code39">Code 39 (Alfanumérico)</option>
                  <option value="DataMatrix">DataMatrix (Rastreabilidade 2D)</option>
                  <option value="QRCode">QR Code (PIX / NFC-e)</option>
                </select>
              </div>

              {/* Expression */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Expressão do Código ($F&#123;...&#125; ou fixo)
                </label>
                <input
                  type="text"
                  value={(selectedElement as JRXMLBarcode).expression}
                  onChange={(e) =>
                    onUpdateElement(elementBand, selectedElement!.id, {
                      expression: e.target.value,
                    } as any)
                  }
                  placeholder="$F{CHAVENFE} ou $F{CODBARRA}"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-cyan-500"
                />

                {/* Quick Presets for Barcode */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <button
                    onClick={() =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        expression: '$F{CHAVENFE}',
                        barcodeType: 'Code128',
                      } as any)
                    }
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Chave NF-e
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        expression: '$F{CODBARRA}',
                        barcodeType: 'EAN13',
                      } as any)
                    }
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    EAN-13 Produto
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        expression: '$F{LINHADIG}',
                        barcodeType: 'Interleaved2Of5',
                      } as any)
                    }
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Boleto I25
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        expression: '$F{CHAVENFE}',
                        barcodeType: 'QRCode',
                      } as any)
                    }
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    QR Code PIX
                  </button>
                </div>
              </div>

              {/* Text Position */}
              {(selectedElement as JRXMLBarcode).barcodeType !== 'QRCode' &&
                (selectedElement as JRXMLBarcode).barcodeType !== 'DataMatrix' && (
                  <div>
                    <label className="text-[10px] text-slate-400 block mb-1">
                      Posição do Número / Texto
                    </label>
                    <select
                      value={(selectedElement as JRXMLBarcode).textPosition || 'bottom'}
                      onChange={(e) =>
                        onUpdateElement(elementBand, selectedElement!.id, {
                          textPosition: e.target.value as any,
                        } as any)
                      }
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-300 text-[10px]"
                    >
                      <option value="bottom">Abaixo das Barras (bottom)</option>
                      <option value="top">Acima das Barras (top)</option>
                      <option value="none">Ocultar Texto (none)</option>
                    </select>
                  </div>
                )}
            </div>
          )}

          {/* Subreport Element Properties */}
          {selectedElement.type === 'subreport' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider flex items-center space-x-1.5">
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Configuração de Sub-relatório</span>
              </h4>

              {/* Subreport Expression / File */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Expressão do Arquivo (.jasper / .jrxml)
                </label>
                <input
                  type="text"
                  value={(selectedElement as JRXMLSubreport).subreportExpression}
                  onChange={(e) =>
                    onUpdateElement(elementBand, selectedElement!.id, {
                      subreportExpression: e.target.value,
                    } as any)
                  }
                  placeholder='$P{PDIR_MODELO} + "sub_itens.jasper"'
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-indigo-300 font-mono text-[11px] focus:outline-none focus:border-indigo-500"
                />

                {/* Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  <button
                    onClick={() =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        subreportExpression: '$P{PDIR_MODELO} + "sub_itens.jasper"',
                      } as any)
                    }
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Itens da Nota
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        subreportExpression: '$P{PDIR_MODELO} + "sub_duplicatas.jasper"',
                      } as any)
                    }
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Duplicatas / Fin
                  </button>
                  <button
                    onClick={() =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        subreportExpression: '$P{PDIR_MODELO} + "sub_impostos.jasper"',
                      } as any)
                    }
                    className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                  >
                    Impostos
                  </button>
                </div>
              </div>

              {/* Connection Expression */}
              <div className="pt-1">
                <label className="text-[10px] text-slate-400 block mb-1">
                  Conexão com Banco de Dados
                </label>
                <input
                  type="text"
                  value={(selectedElement as JRXMLSubreport).connectionExpression || ''}
                  onChange={(e) =>
                    onUpdateElement(elementBand, selectedElement!.id, {
                      connectionExpression: e.target.value || undefined,
                    } as any)
                  }
                  placeholder="$P{REPORT_CONNECTION}"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-[10px]"
                />
              </div>

              {/* Parameters Passed to Subreport */}
              <div className="pt-1 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-semibold text-slate-300">
                    Parâmetros Enviados ao Sub-relatório:
                  </label>
                  <button
                    onClick={() => {
                      const cur = (selectedElement as JRXMLSubreport).parameters || [];
                      onUpdateElement(elementBand, selectedElement!.id, {
                        parameters: [...cur, { name: 'PK_NUNOTA', expression: '$F{NUNOTA}' }],
                      } as any);
                    }}
                    className="text-[9px] text-indigo-400 hover:text-indigo-300 bg-indigo-950/50 px-1.5 py-0.5 rounded border border-indigo-800/40"
                  >
                    + Parâmetro
                  </button>
                </div>

                {((selectedElement as JRXMLSubreport).parameters || []).map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800"
                  >
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => {
                        const next = [
                          ...((selectedElement as JRXMLSubreport).parameters || []),
                        ];
                        next[idx].name = e.target.value;
                        onUpdateElement(elementBand, selectedElement!.id, {
                          parameters: next,
                        } as any);
                      }}
                      placeholder="Nome"
                      className="w-24 bg-transparent border-0 text-indigo-300 font-mono text-[10px] focus:outline-none"
                    />
                    <span className="text-slate-600">=</span>
                    <input
                      type="text"
                      value={p.expression}
                      onChange={(e) => {
                        const next = [
                          ...((selectedElement as JRXMLSubreport).parameters || []),
                        ];
                        next[idx].expression = e.target.value;
                        onUpdateElement(elementBand, selectedElement!.id, {
                          parameters: next,
                        } as any);
                      }}
                      placeholder="$F{CAMPO}"
                      className="flex-1 bg-transparent border-0 text-slate-200 font-mono text-[10px] focus:outline-none"
                    />
                    <button
                      onClick={() => {
                        const next = (
                          (selectedElement as JRXMLSubreport).parameters || []
                        ).filter((_, i) => i !== idx);
                        onUpdateElement(elementBand, selectedElement!.id, {
                          parameters: next,
                        } as any);
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Cache option */}
              <div className="flex items-center space-x-2 pt-1">
                <input
                  type="checkbox"
                  id="subreportCache"
                  checked={(selectedElement as JRXMLSubreport).isUsingCache ?? true}
                  onChange={(e) =>
                    onUpdateElement(elementBand, selectedElement!.id, {
                      isUsingCache: e.target.checked,
                    } as any)
                  }
                  className="rounded bg-slate-950 border-slate-800 text-indigo-600 focus:ring-0"
                />
                <label htmlFor="subreportCache" className="text-[10px] text-slate-300">
                  Manter em Cache no Servidor (isUsingCache)
                </label>
              </div>

              {/* Button to Open Subreport Tab */}
              {onOpenSubreportTab && (
                <button
                  onClick={() => {
                    const expr = (selectedElement as JRXMLSubreport).subreportExpression;
                    const fileNameMatch = expr.match(/["']([^"']+)["']/);
                    const rawName = fileNameMatch ? fileNameMatch[1] : 'sub_itens';
                    const cleanName = rawName.replace(/\.(jasper|jrxml)$/i, '');
                    onOpenSubreportTab(cleanName);
                  }}
                  className="w-full mt-2 py-2 px-3 rounded bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-[11px] transition flex items-center justify-center space-x-1.5 shadow"
                >
                  <FolderGit2 className="w-3.5 h-3.5" />
                  <span>Abrir Sub-relatório para Edição</span>
                </button>
              )}
            </div>
          )}

          {/* Chart Element Properties */}
          {selectedElement.type === 'chart' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider flex items-center space-x-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Configuração do Gráfico JFreeChart</span>
              </h4>

              {/* Chart Type Selector */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Tipo de Gráfico</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      { type: 'barChart', label: 'Barras', icon: <BarChart3 className="w-3.5 h-3.5" /> },
                      { type: 'pieChart', label: 'Pizza', icon: <PieChart className="w-3.5 h-3.5" /> },
                      { type: 'lineChart', label: 'Linhas', icon: <LineChart className="w-3.5 h-3.5" /> },
                    ] as const
                  ).map((ct) => {
                    const isSelected =
                      ((selectedElement as JRXMLChart).chartType || 'barChart') === ct.type;
                    return (
                      <button
                        key={ct.type}
                        onClick={() =>
                          onUpdateElement(elementBand, selectedElement!.id, {
                            chartType: ct.type,
                          } as any)
                        }
                        className={`flex items-center justify-center space-x-1 py-1.5 px-2 rounded text-[11px] font-medium border transition ${
                          isSelected
                            ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {ct.icon}
                        <span>{ct.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chart Title */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Título do Gráfico</label>
                <input
                  type="text"
                  value={(selectedElement as JRXMLChart).title || ''}
                  onChange={(e) =>
                    onUpdateElement(elementBand, selectedElement!.id, {
                      title: e.target.value,
                    } as any)
                  }
                  placeholder="Ex: Faturamento por Filial"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Category / Key Expression (X Axis or Pie Slice) */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  {(selectedElement as JRXMLChart).chartType === 'pieChart'
                    ? 'Fatia / Chave (Key Expression)'
                    : 'Categoria / Eixo X (Category Expression)'}
                </label>
                <input
                  type="text"
                  value={
                    (selectedElement as JRXMLChart).chartType === 'pieChart'
                      ? (selectedElement as JRXMLChart).keyExpression || '$F{APELIDO}'
                      : (selectedElement as JRXMLChart).categoryExpression || '$F{MES}'
                  }
                  onChange={(e) => {
                    const isPie = (selectedElement as JRXMLChart).chartType === 'pieChart';
                    onUpdateElement(elementBand, selectedElement!.id, {
                      ...(isPie
                        ? { keyExpression: e.target.value }
                        : { categoryExpression: e.target.value }),
                    } as any);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-emerald-300 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                />
                {/* Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    { label: 'Vendedor', expr: '$F{APELIDO}' },
                    { label: 'Mês', expr: '$F{MES}' },
                    { label: 'Cliente', expr: '$F{NOMEPARC}' },
                    { label: 'Produto', expr: '$F{DESCRPROD}' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        const isPie = (selectedElement as JRXMLChart).chartType === 'pieChart';
                        onUpdateElement(elementBand, selectedElement!.id, {
                          ...(isPie ? { keyExpression: p.expr } : { categoryExpression: p.expr }),
                        } as any);
                      }}
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Value Expression (Y Axis or Slice Size) */}
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">
                  Valor / Métrica Y (Value Expression)
                </label>
                <input
                  type="text"
                  value={(selectedElement as JRXMLChart).valueExpression || '$F{VLRTOT}'}
                  onChange={(e) =>
                    onUpdateElement(elementBand, selectedElement!.id, {
                      valueExpression: e.target.value,
                    } as any)
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-emerald-300 font-mono text-[11px] focus:outline-none focus:border-emerald-500"
                />
                {/* Presets */}
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    { label: 'Valor Total', expr: '$F{VLRTOT}' },
                    { label: 'Quantidade', expr: '$F{QTDNEG}' },
                    { label: 'Preço Unit.', expr: '$F{VLRUNIT}' },
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() =>
                        onUpdateElement(elementBand, selectedElement!.id, {
                          valueExpression: p.expr,
                        } as any)
                      }
                      className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 hover:bg-slate-700"
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Series Name (for Bar/Line charts) */}
              {(selectedElement as JRXMLChart).chartType !== 'pieChart' && (
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">
                    Nome da Série (Legenda)
                  </label>
                  <input
                    type="text"
                    value={(selectedElement as JRXMLChart).seriesExpression || '"Vendas"'}
                    onChange={(e) =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        seriesExpression: e.target.value,
                      } as any)
                    }
                    placeholder='"Vendas"'
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              )}

              {/* Toggles */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chartLegend"
                    checked={(selectedElement as JRXMLChart).isShowLegend ?? true}
                    onChange={(e) =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        isShowLegend: e.target.checked,
                      } as any)
                    }
                    className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0"
                  />
                  <label htmlFor="chartLegend" className="text-[10px] text-slate-300">
                    Exibir Legenda
                  </label>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="chartLabels"
                    checked={(selectedElement as JRXMLChart).isShowLabels ?? true}
                    onChange={(e) =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        isShowLabels: e.target.checked,
                      } as any)
                    }
                    className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0"
                  />
                  <label htmlFor="chartLabels" className="text-[10px] text-slate-300">
                    Exibir Rótulos nos Dados (Valores/Percentuais)
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Crosstab Element Properties */}
          {selectedElement.type === 'crosstab' && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-semibold text-purple-400 uppercase tracking-wider flex items-center space-x-1.5">
                <Table2 className="w-3.5 h-3.5" />
                <span>Configuração de Matriz Cruzada (Crosstab)</span>
              </h4>

              {/* Row Group (Y Axis) */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-300 block">
                  1. Grupo de Linhas (Eixo Y)
                </span>
                <div>
                  <label className="text-[9px] text-slate-400 block mb-0.5">Nome do Grupo</label>
                  <input
                    type="text"
                    value={(selectedElement as JRXMLCrosstab).rowGroup.name}
                    onChange={(e) => {
                      const ct = selectedElement as JRXMLCrosstab;
                      onUpdateElement(elementBand, selectedElement!.id, {
                        rowGroup: { ...ct.rowGroup, name: e.target.value },
                      } as any);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 block mb-0.5">Campo da Linha (Bucket Expression)</label>
                  <input
                    type="text"
                    value={(selectedElement as JRXMLCrosstab).rowGroup.bucketExpression}
                    onChange={(e) => {
                      const ct = selectedElement as JRXMLCrosstab;
                      onUpdateElement(elementBand, selectedElement!.id, {
                        rowGroup: { ...ct.rowGroup, bucketExpression: e.target.value },
                      } as any);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-purple-300 font-mono text-[11px]"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="rowTotalCheck"
                    checked={(selectedElement as JRXMLCrosstab).rowGroup.totalPosition !== 'None'}
                    onChange={(e) => {
                      const ct = selectedElement as JRXMLCrosstab;
                      onUpdateElement(elementBand, selectedElement!.id, {
                        rowGroup: { ...ct.rowGroup, totalPosition: e.target.checked ? 'End' : 'None' },
                      } as any);
                    }}
                    className="rounded bg-slate-900 border-slate-800 text-purple-600 focus:ring-0"
                  />
                  <label htmlFor="rowTotalCheck" className="text-[9.5px] text-slate-300">
                    Exibir Linha de Subtotal Geral
                  </label>
                </div>
              </div>

              {/* Column Group (X Axis) */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-300 block">
                  2. Grupo de Colunas (Eixo X)
                </span>
                <div>
                  <label className="text-[9px] text-slate-400 block mb-0.5">Nome da Coluna</label>
                  <input
                    type="text"
                    value={(selectedElement as JRXMLCrosstab).columnGroup.name}
                    onChange={(e) => {
                      const ct = selectedElement as JRXMLCrosstab;
                      onUpdateElement(elementBand, selectedElement!.id, {
                        columnGroup: { ...ct.columnGroup, name: e.target.value },
                      } as any);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 block mb-0.5">Campo da Coluna (Bucket Expression)</label>
                  <input
                    type="text"
                    value={(selectedElement as JRXMLCrosstab).columnGroup.bucketExpression}
                    onChange={(e) => {
                      const ct = selectedElement as JRXMLCrosstab;
                      onUpdateElement(elementBand, selectedElement!.id, {
                        columnGroup: { ...ct.columnGroup, bucketExpression: e.target.value },
                      } as any);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-purple-300 font-mono text-[11px]"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-1">
                  <input
                    type="checkbox"
                    id="colTotalCheck"
                    checked={(selectedElement as JRXMLCrosstab).columnGroup.totalPosition !== 'None'}
                    onChange={(e) => {
                      const ct = selectedElement as JRXMLCrosstab;
                      onUpdateElement(elementBand, selectedElement!.id, {
                        columnGroup: { ...ct.columnGroup, totalPosition: e.target.checked ? 'End' : 'None' },
                      } as any);
                    }}
                    className="rounded bg-slate-900 border-slate-800 text-purple-600 focus:ring-0"
                  />
                  <label htmlFor="colTotalCheck" className="text-[9.5px] text-slate-300">
                    Exibir Coluna de Total
                  </label>
                </div>
              </div>

              {/* Measure / Metric */}
              <div className="p-2 rounded bg-slate-950 border border-slate-800 space-y-2">
                <span className="text-[10px] font-bold text-slate-300 block">
                  3. Medida / Métrica Central
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] text-slate-400 block mb-0.5">Função de Cálculo</label>
                    <select
                      value={(selectedElement as JRXMLCrosstab).measure.calculation}
                      onChange={(e) => {
                        const ct = selectedElement as JRXMLCrosstab;
                        onUpdateElement(elementBand, selectedElement!.id, {
                          measure: { ...ct.measure, calculation: e.target.value as any },
                        } as any);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                    >
                      <option value="Sum">Soma (Sum)</option>
                      <option value="Count">Contagem (Count)</option>
                      <option value="Average">Média (Average)</option>
                      <option value="Highest">Maior (Highest)</option>
                      <option value="Lowest">Menor (Lowest)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] text-slate-400 block mb-0.5">Formato Numérico</label>
                    <select
                      value={(selectedElement as JRXMLCrosstab).measure.pattern || '#,##0.00'}
                      onChange={(e) => {
                        const ct = selectedElement as JRXMLCrosstab;
                        onUpdateElement(elementBand, selectedElement!.id, {
                          measure: { ...ct.measure, pattern: e.target.value },
                        } as any);
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs"
                    >
                      <option value="#,##0.00">Moeda / Decimal (#,##0.00)</option>
                      <option value="#,##0">Inteiro (#,##0)</option>
                      <option value="#,##0.00%">Percentual (#,##0.00%)</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 block mb-0.5">Campo Somado (Measure Expression)</label>
                  <input
                    type="text"
                    value={(selectedElement as JRXMLCrosstab).measure.expression}
                    onChange={(e) => {
                      const ct = selectedElement as JRXMLCrosstab;
                      onUpdateElement(elementBand, selectedElement!.id, {
                        measure: { ...ct.measure, expression: e.target.value },
                      } as any);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-emerald-300 font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Typography (for text elements) */}
          {(selectedElement.type === 'staticText' || selectedElement.type === 'textField') && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Tipografia
              </h4>

              {/* Font Family & Size */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Fonte</label>
                  <select
                    value={
                      (selectedElement as any).textElement?.font?.fontName || 'Arial'
                    }
                    onChange={(e) => {
                      const te = (selectedElement as any).textElement || {};
                      const font = te.font || {};
                      onUpdateElement(elementBand, selectedElement!.id, {
                        textElement: { ...te, font: { ...font, fontName: e.target.value } },
                      } as any);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-slate-200 text-[10px]"
                  >
                    <option value="Arial">Arial</option>
                    <option value="SansSerif">SansSerif</option>
                    <option value="Times New Roman">Times New Roman</option>
                    <option value="Courier New">Courier New</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] text-slate-400 block mb-1">Tamanho (pt)</label>
                  <input
                    type="number"
                    value={
                      (selectedElement as any).textElement?.font?.size || 10
                    }
                    onChange={(e) => {
                      const te = (selectedElement as any).textElement || {};
                      const font = te.font || {};
                      onUpdateElement(elementBand, selectedElement!.id, {
                        textElement: {
                          ...te,
                          font: { ...font, size: parseInt(e.target.value, 10) || 10 },
                        },
                      } as any);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-[10px]"
                  />
                </div>
              </div>

              {/* Styles: Bold, Italic, Underline */}
              <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded border border-slate-800">
                <button
                  onClick={() => {
                    const te = (selectedElement as any).textElement || {};
                    const font = te.font || {};
                    onUpdateElement(elementBand, selectedElement!.id, {
                      textElement: { ...te, font: { ...font, isBold: !font.isBold } },
                    } as any);
                  }}
                  className={`p-1.5 rounded transition ${
                    (selectedElement as any).textElement?.font?.isBold
                      ? 'bg-slate-800 text-emerald-400 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Negrito (isBold)"
                >
                  <Bold className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    const te = (selectedElement as any).textElement || {};
                    const font = te.font || {};
                    onUpdateElement(elementBand, selectedElement!.id, {
                      textElement: { ...te, font: { ...font, isItalic: !font.isItalic } },
                    } as any);
                  }}
                  className={`p-1.5 rounded transition ${
                    (selectedElement as any).textElement?.font?.isItalic
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Itálico (isItalic)"
                >
                  <Italic className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => {
                    const te = (selectedElement as any).textElement || {};
                    const font = te.font || {};
                    onUpdateElement(elementBand, selectedElement!.id, {
                      textElement: { ...te, font: { ...font, isUnderline: !font.isUnderline } },
                    } as any);
                  }}
                  className={`p-1.5 rounded transition ${
                    (selectedElement as any).textElement?.font?.isUnderline
                      ? 'bg-slate-800 text-emerald-400'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sublinhado (isUnderline)"
                >
                  <Underline className="w-3.5 h-3.5" />
                </button>

                <div className="h-4 w-px bg-slate-800 mx-1" />

                {/* HAlign */}
                {(['Left', 'Center', 'Right', 'Justified'] as TextHAlign[]).map((align) => (
                  <button
                    key={align}
                    onClick={() => {
                      const te = (selectedElement as any).textElement || {};
                      onUpdateElement(elementBand, selectedElement!.id, {
                        textElement: { ...te, textAlignment: align },
                      } as any);
                    }}
                    className={`p-1.5 rounded transition ${
                      (selectedElement as any).textElement?.textAlignment === align
                        ? 'bg-slate-800 text-emerald-400'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                    title={`Alinhamento Horizontal: ${align}`}
                  >
                    {align === 'Left' && <AlignLeft className="w-3.5 h-3.5" />}
                    {align === 'Center' && <AlignCenter className="w-3.5 h-3.5" />}
                    {align === 'Right' && <AlignRight className="w-3.5 h-3.5" />}
                    {align === 'Justified' && <AlignJustify className="w-3.5 h-3.5" />}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors & Appearance */}
          <div className="space-y-3 pt-2 border-t border-slate-800">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Cores e Aparência
            </h4>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Cor do Texto / Linha</label>
                <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded p-1">
                  <input
                    type="color"
                    value={selectedElement.reportElement.forecolor || '#000000'}
                    onChange={(e) =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        reportElement: {
                          ...selectedElement!.reportElement,
                          forecolor: e.target.value,
                        },
                      })
                    }
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                  />
                  <span className="font-mono text-[10px] text-slate-300">
                    {selectedElement.reportElement.forecolor || '#000000'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Cor de Fundo</label>
                <div className="flex items-center space-x-1.5 bg-slate-950 border border-slate-800 rounded p-1">
                  <input
                    type="color"
                    value={selectedElement.reportElement.backcolor || '#ffffff'}
                    onChange={(e) =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        reportElement: {
                          ...selectedElement!.reportElement,
                          backcolor: e.target.value,
                          mode: 'Opaque',
                        },
                      })
                    }
                    className="w-5 h-5 rounded cursor-pointer bg-transparent border-0"
                  />
                  <button
                    onClick={() =>
                      onUpdateElement(elementBand, selectedElement!.id, {
                        reportElement: {
                          ...selectedElement!.reportElement,
                          mode:
                            selectedElement!.reportElement.mode === 'Opaque'
                              ? 'Transparent'
                              : 'Opaque',
                        },
                      })
                    }
                    className="text-[9px] px-1 py-0.5 rounded bg-slate-800 text-slate-300"
                  >
                    {selectedElement.reportElement.mode === 'Opaque' ? 'Opaco' : 'Transp'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Estilo Visual (JRXML Style) */}
          <div className="space-y-2 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider flex items-center space-x-1.5">
                <Palette className="w-3.5 h-3.5 text-sky-400" />
                <span>Estilo Visual (JRXML)</span>
              </h4>
              {selectedElement.reportElement.style && (
                <span className="text-[9px] bg-sky-500/20 text-sky-300 font-mono px-1.5 py-0.5 rounded border border-sky-500/30">
                  {selectedElement.reportElement.style}
                </span>
              )}
            </div>

            <select
              value={selectedElement.reportElement.style || ''}
              onChange={(e) =>
                onUpdateElement(elementBand, selectedElement!.id, {
                  reportElement: {
                    ...selectedElement!.reportElement,
                    style: e.target.value || undefined,
                  },
                })
              }
              className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-slate-200 text-xs font-mono"
            >
              <option value="">Nenhum (Padrão)</option>
              {report.styles?.map((s) => (
                <option key={s.name} value={s.name}>
                  {s.name} {s.conditionalStyles?.length ? '(Condicional / Zebrado)' : ''}
                </option>
              ))}
              {!report.styles?.some((s) => s.name === 'Zebra') && (
                <option value="Zebra">Zebra (Linhas Alternadas)</option>
              )}
            </select>
          </div>

          {/* Visibilidade Condicional (printWhenExpression) */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <Eye
                  className={`w-3.5 h-3.5 ${
                    selectedElement.reportElement.printWhenExpression
                      ? 'text-amber-400'
                      : 'text-slate-400'
                  }`}
                />
                <h4 className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
                  Condição de Exibição
                </h4>
              </div>
              {selectedElement.reportElement.printWhenExpression ? (
                <span className="text-[9px] bg-amber-500/20 text-amber-300 font-mono px-1.5 py-0.5 rounded border border-amber-500/30">
                  Regra Ativa
                </span>
              ) : (
                <span className="text-[9px] text-slate-500 font-mono">Sempre visível</span>
              )}
            </div>

            <p className="text-[10px] text-slate-400 leading-relaxed">
              Defina regras simples para ocultar ou exibir este elemento na impressão:
            </p>

            {/* Quick 1-Click Rule Buttons */}
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() =>
                  onUpdateElement(elementBand, selectedElement!.id, {
                    reportElement: {
                      ...selectedElement!.reportElement,
                      printWhenExpression: undefined,
                    },
                  })
                }
                className={`text-left px-2.5 py-1.5 rounded text-[11px] transition flex items-center justify-between ${
                  !selectedElement.reportElement.printWhenExpression
                    ? 'bg-slate-800 text-emerald-400 font-medium border border-emerald-500/40'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800/60 border border-slate-800'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Sempre visível (Padrão)</span>
                </span>
                {!selectedElement.reportElement.printWhenExpression && (
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                )}
              </button>

              <button
                onClick={() => {
                  const exp =
                    (selectedElement as any).expression ||
                    (report.fields[0] ? `$F{${report.fields[0].name}}` : '$F{CAMPO}');
                  const rule = `new Boolean(${exp} != null && !${exp}.toString().trim().isEmpty())`;
                  onUpdateElement(elementBand, selectedElement!.id, {
                    reportElement: {
                      ...selectedElement!.reportElement,
                      printWhenExpression: rule,
                    },
                  });
                }}
                className={`text-left px-2.5 py-1.5 rounded text-[11px] transition flex items-center justify-between ${
                  selectedElement.reportElement.printWhenExpression?.includes('!isEmpty') ||
                  (selectedElement.reportElement.printWhenExpression?.includes('!= null') &&
                    !selectedElement.reportElement.printWhenExpression?.includes('> 0'))
                    ? 'bg-amber-950/40 text-amber-300 font-medium border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800/60 border border-slate-800'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <EyeOff className="w-3.5 h-3.5 text-amber-400" />
                  <span>Ocultar se estiver em branco / nulo</span>
                </span>
                {selectedElement.reportElement.printWhenExpression?.includes('!isEmpty') && (
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>

              <button
                onClick={() => {
                  const exp =
                    (selectedElement as any).expression ||
                    (report.fields[0] ? `$F{${report.fields[0].name}}` : '$F{VLRNOTA}');
                  const rule = `new Boolean(${exp} != null && (${exp} instanceof Number ? ((Number)${exp}).doubleValue() > 0 : Double.parseDouble(${exp}.toString()) > 0))`;
                  onUpdateElement(elementBand, selectedElement!.id, {
                    reportElement: {
                      ...selectedElement!.reportElement,
                      printWhenExpression: rule,
                    },
                  });
                }}
                className={`text-left px-2.5 py-1.5 rounded text-[11px] transition flex items-center justify-between ${
                  selectedElement.reportElement.printWhenExpression?.includes('> 0')
                    ? 'bg-amber-950/40 text-amber-300 font-medium border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800/60 border border-slate-800'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Exibir apenas se valor maior que zero (&gt; 0)</span>
                </span>
                {selectedElement.reportElement.printWhenExpression?.includes('> 0') && (
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>

              <button
                onClick={() => {
                  const rule = 'new Boolean($V{PAGE_NUMBER} == 1)';
                  onUpdateElement(elementBand, selectedElement!.id, {
                    reportElement: {
                      ...selectedElement!.reportElement,
                      printWhenExpression: rule,
                    },
                  });
                }}
                className={`text-left px-2.5 py-1.5 rounded text-[11px] transition flex items-center justify-between ${
                  selectedElement.reportElement.printWhenExpression ===
                  'new Boolean($V{PAGE_NUMBER} == 1)'
                    ? 'bg-amber-950/40 text-amber-300 font-medium border border-amber-500/40'
                    : 'bg-slate-950 text-slate-400 hover:bg-slate-800/60 border border-slate-800'
                }`}
              >
                <span className="flex items-center space-x-1.5">
                  <FileText className="w-3.5 h-3.5 text-sky-400" />
                  <span>Exibir apenas na 1ª página</span>
                </span>
                {selectedElement.reportElement.printWhenExpression ===
                  'new Boolean($V{PAGE_NUMBER} == 1)' && (
                  <Check className="w-3.5 h-3.5 text-amber-400" />
                )}
              </button>
            </div>

            {/* Advanced Java/Groovy formula editor */}
            <div className="pt-1">
              <label className="text-[10px] text-slate-400 block mb-1">
                Fórmula Personalizada (Java/Groovy printWhenExpression):
              </label>
              <textarea
                rows={2}
                value={selectedElement.reportElement.printWhenExpression || ''}
                onChange={(e) =>
                  onUpdateElement(elementBand, selectedElement!.id, {
                    reportElement: {
                      ...selectedElement!.reportElement,
                      printWhenExpression: e.target.value || undefined,
                    },
                  })
                }
                placeholder="Ex: new Boolean($F{VLRNOTA} > 100)"
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-amber-300 font-mono text-[10px] resize-none focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        </div>
      ) : (
        /* Global Report & Band Properties */
        <div className="p-4 space-y-4">
          <div className="pb-3 border-b border-slate-800">
            <h3 className="text-sm font-semibold text-slate-200">Propriedades Gerais</h3>
            <p className="text-[11px] text-slate-400">Configurações da Página e Banda Ativa</p>
          </div>

          {/* Active Band Height and Description */}
          {currentBand && (
            <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-emerald-400 block">
                    {activeBandInfo.label}
                  </span>
                  {activeBandInfo.sublabel && (
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {activeBandInfo.sublabel}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 shrink-0">
                  {currentBand.elements.length} item(ns)
                </span>
              </div>

              <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-900/60 p-2 rounded border border-slate-800/80">
                {activeBandInfo.description}
              </p>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Altura da Banda (px)</label>
                <input
                  type="number"
                  value={currentBand.height}
                  onChange={(e) =>
                    onUpdateBandHeight(activeBand, parseInt(e.target.value, 10) || 10)
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                />
              </div>

              {/* Zebra Striping 1-Click Toggle for Detail */}
              {activeBand === 'detail' && (
                <div className="pt-2 border-t border-slate-800 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-300 flex items-center space-x-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Listras Zebradas (Alternadas)</span>
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono">Linha Sim / Não</span>
                  </div>
                  <button
                    onClick={() => {
                      const isZebraActive =
                        report.styles?.some((s) => s.name === 'Zebra') ||
                        report.bands.detail.elements.some((el) => el.reportElement.style === 'Zebra');

                      if (isZebraActive) {
                        const newStyles = (report.styles || []).filter((s) => s.name !== 'Zebra');
                        const newDetailElements = report.bands.detail.elements.map((el) => ({
                          ...el,
                          reportElement: {
                            ...el.reportElement,
                            style:
                              el.reportElement.style === 'Zebra'
                                ? undefined
                                : el.reportElement.style,
                          },
                        }));
                        onUpdateReport({
                          styles: newStyles,
                          bands: {
                            ...report.bands,
                            detail: {
                              ...report.bands.detail,
                              elements: newDetailElements,
                            },
                          },
                        });
                      } else {
                        const zebraStyle: JRXMLStyle = {
                          name: 'Zebra',
                          mode: 'Opaque',
                          conditionalStyles: [
                            {
                              conditionExpression:
                                'new Boolean($V{REPORT_COUNT}.intValue() % 2 == 0)',
                              mode: 'Opaque',
                              backcolor: '#F8FAFC',
                            },
                          ],
                        };
                        const newStyles = [
                          ...(report.styles || []).filter((s) => s.name !== 'Zebra'),
                          zebraStyle,
                        ];
                        const newDetailElements = report.bands.detail.elements.map((el) => ({
                          ...el,
                          reportElement: {
                            ...el.reportElement,
                            style: el.reportElement.style || 'Zebra',
                          },
                        }));
                        onUpdateReport({
                          styles: newStyles,
                          bands: {
                            ...report.bands,
                            detail: {
                              ...report.bands.detail,
                              elements: newDetailElements,
                            },
                          },
                        });
                      }
                    }}
                    className={`w-full py-2 px-3 rounded text-[11px] font-medium transition flex items-center justify-center space-x-2 ${
                      report.styles?.some((s) => s.name === 'Zebra')
                        ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
                        : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                    }`}
                  >
                    <span className="flex items-center space-x-1.5">
                      {report.styles?.some((s) => s.name === 'Zebra') ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Zebrado Ativo no Detail</span>
                        </>
                      ) : (
                        <span>Ativar Zebrado no Detail</span>
                      )}
                    </span>
                  </button>
                  <p className="text-[10px] text-slate-500">
                    Aplica fundo suave alternado nas linhas pares do relatório.
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Page Layout Settings */}
          <div className="space-y-3">
            <h4 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Página e Margens
            </h4>

            <div>
              <label className="text-[10px] text-slate-400 block mb-1">Nome do Relatório</label>
              <input
                type="text"
                value={report.name}
                onChange={(e) => onUpdateReport({ name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 text-xs font-mono"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Largura Página</label>
                <input
                  type="number"
                  value={report.pageWidth}
                  onChange={(e) => {
                    const w = parseInt(e.target.value, 10) || 595;
                    onUpdateReport({
                      pageWidth: w,
                      columnWidth: w - report.leftMargin - report.rightMargin,
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Altura Página</label>
                <input
                  type="number"
                  value={report.pageHeight}
                  onChange={(e) => onUpdateReport({ pageHeight: parseInt(e.target.value, 10) || 842 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                />
              </div>
            </div>

            {/* Presets Button: A4 Portrait vs Landscape */}
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  onUpdateReport({
                    pageWidth: 595,
                    pageHeight: 842,
                    orientation: 'Portrait',
                    columnWidth: 595 - report.leftMargin - report.rightMargin,
                  })
                }
                className={`flex-1 py-1 rounded text-[10px] transition ${
                  report.orientation === 'Portrait'
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                A4 Retrato
              </button>

              <button
                onClick={() =>
                  onUpdateReport({
                    pageWidth: 842,
                    pageHeight: 595,
                    orientation: 'Landscape',
                    columnWidth: 842 - report.leftMargin - report.rightMargin,
                  })
                }
                className={`flex-1 py-1 rounded text-[10px] transition ${
                  report.orientation === 'Landscape'
                    ? 'bg-emerald-600 text-white font-medium'
                    : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                A4 Paisagem
              </button>
            </div>

            {/* Margins */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Margem Superior</label>
                <input
                  type="number"
                  value={report.topMargin}
                  onChange={(e) => onUpdateReport({ topMargin: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Margem Inferior</label>
                <input
                  type="number"
                  value={report.bottomMargin}
                  onChange={(e) => onUpdateReport({ bottomMargin: parseInt(e.target.value, 10) || 0 })}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Margem Esquerda</label>
                <input
                  type="number"
                  value={report.leftMargin}
                  onChange={(e) => {
                    const lm = parseInt(e.target.value, 10) || 0;
                    onUpdateReport({
                      leftMargin: lm,
                      columnWidth: report.pageWidth - lm - report.rightMargin,
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                />
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Margem Direita</label>
                <input
                  type="number"
                  value={report.rightMargin}
                  onChange={(e) => {
                    const rm = parseInt(e.target.value, 10) || 0;
                    onUpdateReport({
                      rightMargin: rm,
                      columnWidth: report.pageWidth - report.leftMargin - rm,
                    });
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-slate-200 font-mono text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
