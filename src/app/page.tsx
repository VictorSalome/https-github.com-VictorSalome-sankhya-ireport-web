'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { X, Plus, FileSpreadsheet, FileText, FolderGit2 } from 'lucide-react';
import { Toolbar } from '../components/Toolbar';
import { Palette } from '../components/Palette';
import { VisualCanvas } from '../components/VisualCanvas';
import { PropertiesPanel } from '../components/PropertiesPanel';
import { CodeEditor } from '../components/CodeEditor';
import { DataPreview } from '../components/DataPreview';
import { SqlQueryModal } from '../components/SqlQueryModal';
import { GroupModal } from '../components/GroupModal';
import { AppDialog, DialogOptions } from '../components/AppDialog';
import { ToastContainer, ToastMessage, ToastType } from '../components/Toast';
import { DocumentTemplatesModal } from '../components/DocumentTemplatesModal';
import { DocumentWizardModal } from '../components/DocumentWizardModal';
import { ComponentCustomizerModal } from '../components/ComponentCustomizerModal';
import { SaveComponentModal } from '../components/SaveComponentModal';
import {
  JRXMLReport,
  BandType,
  ElementType,
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
  JasperReportsVersion,
} from '../types/jrxml';
import { DEFAULT_SANKHYA_REPORT } from '../engine/presets';
import { serializeJRXML } from '../engine/serializer';
import { parseJRXML } from '../engine/parser';
import { SmartBlockDefinition } from '../engine/blocks';
import {
  SankhyaCatalogComponent,
  ComponentCustomProps,
  saveCustomComponent,
} from '../engine/sankhya-components';

export interface ReportTab {
  id: string;
  name: string;
  report: JRXMLReport;
  isSubreport?: boolean;
}

