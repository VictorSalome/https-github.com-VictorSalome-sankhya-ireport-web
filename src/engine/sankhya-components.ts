import { JRXMLElement, JRXMLChart, JRXMLCrosstab, BandType } from '../types/jrxml';

export type ComponentCategory = 'fiscal' | 'finance' | 'stock' | 'structural' | 'custom';
export type ComponentTheme = 'classic' | 'minimal' | 'contrast' | 'corporate';

export interface ComponentCustomProps {
  theme?: ComponentTheme;
  targetBand?: BandType;
  borderColor?: string;
  borderWidth?: number;
  backgroundColor?: string;
  fieldToggles?: Record<string, boolean>;
  slotWidth?: number;
  slotX?: number;
  dropY?: number;
}

export interface ConfigurableFieldOption {
  key: string;
  label: string;
  defaultValue: boolean;
  description?: string;
}

export interface SankhyaCatalogComponent {
  id: string;
  title: string;
  category: ComponentCategory;
  categoryLabel: string;
  description: string;
  band: BandType;
  tags: string[];
  height: number;
  badge: string;
  isCustom?: boolean;
  configurableFields?: ConfigurableFieldOption[];
  generate: (columnWidth: number, customProps?: ComponentCustomProps) => JRXMLElement[];
}

export interface SankhyaCustomBlock {
  id: string;
  title: string;
  category: ComponentCategory;
  categoryLabel: string;
  description: string;
  band: BandType;
  height: number;
  badge: string;
  createdAt: number;
  elements: JRXMLElement[];
}

export const CUSTOM_COMPONENTS_STORAGE_KEY = 'sankhya_custom_components';

