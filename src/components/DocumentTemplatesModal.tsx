'use client';

import React, { useState } from 'react';
import {
  FileText,
  Receipt,
  ShoppingCart,
  DollarSign,
  Barcode,
  Sparkles,
  X,
  Check,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { DOCUMENT_TEMPLATES, DocumentTemplateCard } from '../engine/templates';
import { JRXMLReport } from '../types/jrxml';

interface DocumentTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTemplate: (report: JRXMLReport) => void;
  onOpenWizard: () => void;
}

export const DocumentTemplatesModal: React.FC<DocumentTemplatesModalProps> = ({
  isOpen,
  onClose,
  onSelectTemplate,
  onOpenWizard,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('todos');

  if (!isOpen) return null;

  const categories = [
    { id: 'todos', label: 'Todos os Modelos' },
    { id: 'faturamento', label: 'Faturamento / Fiscal' },
    { id: 'comercial', label: 'Vendas & Propostas' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'logistica', label: 'Logística & Etiquetas' },
  ];

  const filtered = DOCUMENT_TEMPLATES.filter(
    (t) => selectedCategory === 'todos' || t.category === selectedCategory || t.category === 'em_branco'
  );

  const getTemplateIcon = (category: string) => {
    switch (category) {
      case 'faturamento':
        return <Receipt className="w-5 h-5 text-emerald-400" />;
      case 'comercial':
        return <ShoppingCart className="w-5 h-5 text-sky-400" />;
      case 'financeiro':
        return <DollarSign className="w-5 h-5 text-teal-400" />;
      case 'logistica':
        return <Barcode className="w-5 h-5 text-amber-400" />;
      default:
        return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-100 flex items-center space-x-2">
                <span>Modelos de Documentos e Notas Sankhya</span>
              </h2>
              <p className="text-xs text-slate-400">
                Selecione um modelo diagramado pronto ou comece do zero no canvas de design.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onClose();
                onOpenWizard();
              }}
              className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium flex items-center space-x-1.5 shadow-md shadow-emerald-950 transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
              <span>Criar com Assistente (Passo a Passo)</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter categories */}
        <div className="px-6 py-2.5 border-b border-slate-800/80 bg-slate-950/40 flex items-center space-x-2 overflow-x-auto text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1 rounded-md transition font-medium shrink-0 ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Cards Grid */}
        <div className="p-6 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => onSelectTemplate(tpl.report)}
              className="group p-4 rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-850 hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col justify-between space-y-3 relative overflow-hidden"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2.5">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800 group-hover:border-emerald-500/30 transition">
                      {getTemplateIcon(tpl.category)}
                    </div>
                    <div>
                      <h3 className="font-semibold text-sm text-slate-100 group-hover:text-emerald-400 transition">
                        {tpl.title}
                      </h3>
                      <span className="text-[10px] text-slate-400">{tpl.categoryLabel}</span>
                    </div>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-800 text-emerald-400 border border-slate-700">
                    {tpl.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                  {tpl.description}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-xs">
                <span className="text-[10px] text-slate-500">
                  {tpl.tables.length > 0 ? `Tabelas: ${tpl.tables.join(', ')}` : 'Canvas Limpo'}
                </span>

                <span className="text-emerald-400 group-hover:translate-x-0.5 transition-transform font-medium flex items-center space-x-1">
                  <span>Usar este Modelo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between text-xs text-slate-400">
          <span>Todos os modelos são 100% compatíveis com o Sankhya-W e JasperReports 5.6.0.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-800 text-slate-200 transition"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};
