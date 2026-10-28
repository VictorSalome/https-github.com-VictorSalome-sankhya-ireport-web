'use client';

import React from 'react';
import {
  FileCode,
  Eye,
  Layout,
  Download,
  Upload,
  Copy,
  Plus,
  ZoomIn,
  ZoomOut,
  Grid,
  Database,
  Check,
  Undo2,
  Redo2,
  FolderTree,
  Wand2,
  Sparkles,
  Layers,
  BookmarkPlus,
  ChevronDown,
} from 'lucide-react';
import { JasperReportsVersion } from '../types/jrxml';

interface ToolbarProps {
  viewMode: 'visual' | 'code' | 'preview';
  setViewMode: (mode: 'visual' | 'code' | 'preview') => void;
  reportName: string;
  zoom: number;
  setZoom: (zoom: number | ((prev: number) => number)) => void;
  snapGrid: number;
  setSnapGrid: (grid: number) => void;
  targetVersion: JasperReportsVersion;
  setTargetVersion: (version: JasperReportsVersion) => void;
  onNew: () => void;
  onOpenTemplates: () => void;
  onOpenWizard: () => void;
  onDownload: () => void;
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCopyXml: () => void;
  copied: boolean;
  onOpenSqlModal: () => void;
  onOpenGroupModal?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  hasSelection?: boolean;
  onSaveSelectionAsComponent?: () => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  viewMode,
  setViewMode,
  reportName,
  zoom,
  setZoom,
  snapGrid,
  setSnapGrid,
  targetVersion,
  setTargetVersion,
  onNew,
  onOpenTemplates,
  onOpenWizard,
  onDownload,
  onUpload,
  onCopyXml,
  copied,
  onOpenSqlModal,
  onOpenGroupModal,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  hasSelection = false,
  onSaveSelectionAsComponent,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [versionMenuOpen, setVersionMenuOpen] = React.useState(false);
  const versionMenuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (versionMenuRef.current && !versionMenuRef.current.contains(event.target as Node)) {
        setVersionMenuOpen(false);
      }
    }
    if (versionMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [versionMenuOpen]);

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4 z-30 select-none">
      {/* Brand & File Info */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center font-bold text-white shadow-md shadow-emerald-900/50">
            Sk
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-sm text-slate-100">iReport Web</span>
              
              {/* Interactive JasperReports Version Selector */}
              <div className="relative" ref={versionMenuRef}>
                {targetVersion === '4.0.1' && (
                  <button
                    type="button"
                    onClick={() => setVersionMenuOpen(!versionMenuOpen)}
                    className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900/60 transition text-[10px] font-mono font-medium shadow-xs cursor-pointer group"
                    title="Versão do JasperReports: 4.0.1 (Sankhya ERP). Clique para alterar."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>JR 4.0.1</span>
                    <span className="px-1 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-sans text-[9px] uppercase tracking-wide font-semibold hidden sm:inline">
                      Padrão ERP
                    </span>
                    <ChevronDown className={`w-3 h-3 text-emerald-400 transition-transform ${versionMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {targetVersion === '5.6.0' && (
                  <button
                    type="button"
                    onClick={() => setVersionMenuOpen(!versionMenuOpen)}
                    className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-sky-950/80 border border-sky-500/50 text-sky-300 hover:bg-sky-900/60 transition text-[10px] font-mono font-medium shadow-xs cursor-pointer group"
                    title="Versão do JasperReports: 5.6.0 (Clássico). Clique para alterar."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                    <span>JR 5.6.0</span>
                    <span className="px-1 py-0.2 rounded bg-sky-500/20 text-sky-300 font-sans text-[9px] uppercase tracking-wide font-semibold hidden sm:inline">
                      Clássico
                    </span>
                    <ChevronDown className={`w-3 h-3 text-sky-400 transition-transform ${versionMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {targetVersion === '6.0.0' && (
                  <button
                    type="button"
                    onClick={() => setVersionMenuOpen(!versionMenuOpen)}
                    className="flex items-center space-x-1.5 px-2 py-0.5 rounded-md bg-purple-950/80 border border-purple-500/50 text-purple-300 hover:bg-purple-900/60 transition text-[10px] font-mono font-medium shadow-xs cursor-pointer group"
                    title="Versão do JasperReports: 6.x (Moderno). Clique para alterar."
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>JR 6.x</span>
                    <span className="px-1 py-0.2 rounded bg-purple-500/20 text-purple-300 font-sans text-[9px] uppercase tracking-wide font-semibold hidden sm:inline">
                      Moderno
                    </span>
                    <ChevronDown className={`w-3 h-3 text-purple-400 transition-transform ${versionMenuOpen ? 'rotate-180' : ''}`} />
                  </button>
                )}

                {/* Popover Dropdown */}
                {versionMenuOpen && (
                  <div className="absolute left-0 top-full mt-1.5 w-76 bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-2 py-1.5 border-b border-slate-800 mb-1.5">
                      <span className="font-semibold text-slate-200 text-[11px] uppercase tracking-wider">
                        Motor JasperReports
                      </span>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Define a compatibilidade da sintaxe XML gerada no download e cópia.
                      </p>
                    </div>

                    <div className="space-y-1">
                      {/* Option 1: 4.0.1 - Sankhya ERP (Recomendado) */}
                      <button
                        type="button"
                        onClick={() => {
                          setTargetVersion('4.0.1');
                          setVersionMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition border flex flex-col space-y-1 cursor-pointer ${
                          targetVersion === '4.0.1'
                            ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 ring-1 ring-emerald-500/20'
                            : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-xs text-emerald-400">v4.0.1</span>
                            <span className="font-semibold text-slate-200 text-xs">Sankhya ERP</span>
                            <span className="px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 text-[9px] font-semibold uppercase">
                              Recomendado
                            </span>
                          </div>
                          {targetVersion === '4.0.1' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Sem atributos UUID. 100% compatível com a engine nativa do Sankhya Ombrelone / W.
                        </p>
                      </button>

                      {/* Option 2: 5.6.0 - iReport Clássico */}
                      <button
                        type="button"
                        onClick={() => {
                          setTargetVersion('5.6.0');
                          setVersionMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition border flex flex-col space-y-1 cursor-pointer ${
                          targetVersion === '5.6.0'
                            ? 'bg-sky-950/40 border-sky-500/50 text-sky-200 ring-1 ring-sky-500/20'
                            : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-xs text-sky-400">v5.6.0</span>
                            <span className="font-semibold text-slate-200 text-xs">iReport Clássico</span>
                          </div>
                          {targetVersion === '5.6.0' && <Check className="w-3.5 h-3.5 text-sky-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Padrão do iReport Desktop com UUIDs e componentes estendidos.
                        </p>
                      </button>

                      {/* Option 3: 6.0.0 - Jaspersoft Studio */}
                      <button
                        type="button"
                        onClick={() => {
                          setTargetVersion('6.0.0');
                          setVersionMenuOpen(false);
                        }}
                        className={`w-full text-left p-2 rounded-lg transition border flex flex-col space-y-1 cursor-pointer ${
                          targetVersion === '6.0.0'
                            ? 'bg-purple-950/40 border-purple-500/50 text-purple-200 ring-1 ring-purple-500/20'
                            : 'bg-slate-950/40 border-slate-800/80 hover:bg-slate-800/60 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-1.5">
                            <span className="font-mono font-bold text-xs text-purple-400">v6.x</span>
                            <span className="font-semibold text-slate-200 text-xs">Jaspersoft Studio</span>
                          </div>
                          {targetVersion === '6.0.0' && <Check className="w-3.5 h-3.5 text-purple-400" />}
                        </div>
                        <p className="text-[10px] text-slate-400 leading-tight">
                          Para ambientes modernos com Jaspersoft Studio 6+.
                        </p>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className="text-[11px] text-slate-400 truncate max-w-[180px]">
              {reportName}.jrxml
            </p>
          </div>
        </div>

        <div className="h-6 w-px bg-slate-800 mx-2" />

        {/* File Actions */}
        <div className="flex items-center space-x-1">
          <button
            onClick={onOpenTemplates}
            title="Galeria de Modelos de Documentos (Notas, Pedidos, Financeiro)"
            className="px-2.5 py-1.5 text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-md transition flex items-center space-x-1.5 text-xs font-medium"
          >
            <Layers className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Modelos Prontos</span>
          </button>

          <button
            onClick={onOpenWizard}
            title="Assistente Passo a Passo para Criar Documento"
            className="px-2.5 py-1.5 text-emerald-300 hover:text-white bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/30 rounded-md transition flex items-center space-x-1.5 text-xs font-medium"
          >
            <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Assistente</span>
          </button>

          {/* Create Component / Save Selection */}
          {onSaveSelectionAsComponent && (
            <button
              type="button"
              onClick={onSaveSelectionAsComponent}
              title={
                hasSelection
                  ? 'Salvar Elemento(s) Selecionado(s) como Componente no Catálogo'
                  : 'Criar Novo Componente Estruturado para o Catálogo'
              }
              className="px-2.5 py-1.5 rounded-md transition flex items-center space-x-1.5 text-xs font-medium bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 hover:text-white border border-amber-500/40 shadow-xs cursor-pointer"
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">Criar Componente</span>
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept=".jrxml,.xml"
            onChange={onUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Abrir arquivo .jrxml existente"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition flex items-center space-x-1 text-xs"
          >
            <Upload className="w-4 h-4" />
            <span className="hidden sm:inline">Abrir JRXML</span>
          </button>

          <button
            onClick={onDownload}
            title="Exportar arquivo .jrxml para o Sankhya"
            className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/40 rounded-md transition flex items-center space-x-1 text-xs font-medium"
          >
            <Download className="w-4 h-4" />
            <span>Baixar .jrxml</span>
          </button>

          <button
            onClick={onCopyXml}
            title="Copiar código XML para a Área de Transferência"
            className="p-1.5 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-md transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
          </button>

          <div className="h-4 w-px bg-slate-800 mx-1" />

          {/* Undo / Redo */}
          <button
            onClick={onUndo}
            disabled={!canUndo}
            title="Desfazer (Ctrl+Z)"
            className={`p-1.5 rounded-md transition ${
              canUndo
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo}
            title="Refazer (Ctrl+Y)"
            className={`p-1.5 rounded-md transition ${
              canRedo
                ? 'text-slate-300 hover:text-white hover:bg-slate-800'
                : 'text-slate-600 cursor-not-allowed'
            }`}
          >
            <Redo2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Center: Mode Switcher */}
      <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
        <button
          onClick={() => setViewMode('visual')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition ${
            viewMode === 'visual'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layout className="w-3.5 h-3.5" />
          <span>Editor Visual</span>
        </button>

        <button
          onClick={() => setViewMode('code')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition ${
            viewMode === 'code'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCode className="w-3.5 h-3.5" />
          <span>Código JRXML</span>
        </button>

        <button
          onClick={() => setViewMode('preview')}
          className={`flex items-center space-x-1.5 px-3 py-1 rounded-md transition ${
            viewMode === 'preview'
              ? 'bg-slate-800 text-emerald-400 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Simulação / Dados</span>
        </button>
      </div>

      {/* Right Controls: Groups, SQL, Grid, Zoom */}
      <div className="flex items-center space-x-2 text-xs">
        <button
          onClick={onOpenGroupModal}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-300 transition"
          title="Agrupar Relatório por Cliente, Vendedor ou Produto com Subtotais"
        >
          <FolderTree className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden md:inline">Agrupar / Subtotais</span>
        </button>

        <button
          onClick={onOpenSqlModal}
          className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
          title="Editar Consulta SQL (TGFCAB / TGFITE) e Parâmetros"
        >
          <Database className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden md:inline">SQL / Campos</span>
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        {/* Snap to grid */}
        <button
          onClick={() => setSnapGrid(snapGrid === 0 ? 5 : snapGrid === 5 ? 10 : 0)}
          title={`Ajuste à Grade: ${snapGrid === 0 ? 'Desligado' : snapGrid + 'px'}`}
          className={`p-1.5 rounded-md transition flex items-center space-x-1 ${
            snapGrid > 0
              ? 'bg-slate-800 text-sky-400'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          <Grid className="w-3.5 h-3.5" />
          <span className="text-[10px]">{snapGrid === 0 ? 'Off' : `${snapGrid}px`}</span>
        </button>

        {/* Zoom */}
        <div className="flex items-center bg-slate-950 rounded-md border border-slate-800 px-1 py-0.5">
          <button
            onClick={() => setZoom((z) => Math.max(0.25, Math.round((z - 0.1) * 10) / 10))}
            className="p-1 text-slate-400 hover:text-slate-100"
            title="Reduzir Zoom (-10%)"
          >
            <ZoomOut className="w-3 h-3" />
          </button>
          <button
            onClick={() => setZoom(1.0)}
            className="px-1 text-[11px] text-slate-300 font-mono"
            title="Redefinir Zoom para 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(2.5, Math.round((z + 0.1) * 10) / 10))}
            className="p-1 text-slate-400 hover:text-slate-100"
            title="Aumentar Zoom (+10%)"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>
      </div>
    </header>
  );
};
