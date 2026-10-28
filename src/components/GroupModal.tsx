'use client';

import React, { useState } from 'react';
import {
  JRXMLReport,
  JRXMLGroup,
  JRXMLVariable,
  JRXMLBand,
  JRXMLElement,
  TextVAlign,
  TextHAlign,
} from '../types/jrxml';
import { X, Layers, Plus, Trash2, CheckCircle2, Sparkles, FolderTree } from 'lucide-react';

interface GroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: JRXMLReport;
  onUpdateReport: (updates: Partial<JRXMLReport>) => void;
}

export const GroupModal: React.FC<GroupModalProps> = ({
  isOpen,
  onClose,
  report,
  onUpdateReport,
}) => {
  const [selectedField, setSelectedField] = useState('CODPARC');
  const [groupName, setGroupName] = useState('GrupoCliente');
  const [includeHeader, setIncludeHeader] = useState(true);
  const [includeSubtotal, setIncludeSubtotal] = useState(true);
  const [startNewPage, setStartNewPage] = useState(false);

  if (!isOpen) return null;

  const activeGroups = report.groups || [];

  const sankhyaCommonGroupingFields = [
    { field: 'CODPARC', label: 'Cliente / Parceiro', expr: '$F{CODPARC}', name: 'GrupoCliente' },
    { field: 'CODVEND', label: 'Vendedor', expr: '$F{CODVEND}', name: 'GrupoVendedor' },
    { field: 'CODGRUPOPROD', label: 'Grupo de Produtos', expr: '$F{CODGRUPOPROD}', name: 'GrupoProduto' },
    { field: 'CODEMP', label: 'Empresa / Filial', expr: '$F{CODEMP}', name: 'GrupoEmpresa' },
    { field: 'DTNEG', label: 'Data de Emissão', expr: '$F{DTNEG}', name: 'GrupoData' },
  ];

  const handleSelectPreset = (preset: typeof sankhyaCommonGroupingFields[0]) => {
    setSelectedField(preset.field);
    setGroupName(preset.name);
  };

  const handleCreateGroup = () => {
    const colW = report.columnWidth;
    const now = Date.now();
    const gId = `group-${now}`;

    // 1. Optional Header Band
    const headerElements: JRXMLElement[] = [
      {
        id: `elem-gh-${now}-bg`,
        type: 'rectangle',
        reportElement: {
          x: 0,
          y: 2,
          width: colW,
          height: 20,
          backcolor: '#E2E8F0',
          mode: 'Opaque',
        },
        radius: 2,
        penWidth: 0,
      },
      {
        id: `elem-gh-${now}-lbl`,
        type: 'staticText',
        reportElement: {
          x: 8,
          y: 4,
          width: 90,
          height: 16,
          forecolor: '#334155',
        },
        textElement: {
          verticalAlignment: 'Middle',
          font: { size: 9, isBold: true },
        },
        text: `${selectedField}:`,
      },
      {
        id: `elem-gh-${now}-val`,
        type: 'textField',
        reportElement: {
          x: 100,
          y: 4,
          width: colW - 110,
          height: 16,
          forecolor: '#0F172A',
        },
        textElement: {
          verticalAlignment: 'Middle',
          font: { size: 9, isBold: true },
        },
        expression: `$F{${selectedField}}`,
      },
    ];

    const headerBand: JRXMLBand | undefined = includeHeader
      ? {
          type: 'groupHeader' as any,
          title: `Cabeçalho: ${selectedField}`,
          height: 24,
          splitType: 'Stretch',
          elements: headerElements,
        }
      : undefined;

    // 2. Optional Footer Band with automatic Subtotal
    const varName = `SUBTOTAL_${selectedField}`;
    const footerElements: JRXMLElement[] = [
      {
        id: `elem-gf-${now}-box`,
        type: 'rectangle',
        reportElement: {
          x: colW - 240,
          y: 3,
          width: 240,
          height: 20,
          backcolor: '#F8FAFC',
          mode: 'Opaque',
        },
        radius: 2,
        penWidth: 1,
        penColor: '#CBD5E1',
      },
      {
        id: `elem-gf-${now}-lbl`,
        type: 'staticText',
        reportElement: {
          x: colW - 230,
          y: 5,
          width: 100,
          height: 16,
          forecolor: '#475569',
        },
        textElement: {
          verticalAlignment: 'Middle',
          font: { size: 8, isBold: true },
        },
        text: `SUBTOTAL:`,
      },
      {
        id: `elem-gf-${now}-val`,
        type: 'textField',
        reportElement: {
          x: colW - 125,
          y: 5,
          width: 120,
          height: 16,
          forecolor: '#0284C7',
        },
        textElement: {
          textAlignment: 'Right',
          verticalAlignment: 'Middle',
          font: { size: 9, isBold: true },
        },
        pattern: '¤ #,##0.00',
        expression: `$V{${varName}}`,
      },
    ];

    const footerBand: JRXMLBand | undefined = includeSubtotal
      ? {
          type: 'groupFooter' as any,
          title: `Subtotal: ${selectedField}`,
          height: 26,
          splitType: 'Stretch',
          elements: footerElements,
        }
      : undefined;

    const newGroup: JRXMLGroup = {
      id: gId,
      name: groupName,
      expression: `$F{${selectedField}}`,
      label: `Por ${selectedField}`,
      isStartNewPage: startNewPage,
      headerBand,
      footerBand,
    };

    // 3. Create or update calculation variable
    const newVars: JRXMLVariable[] = [...(report.variables || [])];
    if (includeSubtotal && !newVars.some((v) => v.name === varName)) {
      newVars.push({
        name: varName,
        class: 'java.math.BigDecimal',
        calculation: 'Sum',
        resetType: 'Group',
        resetGroup: groupName,
        variableExpression: '$F{VLRNOTA}',
      });
    }

    onUpdateReport({
      groups: [...activeGroups, newGroup],
      variables: newVars,
    });
  };

  const handleRemoveGroup = (groupId: string, gName: string) => {
    const updatedGroups = activeGroups.filter((g) => g.id !== groupId);
    // Remove associated group variables
    const updatedVars = (report.variables || []).filter((v) => v.resetGroup !== gName);

    onUpdateReport({
      groups: updatedGroups,
      variables: updatedVars,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Modal Header */}
        <div className="h-12 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <FolderTree className="w-4 h-4 text-emerald-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Agrupamento do Relatório & Subtotais
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Active Groups List */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-semibold text-slate-300 text-xs">
                Grupos Ativos neste Relatório:
              </span>
              <span className="text-[10px] text-emerald-400 font-mono">
                {activeGroups.length} grupo(s)
              </span>
            </div>

            {activeGroups.length === 0 ? (
              <div className="p-3 bg-slate-950/60 rounded-lg border border-dashed border-slate-800 text-center text-slate-500 text-[11px]">
                Nenhum agrupamento ativo. Crie um abaixo com apenas 1 clique!
              </div>
            ) : (
              <div className="space-y-2">
                {activeGroups.map((g) => (
                  <div
                    key={g.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950 rounded-lg border border-slate-800 text-slate-200"
                  >
                    <div className="flex items-center space-x-2.5">
                      <Layers className="w-4 h-4 text-emerald-400" />
                      <div>
                        <div className="font-semibold text-slate-100 text-xs">
                          {g.name}
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          Quebra: {g.expression}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleRemoveGroup(g.id, g.name)}
                      className="px-2 py-1 rounded bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/40 text-[10px] flex items-center space-x-1 transition"
                      title="Remover agrupamento e subtotais associados"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Remover</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="h-px bg-slate-800 my-2" />

          {/* Create New Group Section */}
          <div className="p-3 bg-slate-950/80 rounded-lg border border-slate-800 space-y-3">
            <div className="flex items-center space-x-1.5 text-slate-200 font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              <span>Criar Novo Agrupamento Simplificado</span>
            </div>

            {/* Quick Pills for Laypeople */}
            <div>
              <label className="text-[10px] text-slate-400 block mb-1.5">
                Escolha por qual informação agrupar (Atalhos Sankhya):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {sankhyaCommonGroupingFields.map((preset) => (
                  <button
                    key={preset.field}
                    onClick={() => handleSelectPreset(preset)}
                    className={`p-2 rounded border text-left transition flex items-center justify-between ${
                      selectedField === preset.field
                        ? 'bg-emerald-950/60 border-emerald-500 text-emerald-300 font-medium'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-[11px] text-slate-200">{preset.label}</div>
                      <div className="text-[9px] font-mono text-sky-400">{preset.expr}</div>
                    </div>
                    {selectedField === preset.field && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Options Checkboxes */}
            <div className="pt-2 border-t border-slate-850 space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeHeader}
                  onChange={(e) => setIncludeHeader(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">
                  Incluir Cabeçalho de Grupo (com nome e código em destaque antes dos itens)
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeSubtotal}
                  onChange={(e) => setIncludeSubtotal(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">
                  Incluir Subtotal Automático de Valores (R$) ao final de cada grupo
                </span>
              </label>

              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={startNewPage}
                  onChange={(e) => setStartNewPage(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-600 focus:ring-0"
                />
                <span className="text-[11px] text-slate-300">
                  Iniciar cada grupo em uma nova folha de impressão
                </span>
              </label>
            </div>

            {/* Create Button */}
            <div className="pt-2 flex justify-end">
              <button
                onClick={handleCreateGroup}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition flex items-center space-x-1.5 shadow-sm text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Criar Agrupamento no Relatório</span>
              </button>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="h-12 border-t border-slate-800 px-4 flex items-center justify-end bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition font-medium"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