export default function Home() {
  const [tabs, setTabs] = useState<ReportTab[]>([
    {
      id: 'tab-main',
      name: 'relatorio_sankhya.jrxml',
      report: DEFAULT_SANKHYA_REPORT,
      isSubreport: false,
    },
  ]);
  const [activeTabId, setActiveTabId] = useState<string>('tab-main');

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];
  const report = activeTab.report;

  const [activeBand, setActiveBand] = useState<BandType>('detail');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'visual' | 'code' | 'preview'>('visual');
  const [zoom, setZoom] = useState<number>(1.0);
  const [snapGrid, setSnapGrid] = useState<number>(5);
  const [targetVersion, setTargetVersion] = useState<JasperReportsVersion>('4.0.1');
  const [copied, setCopied] = useState<boolean>(false);
  const [sqlModalOpen, setSqlModalOpen] = useState<boolean>(false);
  const [groupModalOpen, setGroupModalOpen] = useState<boolean>(false);
  const [templatesModalOpen, setTemplatesModalOpen] = useState<boolean>(false);
  const [wizardModalOpen, setWizardModalOpen] = useState<boolean>(false);
  const [customizingComponent, setCustomizingComponent] = useState<SankhyaCatalogComponent | null>(null);
  const [saveComponentModalOpen, setSaveComponentModalOpen] = useState<boolean>(false);
  const [saveComponentMode, setSaveComponentMode] = useState<'scaffold' | 'selection'>('selection');

  // App Dialog (replaces native alert, confirm, prompt)
  const [dialog, setDialog] = useState<DialogOptions>({
    isOpen: false,
    type: 'confirm',
    title: '',
    message: '',
  });

  const showConfirm = useCallback(
    (
      title: string,
      message: string,
      onConfirmAction: () => void,
      variant: 'danger' | 'warning' | 'primary' = 'primary',
      confirmText = 'Confirmar'
    ) => {
      setDialog({
        isOpen: true,
        type: 'confirm',
        title,
        message,
        variant,
        confirmText,
        onConfirm: () => {
          setDialog((prev) => ({ ...prev, isOpen: false }));
          onConfirmAction();
        },
        onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
      });
    },
    []
  );

  const showPrompt = useCallback(
    (
      title: string,
      message: string,
      defaultValue: string,
      onConfirmAction: (val: string) => void,
      placeholder = 'Digite aqui...'
    ) => {
      setDialog({
        isOpen: true,
        type: 'prompt',
        title,
        message,
        defaultValue,
        placeholder,
        confirmText: 'Prosseguir',
        onConfirm: (val) => {
          setDialog((prev) => ({ ...prev, isOpen: false }));
          if (val && val.trim()) onConfirmAction(val.trim());
        },
        onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
      });
    },
    []
  );

  const showAlert = useCallback(
    (title: string, message: string, variant: 'danger' | 'warning' | 'info' = 'danger') => {
      setDialog({
        isOpen: true,
        type: 'alert',
        title,
        message,
        variant,
        confirmText: 'Entendi',
        onConfirm: () => setDialog((prev) => ({ ...prev, isOpen: false })),
        onCancel: () => setDialog((prev) => ({ ...prev, isOpen: false })),
      });
    },
    []
  );

  // Toast feedback
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((message: string, type: ToastType = 'success') => {
    setToasts((prev) => [
      ...prev,
      { id: `toast-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, message, type },
    ]);
  }, []);
  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleSelectVersion = useCallback(
    (version: JasperReportsVersion) => {
      setTargetVersion(version);
      const labels: Record<JasperReportsVersion, string> = {
        '4.0.1': 'JR 4.0.1 (Sankhya ERP - Padrão)',
        '5.6.0': 'JR 5.6.0 (iReport Clássico)',
        '6.0.0': 'JR 6.x (Jaspersoft Moderno)',
      };
      addToast(`Versão do JasperReports definida para ${labels[version]}`, 'info');
    },
    [addToast]
  );

  // Undo / Redo History Stack per report
  const historyRef = useRef<JRXMLReport[]>([DEFAULT_SANKHYA_REPORT]);
  const historyIndexRef = useRef<number>(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const pushHistory = useCallback((newReport: JRXMLReport) => {
    const nextHistory = historyRef.current.slice(0, historyIndexRef.current + 1);
    nextHistory.push(JSON.parse(JSON.stringify(newReport)));
    if (nextHistory.length > 30) nextHistory.shift();

    historyRef.current = nextHistory;
    historyIndexRef.current = nextHistory.length - 1;
    setCanUndo(historyIndexRef.current > 0);
    setCanRedo(false);
  }, []);

  const setReport = useCallback(
    (newReportOrUpdater: JRXMLReport | ((prev: JRXMLReport) => JRXMLReport)) => {
      setTabs((prevTabs) =>
        prevTabs.map((t) => {
          if (t.id === activeTabId) {
            const nextReport =
              typeof newReportOrUpdater === 'function'
                ? newReportOrUpdater(t.report)
                : newReportOrUpdater;
            return {
              ...t,
              name: `${nextReport.name}.jrxml`,
              report: nextReport,
            };
          }
          return t;
        })
      );
    },
    [activeTabId]
  );

  const handleUndo = useCallback(() => {
    if (historyIndexRef.current > 0) {
      historyIndexRef.current -= 1;
      const targetState = JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current]));
      setReport(targetState);
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  }, [setReport]);

  const handleRedo = useCallback(() => {
    if (historyIndexRef.current < historyRef.current.length - 1) {
      historyIndexRef.current += 1;
      const targetState = JSON.parse(JSON.stringify(historyRef.current[historyIndexRef.current]));
      setReport(targetState);
      setCanUndo(historyIndexRef.current > 0);
      setCanRedo(historyIndexRef.current < historyRef.current.length - 1);
    }
  }, [setReport]);

  // Update report with automatic history snapshot
  const updateReportWithHistory = useCallback(
    (updater: (prev: JRXMLReport) => JRXMLReport) => {
      setTabs((prevTabs) =>
        prevTabs.map((t) => {
          if (t.id === activeTabId) {
            const next = updater(t.report);
            pushHistory(next);
            return {
              ...t,
              name: `${next.name}.jrxml`,
              report: next,
            };
          }
          return t;
        })
      );
    },
    [activeTabId, pushHistory]
  );

  // Open or switch to a Subreport Tab
  const handleOpenSubreportTab = useCallback(
    (subreportName: string = 'sub_itens') => {
      const cleanName =
        subreportName
          .replace(/["'$FP{}]/g, '')
          .replace(/\.(jasper|jrxml)$/i, '')
          .trim() || 'sub_itens';

      const existingTab = tabs.find((t) => t.name === `${cleanName}.jrxml`);
      if (existingTab) {
        setActiveTabId(existingTab.id);
        setSelectedElementId(null);
        return;
      }

      const subReportObj: JRXMLReport = {
        name: cleanName,
        language: 'groovy',
        pageWidth: 555,
        pageHeight: 200,
        columnWidth: 555,
        leftMargin: 0,
        rightMargin: 0,
        topMargin: 0,
        bottomMargin: 0,
        queryString: `SELECT ITE.CODPROD, PRO.DESCRPROD, ITE.QTDNEG, ITE.VLRUNIT, ITE.VLRTOT\nFROM TGFITE ITE\nINNER JOIN TGFPRO PRO ON (PRO.CODPROD = ITE.CODPROD)\nWHERE ITE.NUNOTA = $P{PK_NUNOTA}`,
        parameters: [
          {
            name: 'PK_NUNOTA',
            class: 'java.math.BigDecimal',
            isForPrompting: false,
            defaultValueExpression: '',
            description: 'Chave da Nota Fiscal recebida do relatório mestre',
          },
        ],
        fields: [
          { name: 'CODPROD', class: 'java.math.BigDecimal' },
          { name: 'DESCRPROD', class: 'java.lang.String' },
          { name: 'QTDNEG', class: 'java.math.BigDecimal' },
          { name: 'VLRUNIT', class: 'java.math.BigDecimal' },
          { name: 'VLRTOT', class: 'java.math.BigDecimal' },
        ],
        variables: [
          {
            name: 'TOTAL_ITENS',
            class: 'java.math.BigDecimal',
            resetType: 'Report',
            calculation: 'Sum',
            variableExpression: '$F{VLRTOT}',
          },
        ],
        bands: {
          columnHeader: {
            type: 'columnHeader',
            title: 'Column Header',
            height: 18,
            elements: [
              {
                id: 'sh-cod',
                type: 'staticText',
                reportElement: { x: 0, y: 2, width: 60, height: 14, backcolor: '#F1F5F9', mode: 'Opaque' },
                textElement: { font: { size: 8, isBold: true } },
                text: 'CÓDIGO',
              },
              {
                id: 'sh-desc',
                type: 'staticText',
                reportElement: { x: 65, y: 2, width: 260, height: 14, backcolor: '#F1F5F9', mode: 'Opaque' },
                textElement: { font: { size: 8, isBold: true } },
                text: 'DESCRIÇÃO DO ITEM',
              },
              {
                id: 'sh-qtd',
                type: 'staticText',
                reportElement: { x: 330, y: 2, width: 70, height: 14, backcolor: '#F1F5F9', mode: 'Opaque' },
                textElement: { font: { size: 8, isBold: true }, textAlignment: 'Right' },
                text: 'QUANTIDADE',
              },
              {
                id: 'sh-tot',
                type: 'staticText',
                reportElement: { x: 405, y: 2, width: 150, height: 14, backcolor: '#F1F5F9', mode: 'Opaque' },
                textElement: { font: { size: 8, isBold: true }, textAlignment: 'Right' },
                text: 'VALOR TOTAL (R$)',
              },
            ],
          },
          detail: {
            type: 'detail',
            title: 'Detail',
            height: 18,
            elements: [
              {
                id: 'sd-cod',
                type: 'textField',
                reportElement: { x: 0, y: 2, width: 60, height: 14 },
                textElement: { font: { size: 8 } },
                expression: '$F{CODPROD}',
              },
              {
                id: 'sd-desc',
                type: 'textField',
                reportElement: { x: 65, y: 2, width: 260, height: 14 },
                textElement: { font: { size: 8 } },
                expression: '$F{DESCRPROD}',
              },
              {
                id: 'sd-qtd',
                type: 'textField',
                reportElement: { x: 330, y: 2, width: 70, height: 14 },
                textElement: { font: { size: 8 }, textAlignment: 'Right' },
                expression: '$F{QTDNEG}',
              },
              {
                id: 'sd-tot',
                type: 'textField',
                reportElement: { x: 405, y: 2, width: 150, height: 14 },
                textElement: { font: { size: 8 }, textAlignment: 'Right' },
                expression: '$F{VLRTOT}',
              },
            ],
          },
          summary: {
            type: 'summary',
            title: 'Summary',
            height: 20,
            elements: [
              {
                id: 'ss-lbl',
                type: 'staticText',
                reportElement: { x: 300, y: 4, width: 100, height: 14 },
                textElement: { font: { size: 8, isBold: true }, textAlignment: 'Right' },
                text: 'TOTAL DOS ITENS:',
              },
              {
                id: 'ss-tot',
                type: 'textField',
                reportElement: { x: 405, y: 4, width: 150, height: 14 },
                textElement: { font: { size: 8, isBold: true }, textAlignment: 'Right' },
                expression: '$V{TOTAL_ITENS}',
              },
            ],
          },
        },
      };

      const newTab: ReportTab = {
        id: `tab-${Date.now()}`,
        name: `${cleanName}.jrxml`,
        report: subReportObj,
        isSubreport: true,
      };

      setTabs((prev) => [...prev, newTab]);
      setActiveTabId(newTab.id);
      setSelectedElementId(null);
    },
    [tabs]
  );

  // 1. Add Element At Specific Coordinates (from Palette drag or click)
  const handleAddElementAt = useCallback(
    (
      type: ElementType,
      rawPosition: { x: number; y: number },
      targetBand: BandType = activeBand,
      presetExpression?: string,
      defaultText?: string
    ) => {
      const band = report.bands[targetBand];
      if (!band) return;

      const existingElements = band.elements;
      const isDefaultOccupied = existingElements.some(
        (el) =>
          el.reportElement.x < 150 &&
          el.reportElement.y < 35 &&
          el.reportElement.x + el.reportElement.width > 10 &&
          el.reportElement.y + el.reportElement.height > 5
      );
      const existingMaxY =
        existingElements.length > 0
          ? Math.max(...existingElements.map((el) => el.reportElement.y + el.reportElement.height))
          : 0;

      const resolvedY =
        rawPosition.x === 10 && rawPosition.y === 5 && (isDefaultOccupied || existingMaxY > 0)
          ? existingMaxY + 10
          : rawPosition.y;
      const position = { x: rawPosition.x, y: resolvedY };

      const newId = `elem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      let newElem: JRXMLElement;

      switch (type) {
        case 'staticText':
          newElem = {
            id: newId,
            type: 'staticText',
            reportElement: {
              x: position.x,
              y: position.y,
              width: 120,
              height: 18,
              forecolor: '#0f172a',
            },
            textElement: {
              textAlignment: 'Left',
              verticalAlignment: 'Middle',
              font: { fontName: 'Arial', size: 9 },
            },
            text: defaultText || 'Novo Rótulo',
          } as JRXMLStaticText;
          break;

        case 'textField':
          newElem = {
            id: newId,
            type: 'textField',
            reportElement: {
              x: position.x,
              y: position.y,
              width: 140,
              height: 18,
              forecolor: '#0f172a',
            },
            textElement: {
              textAlignment: 'Left',
              verticalAlignment: 'Middle',
              font: { fontName: 'Arial', size: 9 },
            },
            expression: presetExpression || '$F{NOVO_CAMPO}',
          } as JRXMLTextField;
          break;

        case 'line':
          newElem = {
            id: newId,
            type: 'line',
            reportElement: {
              x: position.x,
              y: position.y,
              width: report.columnWidth - position.x,
              height: 1,
              forecolor: '#cbd5e1',
            },
            penWidth: 1,
          } as JRXMLLine;
          break;

        case 'rectangle':
          newElem = {
            id: newId,
            type: 'rectangle',
            reportElement: {
              x: position.x,
              y: position.y,
              width: 180,
              height: 24,
              backcolor: '#f8fafc',
              mode: 'Opaque',
            },
            radius: 2,
            penWidth: 1,
            penColor: '#e2e8f0',
          } as JRXMLRectangle;
          break;

        case 'image':
          newElem = {
            id: newId,
            type: 'image',
            reportElement: {
              x: position.x,
              y: position.y,
              width: 100,
              height: 40,
            },
            scaleImage: 'RetainShape',
            expression: '$P{PDIR_MODELO} + "logo.jpg"',
          } as JRXMLImage;
          break;

        case 'barcode':
          newElem = {
            id: newId,
            type: 'barcode',
            barcodeType: 'Code128',
            reportElement: {
              x: position.x,
              y: position.y,
              width: 260,
              height: 48,
            },
            expression: presetExpression || '"35261012345678000195550010000284011000284010"',
            textPosition: 'bottom',
            moduleWidth: 1.0,
          } as JRXMLBarcode;
          break;

        case 'subreport':
          newElem = {
            id: newId,
            type: 'subreport',
            reportElement: {
              x: position.x,
              y: position.y,
              width: Math.min(555, report.columnWidth),
              height: 45,
            },
            subreportExpression: presetExpression || '$P{PDIR_MODELO} + "sub_itens.jasper"',
            connectionExpression: '$P{REPORT_CONNECTION}',
            parameters: [
              {
                name: 'PK_NUNOTA',
                expression: '$F{NUNOTA}',
              },
            ],
            isUsingCache: true,
          } as JRXMLSubreport;
          break;

        case 'chart':
          newElem = {
            id: newId,
            type: 'chart',
            chartType: (presetExpression as any) || 'barChart',
            reportElement: {
              x: position.x,
              y: position.y,
              width: Math.min(320, report.columnWidth),
              height: 160,
            },
            title: defaultText || 'Faturamento por Vendedor',
            isShowLegend: true,
            isShowLabels: true,
            seriesExpression: '"Vendas"',
            categoryExpression: '$F{APELIDO}',
            keyExpression: '$F{APELIDO}',
            valueExpression: '$F{VLRTOT}',
          } as JRXMLChart;
          break;

        case 'crosstab':
          newElem = {
            id: newId,
            type: 'crosstab',
            reportElement: {
              x: position.x,
              y: position.y,
              width: Math.min(555, report.columnWidth),
              height: 140,
            },
            rowGroup: {
              name: 'Vendedor',
              width: 120,
              totalPosition: 'End',
              bucketExpression: '$F{APELIDO}',
              totalText: 'Total Vendedores',
            },
            columnGroup: {
              name: 'Mes',
              height: 20,
              totalPosition: 'End',
              bucketExpression: '$F{MES}',
              totalText: 'Total Geral',
            },
            measure: {
              name: 'TotalVendas',
              calculation: 'Sum',
              expression: '$F{VLRTOT}',
              pattern: '#,##0.00',
            },
            cellWidth: 60,
            cellHeight: 20,
          } as JRXMLCrosstab;
          break;
      }

      updateReportWithHistory((prev) => {
        const curBand = prev.bands[targetBand];
        if (!curBand) return prev;

        const newElementMaxY = newElem.reportElement.y + newElem.reportElement.height;
        const newHeight = Math.max(curBand.height, newElementMaxY + 15);

        return {
          ...prev,
          bands: {
            ...prev.bands,
            [targetBand]: {
              ...curBand,
              height: newHeight,
              elements: [...curBand.elements, newElem],
            },
          },
        };
      });

      setActiveBand(targetBand);
      setSelectedElementId(newId);
    },
    [activeBand, report.bands, report.columnWidth, updateReportWithHistory]
  );

  // 2. Add Smart Block (Pre-built Section)
  const handleAddSmartBlock = useCallback(
    (block: SmartBlockDefinition) => {
      const generatedElements = block.elements(report.columnWidth);
      const targetBand = block.targetBand;

      updateReportWithHistory((prev) => {
        const band = prev.bands[targetBand];
        if (!band) return prev;

        // Auto-expand band height if needed
        const maxY = Math.max(...generatedElements.map((el) => el.reportElement.y + el.reportElement.height));
        const newHeight = Math.max(band.height, maxY + 10);

        return {
          ...prev,
          bands: {
            ...prev.bands,
            [targetBand]: {
              ...band,
              height: newHeight,
              elements: [...band.elements, ...generatedElements],
            },
          },
        };
      });

      setActiveBand(targetBand);
    },
    [report.columnWidth, updateReportWithHistory]
  );

  // 2.1 Add Sankhya Catalog Component
  const handleAddCatalogComponent = useCallback(
    (comp: SankhyaCatalogComponent, customProps?: ComponentCustomProps) => {
      const colW = (customProps as any)?.slotWidth || report.columnWidth;
      const slotX = (customProps as any)?.slotX || 0;
      const generatedElements = comp.generate(colW, customProps);
      const targetBand = customProps?.targetBand || comp.band;

      updateReportWithHistory((prev) => {
        const band = prev.bands[targetBand];
        if (!band) return prev;

        const existingElements = band.elements;
        const existingMaxY =
          existingElements.length > 0
            ? Math.max(...existingElements.map((el) => el.reportElement.y + el.reportElement.height))
            : 0;

        // Se veio de dropY pontual, usa dropY; se veio do clique de '+ Inserir', empilha abaixo do último elemento com respiro de 10px
        const offsetY =
          (customProps as any)?.dropY !== undefined
            ? (customProps as any).dropY
            : existingMaxY > 0
            ? existingMaxY + 10
            : 0;

        const positionedElements = generatedElements.map((el) => ({
          ...el,
          reportElement: {
            ...el.reportElement,
            x: el.reportElement.x + slotX,
            y: el.reportElement.y + offsetY,
          },
        }));

        const maxY = Math.max(...positionedElements.map((el) => el.reportElement.y + el.reportElement.height));
        const newHeight = Math.max(band.height, maxY + 15);

        return {
          ...prev,
          bands: {
            ...prev.bands,
            [targetBand]: {
              ...band,
              height: newHeight,
              elements: [...band.elements, ...positionedElements],
            },
          },
        };
      });

      setActiveBand(targetBand);
      addToast(`Componente "${comp.title}" inserido na banda ${targetBand}`, 'success');
    },
    [report.columnWidth, updateReportWithHistory, addToast]
  );

  // 2.2 Selected Element in Active Band
  const selectedElement = useMemo(() => {
    if (!selectedElementId) return null;
    return report.bands[activeBand]?.elements.find((el) => el.id === selectedElementId) || null;
  }, [report.bands, activeBand, selectedElementId]);

  // 2.3 Save Selection as Custom Catalog Component
  const handleConfirmSaveCustomComponent = useCallback(
    (data: {
      title: string;
      category: any;
      categoryLabel: string;
      description: string;
      band: BandType;
      height: number;
      badge: string;
      elements: JRXMLElement[];
    }) => {
      saveCustomComponent({
        title: data.title,
        category: data.category,
        categoryLabel: data.categoryLabel,
        description: data.description,
        band: data.band,
        height: data.height,
        badge: data.badge,
        elements: data.elements,
      });
      addToast(`Bloco "${data.title}" salvo com sucesso em Meus Blocos!`, 'success');
    },
    [addToast]
  );

  // 3. Duplicate Element (Ctrl+D)
  const handleDuplicateElement = useCallback(
    (bandKey: string, elementId: string) => {
      updateReportWithHistory((prev) => {
        if (bandKey.startsWith('group-header-') || bandKey.startsWith('group-footer-')) {
          const isHeader = bandKey.startsWith('group-header-');
          const gId = bandKey.replace(isHeader ? 'group-header-' : 'group-footer-', '');
          const updatedGroups = (prev.groups || []).map((g) => {
            if (g.id === gId) {
              const targetBand = isHeader ? g.headerBand : g.footerBand;
              if (!targetBand) return g;
              const original = targetBand.elements.find((el) => el.id === elementId);
              if (!original) return g;
              const cloneId = `elem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
              const clone: JRXMLElement = {
                ...JSON.parse(JSON.stringify(original)),
                id: cloneId,
                reportElement: {
                  ...original.reportElement,
                  x: original.reportElement.x + 10,
                  y: original.reportElement.y + 10,
                  uuid: crypto.randomUUID(),
                },
              };
              return {
                ...g,
                [isHeader ? 'headerBand' : 'footerBand']: {
                  ...targetBand,
                  elements: [...targetBand.elements, clone],
                },
              };
            }
            return g;
          });
          return { ...prev, groups: updatedGroups };
        }

        const band = prev.bands[bandKey as BandType];
        if (!band) return prev;

        const original = band.elements.find((el) => el.id === elementId);
        if (!original) return prev;

        const cloneId = `elem-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
        const cloneX = Math.max(0, original.reportElement.x + 10);
        const cloneY = Math.max(0, original.reportElement.y + 10);
        const cloneW = Math.max(15, original.reportElement.width);
        const cloneH = Math.max(10, original.reportElement.height);
        const clone: JRXMLElement = {
          ...JSON.parse(JSON.stringify(original)),
          id: cloneId,
          reportElement: {
            ...original.reportElement,
            x: cloneX,
            y: cloneY,
            width: cloneW,
            height: cloneH,
            uuid: crypto.randomUUID(),
          },
        };

        const requiredHeight = cloneY + cloneH + 15;

        return {
          ...prev,
          bands: {
            ...prev.bands,
            [bandKey]: {
              ...band,
              height: Math.max(band.height, requiredHeight),
              elements: [...band.elements, clone],
            },
          },
        };
      });
    },
    [updateReportWithHistory]
  );

  // 4. Update Element
  const handleUpdateElement = useCallback(
    (bandKey: string, elementId: string, updates: Partial<JRXMLElement>) => {
      setReport((prev) => {
        if (bandKey.startsWith('group-header-') || bandKey.startsWith('group-footer-')) {
          const isHeader = bandKey.startsWith('group-header-');
          const gId = bandKey.replace(isHeader ? 'group-header-' : 'group-footer-', '');
          const updatedGroups = (prev.groups || []).map((g) => {
            if (g.id === gId) {
              const targetBand = isHeader ? g.headerBand : g.footerBand;
              if (!targetBand) return g;
              let bandMaxY = 0;
              const updatedElements = targetBand.elements.map((el) => {
                if (el.id === elementId) {
                  const mergedRep = {
                    ...el.reportElement,
                    ...(updates.reportElement || {}),
                  };
                  const sanitizedX = Math.max(0, mergedRep.x);
                  const sanitizedY = Math.max(0, mergedRep.y);
                  const sanitizedW = Math.max(15, mergedRep.width);
                  const sanitizedH = Math.max(10, mergedRep.height);
                  const newEl = {
                    ...el,
                    ...updates,
                    reportElement: {
                      ...mergedRep,
                      x: sanitizedX,
                      y: sanitizedY,
                      width: sanitizedW,
                      height: sanitizedH,
                    },
                  } as JRXMLElement;
                  bandMaxY = Math.max(bandMaxY, sanitizedY + sanitizedH + 15);
                  return newEl;
                }
                bandMaxY = Math.max(bandMaxY, el.reportElement.y + el.reportElement.height);
                return el;
              });
              return {
                ...g,
                [isHeader ? 'headerBand' : 'footerBand']: {
                  ...targetBand,
                  height: Math.max(targetBand.height, bandMaxY),
                  elements: updatedElements,
                },
              };
            }
            return g;
          });
          return { ...prev, groups: updatedGroups };
        }

        const band = prev.bands[bandKey as BandType];
        if (!band) return prev;

        let bandMaxY = 0;
        const updatedElements = band.elements.map((el) => {
          if (el.id === elementId) {
            const mergedRep = {
              ...el.reportElement,
              ...(updates.reportElement || {}),
            };
            const sanitizedX = Math.max(0, mergedRep.x);
            const sanitizedY = Math.max(0, mergedRep.y);
            const sanitizedW = Math.max(15, mergedRep.width);
            const sanitizedH = Math.max(10, mergedRep.height);
            const newEl = {
              ...el,
              ...updates,
              reportElement: {
                ...mergedRep,
                x: sanitizedX,
                y: sanitizedY,
                width: sanitizedW,
                height: sanitizedH,
              },
            } as JRXMLElement;
            bandMaxY = Math.max(bandMaxY, sanitizedY + sanitizedH + 15);
            return newEl;
          }
          bandMaxY = Math.max(bandMaxY, el.reportElement.y + el.reportElement.height);
          return el;
        });

        return {
          ...prev,
          bands: {
            ...prev.bands,
            [bandKey]: {
              ...band,
              height: Math.max(band.height, bandMaxY),
              elements: updatedElements,
            },
          },
        };
      });
    },
    []
  );

  // 4.1 Move Element Between Bands (Cross-band drag & drop or selector)
  const handleMoveElementToBand = useCallback(
    (sourceBandKey: string, targetBandKey: BandType, elementId: string, newY?: number) => {
      updateReportWithHistory((prev) => {
        let elementToMove: JRXMLElement | null = null;
        let nextBands = { ...prev.bands };

        // Remove from source band
        if (sourceBandKey.startsWith('group-header-') || sourceBandKey.startsWith('group-footer-')) {
          const isHeader = sourceBandKey.startsWith('group-header-');
          const gId = sourceBandKey.replace(isHeader ? 'group-header-' : 'group-footer-', '');
          const newGroups = (prev.groups || []).map((g) => {
            if (g.id === gId) {
              const targetB = isHeader ? g.headerBand : g.footerBand;
              if (!targetB) return g;
              elementToMove = targetB.elements.find((el) => el.id === elementId) || null;
              return {
                ...g,
                [isHeader ? 'headerBand' : 'footerBand']: {
                  ...targetB,
                  elements: targetB.elements.filter((el) => el.id !== elementId),
                },
              };
            }
            return g;
          });
          prev = { ...prev, groups: newGroups };
        } else {
          const srcBand = nextBands[sourceBandKey as BandType];
          if (srcBand) {
            elementToMove = srcBand.elements.find((el) => el.id === elementId) || null;
            nextBands[sourceBandKey as BandType] = {
              ...srcBand,
              elements: srcBand.elements.filter((el) => el.id !== elementId),
            };
          }
        }

        if (!elementToMove) return prev;

        // Add to target band
        const tgtBand = nextBands[targetBandKey];
        if (!tgtBand) return prev;

        const placedY = newY !== undefined ? Math.max(0, newY) : 10;
        const placedX = Math.max(0, elementToMove.reportElement.x);
        const placedW = Math.max(15, elementToMove.reportElement.width);
        const placedH = Math.max(10, elementToMove.reportElement.height);

        const placedElement: JRXMLElement = {
          ...elementToMove,
          reportElement: {
            ...elementToMove.reportElement,
            x: placedX,
            y: placedY,
            width: placedW,
            height: placedH,
          },
        };

        const requiredHeight = placedY + placedH + 15;
        nextBands[targetBandKey] = {
          ...tgtBand,
          height: Math.max(tgtBand.height, requiredHeight),
          elements: [...tgtBand.elements, placedElement],
        };

        return {
          ...prev,
          bands: nextBands,
        };
      });

      setActiveBand(targetBandKey);
      addToast(`Elemento movido para a banda ${targetBandKey}`, 'info');
    },
    [updateReportWithHistory, addToast]
  );

  // 5. Delete Element
  const handleDeleteElement = useCallback(
    (bandKey: string, elementId: string) => {
      updateReportWithHistory((prev) => {
        if (bandKey.startsWith('group-header-') || bandKey.startsWith('group-footer-')) {
          const isHeader = bandKey.startsWith('group-header-');
          const gId = bandKey.replace(isHeader ? 'group-header-' : 'group-footer-', '');
          const updatedGroups = (prev.groups || []).map((g) => {
            if (g.id === gId) {
              const targetBand = isHeader ? g.headerBand : g.footerBand;
              if (!targetBand) return g;
              return {
                ...g,
                [isHeader ? 'headerBand' : 'footerBand']: {
                  ...targetBand,
                  elements: targetBand.elements.filter((el) => el.id !== elementId),
                },
              };
            }
            return g;
          });
          return { ...prev, groups: updatedGroups };
        }

        const band = prev.bands[bandKey as BandType];
        if (!band) return prev;

        return {
          ...prev,
          bands: {
            ...prev.bands,
            [bandKey]: {
              ...band,
              elements: band.elements.filter((el) => el.id !== elementId),
            },
          },
        };
      });
      setSelectedElementId(null);
    },
    [updateReportWithHistory]
  );

  // 6. Update Band Height
  const handleUpdateBandHeight = useCallback((bandKey: string, height: number) => {
    setReport((prev) => {
      if (bandKey.startsWith('group-header-') || bandKey.startsWith('group-footer-')) {
        const isHeader = bandKey.startsWith('group-header-');
        const gId = bandKey.replace(isHeader ? 'group-header-' : 'group-footer-', '');
        const updatedGroups = (prev.groups || []).map((g) => {
          if (g.id === gId) {
            const targetBand = isHeader ? g.headerBand : g.footerBand;
            if (!targetBand) return g;
            return {
              ...g,
              [isHeader ? 'headerBand' : 'footerBand']: {
                ...targetBand,
                height,
              },
            };
          }
          return g;
        });
        return { ...prev, groups: updatedGroups };
      }

      const band = prev.bands[bandKey as BandType];
      if (!band) return prev;

      return {
        ...prev,
        bands: {
          ...prev.bands,
          [bandKey]: {
            ...band,
            height,
          },
        },
      };
    });
  }, []);

  // 7. Update Report Properties
  const handleUpdateReport = useCallback(
    (updates: Partial<JRXMLReport>) => {
      updateReportWithHistory((prev) => ({
        ...prev,
        ...updates,
      }));
    },
    [updateReportWithHistory]
  );

  // 8. Download JRXML file
  const handleDownloadXml = useCallback(() => {
    try {
      const xml = serializeJRXML(report, { version: targetVersion });
      const safeName =
        (report.name || 'relatorio_sankhya').trim().replace(/[^a-zA-Z0-9_\-]/g, '_') ||
        'relatorio_sankhya';
      const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${safeName}.jrxml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      addToast(`Arquivo "${safeName}.jrxml" exportado com sucesso!`, 'success');
    } catch (err) {
      console.error('Falha ao baixar arquivo JRXML:', err);
      showAlert('Erro ao Exportar', 'Ocorreu uma falha ao gerar o arquivo JRXML.', 'danger');
    }
  }, [report, targetVersion, addToast, showAlert]);

  // 9. Upload JRXML file
  const handleUploadXml = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        if (text) {
          try {
            const parsed = parseJRXML(text);
            updateReportWithHistory(() => parsed);
            setSelectedElementId(null);
            addToast(`Relatório carregado: ${parsed.name || 'relatorio'}.jrxml`, 'success');
          } catch (err: any) {
            showAlert(
              'Erro ao Carregar JRXML',
              'O arquivo selecionado não pôde ser lido: ' + (err.message || err),
              'danger'
            );
          }
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    },
    [updateReportWithHistory, addToast, showAlert]
  );

  // 10. Copy XML to Clipboard
  const handleCopyXml = useCallback(() => {
    try {
      const xml = serializeJRXML(report, { version: targetVersion });
      navigator.clipboard.writeText(xml);
      setCopied(true);
      addToast('Código JRXML copiado com sucesso!', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Falha ao copiar:', err);
      showAlert('Erro ao Copiar', 'Não foi possível copiar o XML para a área de transferência.', 'danger');
    }
  }, [report, targetVersion, addToast, showAlert]);

  // 11. Keyboard shortcuts (Undo, Redo, Delete, Duplicate, Nudge)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      // Undo: Ctrl+Z / Cmd+Z
      if (cmdKey && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        handleUndo();
        return;
      }

      // Redo: Ctrl+Y / Cmd+Y or Ctrl+Shift+Z
      if ((cmdKey && e.key.toLowerCase() === 'y') || (cmdKey && e.shiftKey && e.key.toLowerCase() === 'z')) {
        e.preventDefault();
        handleRedo();
        return;
      }

      // Duplicate: Ctrl+D / Cmd+D
      if (cmdKey && e.key.toLowerCase() === 'd' && selectedElementId) {
        e.preventDefault();
        handleDuplicateElement(activeBand, selectedElementId);
        return;
      }

      // Delete or Backspace
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
        e.preventDefault();
        handleDeleteElement(activeBand, selectedElementId);
        return;
      }

      // Escape to deselect
      if (e.key === 'Escape') {
        setSelectedElementId(null);
        return;
      }

      // Arrow keys to nudge
      if (selectedElementId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const step = e.shiftKey ? 5 : 1;
        const deltaX = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const deltaY = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;

        const band = report.bands[activeBand];
        const elem = band?.elements.find((el) => el.id === selectedElementId);
        if (elem) {
          handleUpdateElement(activeBand, selectedElementId, {
            reportElement: {
              ...elem.reportElement,
              x: Math.max(0, elem.reportElement.x + deltaX),
              y: Math.max(0, elem.reportElement.y + deltaY),
            },
          });
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    selectedElementId,
    activeBand,
    report,
    handleUndo,
    handleRedo,
    handleDuplicateElement,
    handleDeleteElement,
    handleUpdateElement,
  ]);

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 select-none overflow-hidden print:h-auto print:w-auto print:overflow-visible print:bg-white">
      {/* Top Application Toolbar */}
      <Toolbar
        viewMode={viewMode}
        setViewMode={setViewMode}
        reportName={report.name}
        zoom={zoom}
        setZoom={setZoom}
        snapGrid={snapGrid}
        setSnapGrid={setSnapGrid}
        targetVersion={targetVersion}
        setTargetVersion={handleSelectVersion}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onNew={() => setTemplatesModalOpen(true)}
        onOpenTemplates={() => setTemplatesModalOpen(true)}
        onOpenWizard={() => setWizardModalOpen(true)}
        onDownload={handleDownloadXml}
        onUpload={handleUploadXml}
        onCopyXml={handleCopyXml}
        copied={copied}
        onOpenSqlModal={() => setSqlModalOpen(true)}
        onOpenGroupModal={() => setGroupModalOpen(true)}
        hasSelection={!!selectedElementId}
        onSaveSelectionAsComponent={() => {
          setSaveComponentMode(selectedElementId ? 'selection' : 'scaffold');
          setSaveComponentModalOpen(true);
        }}
      />

      {/* Multi-Tab Workspace Bar */}
      <div className="no-print h-9 bg-slate-900 border-b border-slate-800 flex items-center px-3 space-x-1 overflow-x-auto select-none shrink-0">
        <div className="flex items-center space-x-1">
          {tabs.map((t) => {
            const isActive = t.id === activeTabId;
            return (
              <div
                key={t.id}
                onClick={() => {
                  setActiveTabId(t.id);
                  setSelectedElementId(null);
                }}
                className={`group flex items-center space-x-2 px-3 py-1.5 text-xs rounded-t font-medium border-t-2 transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-950 text-emerald-400 border-emerald-500 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 border-transparent hover:bg-slate-800/80 hover:text-slate-200'
                }`}
              >
                {t.isSubreport ? (
                  <FolderGit2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                ) : (
                  <FileText className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                )}
                <span className="max-w-[140px] truncate">{t.name}</span>
                {tabs.length > 1 && (
                  <button
                    title="Fechar aba"
                    onClick={(e) => {
                      e.stopPropagation();
                      showConfirm(
                        'Fechar Aba',
                        `Deseja realmente fechar a aba "${t.name}"? As alterações não salvas serão descartadas.`,
                        () => {
                          const newTabs = tabs.filter((item) => item.id !== t.id);
                          setTabs(newTabs);
                          if (activeTabId === t.id) {
                            setActiveTabId(newTabs[0].id);
                            setSelectedElementId(null);
                          }
                          addToast(`Aba "${t.name}" fechada`, 'info');
                        },
                        'danger',
                        'Fechar Aba'
                      );
                    }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-slate-700/60 text-slate-400 hover:text-slate-100 transition-opacity ml-1"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>

        <button
          onClick={() => {
            showPrompt(
              'Novo Sub-relatório',
              'Informe o nome para o novo sub-relatório que será aberto em uma nova aba:',
              `sub_${Date.now().toString(36).slice(-4)}`,
              (subName) => {
                handleOpenSubreportTab(subName);
                addToast(`Aba criada: ${subName}.jrxml`, 'success');
              },
              'Ex: sub_duplicatas'
            );
          }}
          className="flex items-center space-x-1 px-2.5 py-1 text-xs text-slate-400 hover:text-emerald-400 hover:bg-slate-800/60 rounded transition-colors ml-2"
          title="Novo Sub-relatório em Nova Aba"
        >
          <Plus className="w-3 h-3" />
          <span>Nova Aba</span>
        </button>
      </div>

      {/* Main Workspace Area */}
      <div className="flex flex-1 overflow-hidden relative print:overflow-visible print:h-auto">
        {viewMode === 'visual' && (
          <>
            {/* Left Tools & Presets Palette */}
            <Palette
              onAddElement={(type, presetExpr, defaultTxt) => {
                const targetBand = activeBand;
                const curBand = report.bands[targetBand];
                const existingElements = curBand?.elements || [];
                const existingMaxY =
                  existingElements.length > 0
                    ? Math.max(...existingElements.map((el) => el.reportElement.y + el.reportElement.height))
                    : 0;
                const isDefaultOccupied = existingElements.some(
                  (el) =>
                    el.reportElement.x < 150 &&
                    el.reportElement.y < 35 &&
                    el.reportElement.x + el.reportElement.width > 10 &&
                    el.reportElement.y + el.reportElement.height > 5
                );
                const posY =
                  isDefaultOccupied || (existingElements.length > 0 && existingMaxY > 0)
                    ? existingMaxY + 10
                    : 5;
                handleAddElementAt(type, { x: 10, y: posY }, targetBand, presetExpr, defaultTxt);
              }}
              onAddCatalogComponent={handleAddCatalogComponent}
              onCustomizeComponent={(comp) => setCustomizingComponent(comp)}
              onOpenCreateComponent={(mode = 'scaffold') => {
                setSaveComponentMode(mode);
                setSaveComponentModalOpen(true);
              }}
              report={report}
              activeBand={activeBand}
              setActiveBand={setActiveBand}
              selectedElementId={selectedElementId}
              onSelectElement={(id, band) => {
                setActiveBand(band);
                setSelectedElementId(id);
              }}
            />

            {/* Center Visual WYSIWYG Canvas with Drag & Drop */}
            <VisualCanvas
              report={report}
              activeBand={activeBand}
              setActiveBand={setActiveBand}
              selectedElementId={selectedElementId}
              setSelectedElementId={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onUpdateBandHeight={handleUpdateBandHeight}
              onAddElementAt={handleAddElementAt}
              onAddSmartBlock={handleAddSmartBlock}
              onAddCatalogComponent={handleAddCatalogComponent}
              onMoveElementToBand={handleMoveElementToBand}
              onDuplicateElement={handleDuplicateElement}
              onDeleteElement={handleDeleteElement}
              zoom={zoom}
              setZoom={setZoom}
              snapGrid={snapGrid}
            />

            {/* Right Properties Inspector */}
            <PropertiesPanel
              report={report}
              activeBand={activeBand}
              selectedElementId={selectedElementId}
              onUpdateElement={handleUpdateElement}
              onDeleteElement={handleDeleteElement}
              onUpdateReport={handleUpdateReport}
              onUpdateBandHeight={handleUpdateBandHeight}
              onOpenSubreportTab={handleOpenSubreportTab}
              onSaveAsComponent={() => {
                setSaveComponentMode('selection');
                setSaveComponentModalOpen(true);
              }}
              onMoveElementToBand={handleMoveElementToBand}
            />
          </>
        )}

        {viewMode === 'code' && (
          <CodeEditor
            report={report}
            onUpdateReportFromXml={(newReport) => updateReportWithHistory(() => newReport)}
            onDownload={handleDownloadXml}
            targetVersion={targetVersion}
            onSelectVersion={handleSelectVersion}
          />
        )}

        {viewMode === 'preview' && <DataPreview report={report} />}
      </div>

      {/* SQL & Parameters Modal */}
      <SqlQueryModal
        isOpen={sqlModalOpen}
        onClose={() => setSqlModalOpen(false)}
        report={report}
        onUpdateReport={handleUpdateReport}
      />

      {/* Grouping & Subtotals Modal */}
      <GroupModal
        isOpen={groupModalOpen}
        onClose={() => setGroupModalOpen(false)}
        report={report}
        onUpdateReport={handleUpdateReport}
      />

      {/* Sankhya Document Templates Gallery */}
      <DocumentTemplatesModal
        isOpen={templatesModalOpen}
        onClose={() => setTemplatesModalOpen(false)}
        onSelectTemplate={(newReport) => {
          updateReportWithHistory(() => newReport);
          setSelectedElementId(null);
          addToast(`Modelo carregado: ${newReport.name}.jrxml`, 'success');
          setTemplatesModalOpen(false);
        }}
        onOpenWizard={() => {
          setTemplatesModalOpen(false);
          setWizardModalOpen(true);
        }}
      />

      {/* Step-by-Step Document Wizard */}
      <DocumentWizardModal
        isOpen={wizardModalOpen}
        onClose={() => setWizardModalOpen(false)}
        onGenerateReport={(newReport) => {
          updateReportWithHistory(() => newReport);
          setSelectedElementId(null);
          addToast(`Documento gerado: ${newReport.name}.jrxml`, 'success');
          setWizardModalOpen(false);
        }}
      />

      {/* Sankhya Component Customizer & Live Props Modal */}
      <ComponentCustomizerModal
        isOpen={!!customizingComponent}
        component={customizingComponent}
        columnWidth={report.columnWidth}
        onClose={() => setCustomizingComponent(null)}
        onInsert={(comp, customProps) => {
          handleAddCatalogComponent(comp, customProps);
          setCustomizingComponent(null);
        }}
      />

      {/* Save Selection / Create Custom Component Modal */}
      <SaveComponentModal
        isOpen={saveComponentModalOpen}
        onClose={() => setSaveComponentModalOpen(false)}
        selectedElements={selectedElement ? [selectedElement] : []}
        defaultBand={activeBand}
        columnWidth={report.columnWidth}
        initialMode={saveComponentMode}
        onConfirmSave={handleConfirmSaveCustomComponent}
      />

      {/* Modern App Dialog System (Replaces native alert, confirm, prompt) */}
      <AppDialog {...dialog} />

      {/* Toast Feedback Notifications */}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </div>
  );
}
