'use client';

import React, { useState } from 'react';
import { JRXMLReport, JRXMLParameter, JRXMLField } from '../types/jrxml';
import { X, Plus, Trash2, Wand2, Database } from 'lucide-react';

interface SqlQueryModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: JRXMLReport;
  onUpdateReport: (updates: Partial<JRXMLReport>) => void;
}

export const SqlQueryModal: React.FC<SqlQueryModalProps> = ({
  isOpen,
  onClose,
  report,
  onUpdateReport,
}) => {
  const [query, setQuery] = useState(report.queryString || '');
  const [params, setParams] = useState<JRXMLParameter[]>(report.parameters || []);
  const [fields, setFields] = useState<JRXMLField[]>(report.fields || []);

  if (!isOpen) return null;

  // Auto-extract fields from SELECT query
  const handleAutoExtractFields = () => {
    try {
      const match = query.match(/SELECT\s+(.*?)\s+FROM/is);
      if (!match || !match[1]) return;

      const cols = match[1].split(',').map((c) => c.trim());
      const newFields: JRXMLField[] = [];

      for (const col of cols) {
        // Handle "AS alias" or table.col
        let fieldName = col;
        const asMatch = col.match(/\s+AS\s+([A-Za-z0-9_]+)/i);
        if (asMatch) {
          fieldName = asMatch[1];
        } else {
          const parts = col.split('.');
          fieldName = parts[parts.length - 1];
        }

        fieldName = fieldName.replace(/[^A-Za-z0-9_]/g, '').toUpperCase();
        if (fieldName && !newFields.some((f) => f.name === fieldName)) {
          newFields.push({
            name: fieldName,
            class:
              fieldName.includes('VLR') || fieldName.includes('QTD') || fieldName.includes('NUNOTA')
                ? 'java.math.BigDecimal'
                : fieldName.includes('DT')
                ? 'java.sql.Timestamp'
                : 'java.lang.String',
          });
        }
      }

      setFields(newFields);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = () => {
    onUpdateReport({
      queryString: query,
      parameters: params,
      fields: fields,
    });
    onClose();
  };

  const handleAddParam = (name = 'NOVO_PARAM', pClass = 'java.lang.String') => {
    setParams([...params, { name, class: pClass, isForPrompting: true }]);
  };

  const handleRemoveParam = (index: number) => {
    setParams(params.filter((_, i) => i !== index));
  };

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-xs">
        {/* Header */}
        <div className="h-12 border-b border-slate-800 px-4 flex items-center justify-between bg-slate-950">
          <div className="flex items-center space-x-2">
            <Database className="w-4 h-4 text-sky-400" />
            <h3 className="font-semibold text-slate-100 text-sm">
              Consulta SQL & Parâmetros Sankhya
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* SQL Editor */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-semibold text-slate-300">
                Consulta SQL (Execute no Sankhya com $P&#123;PARAM&#125;)
              </label>
              <button
                onClick={handleAutoExtractFields}
                className="flex items-center space-x-1 px-2 py-1 rounded bg-sky-600/30 text-sky-300 border border-sky-500/30 hover:bg-sky-600/50 transition text-[11px]"
              >
                <Wand2 className="w-3 h-3" />
                <span>Auto-detectar Campos ($F&#123;...&#125;)</span>
              </button>
            </div>
            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rows={6}
              className="w-full bg-slate-950 border border-slate-800 rounded p-2.5 font-mono text-[11px] text-sky-300 focus:outline-none focus:border-sky-500 leading-relaxed"
              placeholder="SELECT CAB.NUNOTA, CAB.NUMNOTA, PAR.NOMEPARC FROM TGFCAB CAB..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4 pt-2">
            {/* Parameters */}
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300">
                  Parâmetros ($P&#123;...&#125;)
                </span>
                <button
                  onClick={() => handleAddParam()}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center space-x-1 text-[10px]"
                >
                  <Plus className="w-3 h-3" />
                  <span>Novo</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {params.map((p, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded border border-slate-800 text-[11px]"
                  >
                    <input
                      type="text"
                      value={p.name}
                      onChange={(e) => {
                        const copy = [...params];
                        copy[idx].name = e.target.value;
                        setParams(copy);
                      }}
                      className="flex-1 bg-transparent border-0 font-mono text-sky-400 focus:outline-none"
                    />
                    <select
                      value={p.class}
                      onChange={(e) => {
                        const copy = [...params];
                        copy[idx].class = e.target.value;
                        setParams(copy);
                      }}
                      className="bg-slate-950 border border-slate-800 rounded text-[10px] text-slate-300 py-0.5 px-1"
                    >
                      <option value="java.math.BigDecimal">BigDecimal</option>
                      <option value="java.lang.String">String</option>
                      <option value="java.sql.Timestamp">Timestamp</option>
                      <option value="java.lang.Integer">Integer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveParam(idx)}
                      className="text-rose-400 hover:text-rose-300 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Fields */}
            <div className="p-3 bg-slate-950/60 rounded-lg border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-slate-300">
                  Campos da Consulta ($F&#123;...&#125;)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {fields.length} campos
                </span>
              </div>

              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {fields.map((f, idx) => (
                  <div
                    key={idx}
                    className="flex items-center space-x-2 bg-slate-900 p-1.5 rounded border border-slate-800 text-[11px]"
                  >
                    <span className="flex-1 font-mono text-emerald-400 truncate">
                      {f.name}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
                      {f.class.split('.').pop()}
                    </span>
                    <button
                      onClick={() => handleRemoveField(idx)}
                      className="text-rose-400 hover:text-rose-300 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-12 border-t border-slate-800 px-4 flex items-center justify-end space-x-2 bg-slate-950">
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded text-slate-400 hover:text-slate-200 transition"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition shadow-sm"
          >
            Salvar e Atualizar Relatório
          </button>
        </div>
      </div>
    </div>
  );
};
