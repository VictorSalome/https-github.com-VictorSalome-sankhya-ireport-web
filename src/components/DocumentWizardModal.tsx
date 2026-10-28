'use client';

import React, { useState } from 'react';
import {
  Wand2,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  Sparkles,
  Layers,
  FileSpreadsheet,
  Palette,
  CheckSquare,
  Square,
  Eye,
} from 'lucide-react';
import { WIZARD_DATA_SOURCES, WizardDataSourcePreset } from '../engine/templates';
import { JRXMLReport } from '../types/jrxml';

interface DocumentWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerateReport: (report: JRXMLReport) => void;
}

export const DocumentWizardModal: React.FC<DocumentWizardModalProps> = ({
  isOpen,
  onClose,
  onGenerateReport,
}) => {
  const [step, setStep] = useState<number>(1);
  const [selectedSourceId, setSelectedSourceId] = useState<string>('faturamento');

  const selectedSource =
    WIZARD_DATA_SOURCES.find((s) => s.id === selectedSourceId) || WIZARD_DATA_SOURCES[0];

  // Selected fields for Step 2
  const [selectedFields, setSelectedFields] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    selectedSource.fields.forEach((f) => {
      initial[f.key] = f.defaultChecked;
    });
    return initial;
  });

  // Step 3 options
  const [docTitle, setDocTitle] = useState<string>('Novo Relatório Sankhya');
  const [orientation, setOrientation] = useState<'Portrait' | 'Landscape'>('Portrait');
  const [enableZebra, setEnableZebra] = useState<boolean>(true);
  const [includeHeaderBox, setIncludeHeaderBox] = useState<boolean>(true);
  const [includeSummaryTotal, setIncludeSummaryTotal] = useState<boolean>(true);
  const [primaryColor, setPrimaryColor] = useState<string>('#047857'); // Emerald Sankhya default

  if (!isOpen) return null;

  // Toggle field
  const toggleField = (key: string) => {
    setSelectedFields((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Generate Report
  const handleFinish = () => {
    const pageWidth = orientation === 'Portrait' ? 595 : 842;
    const pageHeight = orientation === 'Portrait' ? 842 : 595;
    const leftMargin = 20;
    const rightMargin = 20;
    const columnWidth = pageWidth - leftMargin - rightMargin;

    const activeFields = selectedSource.fields.filter((f) => selectedFields[f.key]);

    // Distribute widths proportionally
    const totalOriginalWidth = activeFields.reduce((sum, f) => sum + f.width, 0) || 1;
    let currentX = 0;

    const columnHeaderElements: any[] = [];
    const detailElements: any[] = [];

    // Background of column header
    columnHeaderElements.push({
      id: 'bg-col-header',
      type: 'rectangle',
      reportElement: { x: 0, y: 2, width: columnWidth, height: 20, backcolor: primaryColor, mode: 'Opaque' },
      radius: 3,
    });

    activeFields.forEach((f, idx) => {
      const calculatedWidth = Math.max(
        40,
        Math.floor((f.width / totalOriginalWidth) * (columnWidth - 10))
      );

      // Column Header label
      columnHeaderElements.push({
        id: `th-${f.key}`,
        type: 'staticText',
        reportElement: { x: currentX + 4, y: 5, width: calculatedWidth - 8, height: 14, forecolor: '#ffffff' },
        text: f.label.toUpperCase(),
        textElement: {
          textAlignment: f.align,
          font: { size: 8, isBold: true },
        },
      });

      // Detail field
      detailElements.push({
        id: `td-${f.key}`,
        type: 'textField',
        reportElement: {
          x: currentX + 4,
          y: 2,
          width: calculatedWidth - 8,
          height: 14,
          forecolor: '#0f172a',
          style: enableZebra ? 'Zebra' : undefined,
        },
        expression: `$F{${f.key}}`,
        pattern: f.pattern,
        textElement: {
          textAlignment: f.align,
          font: { size: 8 },
        },
      });

      currentX += calculatedWidth;
    });

    const newReport: JRXMLReport = {
      name: docTitle.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'documento_sankhya',
      language: 'groovy',
      pageWidth,
      pageHeight,
      orientation,
      columnWidth,
      leftMargin,
      rightMargin,
      topMargin: 20,
      bottomMargin: 20,
      queryString: selectedSource.defaultQuery,
      parameters: [
        { name: 'PK_NUNOTA', class: 'java.math.BigDecimal', description: 'Número Único' },
      ],
      fields: selectedSource.fields.map((f) => ({
        name: f.key,
        class: f.class,
      })),
      variables: includeSummaryTotal
        ? [
            {
              name: 'TOTAL_GERAL',
              class: 'java.math.BigDecimal',
              resetType: 'Report',
              calculation: 'Sum',
              variableExpression: activeFields.find((f) => f.pattern?.includes('R$'))
                ? `$F{${activeFields.find((f) => f.pattern?.includes('R$'))!.key}}`
                : '$V{REPORT_COUNT}',
            },
          ]
        : [],
      styles: enableZebra
        ? [
            {
              name: 'Zebra',
              mode: 'Transparent',
              conditionalStyles: [
                {
                  conditionExpression: '$V{REPORT_COUNT} % 2 == 0',
                  backcolor: '#f8fafc',
                  mode: 'Opaque',
                },
              ],
            },
          ]
        : [],
      bands: {
        pageHeader: {
          type: 'pageHeader',
          title: 'Cabeçalho da Página',
          height: includeHeaderBox ? 70 : 40,
          elements: includeHeaderBox
            ? [
                {
                  id: 'hdr-box',
                  type: 'rectangle',
                  reportElement: { x: 0, y: 0, width: columnWidth, height: 60, backcolor: '#f8fafc', mode: 'Opaque' },
                  radius: 4,
                },
                {
                  id: 'hdr-title',
                  type: 'staticText',
                  reportElement: { x: 12, y: 12, width: 350, height: 22, forecolor: '#0f172a' },
                  text: docTitle.toUpperCase(),
                  textElement: { font: { size: 13, isBold: true } },
                },
                {
                  id: 'hdr-origem',
                  type: 'staticText',
                  reportElement: { x: 12, y: 36, width: 350, height: 14, forecolor: '#64748b' },
                  text: `Fonte: ${selectedSource.table} | Gerado no Sankhya iReport Designer`,
                  textElement: { font: { size: 8 } },
                },
              ]
            : [
                {
                  id: 'hdr-title-simple',
                  type: 'staticText',
                  reportElement: { x: 0, y: 8, width: columnWidth, height: 24, forecolor: '#0f172a' },
                  text: docTitle.toUpperCase(),
                  textElement: { font: { size: 14, isBold: true } },
                },
              ],
        },
        columnHeader: {
          type: 'columnHeader',
          title: 'Títulos das Colunas',
          height: 24,
          elements: columnHeaderElements,
        },
        detail: {
          type: 'detail',
          title: 'Linhas do Documento',
          height: 18,
          elements: detailElements,
        },
        summary: includeSummaryTotal
          ? {
              type: 'summary',
              title: 'Totais e Encerramento',
              height: 45,
              elements: [
                {
                  id: 'sum-box',
                  type: 'rectangle',
                  reportElement: { x: 0, y: 8, width: columnWidth, height: 30, backcolor: '#f1f5f9', mode: 'Opaque' },
                  radius: 4,
                },
                {
                  id: 'sum-lbl',
                  type: 'staticText',
                  reportElement: { x: 15, y: 16, width: 200, height: 14, forecolor: '#334155' },
                  text: 'TOTAL DO DOCUMENTO:',
                  textElement: { font: { size: 9, isBold: true } },
                },
                {
                  id: 'sum-val',
                  type: 'textField',
                  reportElement: { x: columnWidth - 165, y: 14, width: 150, height: 18, forecolor: primaryColor },
                  expression: '$V{TOTAL_GERAL}',
                  pattern: 'R$ #,##0.00',
                  textElement: { textAlignment: 'Right', font: { size: 11, isBold: true } },
                },
              ],
            }
          : undefined,
        pageFooter: {
          type: 'pageFooter',
          title: 'Rodapé da Página',
          height: 22,
          elements: [
            {
              id: 'ftr-line',
              type: 'line',
              reportElement: { x: 0, y: 4, width: columnWidth, height: 1, forecolor: '#e2e8f0' },
            },
            {
              id: 'ftr-pag',
              type: 'textField',
              reportElement: { x: columnWidth - 120, y: 8, width: 120, height: 12, forecolor: '#94a3b8' },
              expression: '"Página " + $V{PAGE_NUMBER}',
              textElement: { textAlignment: 'Right', font: { size: 8 } },
            },
          ],
        },
      },
    };

    onGenerateReport(newReport);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Wand2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100">
                Assistente de Criação de Documentos Sankhya
              </h2>
              <p className="text-xs text-slate-400">
                Passo {step} de 3 — Configure a fonte, selecione as colunas e gere seu layout visual.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs">
          <div
            className={`flex items-center space-x-2 ${
              step >= 1 ? 'text-emerald-400 font-medium' : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px]">
              1
            </span>
            <span>Tipo & Dados</span>
          </div>
          <div className="h-px w-12 bg-slate-800" />
          <div
            className={`flex items-center space-x-2 ${
              step >= 2 ? 'text-emerald-400 font-medium' : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px]">
              2
            </span>
            <span>Colunas</span>
          </div>
          <div className="h-px w-12 bg-slate-800" />
          <div
            className={`flex items-center space-x-2 ${
              step >= 3 ? 'text-emerald-400 font-medium' : 'text-slate-500'
            }`}
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[11px]">
              3
            </span>
            <span>Estilo & Design</span>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {/* STEP 1: Escolha da Origem */}
          {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">
                Qual o objetivo deste documento ou nota?
              </h3>
              <div className="grid grid-cols-1 gap-3">
                {WIZARD_DATA_SOURCES.map((src) => (
                  <div
                    key={src.id}
                    onClick={() => {
                      setSelectedSourceId(src.id);
                      setOrientation(src.recommendedOrientation);
                      // Reset fields to source defaults
                      const init: Record<string, boolean> = {};
                      src.fields.forEach((f) => {
                        init[f.key] = f.defaultChecked;
                      });
                      setSelectedFields(init);
                    }}
                    className={`p-4 rounded-xl border transition-all cursor-pointer flex items-start space-x-3 ${
                      selectedSourceId === src.id
                        ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500/30'
                        : 'border-slate-800 bg-slate-950/40 hover:bg-slate-800/40'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full mt-0.5 border flex items-center justify-center shrink-0 ${
                        selectedSourceId === src.id
                          ? 'border-emerald-500 bg-emerald-600 text-white'
                          : 'border-slate-700 bg-slate-800'
                      }`}
                    >
                      {selectedSourceId === src.id && <Check className="w-3 h-3" />}
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h4 className="text-sm font-medium text-slate-100">{src.name}</h4>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                          {src.table}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{src.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Seleção de Colunas */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">
                    Selecione as colunas da tabela
                  </h3>
                  <p className="text-xs text-slate-400">
                    Marque os campos que você deseja exibir na grade de itens do documento.
                  </p>
                </div>
                <button
                  onClick={() => {
                    const allTrue: Record<string, boolean> = {};
                    selectedSource.fields.forEach((f) => {
                      allTrue[f.key] = true;
                    });
                    setSelectedFields(allTrue);
                  }}
                  className="text-xs text-emerald-400 hover:text-emerald-300 underline"
                >
                  Marcar Todos
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 pt-2">
                {selectedSource.fields.map((f) => {
                  const isChecked = !!selectedFields[f.key];
                  return (
                    <div
                      key={f.key}
                      onClick={() => toggleField(f.key)}
                      className={`px-3 py-2.5 rounded-lg border flex items-center justify-between cursor-pointer transition ${
                        isChecked
                          ? 'border-emerald-500/60 bg-emerald-500/10'
                          : 'border-slate-800 bg-slate-950/40 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Square className="w-4 h-4 text-slate-600" />
                        )}
                        <div>
                          <span className="text-xs font-medium text-slate-200">{f.label}</span>
                          <span className="text-[10px] text-slate-500 ml-2 font-mono">
                            $F&#123;{f.key}&#125;
                          </span>
                        </div>
                      </div>

                      <div className="text-[10px] text-slate-400 font-mono">
                        {f.pattern ? f.pattern : f.align === 'Right' ? 'Numérico' : 'Texto'}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 3: Estilo Visual & Opções */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-300 font-medium block mb-1">
                  Título do Documento
                </label>
                <input
                  type="text"
                  value={docTitle}
                  onChange={(e) => setDocTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Ex: Espelho de Nota de Saída"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Orientação da Página
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setOrientation('Portrait')}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition ${
                        orientation === 'Portrait'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      A4 Retrato
                    </button>
                    <button
                      type="button"
                      onClick={() => setOrientation('Landscape')}
                      className={`py-2 px-3 rounded-lg border text-xs font-medium transition ${
                        orientation === 'Landscape'
                          ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                      }`}
                    >
                      A4 Paisagem
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-slate-300 font-medium block mb-1">
                    Cor Principal de Destaque
                  </label>
                  <div className="flex items-center space-x-2 pt-1">
                    {[
                      { hex: '#047857', label: 'Verde Sankhya' },
                      { hex: '#0f766e', label: 'Teal' },
                      { hex: '#1e293b', label: 'Slate Escuro' },
                      { hex: '#1d4ed8', label: 'Azul Real' },
                      { hex: '#7c3aed', label: 'Violeta' },
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => setPrimaryColor(c.hex)}
                        title={c.label}
                        className={`w-7 h-7 rounded-full border-2 transition ${
                          primaryColor === c.hex ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-800">
                <label
                  onClick={() => setEnableZebra(!enableZebra)}
                  className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300 hover:text-slate-100"
                >
                  {enableZebra ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                  <span>Ativar Linhas Zebradas (Fundo alternado nas linhas de dados)</span>
                </label>

                <label
                  onClick={() => setIncludeHeaderBox(!includeHeaderBox)}
                  className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300 hover:text-slate-100"
                >
                  {includeHeaderBox ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                  <span>Incluir Cabeçalho da Empresa com Moldura</span>
                </label>

                <label
                  onClick={() => setIncludeSummaryTotal(!includeSummaryTotal)}
                  className="flex items-center space-x-2.5 cursor-pointer text-xs text-slate-300 hover:text-slate-100"
                >
                  {includeSummaryTotal ? (
                    <CheckSquare className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <Square className="w-4 h-4 text-slate-600" />
                  )}
                  <span>Incluir Totalizador Geral no Rodapé do Documento</span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-800 bg-slate-900/50 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs flex items-center space-x-1.5 transition"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Voltar</span>
            </button>
          ) : (
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-300 text-xs transition"
            >
              Cancelar
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center space-x-1.5 shadow-md shadow-emerald-950 transition"
            >
              <span>Próximo Passo</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium flex items-center space-x-1.5 shadow-md shadow-emerald-950 transition"
            >
              <Sparkles className="w-4 h-4" />
              <span>Gerar Documento no Canvas</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