export function getCustomComponents(): SankhyaCustomBlock[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CUSTOM_COMPONENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomComponent(block: Omit<SankhyaCustomBlock, 'id' | 'createdAt'>): SankhyaCustomBlock {
  const blocks = getCustomComponents();
  const newBlock: SankhyaCustomBlock = {
    ...block,
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
  };
  blocks.unshift(newBlock);
  try {
    localStorage.setItem(CUSTOM_COMPONENTS_STORAGE_KEY, JSON.stringify(blocks));
    window.dispatchEvent(new Event('sankhya_custom_component_saved'));
  } catch (e) {
    console.error('Failed to save custom component to localStorage', e);
  }
  return newBlock;
}

export function deleteCustomComponent(id: string): void {
  const blocks = getCustomComponents().filter((b) => b.id !== id);
  try {
    localStorage.setItem(CUSTOM_COMPONENTS_STORAGE_KEY, JSON.stringify(blocks));
    window.dispatchEvent(new Event('sankhya_custom_component_saved'));
  } catch (e) {
    console.error('Failed to delete custom component from localStorage', e);
  }
}

export function customBlockToCatalogComponent(block: SankhyaCustomBlock): SankhyaCatalogComponent {
  return {
    id: block.id,
    title: block.title,
    category: block.category,
    categoryLabel: block.categoryLabel,
    description: block.description,
    band: block.band,
    tags: ['meus blocos', 'personalizado', 'custom', block.title.toLowerCase()],
    height: block.height,
    badge: block.badge || 'Personalizado',
    isCustom: true,
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const { backcolor, penColor, penWidth } = getThemeColors(customProps);
      return block.elements.map((el) => {
        const clone = JSON.parse(JSON.stringify(el));
        clone.id = `c-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        if (customProps && clone.type === 'rectangle') {
          if (backcolor) {
            clone.reportElement.backcolor = backcolor;
            clone.reportElement.mode = backcolor === 'transparent' ? 'Transparent' : 'Opaque';
          }
          if (penColor) clone.penColor = penColor;
          if (penWidth !== undefined) clone.penWidth = penWidth;
        }
        return clone;
      });
    },
  };
}

export function getThemeColors(customProps?: ComponentCustomProps) {
  const theme = customProps?.theme || 'classic';
  let backcolor = '#F8FAFC';
  let penColor = '#CBD5E1';
  let penWidth = 1;
  let textColor = '#0F172A';
  let mutedColor = '#64748B';

  if (theme === 'minimal') {
    backcolor = 'transparent';
    penColor = '#E2E8F0';
    penWidth = 0.5;
    textColor = '#1E293B';
    mutedColor = '#94A3B8';
  } else if (theme === 'contrast') {
    backcolor = '#FFFFFF';
    penColor = '#0F172A';
    penWidth = 1.5;
    textColor = '#000000';
    mutedColor = '#334155';
  } else if (theme === 'corporate') {
    backcolor = '#F0F9FF';
    penColor = '#0284C7';
    penWidth = 1;
    textColor = '#0F172A';
    mutedColor = '#0369A1';
  }

  if (customProps?.backgroundColor !== undefined) {
    backcolor = customProps.backgroundColor;
  }
  if (customProps?.borderColor !== undefined) {
    penColor = customProps.borderColor;
  }
  if (customProps?.borderWidth !== undefined) {
    penWidth = customProps.borderWidth;
  }

  return { backcolor, penColor, penWidth, textColor, mutedColor };
}

/**
 * Helper to calculate grid columns with symmetric margins and exact right-edge clamping.
 * Usable width = colW - startX - endMargin (default: colW - 16).
 * The last column absorbs the remainder so that colX + colWidth === colW - endMargin.
 */
export function calculateGridColumns(colW: number, count: number, startX = 8, endMargin = 8) {
  const usableW = Math.max(0, colW - startX - endMargin);
  const baseW = Math.floor(usableW / count);
  return Array.from({ length: count }, (_, i) => {
    const x = startX + i * baseW;
    const width = i === count - 1 ? colW - endMargin - x : baseW;
    return { x, width };
  });
}

/**
 * Creates a subtle vertical divider line between columns (DANFE Official Pattern)
 */
export function createVerticalDivider(
  id: string,
  x: number,
  y: number,
  height: number,
  penColor = '#CBD5E1',
  penWidth = 1
): JRXMLElement {
  return {
    id,
    type: 'line',
    reportElement: { x, y, width: 1, height, forecolor: penColor },
    penWidth: 1,
    penColor,
  };
}

export type ComponentScaffoldType =
  | 'card-info'
  | 'table-grid'
  | 'totalizer'
  | 'barcode-label'
  | 'signature-box'
  | 'blank-box';

export interface ComponentScaffoldOption {
  type: ComponentScaffoldType;
  title: string;
  description: string;
  height: number;
}

export const SCAFFOLD_OPTIONS: ComponentScaffoldOption[] = [
  {
    type: 'card-info',
    title: 'Card Informativo com Moldura',
    description: 'Título no topo, 2 a 3 rótulos e campos de dados, moldura retangular com cor customizável.',
    height: 70,
  },
  {
    type: 'table-grid',
    title: 'Tabela / Grade Resumo',
    description: 'Cabeçalho cinza suave com 3 colunas e divisórias verticais.',
    height: 55,
  },
  {
    type: 'totalizer',
    title: 'Card de Resumo / Totalizador',
    description: 'Moldura com rótulo "TOTAL GERAL" à esquerda e valor monetário R$ em destaque à direita.',
    height: 40,
  },
  {
    type: 'barcode-label',
    title: 'Etiqueta com Código de Barras',
    description: 'Moldura retangular com elemento barcode Code128 e texto de código centralizado.',
    height: 70,
  },
  {
    type: 'signature-box',
    title: 'Quadro de Assinatura & Termo',
    description: 'Linha horizontal para assinatura, termo de conformidade e data.',
    height: 60,
  },
  {
    type: 'blank-box',
    title: 'Quadro Delimitador Vazio',
    description: 'Retângulo com borda fina e título de cabeçalho.',
    height: 50,
  },
];

export function generateScaffoldElements(
  type: ComponentScaffoldType,
  options: {
    title: string;
    primaryColor?: string;
    columnWidth?: number;
    band?: BandType;
  }
): JRXMLElement[] {
  const colW = options.columnWidth && options.columnWidth > 0 ? options.columnWidth : 555;
  const primary = options.primaryColor || '#1E293B';
  const genId = (p: string) => `scaf-${p}-${Math.random().toString(36).slice(2, 9)}`;

  switch (type) {
    case 'card-info': {
      const pad = 8;
      const colGap = 8;
      const availW = colW - pad * 2 - colGap * 2;
      const colW1 = Math.floor(availW / 3);
      const colW2 = colW1;
      const colW3 = availW - colW1 - colW2;

      return [
        {
          id: genId('card-bg'),
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 0,
            width: colW,
            height: 70,
            forecolor: primary,
            backcolor: '#F8FAFC',
            mode: 'Opaque',
          },
          radius: 3,
          penWidth: 1,
          penColor: primary,
        },
        {
          id: genId('card-title'),
          type: 'staticText',
          reportElement: {
            x: 8,
            y: 5,
            width: colW - 16,
            height: 14,
            forecolor: primary,
          },
          textElement: {
            font: { size: 9, isBold: true },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          text: options.title || 'INFORMAÇÕES GERAIS',
        },
        {
          id: genId('card-div'),
          type: 'line',
          reportElement: {
            x: 8,
            y: 22,
            width: colW - 16,
            height: 1,
            forecolor: '#E2E8F0',
          },
          penWidth: 0.5,
          penColor: '#E2E8F0',
        },
        {
          id: genId('card-lbl1'),
          type: 'staticText',
          reportElement: {
            x: pad,
            y: 27,
            width: colW1,
            height: 12,
            forecolor: '#64748B',
          },
          textElement: {
            font: { size: 7, isBold: true },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          text: 'CÓDIGO / ID',
        },
        {
          id: genId('card-val1'),
          type: 'textField',
          reportElement: {
            x: pad,
            y: 41,
            width: colW1,
            height: 18,
            forecolor: '#0F172A',
          },
          textElement: {
            font: { size: 9, isBold: true },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          expression: '$F{CODIGO}',
        },
        {
          id: genId('card-lbl2'),
          type: 'staticText',
          reportElement: {
            x: pad + colW1 + colGap,
            y: 27,
            width: colW2,
            height: 12,
            forecolor: '#64748B',
          },
          textElement: {
            font: { size: 7, isBold: true },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          text: 'DESCRIÇÃO',
        },
        {
          id: genId('card-val2'),
          type: 'textField',
          reportElement: {
            x: pad + colW1 + colGap,
            y: 41,
            width: colW2,
            height: 18,
            forecolor: '#0F172A',
          },
          textElement: {
            font: { size: 9 },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          expression: '$F{DESCRICAO}',
        },
        {
          id: genId('card-lbl3'),
          type: 'staticText',
          reportElement: {
            x: pad + (colW1 + colGap) * 2,
            y: 27,
            width: colW3,
            height: 12,
            forecolor: '#64748B',
          },
          textElement: {
            font: { size: 7, isBold: true },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          text: 'STATUS',
        },
        {
          id: genId('card-val3'),
          type: 'textField',
          reportElement: {
            x: pad + (colW1 + colGap) * 2,
            y: 41,
            width: colW3,
            height: 18,
            forecolor: '#0F172A',
          },
          textElement: {
            font: { size: 9 },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          expression: '$F{STATUS}',
        },
      ];
    }

    case 'table-grid': {
      const wCol1 = Math.floor(colW * 0.25);
      const wCol2 = Math.floor(colW * 0.5);
      const wCol3 = colW - wCol1 - wCol2;

      return [
        {
          id: genId('tbl-border'),
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 0,
            width: colW,
            height: 50,
            forecolor: primary,
          },
          penWidth: 1,
          penColor: primary,
        },
        {
          id: genId('tbl-hdr-bg'),
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 0,
            width: colW,
            height: 22,
            forecolor: primary,
            backcolor: '#F1F5F9',
            mode: 'Opaque',
          },
          penWidth: 1,
          penColor: primary,
        },
        {
          id: genId('tbl-vdiv1'),
          type: 'line',
          reportElement: {
            x: wCol1,
            y: 0,
            width: 1,
            height: 50,
            forecolor: '#CBD5E1',
          },
          penWidth: 0.5,
          penColor: '#CBD5E1',
        },
        {
          id: genId('tbl-vdiv2'),
          type: 'line',
          reportElement: {
            x: wCol1 + wCol2,
            y: 0,
            width: 1,
            height: 50,
            forecolor: '#CBD5E1',
          },
          penWidth: 0.5,
          penColor: '#CBD5E1',
        },
        {
          id: genId('tbl-th1'),
          type: 'staticText',
          reportElement: {
            x: 6,
            y: 3,
            width: wCol1 - 12,
            height: 16,
            forecolor: '#334155',
          },
          textElement: {
            font: { size: 8, isBold: true },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          text: 'CÓDIGO',
        },
        {
          id: genId('tbl-th2'),
          type: 'staticText',
          reportElement: {
            x: wCol1 + 6,
            y: 3,
            width: wCol2 - 12,
            height: 16,
            forecolor: '#334155',
          },
          textElement: {
            font: { size: 8, isBold: true },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          text: options.title || 'DESCRIÇÃO DO ITEM',
        },
        {
          id: genId('tbl-th3'),
          type: 'staticText',
          reportElement: {
            x: wCol1 + wCol2 + 6,
            y: 3,
            width: wCol3 - 12,
            height: 16,
            forecolor: '#334155',
          },
          textElement: {
            font: { size: 8, isBold: true },
            textAlignment: 'Right',
            verticalAlignment: 'Middle',
          },
          text: 'VALOR TOTAL',
        },
        {
          id: genId('tbl-hdiv'),
          type: 'line',
          reportElement: {
            x: 0,
            y: 22,
            width: colW,
            height: 1,
            forecolor: primary,
          },
          penWidth: 1,
          penColor: primary,
        },
        {
          id: genId('tbl-td1'),
          type: 'textField',
          reportElement: {
            x: 6,
            y: 26,
            width: wCol1 - 12,
            height: 18,
            forecolor: '#0F172A',
          },
          textElement: {
            font: { size: 8 },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          expression: '$F{CODPROD}',
        },
        {
          id: genId('tbl-td2'),
          type: 'textField',
          reportElement: {
            x: wCol1 + 6,
            y: 26,
            width: wCol2 - 12,
            height: 18,
            forecolor: '#0F172A',
          },
          textElement: {
            font: { size: 8 },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          expression: '$F{DESCRPROD}',
        },
        {
          id: genId('tbl-td3'),
          type: 'textField',
          reportElement: {
            x: wCol1 + wCol2 + 6,
            y: 26,
            width: wCol3 - 12,
            height: 18,
            forecolor: '#0F172A',
          },
          textElement: {
            font: { size: 8, isBold: true },
            textAlignment: 'Right',
            verticalAlignment: 'Middle',
          },
          pattern: '#,##0.00',
          expression: '$F{VLRTOT}',
        },
      ];
    }

    case 'totalizer': {
      return [
        {
          id: genId('tot-bg'),
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 0,
            width: colW,
            height: 38,
            forecolor: primary,
            backcolor: '#F8FAFC',
            mode: 'Opaque',
          },
          radius: 3,
          penWidth: 1.5,
          penColor: primary,
        },
        {
          id: genId('tot-lbl'),
          type: 'staticText',
          reportElement: {
            x: 12,
            y: 9,
            width: Math.floor(colW * 0.4),
            height: 20,
            forecolor: primary,
          },
          textElement: {
            font: { size: 11, isBold: true },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          text: options.title || 'TOTAL GERAL',
        },
        {
          id: genId('tot-val'),
          type: 'textField',
          reportElement: {
            x: colW - 220,
            y: 8,
            width: 208,
            height: 22,
            forecolor: primary,
          },
          textElement: {
            font: { size: 13, isBold: true },
            textAlignment: 'Right',
            verticalAlignment: 'Middle',
          },
          pattern: 'R$ #,##0.00',
          expression: '$V{VLR_TOTAL} != null ? $V{VLR_TOTAL} : 0.0',
        },
      ];
    }

    case 'barcode-label': {
      const bcWidth = Math.min(260, colW - 32);
      const bcX = Math.floor((colW - bcWidth) / 2);

      return [
        {
          id: genId('bc-frame'),
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 0,
            width: colW,
            height: 68,
            forecolor: primary,
          },
          radius: 2,
          penWidth: 1,
          penColor: primary,
        },
        {
          id: genId('bc-title'),
          type: 'staticText',
          reportElement: {
            x: 8,
            y: 4,
            width: colW - 16,
            height: 12,
            forecolor: '#64748B',
          },
          textElement: {
            font: { size: 7, isBold: true },
            textAlignment: 'Center',
            verticalAlignment: 'Middle',
          },
          text: options.title || 'ETIQUETA DE CÓDIGO DE BARRAS',
        },
        {
          id: genId('bc-code'),
          type: 'barcode',
          barcodeType: 'Code128',
          reportElement: {
            x: bcX,
            y: 18,
            width: bcWidth,
            height: 32,
            forecolor: '#0F172A',
          },
          expression: '$F{CODBARRA} != null ? $F{CODBARRA} : "7891234567890"',
          textPosition: 'none',
          moduleWidth: 1.0,
        },
        {
          id: genId('bc-num'),
          type: 'textField',
          reportElement: {
            x: bcX,
            y: 52,
            width: bcWidth,
            height: 12,
            forecolor: '#0F172A',
          },
          textElement: {
            font: { size: 8, isBold: true },
            textAlignment: 'Center',
            verticalAlignment: 'Middle',
          },
          expression: '$F{CODBARRA} != null ? $F{CODBARRA} : "7891234567890"',
        },
      ];
    }

    case 'signature-box': {
      const lineW = Math.min(300, colW - 40);
      const lineX = Math.floor((colW - lineW) / 2);

      return [
        {
          id: genId('sig-termo'),
          type: 'staticText',
          reportElement: {
            x: 8,
            y: 3,
            width: colW - 16,
            height: 12,
            forecolor: '#64748B',
          },
          textElement: {
            font: { size: 7, isItalic: true },
            textAlignment: 'Center',
            verticalAlignment: 'Middle',
          },
          text: 'Declaro para os devidos fins que conferi e recebi integralmente os itens descritos neste documento.',
        },
        {
          id: genId('sig-line'),
          type: 'line',
          reportElement: {
            x: lineX,
            y: 32,
            width: lineW,
            height: 1,
            forecolor: primary,
          },
          penWidth: 1,
          penColor: primary,
        },
        {
          id: genId('sig-title'),
          type: 'staticText',
          reportElement: {
            x: lineX,
            y: 35,
            width: lineW,
            height: 11,
            forecolor: '#0F172A',
          },
          textElement: {
            font: { size: 7, isBold: true },
            textAlignment: 'Center',
            verticalAlignment: 'Middle',
          },
          text: options.title || 'ASSINATURA DO RESPONSÁVEL / CARIMBO',
        },
        {
          id: genId('sig-dt'),
          type: 'staticText',
          reportElement: {
            x: 8,
            y: 48,
            width: colW - 16,
            height: 10,
            forecolor: '#64748B',
          },
          textElement: {
            font: { size: 6 },
            textAlignment: 'Center',
            verticalAlignment: 'Middle',
          },
          text: 'DATA: _____ / _____ / _________       DOC / CPF: _____________________________',
        },
      ];
    }

    case 'blank-box': {
      return [
        {
          id: genId('blank-rect'),
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 0,
            width: colW,
            height: 48,
            forecolor: primary,
          },
          radius: 2,
          penWidth: 0.5,
          penColor: primary,
        },
        {
          id: genId('blank-title'),
          type: 'staticText',
          reportElement: {
            x: 8,
            y: 5,
            width: colW - 16,
            height: 14,
            forecolor: primary,
          },
          textElement: {
            font: { size: 8, isBold: true },
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
          },
          text: options.title || 'QUADRO DELIMITADOR',
        },
      ];
    }

    default:
      return [];
  }
}

export const SANKHYA_COMPONENT_CATALOG: SankhyaCatalogComponent[] = [
  // ==========================================
  // 1. FISCAL & VENDAS (TGFCAB, TGFITE, TGFPAR)
  // ==========================================
  {
    id: 'sankhya-canhoto-nfe',
    title: 'Canhoto de Recebimento de NF-e',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Protocolo de entrega oficial com dados do emitente, data de recebimento e linha de assinatura.',
    band: 'title',
    height: 48,
    badge: 'NF-e / Vendas',
    tags: ['canhoto', 'nfe', 'entrega', 'assinatura', 'danfe', 'recebimento'],
    configurableFields: [
      { key: 'showLegalText', label: 'Texto Legal de Recebimento', defaultValue: true },
      { key: 'showReceiptDate', label: 'Data do Recebimento', defaultValue: true },
      { key: 'showSignature', label: 'Assinatura do Recebedor', defaultValue: true },
      { key: 'showNfeBadge', label: 'Número da NF-e em Destaque', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showLegalText = toggles.showLegalText !== false;
      const showReceiptDate = toggles.showReceiptDate !== false;
      const showSignature = toggles.showSignature !== false;
      const showNfeBadge = toggles.showNfeBadge !== false;
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `canhoto-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 0,
            width: colW,
            height: 42,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const rightBadgeW = 120;
      const rightX = colW - rightBadgeW - 8;

      if (showLegalText) {
        elements.push({
          id: `canhoto-${now}-text`,
          type: 'staticText',
          reportElement: {
            x: 8,
            y: 4,
            width: showNfeBadge ? rightX - 16 : colW - 16,
            height: 20,
            forecolor: textColor,
          },
          textElement: { font: { size: 7, isBold: false }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'RECEBEMOS DA EMPRESA OS PRODUTOS CONSTANTES DA NOTA FISCAL INDICADA AO LADO.',
        });
      }

      if (showReceiptDate) {
        elements.push({
          id: `canhoto-${now}-dt-lbl`,
          type: 'staticText',
          reportElement: { x: 8, y: 26, width: 112, height: 12, forecolor: mutedColor },
          textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'DATA DO RECEBIMENTO',
        });
      }

      if (showReceiptDate && showSignature) {
        elements.push(createVerticalDivider(`canhoto-${now}-div-rec`, 124, 24, 18, penColor, penWidth));
      }

      if (showSignature) {
        elements.push({
          id: `canhoto-${now}-sign-lbl`,
          type: 'staticText',
          reportElement: {
            x: showReceiptDate ? 130 : 8,
            y: 26,
            width: showNfeBadge ? (showReceiptDate ? rightX - 138 : rightX - 16) : (showReceiptDate ? colW - 8 - 130 : colW - 16),
            height: 12,
            forecolor: mutedColor,
          },
          textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'IDENTIFICAÇÃO E ASSINATURA DO RECEBEDOR',
        });
      }

      if (showNfeBadge) {
        elements.push(
          createVerticalDivider(`canhoto-${now}-div-nfe`, rightX - 4, 0, 42, penColor, penWidth),
          {
            id: `canhoto-${now}-nfe-side`,
            type: 'staticText',
            reportElement: { x: rightX, y: 4, width: rightBadgeW, height: 14, forecolor: textColor },
            textElement: { font: { size: 9, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'NF-e',
          },
          {
            id: `canhoto-${now}-nfe-val`,
            type: 'textField',
            reportElement: { x: rightX, y: 20, width: rightBadgeW, height: 18, forecolor: '#0284C7' },
            textElement: { font: { size: 11, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            expression: '"Nº " + $F{NUMNOTA}',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-quadro-destinatario',
    title: 'Quadro do Destinatário / Cliente',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Dados completos do cliente: Razão Social, CNPJ/CPF, Inscrição Estadual, Endereço, Bairro e CEP.',
    band: 'pageHeader',
    height: 65,
    badge: 'TGFPAR',
    tags: ['destinatario', 'cliente', 'cnpj', 'endereco', 'parceiro', 'tgfpar'],
    configurableFields: [
      { key: 'showCnpj', label: 'CNPJ / CPF', defaultValue: true },
      { key: 'showEmissionDate', label: 'Data de Emissão', defaultValue: true },
      { key: 'showAddress', label: 'Endereço Completo', defaultValue: true },
      { key: 'showCep', label: 'CEP', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showCnpj = toggles.showCnpj !== false;
      const showEmissionDate = toggles.showEmissionDate !== false;
      const showAddress = toggles.showAddress !== false;
      const showCep = toggles.showCep !== false;
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `dest-${now}-bg`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 58,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const cnpjW = 100;
      const dtW = 92;
      const dtX = colW - 8 - dtW;
      const cnpjX = dtX - cnpjW - 8;
      const nameW = showCnpj ? (showEmissionDate ? cnpjX - 16 : dtX - 16) : colW - 16;

      // Linha 1: Razão Social
      elements.push(
        {
          id: `dest-${now}-lbl1`,
          type: 'staticText',
          reportElement: { x: 8, y: 5, width: nameW, height: 11, forecolor: mutedColor },
          textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'NOME / RAZÃO SOCIAL:',
        },
        {
          id: `dest-${now}-val1`,
          type: 'textField',
          reportElement: {
            x: 8,
            y: 17,
            width: nameW,
            height: 15,
            forecolor: textColor,
          },
          textElement: { font: { size: 9, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          expression: '$F{CODPARC} + " - " + $F{NOMEPARC}',
        }
      );

      if (showCnpj) {
        elements.push(
          createVerticalDivider(`dest-${now}-div-cnpj`, cnpjX - 4, 2, 32, penColor, penWidth),
          {
            id: `dest-${now}-lbl-cnpj`,
            type: 'staticText',
            reportElement: { x: cnpjX, y: 5, width: cnpjW, height: 11, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'CNPJ / CPF:',
          },
          {
            id: `dest-${now}-val-cnpj`,
            type: 'textField',
            reportElement: { x: cnpjX, y: 17, width: cnpjW, height: 15, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            expression: '$F{CGC_CPF}',
          }
        );
      }

      if (showEmissionDate) {
        elements.push(
          createVerticalDivider(`dest-${now}-div-dt`, dtX - 4, 2, 32, penColor, penWidth),
          {
            id: `dest-${now}-lbl-dt`,
            type: 'staticText',
            reportElement: { x: dtX, y: 5, width: dtW, height: 11, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'DATA EMISSÃO:',
          },
          {
            id: `dest-${now}-val-dt`,
            type: 'textField',
            reportElement: { x: dtX, y: 17, width: dtW, height: 15, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            pattern: 'dd/MM/yyyy',
            expression: '$F{DTNEG}',
          }
        );
      }

      // Linha divisória horizontal entre Linha 1 e Linha 2
      elements.push({
        id: `dest-${now}-hdiv`,
        type: 'line',
        reportElement: { x: 0, y: 34, width: colW, height: 1, forecolor: penColor },
        penWidth: 1,
        penColor,
      });

      // Linha 2: Endereço & CEP
      const cepW = 92;
      const cepX = colW - 8 - cepW;
      const addrW = showCep ? cepX - 16 : colW - 16;

      if (showAddress) {
        elements.push(
          {
            id: `dest-${now}-lbl2`,
            type: 'staticText',
            reportElement: { x: 8, y: 36, width: addrW, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'ENDEREÇO:',
          },
          {
            id: `dest-${now}-val2`,
            type: 'textField',
            reportElement: {
              x: 8,
              y: 46,
              width: addrW,
              height: 12,
              forecolor: textColor,
            },
            textElement: { font: { size: 8 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '$F{LOGRADOURO} + ", " + $F{NUMEND} + " - " + $F{BAIRRO} + " • " + $F{CIDADE} + "/" + $F{UF}',
          }
        );
      }

      if (showCep) {
        elements.push(
          createVerticalDivider(`dest-${now}-div-cep`, cepX - 4, 34, 26, penColor, penWidth),
          {
            id: `dest-${now}-lbl-cep`,
            type: 'staticText',
            reportElement: { x: cepX, y: 36, width: cepW, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'CEP:',
          },
          {
            id: `dest-${now}-val-cep`,
            type: 'textField',
            reportElement: { x: cepX, y: 46, width: cepW, height: 12, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            expression: '$F{CEP}',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-quadro-impostos',
    title: 'Quadro de Cálculo do Imposto (Totais da Nota)',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Base de Cálculo ICMS, Valor ICMS, Base ST, Valor ST, Frete, Desconto e Valor Total da Nota.',
    band: 'summary',
    height: 70,
    badge: 'Impostos / Totais',
    tags: ['impostos', 'icms', 'ipi', 'substituicao', 'frete', 'desconto', 'total'],
    configurableFields: [
      { key: 'showIcms', label: 'Base e Valor ICMS', defaultValue: true },
      { key: 'showSt', label: 'Base e Valor ICMS ST (Substituição)', defaultValue: true },
      { key: 'showFrete', label: 'Frete e Desconto', defaultValue: true },
      { key: 'showTotal', label: 'Total da Nota Fiscal', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showIcms = toggles.showIcms !== false;
      const showSt = toggles.showSt !== false;
      const showFrete = toggles.showFrete !== false;
      const showTotal = toggles.showTotal !== false;
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `imp-${now}-bg`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 4,
            width: colW,
            height: 58,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const cols = calculateGridColumns(colW, 5, 8, 8);

      // Divisórias verticais de grade
      for (let i = 1; i < 5; i++) {
        elements.push(createVerticalDivider(`imp-${now}-vdiv-${i}`, cols[i].x, 4, 58, penColor, penWidth));
      }

      // Linha horizontal divisória entre linha 1 e linha 2
      elements.push({
        id: `imp-${now}-hdiv`,
        type: 'line',
        reportElement: { x: 0, y: 33, width: colW, height: 1, forecolor: penColor },
        penWidth: 1,
        penColor,
      });

      // Linha 1:
      // Col 0: Base ICMS
      if (showIcms) {
        elements.push(
          {
            id: `imp-${now}-l1-c0`,
            type: 'staticText',
            reportElement: { x: cols[0].x + 4, y: 7, width: cols[0].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'BASE CÁLC. ICMS',
          },
          {
            id: `imp-${now}-v1-c0`,
            type: 'textField',
            reportElement: { x: cols[0].x + 4, y: 17, width: cols[0].width - 8, height: 13, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00',
            expression: '$F{BASEICMS}',
          },
          {
            id: `imp-${now}-l1-c1`,
            type: 'staticText',
            reportElement: { x: cols[1].x + 4, y: 7, width: cols[1].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'VALOR DO ICMS',
          },
          {
            id: `imp-${now}-v1-c1`,
            type: 'textField',
            reportElement: { x: cols[1].x + 4, y: 17, width: cols[1].width - 8, height: 13, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00',
            expression: '$F{VLRICMS}',
          }
        );
      }

      // Base ST & Vlr ST
      if (showSt) {
        elements.push(
          {
            id: `imp-${now}-l1-c2`,
            type: 'staticText',
            reportElement: { x: cols[2].x + 4, y: 7, width: cols[2].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'BASE CÁLC. ICMS ST',
          },
          {
            id: `imp-${now}-v1-c2`,
            type: 'textField',
            reportElement: { x: cols[2].x + 4, y: 17, width: cols[2].width - 8, height: 13, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00',
            expression: '$F{BASESUBST}',
          },
          {
            id: `imp-${now}-l1-c3`,
            type: 'staticText',
            reportElement: { x: cols[3].x + 4, y: 7, width: cols[3].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'VALOR DO ICMS ST',
          },
          {
            id: `imp-${now}-v1-c3`,
            type: 'textField',
            reportElement: { x: cols[3].x + 4, y: 17, width: cols[3].width - 8, height: 13, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00',
            expression: '$F{VLRSUBST}',
          }
        );
      }

      // Valor dos Produtos
      elements.push(
        {
          id: `imp-${now}-l1-c4`,
          type: 'staticText',
          reportElement: { x: cols[4].x + 4, y: 7, width: cols[4].width - 8, height: 10, forecolor: mutedColor },
          textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          text: 'VALOR DOS PRODUTOS',
        },
        {
          id: `imp-${now}-v1-c4`,
          type: 'textField',
          reportElement: { x: cols[4].x + 4, y: 17, width: cols[4].width - 8, height: 13, forecolor: textColor },
          textElement: { font: { size: 8, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          pattern: '¤ #,##0.00',
          expression: '$F{VLRPROD}',
        }
      );

      // Linha 2: Frete e Desconto
      if (showFrete) {
        elements.push(
          {
            id: `imp-${now}-l2-c0`,
            type: 'staticText',
            reportElement: { x: cols[0].x + 4, y: 36, width: cols[0].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'VALOR DO FRETE',
          },
          {
            id: `imp-${now}-v2-c0`,
            type: 'textField',
            reportElement: { x: cols[0].x + 4, y: 46, width: cols[0].width - 8, height: 13, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00',
            expression: '$F{VLRFRETE}',
          },
          {
            id: `imp-${now}-l2-c1`,
            type: 'staticText',
            reportElement: { x: cols[1].x + 4, y: 36, width: cols[1].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'DESCONTO',
          },
          {
            id: `imp-${now}-v2-c1`,
            type: 'textField',
            reportElement: { x: cols[1].x + 4, y: 46, width: cols[1].width - 8, height: 13, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00',
            expression: '$F{VLRDESC}',
          },
          {
            id: `imp-${now}-l2-c2`,
            type: 'staticText',
            reportElement: { x: cols[2].x + 4, y: 36, width: cols[2].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'OUTRAS DESPESAS',
          },
          {
            id: `imp-${now}-v2-c2`,
            type: 'textField',
            reportElement: { x: cols[2].x + 4, y: 46, width: cols[2].width - 8, height: 13, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00',
            expression: '$F{OUTRASDESP} != null ? $F{OUTRASDESP} : new java.math.BigDecimal(0)',
          },
          {
            id: `imp-${now}-l2-c3`,
            type: 'staticText',
            reportElement: { x: cols[3].x + 4, y: 36, width: cols[3].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'VALOR DO IPI',
          },
          {
            id: `imp-${now}-v2-c3`,
            type: 'textField',
            reportElement: { x: cols[3].x + 4, y: 46, width: cols[3].width - 8, height: 13, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00',
            expression: '$F{VLRIPI} != null ? $F{VLRIPI} : new java.math.BigDecimal(0)',
          }
        );
      }

      // Total da Nota Fiscal
      if (showTotal) {
        elements.push(
          {
            id: `imp-${now}-l2-c4`,
            type: 'staticText',
            reportElement: { x: cols[4].x + 4, y: 36, width: cols[4].width - 8, height: 10, forecolor: '#0284C7' },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'TOTAL DA NOTA FISCAL',
          },
          {
            id: `imp-${now}-v2-c4`,
            type: 'textField',
            reportElement: { x: cols[4].x + 4, y: 46, width: cols[4].width - 8, height: 14, forecolor: '#0284C7' },
            textElement: { font: { size: 10, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '¤ #,##0.00',
            expression: '$F{VLRNOTA}',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-quadro-transportadora',
    title: 'Quadro de Transportador e Volumes',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Razão Social do Transportador, Modalidade de Frete (CIF/FOB), Placa, Qtd de Volumes e Peso.',
    band: 'summary',
    height: 50,
    badge: 'Logística / Frete',
    tags: ['transportadora', 'frete', 'cif', 'fob', 'placa', 'volumes', 'peso'],
    configurableFields: [
      { key: 'showFreteConta', label: 'Frete por Conta (CIF/FOB)', defaultValue: true },
      { key: 'showPlaca', label: 'Placa do Veículo e UF', defaultValue: true },
      { key: 'showVolumes', label: 'Volumes e Espécie', defaultValue: true },
      { key: 'showPeso', label: 'Peso Bruto', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showFreteConta = toggles.showFreteConta !== false;
      const showPlaca = toggles.showPlaca !== false;
      const showVolumes = toggles.showVolumes !== false;
      const showPeso = toggles.showPeso !== false;
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `transp-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 42,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const placaW = 96;
      const freteW = 100;
      const placaX = colW - 8 - placaW;
      const freteX = placaX - freteW - 8;
      const transpW = showFreteConta ? (showPlaca ? freteX - 16 : placaX - 16) : colW - 16;

      // Linha 1: Transportador, Frete, Placa
      elements.push(
        {
          id: `transp-${now}-l1`,
          type: 'staticText',
          reportElement: { x: 8, y: 5, width: transpW, height: 10, forecolor: mutedColor },
          textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'TRANSPORTADOR:',
        },
        {
          id: `transp-${now}-v1`,
          type: 'textField',
          reportElement: {
            x: 8,
            y: 15,
            width: transpW,
            height: 13,
            forecolor: textColor,
          },
          textElement: { font: { size: 8, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          expression: '$F{NOMEPARC_TRANSP}',
        }
      );

      if (showFreteConta) {
        elements.push(
          createVerticalDivider(`transp-${now}-div-fr`, freteX - 4, 2, 26, penColor, penWidth),
          {
            id: `transp-${now}-l2`,
            type: 'staticText',
            reportElement: { x: freteX, y: 5, width: freteW, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'FRETE POR CONTA:',
          },
          {
            id: `transp-${now}-v2`,
            type: 'textField',
            reportElement: { x: freteX, y: 15, width: freteW, height: 13, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            expression: '$F{CIF_FOB} == "C" ? "0 - Emitente" : "1 - Destinatário"',
          }
        );
      }

      if (showPlaca) {
        elements.push(
          createVerticalDivider(`transp-${now}-div-pl`, placaX - 4, 2, 26, penColor, penWidth),
          {
            id: `transp-${now}-l3`,
            type: 'staticText',
            reportElement: { x: placaX, y: 5, width: placaW, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'PLACA DO VEÍCULO:',
          },
          {
            id: `transp-${now}-v3`,
            type: 'textField',
            reportElement: { x: placaX, y: 15, width: placaW, height: 13, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            expression: '$F{PLACA} + " - " + $F{UFVEICULO}',
          }
        );
      }

      // Linha horizontal divisória
      elements.push({
        id: `transp-${now}-hdiv`,
        type: 'line',
        reportElement: { x: 0, y: 28, width: colW, height: 1, forecolor: penColor },
        penWidth: 1,
        penColor,
      });

      // Linha 2: Volumes & Peso
      const pesoW = 100;
      const pesoX = colW - 8 - pesoW;
      const volW = showPeso ? pesoX - 16 : colW - 16;

      if (showVolumes) {
        elements.push(
          {
            id: `transp-${now}-l4`,
            type: 'staticText',
            reportElement: { x: 8, y: 30, width: 60, height: 11, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'VOLUMES:',
          },
          {
            id: `transp-${now}-v4`,
            type: 'textField',
            reportElement: { x: 72, y: 30, width: volW - 68, height: 11, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '$F{QTDVOL} + " (" + $F{ESPECIE} + ")"',
          }
        );
      }

      if (showPeso) {
        elements.push(
          createVerticalDivider(`transp-${now}-div-peso`, pesoX - 4, 28, 16, penColor, penWidth),
          {
            id: `transp-${now}-l5`,
            type: 'staticText',
            reportElement: { x: pesoX, y: 30, width: pesoW - 55, height: 11, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'PESO BRUTO:',
          },
          {
            id: `transp-${now}-v5`,
            type: 'textField',
            reportElement: { x: pesoX + pesoW - 52, y: 30, width: 52, height: 11, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00 kg',
            expression: '$F{PESOBRUTO}',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-quadro-duplicatas',
    title: 'Quadro de Cobrança / Duplicatas',
    category: 'finance',
    categoryLabel: 'Financeiro',
    description: 'Resumo das parcelas a receber ou a pagar com Número do Título, Vencimento e Valor.',
    band: 'summary',
    height: 45,
    badge: 'TGFFIN',
    tags: ['duplicata', 'cobranca', 'fatura', 'parcelas', 'vencimento', 'tgffin'],
    configurableFields: [
      { key: 'showTitle', label: 'Título Fatura / Duplicatas', defaultValue: true },
      { key: 'showVencimento', label: 'Data de Vencimento', defaultValue: true },
      { key: 'showValor', label: 'Valor da Parcela', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showTitle = toggles.showTitle !== false;
      const showVencimento = toggles.showVencimento !== false;
      const showValor = toggles.showValor !== false;
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `dup-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 40,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      if (showTitle) {
        elements.push({
          id: `dup-${now}-title`,
          type: 'staticText',
          reportElement: { x: 8, y: 4, width: colW - 16, height: 11, forecolor: mutedColor },
          textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'FATURA / DUPLICATAS:',
        });
      }

      elements.push({
        id: `dup-${now}-hdiv`,
        type: 'line',
        reportElement: { x: 0, y: 17, width: colW, height: 1, forecolor: penColor },
        penWidth: 1,
        penColor,
      });

      const cols = calculateGridColumns(colW, 3, 8, 8);

      elements.push(
        createVerticalDivider(`dup-${now}-div1`, cols[1].x, 17, 25, penColor, penWidth),
        createVerticalDivider(`dup-${now}-div2`, cols[2].x, 17, 25, penColor, penWidth),
        {
          id: `dup-${now}-c0-lbl`,
          type: 'staticText',
          reportElement: { x: cols[0].x + 4, y: 22, width: cols[0].width - 8, height: 14, forecolor: textColor },
          textElement: { font: { size: 8, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          text: 'PARC: 01/01',
        }
      );

      if (showVencimento) {
        elements.push({
          id: `dup-${now}-c1-venc`,
          type: 'textField',
          reportElement: { x: cols[1].x + 4, y: 22, width: cols[1].width - 8, height: 14, forecolor: textColor },
          textElement: { font: { size: 8, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          pattern: 'dd/MM/yyyy',
          expression: '$F{DTVENC}',
        });
      }

      if (showValor) {
        elements.push({
          id: `dup-${now}-c2-vlr`,
          type: 'textField',
          reportElement: { x: cols[2].x + 4, y: 22, width: cols[2].width - 8, height: 14, forecolor: '#0284C7' },
          textElement: { font: { size: 9, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          pattern: '¤ #,##0.00',
          expression: '$F{VLRDESDOB}',
        });
      }

      return elements;
    },
  },
  {
    id: 'sankhya-recibo-quitacao',
    title: 'Recibo Oficial de Pagamento / Quitação',
    category: 'finance',
    categoryLabel: 'Financeiro',
    description: 'Declaração formal de recebimento de valor com menção ao histórico e espaço de assinatura.',
    band: 'summary',
    height: 75,
    badge: 'Recibo Formal',
    tags: ['recibo', 'quitacao', 'pagamento', 'declaracao', 'financeiro'],
    configurableFields: [
      { key: 'showValueHeader', label: 'Valor em Destaque no Topo', defaultValue: true },
      { key: 'showDeclaration', label: 'Texto de Declaração de Quitação', defaultValue: true },
      { key: 'showSignature', label: 'Linha e Assinatura do Beneficiário', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showValueHeader = toggles.showValueHeader !== false;
      const showDeclaration = toggles.showDeclaration !== false;
      const showSignature = toggles.showSignature !== false;
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `rec-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 4,
            width: colW,
            height: 65,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 3,
          penWidth,
          penColor,
        },
        {
          id: `rec-${now}-title`,
          type: 'staticText',
          reportElement: { x: 8, y: 7, width: 220, height: 14, forecolor: textColor },
          textElement: { font: { size: 9, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'RECIBO DE PAGAMENTO',
        },
      ];

      if (showValueHeader) {
        elements.push({
          id: `rec-${now}-val`,
          type: 'textField',
          reportElement: { x: colW - 178, y: 7, width: 170, height: 14, forecolor: '#059669' },
          textElement: { font: { size: 11, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          pattern: '¤ #,##0.00',
          expression: '$F{VLRDESDOB}',
        });
      }

      elements.push({
        id: `rec-${now}-hdiv`,
        type: 'line',
        reportElement: { x: 0, y: 24, width: colW, height: 1, forecolor: penColor },
        penWidth: 1,
        penColor,
      });

      if (showDeclaration) {
        elements.push({
          id: `rec-${now}-body`,
          type: 'textField',
          reportElement: { x: 8, y: 28, width: colW - 16, height: 18, forecolor: textColor },
          textElement: { font: { size: 8 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          expression:
            '"Recebemos de " + $F{NOMEPARC} + " a importância de R$ " + $F{VLRDESDOB} + " referente a quitação do título " + $F{NUMNOTA} + "."',
        });
      }

      if (showSignature) {
        const signW = 200;
        const signX = colW - 8 - signW;
        elements.push(
          {
            id: `rec-${now}-sign-line`,
            type: 'line',
            reportElement: { x: signX, y: 54, width: signW, height: 1, forecolor: penColor },
            penWidth: 1,
            penColor,
          },
          {
            id: `rec-${now}-sign-lbl`,
            type: 'staticText',
            reportElement: { x: signX, y: 56, width: signW, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'ASSINATURA DO EMITENTE / BENEFICIÁRIO',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-etiqueta-produto',
    title: 'Etiqueta de Produto com Código de Barras',
    category: 'stock',
    categoryLabel: 'Estoque & Logística',
    description: 'Etiqueta de gôndola/caixa com Código, Descrição, Preço e Código de Barras EAN-13.',
    band: 'detail',
    height: 60,
    badge: 'Etiqueta / Barcode',
    tags: ['etiqueta', 'produto', 'barcode', 'ean', 'preco', 'gondola'],
    configurableFields: [
      { key: 'showDescription', label: 'Descrição do Produto', defaultValue: true },
      { key: 'showCode', label: 'Código do Produto', defaultValue: true },
      { key: 'showPrice', label: 'Preço Unitário em Destaque', defaultValue: true },
      { key: 'showBarcode', label: 'Código de Barras Simulado', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showDescription = toggles.showDescription !== false;
      const showCode = toggles.showCode !== false;
      const showPrice = toggles.showPrice !== false;
      const showBarcode = toggles.showBarcode !== false;
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const labelW = colW;
      const elements: JRXMLElement[] = [
        {
          id: `lbl-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: labelW,
            height: 55,
            backcolor: backcolor === 'transparent' ? 'transparent' : '#FFFFFF',
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor: penColor || '#CBD5E1',
        },
      ];

      if (showDescription) {
        elements.push({
          id: `lbl-${now}-prod-descr`,
          type: 'textField',
          reportElement: { x: 8, y: 6, width: labelW - 16, height: 14, forecolor: textColor },
          textElement: { font: { size: 9, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          expression: '$F{DESCRPROD}',
        });
      }

      const halfW = Math.floor((labelW - 16) / 2);

      if (showCode) {
        elements.push({
          id: `lbl-${now}-prod-cod`,
          type: 'textField',
          reportElement: { x: 8, y: 22, width: halfW, height: 12, forecolor: mutedColor },
          textElement: { font: { size: 8 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          expression: '"CÓD: " + $F{CODPROD}',
        });
      }

      if (showPrice) {
        elements.push({
          id: `lbl-${now}-prod-prc`,
          type: 'textField',
          reportElement: { x: 8 + halfW, y: 20, width: labelW - 8 - (8 + halfW), height: 16, forecolor: '#0284C7' },
          textElement: { font: { size: 12, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          pattern: '¤ #,##0.00',
          expression: '$F{VLRUNIT}',
        });
      }

      if (showBarcode) {
        elements.push({
          id: `lbl-${now}-barcode-mock`,
          type: 'staticText',
          reportElement: { x: 8, y: 38, width: labelW - 16, height: 14, forecolor: textColor },
          textElement: { font: { fontName: 'Courier New', size: 8 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          text: '||||| ||||||| |||||| |||||| ||||',
        });
      }

      return elements;
    },
  },
  {
    id: 'sankhya-romaneio-picking',
    title: 'Item de Separação / Romaneio de Carga',
    category: 'stock',
    categoryLabel: 'Estoque & Logística',
    description: 'Linha de conferência de estoque com Localização/Rua, Lote, Quantidade e Checkbox de conferência.',
    band: 'detail',
    height: 25,
    badge: 'Picking / WMS',
    tags: ['romaneio', 'picking', 'separacao', 'estoque', 'conferencia', 'lote'],
    configurableFields: [
      { key: 'showCheckbox', label: 'Caixa de Checagem (Picking)', defaultValue: true },
      { key: 'showLocation', label: 'Localização / Posição (Rua)', defaultValue: true },
      { key: 'showQuantity', label: 'Quantidade a Separar', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showCheckbox = toggles.showCheckbox !== false;
      const showLocation = toggles.showLocation !== false;
      const showQuantity = toggles.showQuantity !== false;
      const { penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [];

      if (showCheckbox) {
        elements.push({
          id: `pick-${now}-chk`,
          type: 'rectangle',
          reportElement: { x: 8, y: 5, width: 12, height: 12, backcolor: '#FFFFFF', mode: 'Opaque' },
          radius: 1,
          penWidth,
          penColor: '#94A3B8',
        });
      }

      if (showLocation) {
        elements.push({
          id: `pick-${now}-loc`,
          type: 'staticText',
          reportElement: { x: showCheckbox ? 26 : 8, y: 5, width: 56, height: 12, forecolor: mutedColor },
          textElement: { font: { size: 8, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          text: 'R01-P04',
        });
        elements.push(createVerticalDivider(`pick-${now}-div1`, 86, 2, 20, penColor, penWidth));
      }

      elements.push(
        {
          id: `pick-${now}-cod`,
          type: 'textField',
          reportElement: { x: 90, y: 5, width: 50, height: 12, forecolor: textColor },
          textElement: { font: { size: 8, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          expression: '$F{CODPROD}',
        },
        createVerticalDivider(`pick-${now}-div2`, 144, 2, 20, penColor, penWidth),
        {
          id: `pick-${now}-descr`,
          type: 'textField',
          reportElement: {
            x: 148,
            y: 5,
            width: showQuantity ? colW - 256 : colW - 156,
            height: 12,
            forecolor: textColor,
          },
          textElement: { font: { size: 8 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          expression: '$F{DESCRPROD}',
        }
      );

      if (showQuantity) {
        elements.push(
          createVerticalDivider(`pick-${now}-div3`, colW - 104, 2, 20, penColor, penWidth),
          {
            id: `pick-${now}-qtd`,
            type: 'textField',
            reportElement: { x: colW - 100, y: 5, width: 92, height: 12, forecolor: '#0284C7' },
            textElement: { font: { size: 9, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00',
            expression: '$F{QTDNEG}',
          }
        );
      }

      elements.push({
        id: `pick-${now}-line`,
        type: 'line',
        reportElement: { x: 0, y: 23, width: colW, height: 1, forecolor: penColor },
        penWidth: 0.5,
        penColor,
      });

      return elements;
    },
  },
  {
    id: 'sankhya-dupla-assinatura',
    title: 'Quadro de Dupla Assinatura (Contrato/Pedido)',
    category: 'structural',
    categoryLabel: 'Estruturais',
    description: 'Duas colunas formais de assinatura: Emitente (Vendedor) e Destinatário (Comprador).',
    band: 'summary',
    height: 55,
    badge: 'Assinaturas',
    tags: ['assinatura', 'responsavel', 'comprador', 'vendedor', 'contrato'],
    configurableFields: [
      { key: 'showIssuerSign', label: 'Assinatura Emitente / Vendedor', defaultValue: true },
      { key: 'showBuyerSign', label: 'Assinatura Cliente / Comprador', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showIssuerSign = toggles.showIssuerSign !== false;
      const showBuyerSign = toggles.showBuyerSign !== false;
      const { penColor, penWidth, textColor } = getThemeColors(customProps);

      const cols = calculateGridColumns(colW, 2, 8, 8);
      const elements: JRXMLElement[] = [];

      if (showIssuerSign) {
        const signW = cols[0].width - 24;
        const signX = cols[0].x + 12;
        elements.push(
          {
            id: `sign-${now}-l1`,
            type: 'line',
            reportElement: { x: signX, y: 28, width: signW, height: 1, forecolor: penColor },
            penWidth,
          },
          {
            id: `sign-${now}-t1`,
            type: 'staticText',
            reportElement: { x: signX, y: 32, width: signW, height: 14, forecolor: textColor },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'EMPRESA EMITENTE / VENDEDOR',
          }
        );
      }

      if (showBuyerSign) {
        const signW = cols[1].width - 24;
        const signX = cols[1].x + 12;
        elements.push(
          {
            id: `sign-${now}-l2`,
            type: 'line',
            reportElement: {
              x: signX,
              y: 28,
              width: signW,
              height: 1,
              forecolor: penColor,
            },
            penWidth,
          },
          {
            id: `sign-${now}-t2`,
            type: 'staticText',
            reportElement: {
              x: signX,
              y: 32,
              width: signW,
              height: 14,
              forecolor: textColor,
            },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'CLIENTE / DE ACORDO',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-dados-adicionais-obs',
    title: 'Quadro de Dados Adicionais / Observações',
    category: 'structural',
    categoryLabel: 'Estruturais',
    description: 'Área reservada para informações complementares fiscais e observações gerais da nota.',
    band: 'summary',
    height: 50,
    badge: 'Observações',
    tags: ['observacoes', 'adicionais', 'fisco', 'tributos', 'mensagem'],
    configurableFields: [
      { key: 'showTitle', label: 'Título da Seção', defaultValue: true },
      { key: 'showText', label: 'Texto Legal de Observações', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showTitle = toggles.showTitle !== false;
      const showText = toggles.showText !== false;
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `obs-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 44,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      if (showTitle) {
        elements.push(
          {
            id: `obs-${now}-title`,
            type: 'staticText',
            reportElement: { x: 8, y: 5, width: colW - 16, height: 11, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'DADOS ADICIONAIS / INFORMAÇÕES COMPLEMENTARES:',
          },
          {
            id: `obs-${now}-hdiv`,
            type: 'line',
            reportElement: { x: 0, y: 17, width: colW, height: 1, forecolor: penColor },
            penWidth: 1,
            penColor,
          }
        );
      }

      if (showText) {
        elements.push({
          id: `obs-${now}-text`,
          type: 'textField',
          reportElement: { x: 8, y: showTitle ? 19 : 6, width: colW - 16, height: showTitle ? 23 : 36, forecolor: textColor },
          textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          expression:
            '$F{OBSERVACAO} != null ? $F{OBSERVACAO} : "DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL; NAO GERA DIREITO A CREDITO FISCAL DE IPI."',
        });
      }

      return elements;
    },
  },
  {
    id: 'sankhya-chave-nfe-barcode',
    title: 'Chave de Acesso NF-e (Código de Barras Code 128)',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Código de barras oficial de 44 dígitos da NF-e / DANFE para leitura óptica pelo fisco e transportadora.',
    band: 'title',
    height: 60,
    badge: 'NF-e / DANFE',
    tags: ['codigo de barras', 'barcode', 'code128', 'chave', 'nfe', 'danfe', 'leitor'],
    configurableFields: [
      { key: 'showTitle', label: 'Rótulo Chave de Acesso', defaultValue: true },
      { key: 'showBarcode', label: 'Código de Barras Code 128', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showTitle = toggles.showTitle !== false;
      const showBarcode = toggles.showBarcode !== false;
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `nfe-bc-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 0,
            width: colW,
            height: 56,
            backcolor: backcolor === 'transparent' ? 'transparent' : '#FFFFFF',
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      if (showTitle) {
        elements.push({
          id: `nfe-bc-${now}-title`,
          type: 'staticText',
          reportElement: { x: 8, y: 3, width: colW - 16, height: 11, forecolor: mutedColor },
          textElement: { font: { size: 7, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          text: 'CHAVE DE ACESSO DA NF-E',
        });
      }

      if (showBarcode) {
        elements.push({
          id: `nfe-bc-${now}-code`,
          type: 'barcode',
          barcodeType: 'Code128',
          reportElement: { x: 8, y: showTitle ? 15 : 6, width: colW - 16, height: showTitle ? 37 : 46, forecolor: textColor },
          expression: '$F{CHAVENFE} != null ? $F{CHAVENFE} : "35261012345678000195550010000284011000284010"',
          textPosition: 'bottom',
          moduleWidth: 1.0,
        });
      }

      return elements;
    },
  },
  {
    id: 'sankhya-pix-qrcode',
    title: 'PIX Dinâmico / QR Code da Nota Fiscal',
    category: 'finance',
    categoryLabel: 'Financeiro',
    description: 'QR Code de pagamento instantâneo via PIX ou consulta da NFC-e no portal da SEFAZ.',
    band: 'summary',
    height: 80,
    badge: 'PIX / NFC-e',
    tags: ['pix', 'qrcode', 'pagamento', 'nfce', 'sefaz', 'banco'],
    configurableFields: [
      { key: 'showQrCode', label: 'QR Code de Pagamento', defaultValue: true },
      { key: 'showTitle', label: 'Título "PAGUE VIA PIX"', defaultValue: true },
      { key: 'showInstructions', label: 'Instruções de Pagamento', defaultValue: true },
      { key: 'largeQr', label: 'QR Code em Tamanho Grande', defaultValue: false },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showQrCode = toggles.showQrCode !== false;
      const showTitle = toggles.showTitle !== false;
      const showInstructions = toggles.showInstructions !== false;
      const largeQr = toggles.largeQr === true;
      const { backcolor, penColor, penWidth } = getThemeColors(customProps);

      const qrSize = largeQr ? 80 : 60;
      const boxH = largeQr ? 95 : 75;

      const elements: JRXMLElement[] = [
        {
          id: `pix-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 0,
            width: colW,
            height: boxH,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor: penColor || '#0EA5E9',
        },
      ];

      if (showQrCode) {
        elements.push({
          id: `pix-${now}-qr`,
          type: 'barcode',
          barcodeType: 'QRCode',
          reportElement: { x: 8, y: 7, width: qrSize, height: qrSize },
          expression: '$F{CHAVENFE} != null ? $F{CHAVENFE} : "https://pix.bcb.gov.br/qr/v2/sankhya10452"',
        });
        elements.push(createVerticalDivider(`pix-${now}-vdiv`, 8 + qrSize + 8, 4, boxH - 8, penColor, penWidth));
      }

      const textX = showQrCode ? 8 + qrSize + 16 : 8;
      const textW = colW - 8 - textX;

      if (showTitle) {
        elements.push({
          id: `pix-${now}-title`,
          type: 'staticText',
          reportElement: { x: textX, y: 10, width: textW, height: 16, forecolor: '#0369A1' },
          textElement: { font: { size: 9, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'PAGUE VIA PIX',
        });
      }

      if (showInstructions) {
        elements.push({
          id: `pix-${now}-sub`,
          type: 'staticText',
          reportElement: { x: textX, y: showTitle ? 28 : 14, width: textW, height: 40, forecolor: '#64748B' },
          textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'Aponte a câmera do aplicativo do seu banco para o QR Code ao lado para efetuar o pagamento imediato.',
        });
      }

      return elements;
    },
  },
  {
    id: 'sankhya-chart-faturamento-filial',
    title: 'Gráfico: Faturamento por Filial (Barras)',
    category: 'finance',
    categoryLabel: 'Financeiro',
    description: 'Gráfico estatístico de barras comparativo de faturamento entre filiais e empresas.',
    band: 'summary',
    height: 180,
    badge: 'JFreeChart / Barras',
    tags: ['grafico', 'chart', 'barras', 'faturamento', 'filial', 'empresa', 'total'],
    configurableFields: [
      { key: 'showLegend', label: 'Legenda do Gráfico', defaultValue: true },
      { key: 'showLabels', label: 'Rótulos de Dados', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const isShowLegend = toggles.showLegend !== false;
      const isShowLabels = toggles.showLabels !== false;

      return [
        {
          id: `chart-bar-${now}`,
          type: 'chart',
          chartType: 'barChart',
          reportElement: { x: 0, y: 10, width: colW, height: 160 },
          title: 'Faturamento por Filial',
          isShowLegend,
          isShowLabels,
          seriesExpression: '"Faturamento"',
          categoryExpression: '$F{APELIDO}',
          valueExpression: '$F{VLRTOT}',
        } as JRXMLChart,
      ];
    },
  },
  {
    id: 'sankhya-chart-pizza-vendedor',
    title: 'Gráfico: Participação por Vendedor (Pizza)',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Gráfico de pizza com divisão percentual de vendas por vendedor ou representante.',
    band: 'summary',
    height: 180,
    badge: 'JFreeChart / Pizza',
    tags: ['grafico', 'chart', 'pizza', 'pie', 'vendedor', 'participacao', 'meta'],
    configurableFields: [
      { key: 'showLegend', label: 'Legenda do Gráfico', defaultValue: true },
      { key: 'showLabels', label: 'Rótulos de Percentuais', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const isShowLegend = toggles.showLegend !== false;
      const isShowLabels = toggles.showLabels !== false;

      return [
        {
          id: `chart-pie-${now}`,
          type: 'chart',
          chartType: 'pieChart',
          reportElement: { x: 0, y: 10, width: colW, height: 160 },
          title: 'Participação por Vendedor',
          isShowLegend,
          isShowLabels,
          keyExpression: '$F{APELIDO}',
          valueExpression: '$F{VLRTOT}',
        } as JRXMLChart,
      ];
    },
  },
  {
    id: 'sankhya-chart-evolucao-mensal',
    title: 'Gráfico: Evolução Mensal de Vendas (Linhas)',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Gráfico de linhas com curva de tendência e pontos de vendas mensais.',
    band: 'summary',
    height: 180,
    badge: 'JFreeChart / Linhas',
    tags: ['grafico', 'chart', 'linhas', 'evolucao', 'mensal', 'tendencia', 'vendas'],
    configurableFields: [
      { key: 'showLegend', label: 'Legenda do Gráfico', defaultValue: true },
      { key: 'showLabels', label: 'Rótulos de Dados', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const isShowLegend = toggles.showLegend !== false;
      const isShowLabels = toggles.showLabels !== false;

      return [
        {
          id: `chart-line-${now}`,
          type: 'chart',
          chartType: 'lineChart',
          reportElement: { x: 0, y: 10, width: colW, height: 160 },
          title: 'Evolução Mensal de Vendas',
          isShowLegend,
          isShowLabels,
          seriesExpression: '"Faturamento"',
          categoryExpression: '$F{MES}',
          valueExpression: '$F{VLRTOT}',
        } as JRXMLChart,
      ];
    },
  },
  {
    id: 'sankhya-crosstab-vendedor-mes',
    title: 'Matriz Cruzada: Vendas por Vendedor e Mês (Crosstab)',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Tabela dinâmica cruzando Vendedores (Linhas) com Meses (Colunas) e totalizadores automáticos.',
    band: 'summary',
    height: 160,
    badge: 'Crosstab / Matriz 2D',
    tags: ['crosstab', 'matriz', 'pivot', 'tabela', 'vendedor', 'mes', 'faturamento'],
    configurableFields: [
      { key: 'showRowTotal', label: 'Subtotais por Linha (Vendedor)', defaultValue: true },
      { key: 'showColTotal', label: 'Total Geral por Coluna (Mês)', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const rowTotalPosition = toggles.showRowTotal !== false ? 'End' : 'None';
      const colTotalPosition = toggles.showColTotal !== false ? 'End' : 'None';

      return [
        {
          id: `crosstab-vend-${now}`,
          type: 'crosstab',
          reportElement: { x: 0, y: 10, width: colW, height: 140 },
          rowGroup: {
            name: 'Vendedor',
            width: 120,
            totalPosition: rowTotalPosition,
            bucketExpression: '$F{APELIDO}',
            totalText: 'Total Vendedores',
          },
          columnGroup: {
            name: 'Mes',
            height: 20,
            totalPosition: colTotalPosition,
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
        } as JRXMLCrosstab,
      ];
    },
  },
  {
    id: 'sankhya-crosstab-filial-produto',
    title: 'Matriz Cruzada: Faturamento por Filial e Produto (Crosstab)',
    category: 'finance',
    categoryLabel: 'Financeiro',
    description: 'Matriz contábil e de faturamento cruzando Filiais (Linhas) com Grupos de Produto (Colunas).',
    band: 'summary',
    height: 160,
    badge: 'Crosstab / Matriz 2D',
    tags: ['crosstab', 'matriz', 'pivot', 'filial', 'produto', 'financeiro'],
    configurableFields: [
      { key: 'showRowTotal', label: 'Subtotais por Linha (Filial)', defaultValue: true },
      { key: 'showColTotal', label: 'Total Geral por Coluna (Produto)', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const rowTotalPosition = toggles.showRowTotal !== false ? 'End' : 'None';
      const colTotalPosition = toggles.showColTotal !== false ? 'End' : 'None';

      return [
        {
          id: `crosstab-filial-${now}`,
          type: 'crosstab',
          reportElement: { x: 0, y: 10, width: colW, height: 140 },
          rowGroup: {
            name: 'Filial',
            width: 110,
            totalPosition: rowTotalPosition,
            bucketExpression: '$F{APELIDO}',
            totalText: 'Total Filiais',
          },
          columnGroup: {
            name: 'GrupoProd',
            height: 20,
            totalPosition: colTotalPosition,
            bucketExpression: '$F{DESCRGRUPOPROD}',
            totalText: 'Total Geral',
          },
          measure: {
            name: 'Faturamento',
            calculation: 'Sum',
            expression: '$F{VLRTOT}',
            pattern: '#,##0.00',
          },
          cellWidth: 65,
          cellHeight: 20,
        } as JRXMLCrosstab,
      ];
    },
  },

  // ==========================================
  // 5. SUPER-BIBLIOTECA EXPANDIDA SANKHYA ERP
  // ==========================================
  {
    id: 'sankhya-boleto-bancario',
    title: 'Boleto de Cobrança Bancária (FEBRABAN)',
    category: 'finance',
    categoryLabel: 'Financeiro',
    description: 'Ficha de compensação oficial FEBRABAN com linha digitável, vencimento, agência/código cedente, valor do documento, instruções e código de barras I25.',
    band: 'summary',
    height: 160,
    badge: 'FEBRABAN / Boleto',
    tags: ['boleto', 'febraban', 'banco', 'cobranca', 'i25', 'linha digitavel', 'compensacao'],
    configurableFields: [
      { key: 'showLinhaDigitavel', label: 'Linha Digitável Oficial', defaultValue: true },
      { key: 'showBankHeader', label: 'Logotipo e Número do Banco', defaultValue: true },
      { key: 'showCedenteSacado', label: 'Dados do Beneficiário / Pagador', defaultValue: true },
      { key: 'showInstrucoes', label: 'Instruções de Pagamento e Juros', defaultValue: true },
      { key: 'showBarcodeI25', label: 'Código de Barras Interleaved 2 of 5', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showLinhaDigitavel = toggles.showLinhaDigitavel !== false;
      const showBankHeader = toggles.showBankHeader !== false;
      const showCedenteSacado = toggles.showCedenteSacado !== false;
      const showInstrucoes = toggles.showInstrucoes !== false;
      const showBarcodeI25 = toggles.showBarcodeI25 !== false;
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        // Linha pontilhada de corte
        {
          id: `bol-${now}-cut`,
          type: 'line',
          reportElement: { x: 0, y: 2, width: colW, height: 1, forecolor: '#94A3B8' },
          penWidth: 0.5,
        },
        // Moldura principal do boleto
        {
          id: `bol-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 8,
            width: colW,
            height: 148,
            backcolor: backcolor === 'transparent' ? 'transparent' : '#FFFFFF',
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const rightBoxW = 140;
      const rightX = colW - 8 - rightBoxW;

      // Cabeçalho do banco & linha digitável
      if (showBankHeader) {
        elements.push(
          {
            id: `bol-${now}-banco`,
            type: 'staticText',
            reportElement: { x: 8, y: 12, width: 120, height: 14, forecolor: textColor },
            textElement: { font: { size: 10, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'BANCO DO BRASIL | 001-9',
          },
          createVerticalDivider(`bol-${now}-sep1`, 132, 12, 14, penColor, penWidth)
        );
      }

      if (showLinhaDigitavel) {
        elements.push({
          id: `bol-${now}-linha`,
          type: 'textField',
          reportElement: {
            x: showBankHeader ? 140 : 8,
            y: 12,
            width: showBankHeader ? colW - 148 : colW - 16,
            height: 14,
            forecolor: textColor,
          },
          textElement: { font: { fontName: 'Courier New', size: 9, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          expression: '"00190.00009  01234.567802  00000.000123  1  95420000164453"',
        });
      }

      // Linha divisória horizontal 1
      elements.push({
        id: `bol-${now}-div1`,
        type: 'line',
        reportElement: { x: 0, y: 28, width: colW, height: 1, forecolor: penColor },
        penWidth: 1,
        penColor,
      });

      // Divisória vertical contínua da coluna lateral direita FEBRABAN
      elements.push(createVerticalDivider(`bol-${now}-vdiv-right`, rightX - 4, 28, 76, penColor, penWidth));

      // Grade Linha 1: Local de Pagamento + Vencimento
      elements.push(
        {
          id: `bol-${now}-lbl-loc`,
          type: 'staticText',
          reportElement: { x: 8, y: 30, width: rightX - 16, height: 9, forecolor: mutedColor },
          textElement: { font: { size: 6, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'LOCAL DE PAGAMENTO:',
        },
        {
          id: `bol-${now}-val-loc`,
          type: 'staticText',
          reportElement: { x: 8, y: 39, width: rightX - 16, height: 10, forecolor: textColor },
          textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'PAGÁVEL EM QUALQUER BANCO OU CANAIS ELETRÔNICOS ATÉ O VENCIMENTO',
        },
        {
          id: `bol-${now}-lbl-venc`,
          type: 'staticText',
          reportElement: { x: rightX, y: 30, width: rightBoxW, height: 9, forecolor: mutedColor },
          textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          text: 'DATA DE VENCIMENTO:',
        },
        {
          id: `bol-${now}-val-venc`,
          type: 'textField',
          reportElement: { x: rightX, y: 39, width: rightBoxW, height: 11, forecolor: textColor },
          textElement: { font: { size: 9, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          pattern: 'dd/MM/yyyy',
          expression: '$F{DTVENC}',
        },
        {
          id: `bol-${now}-div2`,
          type: 'line',
          reportElement: { x: 0, y: 50, width: colW, height: 1, forecolor: penColor },
          penWidth: 1,
          penColor,
        }
      );

      // Grade Linha 2: Beneficiário + Agência / Código
      if (showCedenteSacado) {
        elements.push(
          {
            id: `bol-${now}-lbl-ben`,
            type: 'staticText',
            reportElement: { x: 8, y: 52, width: rightX - 16, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'BENEFICIÁRIO / CEDENTE:',
          },
          {
            id: `bol-${now}-val-ben`,
            type: 'textField',
            reportElement: { x: 8, y: 61, width: rightX - 16, height: 10, forecolor: textColor },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '$F{RAZAOSOCIAL_EMP} + " - CNPJ: " + $F{CGC_EMP}',
          },
          {
            id: `bol-${now}-lbl-ag`,
            type: 'staticText',
            reportElement: { x: rightX, y: 52, width: rightBoxW, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'AGÊNCIA / CÓDIGO BENEFICIÁRIO:',
          },
          {
            id: `bol-${now}-val-ag`,
            type: 'staticText',
            reportElement: { x: rightX, y: 61, width: rightBoxW, height: 10, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: '1234-5 / 0012345-6',
          },
          {
            id: `bol-${now}-div3`,
            type: 'line',
            reportElement: { x: 0, y: 72, width: colW, height: 1, forecolor: penColor },
            penWidth: 1,
            penColor,
          }
        );
      }

      // Grade Linha 3: Nº Documento + Nosso Número + Valor do Documento
      const leftMidW = Math.floor((rightX - 16) / 2);
      elements.push(
        {
          id: `bol-${now}-lbl-doc`,
          type: 'staticText',
          reportElement: { x: 8, y: 74, width: leftMidW - 8, height: 9, forecolor: mutedColor },
          textElement: { font: { size: 6, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          text: 'Nº DO DOCUMENTO:',
        },
        {
          id: `bol-${now}-val-doc`,
          type: 'textField',
          reportElement: { x: 8, y: 83, width: leftMidW - 8, height: 11, forecolor: textColor },
          textElement: { font: { size: 8 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          expression: '$F{NUMNOTA}',
        },
        createVerticalDivider(`bol-${now}-vdiv-doc`, 8 + leftMidW, 72, 32, penColor, penWidth),
        {
          id: `bol-${now}-lbl-nn`,
          type: 'staticText',
          reportElement: { x: 8 + leftMidW + 4, y: 74, width: leftMidW - 8, height: 9, forecolor: mutedColor },
          textElement: { font: { size: 6, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          text: 'NOSSO NÚMERO:',
        },
        {
          id: `bol-${now}-val-nn`,
          type: 'textField',
          reportElement: { x: 8 + leftMidW + 4, y: 83, width: leftMidW - 8, height: 11, forecolor: textColor },
          textElement: { font: { size: 8 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          expression: '$F{NOSSONUM}',
        },
        {
          id: `bol-${now}-lbl-vlr`,
          type: 'staticText',
          reportElement: { x: rightX, y: 74, width: rightBoxW, height: 9, forecolor: mutedColor },
          textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          text: 'VALOR DO DOCUMENTO:',
        },
        {
          id: `bol-${now}-val-vlr`,
          type: 'textField',
          reportElement: { x: rightX, y: 83, width: rightBoxW, height: 13, forecolor: '#0284C7' },
          textElement: { font: { size: 10, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          pattern: '¤ #,##0.00',
          expression: '$F{VLRDESDOB}',
        },
        {
          id: `bol-${now}-div4`,
          type: 'line',
          reportElement: { x: 0, y: 104, width: colW, height: 1, forecolor: penColor },
          penWidth: 1,
          penColor,
        }
      );

      // Instruções & Pagador
      if (showInstrucoes) {
        elements.push(
          {
            id: `bol-${now}-lbl-inst`,
            type: 'staticText',
            reportElement: { x: 8, y: 106, width: colW - 16, height: 8, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'INSTRUÇÕES (TEXTO DE RESPONSABILIDADE DO BENEFICIÁRIO):',
          },
          {
            id: `bol-${now}-val-inst`,
            type: 'staticText',
            reportElement: { x: 8, y: 114, width: colW - 16, height: 16, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'JUROS DE MORA DE 1,00% AO MÊS APÓS O VENCIMENTO. NÃO RECEBER APÓS 30 DIAS DO VENCIMENTO.',
          }
        );
      }

      if (showBarcodeI25) {
        elements.push({
          id: `bol-${now}-barcode`,
          type: 'barcode',
          barcodeType: 'Interleaved2Of5',
          reportElement: { x: 8, y: 132, width: colW - 16, height: 20 },
          expression: '"00191954200001644530000001234567802000000123"',
          moduleWidth: 1.0,
        });
      }

      return elements;
    },
  },
  {
    id: 'sankhya-quadro-emitente',
    title: 'Quadro da Empresa Emitente (Filial)',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Dados completos da empresa emissora: Razão Social, CNPJ, Inscrição Estadual, Endereço e Logotipo institucional.',
    band: 'title',
    height: 50,
    badge: 'TSIEMP / Emitente',
    tags: ['emitente', 'empresa', 'filial', 'cnpj', 'ie', 'logo', 'tsiemp'],
    configurableFields: [
      { key: 'showLogo', label: 'Espaço para Logotipo da Empresa', defaultValue: true },
      { key: 'showRazaoSocial', label: 'Razão Social e Nome Fantasia', defaultValue: true },
      { key: 'showCnpjIe', label: 'CNPJ e Inscrição Estadual', defaultValue: true },
      { key: 'showEndereco', label: 'Endereço, Telefone e Cidade/UF', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const showLogo = toggles.showLogo !== false;
      const showRazaoSocial = toggles.showRazaoSocial !== false;
      const showCnpjIe = toggles.showCnpjIe !== false;
      const showEndereco = toggles.showEndereco !== false;
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `emp-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 46,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const startX = showLogo ? 54 : 8;
      const badgeW = 126;
      const badgeX = colW - 8 - badgeW;
      const textW = badgeX - startX - 8;

      if (showLogo) {
        elements.push(
          {
            id: `emp-${now}-logo`,
            type: 'image',
            reportElement: { x: 8, y: 6, width: 38, height: 38 },
            expression: '"logo_empresa.png"',
          },
          createVerticalDivider(`emp-${now}-vdiv-logo`, 48, 2, 46, penColor, penWidth)
        );
      }

      if (showRazaoSocial) {
        elements.push({
          id: `emp-${now}-razao`,
          type: 'textField',
          reportElement: { x: startX, y: 6, width: textW, height: 14, forecolor: textColor },
          textElement: { font: { size: 10, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          expression: '$F{RAZAOSOCIAL_EMP}',
        });
      }

      if (showCnpjIe) {
        elements.push({
          id: `emp-${now}-doc`,
          type: 'textField',
          reportElement: { x: startX, y: 20, width: textW, height: 11, forecolor: mutedColor },
          textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          expression: '"CNPJ: " + $F{CGC_EMP} + "  •  INSCRIÇÃO ESTADUAL: " + $F{INSCEST_EMP}',
        });
      }

      if (showEndereco) {
        elements.push({
          id: `emp-${now}-end`,
          type: 'textField',
          reportElement: { x: startX, y: 31, width: textW, height: 11, forecolor: mutedColor },
          textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          expression: '$F{LOGRADOURO_EMP} + ", " + $F{NUMERO_EMP} + " - " + $F{CIDADE_EMP} + "/" + $F{UF_EMP} + "  •  FONE: (34) 3239-0000"',
        });
      }

      // Painel direito: DANFE Oficial
      elements.push(
        createVerticalDivider(`emp-${now}-vdiv-badge`, badgeX - 4, 2, 46, penColor, penWidth),
        {
          id: `emp-${now}-badge-title`,
          type: 'staticText',
          reportElement: { x: badgeX, y: 8, width: badgeW, height: 14, forecolor: textColor },
          textElement: { font: { size: 10, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          text: 'DANFE',
        },
        {
          id: `emp-${now}-badge-sub`,
          type: 'staticText',
          reportElement: { x: badgeX, y: 22, width: badgeW, height: 20, forecolor: mutedColor },
          textElement: { font: { size: 6, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          text: 'DOCUMENTO AUXILIAR DA NOTA FISCAL ELETRÔNICA',
        }
      );

      return elements;
    },
  },
  {
    id: 'sankhya-retencoes-federais',
    title: 'Quadro de Retenções de Tributos Federais',
    category: 'finance',
    categoryLabel: 'Financeiro',
    description: 'Demonstrativo das retenções na fonte: PIS, COFINS, CSLL, IRRF, INSS e ISSQN de serviços.',
    band: 'summary',
    height: 40,
    badge: 'Retenções / Fisco',
    tags: ['retencoes', 'pis', 'cofins', 'csll', 'irrf', 'inss', 'iss', 'tributos'],
    configurableFields: [
      { key: 'showPis', label: 'Retenção de PIS', defaultValue: true },
      { key: 'showCofins', label: 'Retenção de COFINS', defaultValue: true },
      { key: 'showCsll', label: 'Retenção de CSLL', defaultValue: true },
      { key: 'showIrrf', label: 'Retenção de IRRF', defaultValue: true },
      { key: 'showIssInss', label: 'Retenção de ISS / INSS', defaultValue: true },
      { key: 'showTotalRetencoes', label: 'Total das Retenções', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `ret-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 34,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const retColumns = [
        { key: 'showPis', title: 'RETENÇÃO PIS', expr: '$F{VLRPISRET}' },
        { key: 'showCofins', title: 'RETENÇÃO COFINS', expr: '$F{VLRCOFINSRET}' },
        { key: 'showCsll', title: 'RETENÇÃO CSLL', expr: '$F{VLRCSLLRET}' },
        { key: 'showIrrf', title: 'RETENÇÃO IRRF', expr: '$F{VLRIRFRET}' },
        { key: 'showIssInss', title: 'RETENÇÃO ISS', expr: '$F{VLRISSRET}' },
        { key: 'showTotalRetencoes', title: 'TOTAL RETENÇÕES', expr: '$F{TOTRET}', isBold: true, color: '#0284C7' },
      ];

      const cols = calculateGridColumns(colW, 6, 8, 8);

      for (let i = 1; i < 6; i++) {
        elements.push(createVerticalDivider(`ret-${now}-vdiv-${i}`, cols[i].x, 2, 34, penColor, penWidth));
      }

      retColumns.forEach((col, idx) => {
        if (toggles[col.key] !== false) {
          elements.push(
            {
              id: `ret-${now}-lbl-${idx}`,
              type: 'staticText',
              reportElement: { x: cols[idx].x + 4, y: 5, width: cols[idx].width - 8, height: 9, forecolor: col.color || mutedColor },
              textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
              text: col.title,
            },
            {
              id: `ret-${now}-val-${idx}`,
              type: 'textField',
              reportElement: { x: cols[idx].x + 4, y: 16, width: cols[idx].width - 8, height: 14, forecolor: col.color || textColor },
              textElement: { font: { size: 8, isBold: !!col.isBold }, textAlignment: 'Right', verticalAlignment: 'Middle' },
              pattern: '¤ #,##0.00',
              expression: col.expr,
            }
          );
        }
      });

      return elements;
    },
  },
  {
    id: 'sankhya-pedido-venda-header',
    title: 'Cabeçalho do Pedido de Venda / Orçamento',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Número do pedido, data de negociação, tipo de operação (TOP), tipo de movimento e status de aprovação.',
    band: 'title',
    height: 45,
    badge: 'TGFCAB / Pedido',
    tags: ['pedido', 'venda', 'orcamento', 'tgfcab', 'top', 'status'],
    configurableFields: [
      { key: 'showNumeroPedido', label: 'Número do Pedido / Orçamento', defaultValue: true },
      { key: 'showDataNegociacao', label: 'Data de Negociação / Entrada', defaultValue: true },
      { key: 'showTop', label: 'Tipo de Operação (TOP)', defaultValue: true },
      { key: 'showStatus', label: 'Status / Situação do Pedido', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `ped-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 38,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const cols = calculateGridColumns(colW, 4, 8, 8);

      for (let i = 1; i < 4; i++) {
        elements.push(createVerticalDivider(`ped-${now}-vdiv-${i}`, cols[i].x, 2, 38, penColor, penWidth));
      }

      if (toggles.showNumeroPedido !== false) {
        elements.push(
          {
            id: `ped-${now}-lbl-num`,
            type: 'staticText',
            reportElement: { x: cols[0].x + 4, y: 5, width: cols[0].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'PEDIDO DE VENDA Nº:',
          },
          {
            id: `ped-${now}-val-num`,
            type: 'textField',
            reportElement: { x: cols[0].x + 4, y: 16, width: cols[0].width - 8, height: 18, forecolor: '#0284C7' },
            textElement: { font: { size: 12, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '$F{NUMNOTA}',
          }
        );
      }

      if (toggles.showDataNegociacao !== false) {
        elements.push(
          {
            id: `ped-${now}-lbl-dt`,
            type: 'staticText',
            reportElement: { x: cols[1].x + 4, y: 5, width: cols[1].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'DATA NEGOCIAÇÃO:',
          },
          {
            id: `ped-${now}-val-dt`,
            type: 'textField',
            reportElement: { x: cols[1].x + 4, y: 16, width: cols[1].width - 8, height: 16, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            pattern: 'dd/MM/yyyy HH:mm',
            expression: '$F{DTNEG}',
          }
        );
      }

      if (toggles.showTop !== false) {
        elements.push(
          {
            id: `ped-${now}-lbl-top`,
            type: 'staticText',
            reportElement: { x: cols[2].x + 4, y: 5, width: cols[2].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'TIPO DE OPERAÇÃO (TOP):',
          },
          {
            id: `ped-${now}-val-top`,
            type: 'textField',
            reportElement: { x: cols[2].x + 4, y: 16, width: cols[2].width - 8, height: 16, forecolor: textColor },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '$F{CODTIPOPER} + " - VENDA"',
          }
        );
      }

      if (toggles.showStatus !== false) {
        elements.push(
          {
            id: `ped-${now}-lbl-st`,
            type: 'staticText',
            reportElement: { x: cols[3].x + 4, y: 5, width: cols[3].width - 8, height: 10, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'SITUAÇÃO:',
          },
          {
            id: `ped-${now}-val-st`,
            type: 'textField',
            reportElement: { x: cols[3].x + 4, y: 16, width: cols[3].width - 8, height: 16, forecolor: '#059669' },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            expression: '$F{STATUSNOTA} == "L" ? "CONFIRMADO" : "PENDENTE"',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-dados-vendedor-comissao',
    title: 'Quadro do Vendedor e Condições Comerciais',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Vendedor responsável, percentual de comissão, tabela de preços aplicada e condição/prazo de pagamento.',
    band: 'pageHeader',
    height: 35,
    badge: 'TGFVEN / Comercial',
    tags: ['vendedor', 'comissao', 'tabela de preco', 'condicao', 'comercial', 'tgfven'],
    configurableFields: [
      { key: 'showVendedor', label: 'Vendedor / Representante', defaultValue: true },
      { key: 'showTabelaPreco', label: 'Tabela de Preços', defaultValue: true },
      { key: 'showCondicaoPagamento', label: 'Condição de Pagamento', defaultValue: true },
      { key: 'showComissao', label: 'Percentual de Comissão', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `ven-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 30,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const cols = calculateGridColumns(colW, 4, 8, 8);

      for (let i = 1; i < 4; i++) {
        elements.push(createVerticalDivider(`ven-${now}-vdiv-${i}`, cols[i].x, 2, 30, penColor, penWidth));
      }

      if (toggles.showVendedor !== false) {
        elements.push(
          {
            id: `ven-${now}-lbl1`,
            type: 'staticText',
            reportElement: { x: cols[0].x + 4, y: 5, width: cols[0].width - 8, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'VENDEDOR:',
          },
          {
            id: `ven-${now}-val1`,
            type: 'textField',
            reportElement: { x: cols[0].x + 4, y: 15, width: cols[0].width - 8, height: 12, forecolor: textColor },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '$F{CODVEND} + " - " + $F{APELIDO_VEND}',
          }
        );
      }

      if (toggles.showTabelaPreco !== false) {
        elements.push(
          {
            id: `ven-${now}-lbl2`,
            type: 'staticText',
            reportElement: { x: cols[1].x + 4, y: 5, width: cols[1].width - 8, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'TABELA DE PREÇOS:',
          },
          {
            id: `ven-${now}-val2`,
            type: 'textField',
            reportElement: { x: cols[1].x + 4, y: 15, width: cols[1].width - 8, height: 12, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '"TAB 01 - VAREJO"',
          }
        );
      }

      if (toggles.showCondicaoPagamento !== false) {
        elements.push(
          {
            id: `ven-${now}-lbl3`,
            type: 'staticText',
            reportElement: { x: cols[2].x + 4, y: 5, width: cols[2].width - 8, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'COND. PAGAMENTO:',
          },
          {
            id: `ven-${now}-val3`,
            type: 'textField',
            reportElement: { x: cols[2].x + 4, y: 15, width: cols[2].width - 8, height: 12, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            expression: '"30/60/90 DIAS"',
          }
        );
      }

      if (toggles.showComissao !== false) {
        elements.push(
          {
            id: `ven-${now}-lbl4`,
            type: 'staticText',
            reportElement: { x: cols[3].x + 4, y: 5, width: cols[3].width - 8, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'COMISSÃO:',
          },
          {
            id: `ven-${now}-val4`,
            type: 'textField',
            reportElement: { x: cols[3].x + 4, y: 15, width: cols[3].width - 8, height: 12, forecolor: '#059669' },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00 %',
            expression: '$F{COMISSAO}',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-romaneio-picking-carga',
    title: 'Linha de Romaneio com Lote e Validade (WMS)',
    category: 'stock',
    categoryLabel: 'Estoque & Logística',
    description: 'Conferência avançada de expedição com Rua/Prateleira, Lote, Data de Validade e Checkbox de conferência.',
    band: 'detail',
    height: 30,
    badge: 'WMS / Expedição',
    tags: ['romaneio', 'picking', 'lote', 'validade', 'wms', 'expedicao', 'conferencia'],
    configurableFields: [
      { key: 'showCheckbox', label: 'Caixa de Checagem', defaultValue: true },
      { key: 'showLocalizacao', label: 'Rua / Posição (Endereçamento)', defaultValue: true },
      { key: 'showLote', label: 'Número do Lote', defaultValue: true },
      { key: 'showValidade', label: 'Data de Validade do Produto', defaultValue: true },
      { key: 'showQuantidade', label: 'Quantidade a Conferir', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [];

      if (toggles.showCheckbox !== false) {
        elements.push({
          id: `wms-${now}-chk`,
          type: 'rectangle',
          reportElement: { x: 8, y: 7, width: 14, height: 14, backcolor: '#FFFFFF', mode: 'Opaque' },
          radius: 2,
          penWidth: 1,
          penColor: '#94A3B8',
        });
      }

      if (toggles.showLocalizacao !== false) {
        elements.push(
          {
            id: `wms-${now}-loc`,
            type: 'staticText',
            reportElement: { x: 26, y: 8, width: 52, height: 12, forecolor: mutedColor },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'R04-P12',
          },
          createVerticalDivider(`wms-${now}-div1`, 82, 2, 24, penColor, penWidth)
        );
      }

      elements.push(
        {
          id: `wms-${now}-cod`,
          type: 'textField',
          reportElement: { x: 86, y: 8, width: 44, height: 12, forecolor: textColor },
          textElement: { font: { size: 8, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          expression: '$F{CODPROD}',
        },
        createVerticalDivider(`wms-${now}-div2`, 134, 2, 24, penColor, penWidth),
        {
          id: `wms-${now}-descr`,
          type: 'textField',
          reportElement: { x: 138, y: 8, width: colW - 370, height: 12, forecolor: textColor },
          textElement: { font: { size: 8 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          expression: '$F{DESCRPROD}',
        }
      );

      if (toggles.showLote !== false) {
        elements.push(
          createVerticalDivider(`wms-${now}-div3`, colW - 228, 2, 24, penColor, penWidth),
          {
            id: `wms-${now}-lote`,
            type: 'textField',
            reportElement: { x: colW - 224, y: 8, width: 72, height: 12, forecolor: mutedColor },
            textElement: { font: { size: 7 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            expression: '"LT: " + $F{CONTROLE}',
          }
        );
      }

      if (toggles.showValidade !== false) {
        elements.push(
          createVerticalDivider(`wms-${now}-div4`, colW - 148, 2, 24, penColor, penWidth),
          {
            id: `wms-${now}-val`,
            type: 'textField',
            reportElement: { x: colW - 144, y: 8, width: 66, height: 12, forecolor: mutedColor },
            textElement: { font: { size: 7 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            pattern: 'dd/MM/yyyy',
            expression: '$F{DTVAL}',
          }
        );
      }

      if (toggles.showQuantidade !== false) {
        elements.push(
          createVerticalDivider(`wms-${now}-div5`, colW - 74, 2, 24, penColor, penWidth),
          {
            id: `wms-${now}-qtd`,
            type: 'textField',
            reportElement: { x: colW - 70, y: 8, width: 62, height: 12, forecolor: '#0284C7' },
            textElement: { font: { size: 9, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '#,##0.00',
            expression: '$F{QTDNEG}',
          }
        );
      }

      elements.push({
        id: `wms-${now}-line`,
        type: 'line',
        reportElement: { x: 0, y: 26, width: colW, height: 1, forecolor: penColor },
        penWidth: 0.5,
        penColor,
      });

      return elements;
    },
  },
  {
    id: 'sankhya-holerite-salario',
    title: 'Recibo de Pagamento de Salário (Holerite)',
    category: 'finance',
    categoryLabel: 'Financeiro',
    description: 'Demonstrativo formal de folha de pagamento: Proventos, Descontos, Bases de FGTS/INSS/IRRF e Salário Líquido.',
    band: 'summary',
    height: 120,
    badge: 'DP / Folha',
    tags: ['holerite', 'salario', 'folha', 'proventos', 'descontos', 'liquido', 'fgts', 'inss'],
    configurableFields: [
      { key: 'showProventos', label: 'Coluna de Vencimentos / Proventos', defaultValue: true },
      { key: 'showDescontos', label: 'Coluna de Descontos (INSS/IRRF)', defaultValue: true },
      { key: 'showTotaisBases', label: 'Bases de FGTS, INSS e IRRF', defaultValue: true },
      { key: 'showSalarioLiquido', label: 'Salário Líquido em Destaque', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `hol-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 4,
            width: colW,
            height: 110,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
        // Título Holerite
        {
          id: `hol-${now}-title`,
          type: 'staticText',
          reportElement: { x: 8, y: 7, width: 220, height: 12, forecolor: textColor },
          textElement: { font: { size: 9, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'DEMONSTRATIVO DE PAGAMENTO MENSAL',
        },
        {
          id: `hol-${now}-func`,
          type: 'textField',
          reportElement: { x: colW - 228, y: 7, width: 220, height: 12, forecolor: mutedColor },
          textElement: { font: { size: 8 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          expression: '$F{CODPARC} + " - " + $F{NOMEPARC}',
        },
        {
          id: `hol-${now}-div1`,
          type: 'line',
          reportElement: { x: 0, y: 22, width: colW, height: 1, forecolor: penColor },
          penWidth: 1,
          penColor,
        },
      ];

      const midX = Math.floor(colW / 2);
      elements.push(createVerticalDivider(`hol-${now}-mid-div`, midX, 22, 48, penColor, penWidth));

      // Coluna Proventos (lado esquerdo)
      if (toggles.showProventos !== false) {
        const leftW = midX - 16;
        elements.push(
          {
            id: `hol-${now}-prov-hdr`,
            type: 'staticText',
            reportElement: { x: 8, y: 25, width: leftW, height: 10, forecolor: '#059669' },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'PROVENTOS / VENCIMENTOS',
          },
          {
            id: `hol-${now}-prov-1`,
            type: 'staticText',
            reportElement: { x: 8, y: 37, width: leftW - 70, height: 10, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: '001 - SALÁRIO BASE',
          },
          {
            id: `hol-${now}-prov-v1`,
            type: 'textField',
            reportElement: { x: 8 + leftW - 68, y: 37, width: 68, height: 10, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            pattern: '¤ #,##0.00',
            expression: '$F{SALARIOBASE}',
          },
          {
            id: `hol-${now}-prov-2`,
            type: 'staticText',
            reportElement: { x: 8, y: 49, width: leftW - 70, height: 10, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: '015 - HORAS EXTRAS 50%',
          },
          {
            id: `hol-${now}-prov-v2`,
            type: 'staticText',
            reportElement: { x: 8 + leftW - 68, y: 49, width: 68, height: 10, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'R$ 480,00',
          }
        );
      }

      // Coluna Descontos (lado direito)
      if (toggles.showDescontos !== false) {
        const rightStart = midX + 8;
        const rightW = colW - 8 - rightStart;
        elements.push(
          {
            id: `hol-${now}-desc-hdr`,
            type: 'staticText',
            reportElement: { x: rightStart, y: 25, width: rightW, height: 10, forecolor: '#DC2626' },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'DESCONTOS LEGAIS',
          },
          {
            id: `hol-${now}-desc-1`,
            type: 'staticText',
            reportElement: { x: rightStart, y: 37, width: rightW - 70, height: 10, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: '501 - INSS FOLHA (11%)',
          },
          {
            id: `hol-${now}-desc-v1`,
            type: 'staticText',
            reportElement: { x: rightStart + rightW - 68, y: 37, width: 68, height: 10, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'R$ 514,80',
          },
          {
            id: `hol-${now}-desc-2`,
            type: 'staticText',
            reportElement: { x: rightStart, y: 49, width: rightW - 70, height: 10, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: '505 - IRRF SOBRE SALÁRIO',
          },
          {
            id: `hol-${now}-desc-v2`,
            type: 'staticText',
            reportElement: { x: rightStart + rightW - 68, y: 49, width: 68, height: 10, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'R$ 212,40',
          }
        );
      }

      // Linha horizontal divisória antes das bases
      elements.push({
        id: `hol-${now}-div2`,
        type: 'line',
        reportElement: { x: 0, y: 70, width: colW, height: 1, forecolor: penColor },
        penWidth: 1,
        penColor,
      });

      // Bases de FGTS / INSS em 5 colunas perfeitamente alinhadas
      const baseCols = calculateGridColumns(colW, 5, 8, 8);
      for (let i = 1; i < 5; i++) {
        elements.push(createVerticalDivider(`hol-${now}-bdiv-${i}`, baseCols[i].x, 70, 44, penColor, penWidth));
      }

      if (toggles.showTotaisBases !== false) {
        elements.push(
          // Col 0: Base FGTS
          {
            id: `hol-${now}-base-fgts-lbl`,
            type: 'staticText',
            reportElement: { x: baseCols[0].x + 4, y: 74, width: baseCols[0].width - 8, height: 8, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'BASE CÁLC. FGTS:',
          },
          {
            id: `hol-${now}-base-fgts-val`,
            type: 'staticText',
            reportElement: { x: baseCols[0].x + 4, y: 84, width: baseCols[0].width - 8, height: 11, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'R$ 4.680,00',
          },
          // Col 1: Vlr FGTS
          {
            id: `hol-${now}-vlr-fgts-lbl`,
            type: 'staticText',
            reportElement: { x: baseCols[1].x + 4, y: 74, width: baseCols[1].width - 8, height: 8, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'FGTS DO MÊS:',
          },
          {
            id: `hol-${now}-vlr-fgts-val`,
            type: 'staticText',
            reportElement: { x: baseCols[1].x + 4, y: 84, width: baseCols[1].width - 8, height: 11, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'R$ 374,40',
          },
          // Col 2: Base INSS
          {
            id: `hol-${now}-base-inss-lbl`,
            type: 'staticText',
            reportElement: { x: baseCols[2].x + 4, y: 74, width: baseCols[2].width - 8, height: 8, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'BASE CÁLC. INSS:',
          },
          {
            id: `hol-${now}-base-inss-val`,
            type: 'staticText',
            reportElement: { x: baseCols[2].x + 4, y: 84, width: baseCols[2].width - 8, height: 11, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'R$ 4.680,00',
          },
          // Col 3: Base IRRF
          {
            id: `hol-${now}-base-irrf-lbl`,
            type: 'staticText',
            reportElement: { x: baseCols[3].x + 4, y: 74, width: baseCols[3].width - 8, height: 8, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'BASE CÁLC. IRRF:',
          },
          {
            id: `hol-${now}-base-irrf-val`,
            type: 'staticText',
            reportElement: { x: baseCols[3].x + 4, y: 84, width: baseCols[3].width - 8, height: 11, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'R$ 4.165,20',
          }
        );
      }

      // Col 4: Salário Líquido em Destaque
      if (toggles.showSalarioLiquido !== false) {
        elements.push(
          {
            id: `hol-${now}-liq-lbl`,
            type: 'staticText',
            reportElement: { x: baseCols[4].x + 4, y: 74, width: baseCols[4].width - 8, height: 9, forecolor: '#059669' },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'VALOR LÍQUIDO A RECEBER:',
          },
          {
            id: `hol-${now}-liq-val`,
            type: 'staticText',
            reportElement: { x: baseCols[4].x + 4, y: 84, width: baseCols[4].width - 8, height: 14, forecolor: '#059669' },
            textElement: { font: { size: 10, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'R$ 3.952,80',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-ordem-servico',
    title: 'Quadro de Ordem de Serviço (Equipamento & Laudo)',
    category: 'structural',
    categoryLabel: 'Estruturais',
    description: 'Identificação do equipamento/veículo, número de série/chassi, defeito relatado e laudo técnico do especialista.',
    band: 'pageHeader',
    height: 60,
    badge: 'O.S. / Serviços',
    tags: ['ordem de servico', 'os', 'equipamento', 'laudo', 'defeito', 'tecnico'],
    configurableFields: [
      { key: 'showEquipamento', label: 'Dados do Equipamento / Modelo', defaultValue: true },
      { key: 'showDefeitoRelatado', label: 'Defeito Relatado pelo Cliente', defaultValue: true },
      { key: 'showLaudoTecnico', label: 'Parecer Técnico / Diagnóstico', defaultValue: true },
      { key: 'showStatusOs', label: 'Status da O.S. (Garantia/Orçamento)', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `os-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 54,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const statusW = 140;
      const statusX = colW - 8 - statusW;
      const equipW = statusX - 16;

      if (toggles.showEquipamento !== false) {
        elements.push(
          {
            id: `os-${now}-lbl-eq`,
            type: 'staticText',
            reportElement: { x: 8, y: 5, width: equipW, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'EQUIPAMENTO / BEM:',
          },
          {
            id: `os-${now}-val-eq`,
            type: 'textField',
            reportElement: { x: 8, y: 14, width: equipW, height: 12, forecolor: textColor },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '$F{EQUIPAMENTO} + "  (N/S: " + $F{NUMSERIE} + ")"',
          }
        );
      }

      if (toggles.showStatusOs !== false) {
        elements.push(
          createVerticalDivider(`os-${now}-vdiv`, statusX - 4, 2, 26, penColor, penWidth),
          {
            id: `os-${now}-lbl-st`,
            type: 'staticText',
            reportElement: { x: statusX, y: 5, width: statusW, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'TIPO DE ATENDIMENTO:',
          },
          {
            id: `os-${now}-val-st`,
            type: 'staticText',
            reportElement: { x: statusX, y: 14, width: statusW, height: 12, forecolor: '#0284C7' },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'MANUTENÇÃO CORRETIVA',
          }
        );
      }

      elements.push({
        id: `os-${now}-hdiv`,
        type: 'line',
        reportElement: { x: 0, y: 28, width: colW, height: 1, forecolor: penColor },
        penWidth: 1,
        penColor,
      });

      if (toggles.showDefeitoRelatado !== false) {
        elements.push(
          {
            id: `os-${now}-lbl-def`,
            type: 'staticText',
            reportElement: { x: 8, y: 30, width: colW - 16, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'DEFEITO RELATADO:',
          },
          {
            id: `os-${now}-val-def`,
            type: 'textField',
            reportElement: { x: 8, y: 39, width: colW - 16, height: 12, forecolor: textColor },
            textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '$F{DEFEITO}',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-clausula-lgpd',
    title: 'Cláusula de Privacidade e Proteção de Dados (LGPD)',
    category: 'structural',
    categoryLabel: 'Estruturais',
    description: 'Termo legal padronizado de conformidade com a LGPD (Lei 13.709/2018) com indicação do canal DPO/Encarregado.',
    band: 'pageFooter',
    height: 25,
    badge: 'LGPD / Jurídico',
    tags: ['lgpd', 'privacidade', 'dados', 'juridico', 'termo', 'dpo'],
    configurableFields: [
      { key: 'showTextoLgpd', label: 'Texto Legal de Privacidade', defaultValue: true },
      { key: 'showCanalDpo', label: 'Canal de Contato do DPO / Encarregado', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `lgpd-${now}-line`,
          type: 'line',
          reportElement: { x: 0, y: 2, width: colW, height: 1, forecolor: penColor },
          penWidth: 0.5,
        },
      ];

      const dpoW = 145;
      const dpoX = colW - 8 - dpoW;
      const textW = toggles.showCanalDpo !== false ? dpoX - 16 : colW - 16;

      if (toggles.showTextoLgpd !== false) {
        elements.push({
          id: `lgpd-${now}-text`,
          type: 'staticText',
          reportElement: {
            x: 8,
            y: 5,
            width: textW,
            height: 16,
            forecolor: mutedColor,
          },
          textElement: { font: { size: 6 }, textAlignment: 'Justified', verticalAlignment: 'Middle' },
          text: 'Os dados pessoais contidos neste documento são processados em conformidade com a Lei Geral de Proteção de Dados (Lei 13.709/2018), com finalidade exclusiva de cumprimento de obrigações fiscais e comerciais legítimas.',
        });
      }

      if (toggles.showCanalDpo !== false) {
        elements.push(
          createVerticalDivider(`lgpd-${now}-vdiv`, dpoX - 4, 4, 18, penColor, penWidth),
          {
            id: `lgpd-${now}-dpo`,
            type: 'staticText',
            reportElement: { x: dpoX, y: 5, width: dpoW, height: 16, forecolor: textColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'DPO / Encarregado de Dados:\nprivacidade@empresa.com.br',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-termo-garantia',
    title: 'Termo de Garantia e Assistência Técnica',
    category: 'structural',
    categoryLabel: 'Estruturais',
    description: 'Condições gerais de garantia legal e contratual, prazo de vigência e regras de cancelamento.',
    band: 'summary',
    height: 50,
    badge: 'Garantia',
    tags: ['garantia', 'assistencia', 'prazo', 'juridico', 'termo'],
    configurableFields: [
      { key: 'showPrazoGarantia', label: 'Prazo de Vigência da Garantia', defaultValue: true },
      { key: 'showCondicoesGarantia', label: 'Condições e Regras de Cobertura', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `gar-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 44,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
        {
          id: `gar-${now}-title`,
          type: 'staticText',
          reportElement: { x: 8, y: 5, width: 220, height: 10, forecolor: textColor },
          textElement: { font: { size: 8, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'TERMO DE GARANTIA E ASSISTÊNCIA TÉCNICA',
        },
      ];

      const prazoW = 160;
      const prazoX = colW - 8 - prazoW;

      if (toggles.showPrazoGarantia !== false) {
        elements.push({
          id: `gar-${now}-prazo`,
          type: 'staticText',
          reportElement: { x: prazoX, y: 5, width: prazoW, height: 10, forecolor: '#059669' },
          textElement: { font: { size: 7, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          text: 'VIGÊNCIA: 12 MESES (CONTRATUAL)',
        });
      }

      elements.push({
        id: `gar-${now}-hdiv`,
        type: 'line',
        reportElement: { x: 0, y: 17, width: colW, height: 1, forecolor: penColor },
        penWidth: 1,
        penColor,
      });

      if (toggles.showCondicoesGarantia !== false) {
        elements.push({
          id: `gar-${now}-desc`,
          type: 'staticText',
          reportElement: { x: 8, y: 19, width: colW - 16, height: 24, forecolor: mutedColor },
          textElement: { font: { size: 6 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'A garantia cobre defeitos de fabricação e montagem a partir da emissão deste documento. A garantia fica automaticamente invalidada caso constatado mau uso, quedas, ligação em tensão elétrica inadequada ou intervenção por terceiros não autorizados.',
        });
      }

      return elements;
    },
  },
  {
    id: 'sankhya-tributos-aproximados-ibpt',
    title: 'Quadro de Tributos Aproximados (Lei 12.741 - IBPT)',
    category: 'fiscal',
    categoryLabel: 'Fiscal & Vendas',
    description: 'Demonstração oficial do valor estimado dos tributos federais, estaduais e municipais conforme o IBPT.',
    band: 'summary',
    height: 30,
    badge: 'Lei 12.741 / IBPT',
    tags: ['ibpt', 'impostos', 'tributos aproximados', 'transparencia', 'fiscal'],
    configurableFields: [
      { key: 'showTributosFederais', label: 'Tributos Federais e Estaduais', defaultValue: true },
      { key: 'showFonteIbpt', label: 'Chave e Fonte da Tabela IBPT', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `ibpt-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 24,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const fonteW = 140;
      const fonteX = colW - 8 - fonteW;
      const tribW = toggles.showFonteIbpt !== false ? fonteX - 16 : colW - 16;

      if (toggles.showTributosFederais !== false) {
        elements.push(
          {
            id: `ibpt-${now}-t1`,
            type: 'staticText',
            reportElement: { x: 8, y: 7, width: 140, height: 12, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'VALOR APROXIMADO DOS TRIBUTOS:',
          },
          {
            id: `ibpt-${now}-val`,
            type: 'textField',
            reportElement: { x: 152, y: 7, width: tribW - 146, height: 12, forecolor: textColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '"FEDERAIS: R$ " + $F{VLRFED} + " (13,45%)  •  ESTADUAIS: R$ " + $F{VLREST} + " (18,00%)"',
          }
        );
      }

      if (toggles.showFonteIbpt !== false) {
        elements.push(
          createVerticalDivider(`ibpt-${now}-vdiv`, fonteX - 4, 2, 24, penColor, penWidth),
          {
            id: `ibpt-${now}-fonte`,
            type: 'staticText',
            reportElement: { x: fonteX, y: 7, width: fonteW, height: 12, forecolor: mutedColor },
            textElement: { font: { size: 6 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'FONTE: IBPT / CHAVE W3A8F9',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-protocolo-devolucao',
    title: 'Protocolo de Troca / Devolução de Mercadoria',
    category: 'stock',
    categoryLabel: 'Estoque & Logística',
    description: 'Registro formal de devolução com referência à NF original, motivo da troca e visto do conferente.',
    band: 'summary',
    height: 45,
    badge: 'Devolução',
    tags: ['devolucao', 'troca', 'protocolo', 'estoque', 'conferente'],
    configurableFields: [
      { key: 'showNotaOrigem', label: 'Nota Fiscal de Origem', defaultValue: true },
      { key: 'showMotivoDevolucao', label: 'Motivo Declarado da Devolução', defaultValue: true },
      { key: 'showAssinaturaConferente', label: 'Visto do Conferente', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `dev-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 40,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
        {
          id: `dev-${now}-title`,
          type: 'staticText',
          reportElement: { x: 8, y: 5, width: 220, height: 11, forecolor: textColor },
          textElement: { font: { size: 8, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          text: 'PROTOCOLO DE TROCA / DEVOLUÇÃO',
        },
      ];

      const origW = 180;
      const origX = colW - 8 - origW;

      if (toggles.showNotaOrigem !== false) {
        elements.push({
          id: `dev-${now}-orig`,
          type: 'textField',
          reportElement: { x: origX, y: 5, width: origW, height: 11, forecolor: mutedColor },
          textElement: { font: { size: 7 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          expression: '"NF DE ORIGEM: Nº " + $F{NUMNOTA_ORIG}',
        });
      }

      elements.push({
        id: `dev-${now}-hdiv`,
        type: 'line',
        reportElement: { x: 0, y: 18, width: colW, height: 1, forecolor: penColor },
        penWidth: 1,
        penColor,
      });

      const vistoW = 144;
      const vistoX = colW - 8 - vistoW;
      const motivoW = toggles.showAssinaturaConferente !== false ? vistoX - 16 : colW - 16;

      if (toggles.showMotivoDevolucao !== false) {
        elements.push({
          id: `dev-${now}-motivo`,
          type: 'textField',
          reportElement: { x: 8, y: 20, width: motivoW, height: 16, forecolor: textColor },
          textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          expression: '"MOTIVO: " + ($F{MOTIVODEV} != null ? $F{MOTIVODEV} : "MERCADORIA EM DESACORDO COM O PEDIDO")',
        });
      }

      if (toggles.showAssinaturaConferente !== false) {
        elements.push(
          createVerticalDivider(`dev-${now}-vdiv`, vistoX - 4, 18, 24, penColor, penWidth),
          {
            id: `dev-${now}-visto`,
            type: 'staticText',
            reportElement: { x: vistoX, y: 22, width: vistoW, height: 14, forecolor: mutedColor },
            textElement: { font: { size: 7, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'VISTO DO CONFERENTE',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-resumo-centro-custo',
    title: 'Apropriação Contábil por Centro de Resultado (CR)',
    category: 'finance',
    categoryLabel: 'Financeiro',
    description: 'Rateio gerencial do faturamento por Centro de Resultado e Natureza Orçamentária.',
    band: 'summary',
    height: 40,
    badge: 'TGFNAT / Gerencial',
    tags: ['centro de custo', 'cr', 'natureza', 'rateio', 'gerencial', 'contabil'],
    configurableFields: [
      { key: 'showCentroResultado', label: 'Centro de Resultado (CR)', defaultValue: true },
      { key: 'showNatureza', label: 'Natureza Orçamentária', defaultValue: true },
      { key: 'showPercentualRateio', label: 'Percentual e Valor do Rateio', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `cr-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 34,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const cols = calculateGridColumns(colW, 3, 8, 8);

      elements.push(
        createVerticalDivider(`cr-${now}-vdiv1`, cols[1].x, 2, 34, penColor, penWidth),
        createVerticalDivider(`cr-${now}-vdiv2`, cols[2].x, 2, 34, penColor, penWidth)
      );

      if (toggles.showCentroResultado !== false) {
        elements.push(
          {
            id: `cr-${now}-lbl1`,
            type: 'staticText',
            reportElement: { x: cols[0].x + 4, y: 5, width: cols[0].width - 8, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'CENTRO DE RESULTADO (CR):',
          },
          {
            id: `cr-${now}-val1`,
            type: 'textField',
            reportElement: { x: cols[0].x + 4, y: 16, width: cols[0].width - 8, height: 14, forecolor: textColor },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '$F{CODCR} + " - VENDAS SUL"',
          }
        );
      }

      if (toggles.showNatureza !== false) {
        elements.push(
          {
            id: `cr-${now}-lbl2`,
            type: 'staticText',
            reportElement: { x: cols[1].x + 4, y: 5, width: cols[1].width - 8, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'NATUREZA FINANCEIRA:',
          },
          {
            id: `cr-${now}-val2`,
            type: 'textField',
            reportElement: { x: cols[1].x + 4, y: 16, width: cols[1].width - 8, height: 14, forecolor: textColor },
            textElement: { font: { size: 8 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            expression: '$F{DESCRNAT}',
          }
        );
      }

      if (toggles.showPercentualRateio !== false) {
        elements.push(
          {
            id: `cr-${now}-lbl3`,
            type: 'staticText',
            reportElement: { x: cols[2].x + 4, y: 5, width: cols[2].width - 8, height: 9, forecolor: mutedColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            text: 'RATEIO APROPRIADO:',
          },
          {
            id: `cr-${now}-val3`,
            type: 'textField',
            reportElement: { x: cols[2].x + 4, y: 16, width: cols[2].width - 8, height: 14, forecolor: '#0284C7' },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
            expression: '"100,00% (R$ " + $F{VLRDESDOB} + ")"',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-aprovacao-diretoria',
    title: 'Carimbo de Aprovação da Diretoria / Alçada',
    category: 'structural',
    categoryLabel: 'Estruturais',
    description: 'Espaço reservado para carimbo de alçada, parecer e assinatura de aprovação da diretoria ou gerência.',
    band: 'summary',
    height: 45,
    badge: 'Alçada / Aprovação',
    tags: ['aprovacao', 'diretoria', 'alcada', 'parecer', 'assinatura', 'gerencia'],
    configurableFields: [
      { key: 'showParecer', label: 'Parecer Formal da Diretoria', defaultValue: true },
      { key: 'showDataAprovacao', label: 'Data de Aprovação', defaultValue: true },
      { key: 'showAssinaturaDiretor', label: 'Linha e Assinatura do Aprovador', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { backcolor, penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `apr-${now}-box`,
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 2,
            width: colW,
            height: 40,
            backcolor,
            mode: backcolor === 'transparent' ? 'Transparent' : 'Opaque',
          },
          radius: 2,
          penWidth,
          penColor,
        },
      ];

      const rightW = 186;
      const rightX = colW - 8 - rightW;
      const leftW = rightX - 16;

      elements.push(createVerticalDivider(`apr-${now}-vdiv`, rightX - 4, 2, 40, penColor, penWidth));

      if (toggles.showParecer !== false) {
        elements.push(
          {
            id: `apr-${now}-lbl`,
            type: 'staticText',
            reportElement: { x: 8, y: 5, width: leftW, height: 10, forecolor: '#059669' },
            textElement: { font: { size: 8, isBold: true }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'LIBERADO POR ALÇADA / DIRETORIA',
          },
          {
            id: `apr-${now}-parecer`,
            type: 'staticText',
            reportElement: { x: 8, y: 17, width: leftW, height: 20, forecolor: mutedColor },
            textElement: { font: { size: 6 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
            text: 'Limites comerciais e condições de pagamento analisados e deferidos conforme política interna de crédito.',
          }
        );
      }

      if (toggles.showDataAprovacao !== false) {
        elements.push({
          id: `apr-${now}-dt`,
          type: 'textField',
          reportElement: { x: rightX, y: 5, width: rightW, height: 10, forecolor: mutedColor },
          textElement: { font: { size: 7 }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          pattern: 'dd/MM/yyyy HH:mm',
          expression: '$F{DTNEG}',
        });
      }

      if (toggles.showAssinaturaDiretor !== false) {
        elements.push(
          {
            id: `apr-${now}-line`,
            type: 'line',
            reportElement: { x: rightX, y: 24, width: rightW, height: 1, forecolor: penColor },
            penWidth: 1,
            penColor,
          },
          {
            id: `apr-${now}-sign`,
            type: 'staticText',
            reportElement: { x: rightX, y: 26, width: rightW, height: 12, forecolor: textColor },
            textElement: { font: { size: 6, isBold: true }, textAlignment: 'Center', verticalAlignment: 'Middle' },
            text: 'ASSINATURA / CARIMBO DA DIRETORIA',
          }
        );
      }

      return elements;
    },
  },
  {
    id: 'sankhya-rodape-paginacao-sankhya',
    title: 'Rodapé com Paginação, Data/Hora e Usuário',
    category: 'structural',
    categoryLabel: 'Estruturais',
    description: 'Rodapé padrão com paginação "Página X de Y", timestamp de impressão e identificação do usuário logado.',
    band: 'pageFooter',
    height: 20,
    badge: 'Auditoria / Rodapé',
    tags: ['rodape', 'paginacao', 'usuario', 'data hora', 'auditoria', 'pagefooter'],
    configurableFields: [
      { key: 'showPaginacao', label: 'Paginação (Página X de Y)', defaultValue: true },
      { key: 'showDataHora', label: 'Data e Hora de Emissão', defaultValue: true },
      { key: 'showUsuarioSankhya', label: 'Identificação do Usuário Logado', defaultValue: true },
    ],
    generate: (colW: number, customProps?: ComponentCustomProps): JRXMLElement[] => {
      const now = Date.now();
      const toggles = customProps?.fieldToggles || {};
      const { penColor, penWidth, textColor, mutedColor } = getThemeColors(customProps);

      const elements: JRXMLElement[] = [
        {
          id: `rod-${now}-line`,
          type: 'line',
          reportElement: { x: 0, y: 1, width: colW, height: 1, forecolor: penColor },
          penWidth: 0.5,
        },
      ];

      const pagW = 140;
      const pagX = colW - 8 - pagW;
      const dtW = 160;

      if (toggles.showDataHora !== false) {
        elements.push({
          id: `rod-${now}-dt`,
          type: 'textField',
          reportElement: { x: 8, y: 4, width: dtW, height: 12, forecolor: mutedColor },
          textElement: { font: { size: 7 }, textAlignment: 'Left', verticalAlignment: 'Middle' },
          pattern: 'dd/MM/yyyy HH:mm:ss',
          expression: 'new java.util.Date()',
        });
      }

      if (toggles.showUsuarioSankhya !== false) {
        const usuX = 8 + dtW + 8;
        const usuW = pagX - usuX - 8;
        elements.push({
          id: `rod-${now}-usu`,
          type: 'textField',
          reportElement: { x: usuX, y: 4, width: usuW, height: 12, forecolor: mutedColor },
          textElement: { font: { size: 7 }, textAlignment: 'Center', verticalAlignment: 'Middle' },
          expression: '"Emitido por: " + ($P{NOMEUSU} != null ? $P{NOMEUSU} : "SUP")',
        });
      }

      if (toggles.showPaginacao !== false) {
        elements.push({
          id: `rod-${now}-pag`,
          type: 'textField',
          reportElement: { x: pagX, y: 4, width: pagW, height: 12, forecolor: textColor },
          textElement: { font: { size: 7, isBold: true }, textAlignment: 'Right', verticalAlignment: 'Middle' },
          expression: '"Página " + $V{PAGE_NUMBER} + " de " + $V{PAGE_COUNT}',
        });
      }

      return elements;
    },
  },
];
