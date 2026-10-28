'use client';

import React, { useState, useEffect } from 'react';
import { JRXMLReport, JasperReportsVersion } from '../types/jrxml';
import { serializeJRXML } from '../engine/serializer';
import { parseJRXML } from '../engine/parser';
import { Copy, Download, RefreshCw, AlertCircle, Check } from 'lucide-react';

interface CodeEditorProps {
  report: JRXMLReport;
  onUpdateReportFromXml: (newReport: JRXMLReport) => void;
  onDownload: () => void;
  targetVersion?: JasperReportsVersion;
  onSelectVersion?: (v: JasperReportsVersion) => void;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  report,
  onUpdateReportFromXml,
  onDownload,
  targetVersion = '4.0.1',
  onSelectVersion,
}) => {
  const [xmlContent, setXmlContent] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  useEffect(() => {
    try {
      const serialized = serializeJRXML(report, { version: targetVersion });
      setXmlContent(serialized);
      setParseError(null);
    } catch (err: any) {
      setParseError(err.message || 'Erro ao serializar relatório.');
    }
  }, [report, targetVersion]);

  const handleApplyChanges = () => {
    try {
      const parsed = parseJRXML(xmlContent);
      onUpdateReportFromXml(parsed);
      setParseError(null);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 2000);
    } catch (err: any) {
      setParseError(err.message || 'Erro ao processar XML do relatório.');
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(xmlContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    onDownload();
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-hidden">
      {/* Editor Sub-header */}
      <div className="h-10 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-slate-300">Fonte JRXML</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded font-mono font-semibold flex items-center space-x-1 ${
              targetVersion === '4.0.1'
                ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/40'
                : targetVersion === '5.6.0'
                ? 'bg-sky-950/80 text-sky-400 border border-sky-800/40'
                : 'bg-purple-950/80 text-purple-400 border border-purple-800/40'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                targetVersion === '4.0.1'
                  ? 'bg-emerald-400'
                  : targetVersion === '5.6.0'
                  ? 'bg-sky-400'
                  : 'bg-purple-400'
              }`}
            />
            <span>v{targetVersion}</span>
            <span className="opacity-75 font-sans text-[9px] uppercase">
              {targetVersion === '4.0.1' ? '(Sankhya)' : targetVersion === '5.6.0' ? '(iReport)' : '(Studio)'}
            </span>
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {xmlContent.split('\n').length} linhas
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleApplyChanges}
            className="flex items-center space-x-1.5 px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded font-medium transition text-xs shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Aplicar ao Canvas</span>
          </button>

          <button
            onClick={handleCopy}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition"
            title="Copiar XML"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <button
            onClick={handleDownload}
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded transition"
            title="Baixar .jrxml"
          >
            {downloaded ? <Check className="w-4 h-4 text-emerald-400" /> : <Download className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Error / Success Toast Banner */}
      {parseError && (
        <div className="bg-rose-950/80 border-b border-rose-800 px-4 py-2 flex items-center space-x-2 text-rose-300 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{parseError}</span>
        </div>
      )}

      {syncSuccess && (
        <div className="bg-emerald-950/80 border-b border-emerald-800 px-4 py-2 flex items-center space-x-2 text-emerald-300 text-xs">
          <Check className="w-4 h-4 shrink-0" />
          <span>Alterações aplicadas com sucesso ao editor visual!</span>
        </div>
      )}

      {/* Code Textarea */}
      <div className="flex-1 p-4 overflow-auto font-mono text-[13px] leading-relaxed">
        <textarea
          value={xmlContent}
          onChange={(e) => {
            setXmlContent(e.target.value);
            setParseError(null);
          }}
          className="w-full h-full bg-transparent text-emerald-300/90 focus:outline-none resize-none font-mono selection:bg-emerald-900/50"
          spellCheck={false}
        />
      </div>
    </div>
  );
};
