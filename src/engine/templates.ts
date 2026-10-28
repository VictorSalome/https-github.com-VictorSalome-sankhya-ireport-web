import { JRXMLReport } from '../types/jrxml';

export interface DocumentTemplateCard {
  id: string;
  title: string;
  category: 'faturamento' | 'comercial' | 'financeiro' | 'logistica' | 'em_branco';
  categoryLabel: string;
  description: string;
  badge: string;
  tables: string[];
  report: JRXMLReport;
}

export const DOCUMENT_TEMPLATES: DocumentTemplateCard[] = [
  {
    id: 'nota_fiscal_danfe',
    title: 'Espelho de Nota Fiscal / DANFE',
    category: 'faturamento',
    categoryLabel: 'Faturamento & Fiscal',
    description: 'Layout completo com cabeçalho da empresa, dados do cliente/destinatário, grade de produtos (código, descrição, NCM, qtd, unitário e total) e quadro de totais fiscais.',
    badge: 'TGFCAB + TGFITE',
    tables: ['TGFCAB', 'TGFITE', 'TGFPAR', 'TSIEMP'],
    report: {
      name: 'espelho_nota_fiscal',
      language: 'groovy',
      pageWidth: 595,
      pageHeight: 842,
      orientation: 'Portrait',
      columnWidth: 555,
      leftMargin: 20,
      rightMargin: 20,
      topMargin: 20,
      bottomMargin: 20,
      queryString: `SELECT 
  CAB.NUNOTA, CAB.NUMNOTA, CAB.DTNEG, CAB.VLRNOTA, CAB.BASEICMS, CAB.VLRICMS,
  PAR.CODPARC, PAR.RAZAOSOCIAL, PAR.CGC_CPF,
  EMP.RAZAOSOCIAL AS EMPRESA, EMP.CGC AS CNPJ_EMP,
  ITE.SEQUENCIA, ITE.CODPROD, PRO.DESCRPROD, PRO.NCM, ITE.QTDNEG, ITE.VLRUNIT, ITE.VLRTOT
FROM TGFCAB CAB
JOIN TGFPAR PAR ON CAB.CODPARC = PAR.CODPARC
JOIN TSIEMP EMP ON CAB.CODEMP = EMP.CODEMP
JOIN TGFITE ITE ON CAB.NUNOTA = ITE.NUNOTA
JOIN TGFPRO PRO ON ITE.CODPROD = PRO.CODPROD
WHERE CAB.NUNOTA = $P{PK_NUNOTA}
ORDER BY ITE.SEQUENCIA`,
      parameters: [
        { name: 'PK_NUNOTA', class: 'java.math.BigDecimal', description: 'Número Único da Nota (Sankhya)' },
        { name: 'REPORT_CONNECTION', class: 'java.sql.Connection', description: 'Conexão Ativa Sankhya' },
      ],
      fields: [
        { name: 'NUNOTA', class: 'java.math.BigDecimal' },
        { name: 'NUMNOTA', class: 'java.math.BigDecimal' },
        { name: 'DTNEG', class: 'java.sql.Timestamp' },
        { name: 'VLRNOTA', class: 'java.math.BigDecimal' },
        { name: 'BASEICMS', class: 'java.math.BigDecimal' },
        { name: 'VLRICMS', class: 'java.math.BigDecimal' },
        { name: 'CODPARC', class: 'java.math.BigDecimal' },
        { name: 'RAZAOSOCIAL', class: 'java.lang.String' },
        { name: 'CGC_CPF', class: 'java.lang.String' },
        { name: 'EMPRESA', class: 'java.lang.String' },
        { name: 'CNPJ_EMP', class: 'java.lang.String' },
        { name: 'SEQUENCIA', class: 'java.math.BigDecimal' },
        { name: 'CODPROD', class: 'java.math.BigDecimal' },
        { name: 'DESCRPROD', class: 'java.lang.String' },
        { name: 'NCM', class: 'java.lang.String' },
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
      styles: [
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
      ],
      bands: {
        pageHeader: {
          type: 'pageHeader',
          title: 'Cabeçalho da Página (Dados da Empresa e Cliente)',
          height: 110,
          elements: [
            // Borda do topo
            {
              id: 'box-empresa',
              type: 'rectangle',
              reportElement: { x: 0, y: 0, width: 555, height: 50, backcolor: '#f1f5f9', mode: 'Opaque' },
              radius: 4,
            },
            {
              id: 'lbl-empresa',
              type: 'textField',
              reportElement: { x: 10, y: 6, width: 340, height: 18, forecolor: '#0f172a' },
              expression: '$F{EMPRESA}',
              textElement: { font: { size: 12, isBold: true } },
            },
            {
              id: 'lbl-cnpj',
              type: 'textField',
              reportElement: { x: 10, y: 26, width: 340, height: 14, forecolor: '#475569' },
              expression: '"CNPJ: " + $F{CNPJ_EMP}',
              textElement: { font: { size: 9 } },
            },
            {
              id: 'lbl-titulo-doc',
              type: 'staticText',
              reportElement: { x: 360, y: 6, width: 185, height: 16, forecolor: '#0f172a' },
              text: 'ESPELHO DE NOTA FISCAL',
              textElement: { textAlignment: 'Right', font: { size: 11, isBold: true } },
            },
            {
              id: 'lbl-num-nota',
              type: 'textField',
              reportElement: { x: 360, y: 24, width: 185, height: 16, forecolor: '#047857' },
              expression: '"Nº " + $F{NUMNOTA} + " | NÚ: " + $F{NUNOTA}',
              textElement: { textAlignment: 'Right', font: { size: 10, isBold: true } },
            },
            // Caixa do Destinatário
            {
              id: 'box-dest',
              type: 'rectangle',
              reportElement: { x: 0, y: 55, width: 555, height: 48, backcolor: '#ffffff', mode: 'Opaque' },
              radius: 4,
            },
            {
              id: 'lbl-dest-tit',
              type: 'staticText',
              reportElement: { x: 10, y: 60, width: 200, height: 12, forecolor: '#64748b' },
              text: 'DESTINATÁRIO / CLIENTE',
              textElement: { font: { size: 8, isBold: true } },
            },
            {
              id: 'val-dest-nome',
              type: 'textField',
              reportElement: { x: 10, y: 74, width: 360, height: 16, forecolor: '#0f172a' },
              expression: '$F{CODPARC} + " - " + $F{RAZAOSOCIAL}',
              textElement: { font: { size: 10, isBold: true } },
            },
            {
              id: 'val-dest-cpf',
              type: 'textField',
              reportElement: { x: 380, y: 74, width: 165, height: 16, forecolor: '#334155' },
              expression: '"CPF/CNPJ: " + $F{CGC_CPF}',
              textElement: { textAlignment: 'Right', font: { size: 9 } },
            },
          ],
        },
        columnHeader: {
          type: 'columnHeader',
          title: 'Títulos das Colunas (Tabela de Produtos)',
          height: 24,
          elements: [
            {
              id: 'bg-col-header',
              type: 'rectangle',
              reportElement: { x: 0, y: 2, width: 555, height: 20, backcolor: '#1e293b', mode: 'Opaque' },
              radius: 3,
            },
            {
              id: 'th-cod',
              type: 'staticText',
              reportElement: { x: 8, y: 6, width: 45, height: 14, forecolor: '#f8fafc' },
              text: 'CÓD.',
              textElement: { font: { size: 8, isBold: true } },
            },
            {
              id: 'th-descr',
              type: 'staticText',
              reportElement: { x: 55, y: 6, width: 225, height: 14, forecolor: '#f8fafc' },
              text: 'DESCRIÇÃO DO PRODUTO',
              textElement: { font: { size: 8, isBold: true } },
            },
            {
              id: 'th-ncm',
              type: 'staticText',
              reportElement: { x: 282, y: 6, width: 65, height: 14, forecolor: '#f8fafc' },
              text: 'NCM',
              textElement: { font: { size: 8, isBold: true } },
            },
            {
              id: 'th-qtd',
              type: 'staticText',
              reportElement: { x: 349, y: 6, width: 50, height: 14, forecolor: '#f8fafc' },
              text: 'QTD',
              textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
            },
            {
              id: 'th-unit',
              type: 'staticText',
              reportElement: { x: 401, y: 6, width: 65, height: 14, forecolor: '#f8fafc' },
              text: 'VLR. UNIT.',
              textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
            },
            {
              id: 'th-total',
              type: 'staticText',
              reportElement: { x: 468, y: 6, width: 79, height: 14, forecolor: '#f8fafc' },
              text: 'TOTAL ITEM',
              textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
            },
          ],
        },
        detail: {
          type: 'detail',
          title: 'Linhas do Documento (Itens da Nota)',
          height: 20,
          elements: [
            {
              id: 'td-cod',
              type: 'textField',
              reportElement: { x: 8, y: 3, width: 45, height: 14, style: 'Zebra' },
              expression: '$F{CODPROD}',
              textElement: { font: { size: 8 } },
            },
            {
              id: 'td-descr',
              type: 'textField',
              reportElement: { x: 55, y: 3, width: 225, height: 14, style: 'Zebra' },
              expression: '$F{DESCRPROD}',
              textElement: { font: { size: 8 } },
            },
            {
              id: 'td-ncm',
              type: 'textField',
              reportElement: { x: 282, y: 3, width: 65, height: 14, style: 'Zebra' },
              expression: '$F{NCM}',
              textElement: { font: { size: 8 } },
            },
            {
              id: 'td-qtd',
              type: 'textField',
              reportElement: { x: 349, y: 3, width: 50, height: 14, style: 'Zebra' },
              expression: '$F{QTDNEG}',
              pattern: '#,##0.00',
              textElement: { textAlignment: 'Right', font: { size: 8 } },
            },
            {
              id: 'td-unit',
              type: 'textField',
              reportElement: { x: 401, y: 3, width: 65, height: 14, style: 'Zebra' },
              expression: '$F{VLRUNIT}',
              pattern: 'R$ #,##0.00',
              textElement: { textAlignment: 'Right', font: { size: 8 } },
            },
            {
              id: 'td-total',
              type: 'textField',
              reportElement: { x: 468, y: 3, width: 79, height: 14, style: 'Zebra' },
              expression: '$F{VLRTOT}',
              pattern: 'R$ #,##0.00',
              textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
            },
          ],
        },
        summary: {
          type: 'summary',
          title: 'Totais e Encerramento Fiscal',
          height: 70,
          elements: [
            {
              id: 'box-totais',
              type: 'rectangle',
              reportElement: { x: 0, y: 10, width: 555, height: 48, backcolor: '#f8fafc', mode: 'Opaque' },
              radius: 4,
            },
            {
              id: 'lbl-base-icms',
              type: 'staticText',
              reportElement: { x: 15, y: 16, width: 110, height: 12, forecolor: '#64748b' },
              text: 'BASE CÁLCULO ICMS',
              textElement: { font: { size: 7, isBold: true } },
            },
            {
              id: 'val-base-icms',
              type: 'textField',
              reportElement: { x: 15, y: 30, width: 110, height: 16, forecolor: '#0f172a' },
              expression: '$F{BASEICMS}',
              pattern: 'R$ #,##0.00',
              textElement: { font: { size: 9, isBold: true } },
            },
            {
              id: 'lbl-vlr-icms',
              type: 'staticText',
              reportElement: { x: 145, y: 16, width: 110, height: 12, forecolor: '#64748b' },
              text: 'VALOR DO ICMS',
              textElement: { font: { size: 7, isBold: true } },
            },
            {
              id: 'val-vlr-icms',
              type: 'textField',
              reportElement: { x: 145, y: 30, width: 110, height: 16, forecolor: '#0f172a' },
              expression: '$F{VLRICMS}',
              pattern: 'R$ #,##0.00',
              textElement: { font: { size: 9, isBold: true } },
            },
            {
              id: 'lbl-tot-nota',
              type: 'staticText',
              reportElement: { x: 367, y: 16, width: 180, height: 12, forecolor: '#047857' },
              text: 'VALOR TOTAL DA NOTA',
              textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
            },
            {
              id: 'val-tot-nota',
              type: 'textField',
              reportElement: { x: 367, y: 28, width: 180, height: 22, forecolor: '#047857' },
              expression: '$F{VLRNOTA}',
              pattern: 'R$ #,##0.00',
              textElement: { textAlignment: 'Right', font: { size: 14, isBold: true } },
            },
          ],
        },
        pageFooter: {
          type: 'pageFooter',
          title: 'Rodapé da Página',
          height: 25,
          elements: [
            {
              id: 'line-footer',
              type: 'line',
              reportElement: { x: 0, y: 4, width: 555, height: 1, forecolor: '#cbd5e1' },
            },
            {
              id: 'txt-emissao',
              type: 'staticText',
              reportElement: { x: 0, y: 8, width: 220, height: 12, forecolor: '#94a3b8' },
              text: 'Emitido via Sankhya-W iReport Designer',
              textElement: { font: { size: 8 } },
            },
            {
              id: 'txt-paginacao',
              type: 'textField',
              reportElement: { x: 400, y: 8, width: 155, height: 12, forecolor: '#94a3b8' },
              expression: '"Página " + $V{PAGE_NUMBER}',
              textElement: { textAlignment: 'Right', font: { size: 8 } },
            },
          ],
        },
      },
    },
  },
  {
    id: 'pedido_venda_orcamento',
    title: 'Pedido de Venda / Orçamento Comercial',
    category: 'comercial',
    categoryLabel: 'Comercial & Vendas',
    description: 'Espelho de proposta comercial e pedido com dados do vendedor, condições de negociação, prazos, itens e assinatura de aceite do cliente.',
    badge: 'TGFCAB + TGFITE',
    tables: ['TGFCAB', 'TGFITE', 'TGFPAR', 'TGFVEN'],
    report: {
      name: 'pedido_venda_comercial',
      language: 'groovy',
      pageWidth: 595,
      pageHeight: 842,
      orientation: 'Portrait',
      columnWidth: 555,
      leftMargin: 20,
      rightMargin: 20,
      topMargin: 20,
      bottomMargin: 20,
      queryString: `SELECT 
  CAB.NUNOTA, CAB.NUMNOTA, CAB.DTNEG, CAB.VLRNOTA,
  PAR.CODPARC, PAR.RAZAOSOCIAL, PAR.TELEFONE, PAR.EMAIL,
  VEN.APELIDO AS VENDEDOR,
  ITE.SEQUENCIA, ITE.CODPROD, PRO.DESCRPROD, ITE.QTDNEG, ITE.VLRUNIT, ITE.VLRTOT
FROM TGFCAB CAB
JOIN TGFPAR PAR ON CAB.CODPARC = PAR.CODPARC
LEFT JOIN TGFVEN VEN ON CAB.CODVEND = VEN.CODVEND
JOIN TGFITE ITE ON CAB.NUNOTA = ITE.NUNOTA
JOIN TGFPRO PRO ON ITE.CODPROD = PRO.CODPROD
WHERE CAB.NUNOTA = $P{PK_NUNOTA}
ORDER BY ITE.SEQUENCIA`,
      parameters: [
        { name: 'PK_NUNOTA', class: 'java.math.BigDecimal', description: 'Número do Pedido' },
      ],
      fields: [
        { name: 'NUNOTA', class: 'java.math.BigDecimal' },
        { name: 'NUMNOTA', class: 'java.math.BigDecimal' },
        { name: 'DTNEG', class: 'java.sql.Timestamp' },
        { name: 'VLRNOTA', class: 'java.math.BigDecimal' },
        { name: 'CODPARC', class: 'java.math.BigDecimal' },
        { name: 'RAZAOSOCIAL', class: 'java.lang.String' },
        { name: 'TELEFONE', class: 'java.lang.String' },
        { name: 'EMAIL', class: 'java.lang.String' },
        { name: 'VENDEDOR', class: 'java.lang.String' },
        { name: 'SEQUENCIA', class: 'java.math.BigDecimal' },
        { name: 'CODPROD', class: 'java.math.BigDecimal' },
        { name: 'DESCRPROD', class: 'java.lang.String' },
        { name: 'QTDNEG', class: 'java.math.BigDecimal' },
        { name: 'VLRUNIT', class: 'java.math.BigDecimal' },
        { name: 'VLRTOT', class: 'java.math.BigDecimal' },
      ],
      variables: [],
      bands: {
        pageHeader: {
          type: 'pageHeader',
          title: 'Cabeçalho do Pedido e Dados Comerciais',
          height: 90,
          elements: [
            {
              id: 'box-pv-top',
              type: 'rectangle',
              reportElement: { x: 0, y: 0, width: 555, height: 42, backcolor: '#047857', mode: 'Opaque' },
              radius: 4,
            },
            {
              id: 'txt-pv-tit',
              type: 'staticText',
              reportElement: { x: 12, y: 11, width: 250, height: 20, forecolor: '#ffffff' },
              text: 'PROPOSTA COMERCIAL / PEDIDO',
              textElement: { font: { size: 13, isBold: true } },
            },
            {
              id: 'txt-pv-num',
              type: 'textField',
              reportElement: { x: 300, y: 11, width: 243, height: 20, forecolor: '#ffffff' },
              expression: '"PEDIDO Nº " + $F{NUMNOTA}',
              textElement: { textAlignment: 'Right', font: { size: 12, isBold: true } },
            },
            {
              id: 'pv-cli-info',
              type: 'textField',
              reportElement: { x: 0, y: 50, width: 340, height: 16, forecolor: '#0f172a' },
              expression: '"Cliente: " + $F{CODPARC} + " - " + $F{RAZAOSOCIAL}',
              textElement: { font: { size: 10, isBold: true } },
            },
            {
              id: 'pv-vend-info',
              type: 'textField',
              reportElement: { x: 360, y: 50, width: 195, height: 16, forecolor: '#334155' },
              expression: '"Vendedor: " + ($F{VENDEDOR} != null ? $F{VENDEDOR} : "Geral")',
              textElement: { textAlignment: 'Right', font: { size: 9 } },
            },
          ],
        },
        columnHeader: {
          type: 'columnHeader',
          title: 'Títulos das Colunas de Itens',
          height: 22,
          elements: [
            {
              id: 'pv-ch-bg',
              type: 'rectangle',
              reportElement: { x: 0, y: 0, width: 555, height: 20, backcolor: '#e2e8f0', mode: 'Opaque' },
              radius: 2,
            },
            {
              id: 'pv-th-item',
              type: 'staticText',
              reportElement: { x: 8, y: 4, width: 35, height: 14, forecolor: '#1e293b' },
              text: 'ITEM',
              textElement: { font: { size: 8, isBold: true } },
            },
            {
              id: 'pv-th-prod',
              type: 'staticText',
              reportElement: { x: 45, y: 4, width: 280, height: 14, forecolor: '#1e293b' },
              text: 'PRODUTO',
              textElement: { font: { size: 8, isBold: true } },
            },
            {
              id: 'pv-th-qtd',
              type: 'staticText',
              reportElement: { x: 335, y: 4, width: 55, height: 14, forecolor: '#1e293b' },
              text: 'QTD',
              textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
            },
            {
              id: 'pv-th-unit',
              type: 'staticText',
              reportElement: { x: 400, y: 4, width: 70, height: 14, forecolor: '#1e293b' },
              text: 'UNITÁRIO',
              textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
            },
            {
              id: 'pv-th-total',
              type: 'staticText',
              reportElement: { x: 480, y: 4, width: 67, height: 14, forecolor: '#1e293b' },
              text: 'TOTAL',
              textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
            },
          ],
        },
        detail: {
          type: 'detail',
          title: 'Linhas do Pedido',
          height: 18,
          elements: [
            {
              id: 'pv-td-seq',
              type: 'textField',
              reportElement: { x: 8, y: 2, width: 35, height: 14 },
              expression: '$F{SEQUENCIA}',
              textElement: { font: { size: 8 } },
            },
            {
              id: 'pv-td-prod',
              type: 'textField',
              reportElement: { x: 45, y: 2, width: 280, height: 14 },
              expression: '$F{CODPROD} + " - " + $F{DESCRPROD}',
              textElement: { font: { size: 8 } },
            },
            {
              id: 'pv-td-qtd',
              type: 'textField',
              reportElement: { x: 335, y: 2, width: 55, height: 14 },
              expression: '$F{QTDNEG}',
              pattern: '#,##0.00',
              textElement: { textAlignment: 'Right', font: { size: 8 } },
            },
            {
              id: 'pv-td-unit',
              type: 'textField',
              reportElement: { x: 400, y: 2, width: 70, height: 14 },
              expression: '$F{VLRUNIT}',
              pattern: 'R$ #,##0.00',
              textElement: { textAlignment: 'Right', font: { size: 8 } },
            },
            {
              id: 'pv-td-total',
              type: 'textField',
              reportElement: { x: 480, y: 2, width: 67, height: 14 },
              expression: '$F{VLRTOT}',
              pattern: 'R$ #,##0.00',
              textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
            },
          ],
        },
        summary: {
          type: 'summary',
          title: 'Fechamento e Assinatura',
          height: 100,
          elements: [
            {
              id: 'pv-sum-bg',
              type: 'rectangle',
              reportElement: { x: 337, y: 10, width: 210, height: 35, backcolor: '#064e3b', mode: 'Opaque' },
              radius: 4,
            },
            {
              id: 'pv-sum-lbl',
              type: 'staticText',
              reportElement: { x: 345, y: 14, width: 95, height: 14, forecolor: '#a7f3d0' },
              text: 'TOTAL DO PEDIDO:',
              textElement: { font: { size: 8, isBold: true } },
            },
            {
              id: 'pv-sum-val',
              type: 'textField',
              reportElement: { x: 440, y: 14, width: 107, height: 26, forecolor: '#ffffff' },
              expression: '$F{VLRNOTA}',
              pattern: 'R$ #,##0.00',
              textElement: { textAlignment: 'Right', font: { size: 13, isBold: true } },
            },
            // Assinatura
            {
              id: 'pv-ass-line',
              type: 'line',
              reportElement: { x: 50, y: 80, width: 200, height: 1, forecolor: '#94a3b8' },
            },
            {
              id: 'pv-ass-txt',
              type: 'staticText',
              reportElement: { x: 50, y: 84, width: 200, height: 12, forecolor: '#64748b' },
              text: 'Assinatura do Cliente / De Acordo',
              textElement: { textAlignment: 'Center', font: { size: 8 } },
            },
          ],
        },
        pageFooter: {
          type: 'pageFooter',
          title: 'Rodapé',
          height: 20,
          elements: [
            {
              id: 'pv-foot-txt',
              type: 'staticText',
              reportElement: { x: 0, y: 4, width: 300, height: 12, forecolor: '#94a3b8' },
              text: 'Validade da Proposta: 10 dias corridos.',
              textElement: { font: { size: 8 } },
            },
          ],
        },
      },
    },
  },
  {
    id: 'extrato_financeiro_receber',
    title: 'Extrato Financeiro / Contas a Receber',
    category: 'financeiro',
    categoryLabel: 'Financeiro & Contas',
    description: 'Relatório financeiro com títulos em aberto, quebra por cliente (CODPARC), vencimentos, valor desdobrado e cálculo automático de subtotais.',
    badge: 'TGFFIN + TGFPAR',
    tables: ['TGFFIN', 'TGFPAR'],
    report: {
      name: 'extrato_contas_receber',
      language: 'groovy',
      pageWidth: 595,
      pageHeight: 842,
      orientation: 'Portrait',
      columnWidth: 555,
      leftMargin: 20,
      rightMargin: 20,
      topMargin: 20,
      bottomMargin: 20,
      queryString: `SELECT 
  FIN.NUFIN, FIN.NUMNOTA, FIN.DESDOBRAMENTO, FIN.DTVENC, FIN.VLRDESDOB,
  PAR.CODPARC, PAR.RAZAOSOCIAL, PAR.TELEFONE
FROM TGFFIN FIN
JOIN TGFPAR PAR ON FIN.CODPARC = PAR.CODPARC
WHERE FIN.RECDESP = 1 AND FIN.DHBAIXA IS NULL
ORDER BY PAR.RAZAOSOCIAL, FIN.DTVENC`,
      parameters: [
        { name: 'DTINI', class: 'java.sql.Timestamp', description: 'Data Inicial Vencimento' },
        { name: 'DTFIM', class: 'java.sql.Timestamp', description: 'Data Final Vencimento' },
      ],
      fields: [
        { name: 'NUFIN', class: 'java.math.BigDecimal' },
        { name: 'NUMNOTA', class: 'java.math.BigDecimal' },
        { name: 'DESDOBRAMENTO', class: 'java.lang.String' },
        { name: 'DTVENC', class: 'java.sql.Timestamp' },
        { name: 'VLRDESDOB', class: 'java.math.BigDecimal' },
        { name: 'CODPARC', class: 'java.math.BigDecimal' },
        { name: 'RAZAOSOCIAL', class: 'java.lang.String' },
        { name: 'TELEFONE', class: 'java.lang.String' },
      ],
      groups: [
        {
          id: 'grp-parceiro',
          name: 'GRUPO_CLIENTE',
          expression: '$F{CODPARC}',
          label: 'Cliente (CODPARC)',
          headerBand: {
            type: 'pageHeader',
            title: 'Quebra por Cliente',
            height: 24,
            elements: [
              {
                id: 'grp-cli-bg',
                type: 'rectangle',
                reportElement: { x: 0, y: 2, width: 555, height: 20, backcolor: '#0f766e', mode: 'Opaque' },
                radius: 2,
              },
              {
                id: 'grp-cli-txt',
                type: 'textField',
                reportElement: { x: 8, y: 5, width: 539, height: 14, forecolor: '#ffffff' },
                expression: '"CLIENTE: " + $F{CODPARC} + " - " + $F{RAZAOSOCIAL}',
                textElement: { font: { size: 9, isBold: true } },
              },
            ],
          },
          footerBand: {
            type: 'columnFooter',
            title: 'Subtotal do Cliente',
            height: 22,
            elements: [
              {
                id: 'grp-sub-lbl',
                type: 'staticText',
                reportElement: { x: 280, y: 4, width: 150, height: 14, forecolor: '#0f766e' },
                text: 'SUBTOTAL DO CLIENTE:',
                textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
              },
              {
                id: 'grp-sub-val',
                type: 'textField',
                reportElement: { x: 435, y: 4, width: 112, height: 14, forecolor: '#0f766e' },
                expression: '$F{VLRDESDOB}',
                pattern: 'R$ #,##0.00',
                textElement: { textAlignment: 'Right', font: { size: 9, isBold: true } },
              },
            ],
          },
        },
      ],
      variables: [
        {
          name: 'TOTAL_GERAL',
          class: 'java.math.BigDecimal',
          resetType: 'Report',
          calculation: 'Sum',
          variableExpression: '$F{VLRDESDOB}',
        },
      ],
      bands: {
        pageHeader: {
          type: 'pageHeader',
          title: 'Título do Relatório',
          height: 40,
          elements: [
            {
              id: 'fin-tit',
              type: 'staticText',
              reportElement: { x: 0, y: 8, width: 350, height: 22, forecolor: '#0f172a' },
              text: 'EXTRATO DE CONTAS A RECEBER EM ABERTO',
              textElement: { font: { size: 13, isBold: true } },
            },
          ],
        },
        columnHeader: {
          type: 'columnHeader',
          title: 'Cabeçalho das Colunas de Títulos',
          height: 20,
          elements: [
            {
              id: 'fin-th-nufin',
              type: 'staticText',
              reportElement: { x: 8, y: 4, width: 75, height: 12, forecolor: '#475569' },
              text: 'NÚM. TÍTULO',
              textElement: { font: { size: 8, isBold: true } },
            },
            {
              id: 'fin-th-nota',
              type: 'staticText',
              reportElement: { x: 88, y: 4, width: 75, height: 12, forecolor: '#475569' },
              text: 'NOTA',
              textElement: { font: { size: 8, isBold: true } },
            },
            {
              id: 'fin-th-parc',
              type: 'staticText',
              reportElement: { x: 168, y: 4, width: 65, height: 12, forecolor: '#475569' },
              text: 'PARCELA',
              textElement: { font: { size: 8, isBold: true } },
            },
            {
              id: 'fin-th-venc',
              type: 'staticText',
              reportElement: { x: 335, y: 4, width: 95, height: 12, forecolor: '#475569' },
              text: 'VENCIMENTO',
              textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
            },
            {
              id: 'fin-th-vlr',
              type: 'staticText',
              reportElement: { x: 435, y: 4, width: 112, height: 12, forecolor: '#475569' },
              text: 'VALOR TÍTULO',
              textElement: { textAlignment: 'Right', font: { size: 8, isBold: true } },
            },
          ],
        },
        detail: {
          type: 'detail',
          title: 'Linha de Título Financeiro',
          height: 18,
          elements: [
            {
              id: 'fin-td-nufin',
              type: 'textField',
              reportElement: { x: 8, y: 2, width: 75, height: 14 },
              expression: '$F{NUFIN}',
              textElement: { font: { size: 8 } },
            },
            {
              id: 'fin-td-nota',
              type: 'textField',
              reportElement: { x: 88, y: 2, width: 75, height: 14 },
              expression: '$F{NUMNOTA}',
              textElement: { font: { size: 8 } },
            },
            {
              id: 'fin-td-parc',
              type: 'textField',
              reportElement: { x: 168, y: 2, width: 65, height: 14 },
              expression: '$F{DESDOBRAMENTO}',
              textElement: { font: { size: 8 } },
            },
            {
              id: 'fin-td-venc',
              type: 'textField',
              reportElement: { x: 335, y: 2, width: 95, height: 14 },
              expression: '$F{DTVENC}',
              pattern: 'dd/MM/yyyy',
              textElement: { textAlignment: 'Right', font: { size: 8 } },
            },
            {
              id: 'fin-td-vlr',
              type: 'textField',
              reportElement: { x: 435, y: 2, width: 112, height: 14 },
              expression: '$F{VLRDESDOB}',
              pattern: 'R$ #,##0.00',
              textElement: { textAlignment: 'Right', font: { size: 8 } },
            },
          ],
        },
        summary: {
          type: 'summary',
          title: 'Total Geral da Carteira',
          height: 40,
          elements: [
            {
              id: 'fin-sum-bg',
              type: 'rectangle',
              reportElement: { x: 0, y: 8, width: 555, height: 28, backcolor: '#1e293b', mode: 'Opaque' },
              radius: 4,
            },
            {
              id: 'fin-sum-lbl',
              type: 'staticText',
              reportElement: { x: 15, y: 14, width: 280, height: 16, forecolor: '#f8fafc' },
              text: 'TOTAL GERAL DE RECEBÍVEIS EM ABERTO:',
              textElement: { font: { size: 9, isBold: true } },
            },
            {
              id: 'fin-sum-val',
              type: 'textField',
              reportElement: { x: 387, y: 14, width: 160, height: 18, forecolor: '#34d399' },
              expression: '$V{TOTAL_GERAL}',
              pattern: 'R$ #,##0.00',
              textElement: { textAlignment: 'Right', font: { size: 11, isBold: true } },
            },
          ],
        },
      },
    },
  },
  {
    id: 'etiqueta_produto_barcode',
    title: 'Etiqueta de Produto com Código de Barras e QR Code',
    category: 'logistica',
    categoryLabel: 'Logística & Estoque',
    description: 'Etiqueta compacta pronta para impressão com descrição do produto, código interno, valor unitário em destaque, código de barras EAN-13 e QR Code.',
    badge: 'TGFPRO + Barcode4J',
    tables: ['TGFPRO'],
    report: {
      name: 'etiqueta_produto_barcode',
      language: 'groovy',
      pageWidth: 283, // ~100mm
      pageHeight: 141, // ~50mm
      orientation: 'Landscape',
      columnWidth: 263,
      leftMargin: 10,
      rightMargin: 10,
      topMargin: 10,
      bottomMargin: 10,
      queryString: `SELECT CODPROD, DESCRPROD, CODBARRA, VLRVENDA, MARCA FROM TGFPRO WHERE ATIVO = 'S'`,
      parameters: [],
      fields: [
        { name: 'CODPROD', class: 'java.math.BigDecimal' },
        { name: 'DESCRPROD', class: 'java.lang.String' },
        { name: 'CODBARRA', class: 'java.lang.String' },
        { name: 'VLRVENDA', class: 'java.math.BigDecimal' },
        { name: 'MARCA', class: 'java.lang.String' },
      ],
      variables: [],
      bands: {
        detail: {
          type: 'detail',
          title: 'Corpo da Etiqueta Adesiva',
          height: 120,
          elements: [
            {
              id: 'etiq-bg',
              type: 'rectangle',
              reportElement: { x: 0, y: 0, width: 263, height: 120, backcolor: '#ffffff', mode: 'Opaque' },
              radius: 4,
            },
            {
              id: 'etiq-prod-nome',
              type: 'textField',
              reportElement: { x: 8, y: 8, width: 175, height: 26, forecolor: '#0f172a' },
              expression: '$F{DESCRPROD}',
              textElement: { font: { size: 10, isBold: true } },
            },
            {
              id: 'etiq-preco',
              type: 'textField',
              reportElement: { x: 8, y: 36, width: 175, height: 22, forecolor: '#047857' },
              expression: '$F{VLRVENDA}',
              pattern: 'R$ #,##0.00',
              textElement: { font: { size: 15, isBold: true } },
            },
            {
              id: 'etiq-barcode',
              type: 'barcode',
              reportElement: { x: 8, y: 60, width: 175, height: 50 },
              barcodeType: 'Code128',
              expression: '$F{CODBARRA}',
              textPosition: 'bottom',
            },
            {
              id: 'etiq-qrcode',
              type: 'barcode',
              reportElement: { x: 193, y: 21, width: 60, height: 60 },
              barcodeType: 'QRCode',
              expression: '"https://sankhya.com.br/p/" + $F{CODPROD}',
            },
            {
              id: 'etiq-cod',
              type: 'textField',
              reportElement: { x: 193, y: 85, width: 60, height: 14, forecolor: '#64748b' },
              expression: '"CÓD: " + $F{CODPROD}',
              textElement: { textAlignment: 'Center', font: { size: 7 } },
            },
          ],
        },
      },
    },
  },
  {
    id: 'documento_em_branco',
    title: 'Documento em Branco (Customizável)',
    category: 'em_branco',
    categoryLabel: 'Em Branco',
    description: 'Inicie com uma folha limpa A4 pronta para desenhar seu próprio layout livre com todas as ferramentas de design.',
    badge: 'Livre',
    tables: [],
    report: {
      name: 'novo_documento_sankhya',
      language: 'groovy',
      pageWidth: 595,
      pageHeight: 842,
      orientation: 'Portrait',
      columnWidth: 555,
      leftMargin: 20,
      rightMargin: 20,
      topMargin: 20,
      bottomMargin: 20,
      queryString: 'SELECT 1 AS TESTE FROM DUAL',
      parameters: [
        { name: 'PK_NUNOTA', class: 'java.math.BigDecimal', description: 'Número Único' },
      ],
      fields: [
        { name: 'TESTE', class: 'java.math.BigDecimal' },
      ],
      variables: [],
      bands: {
        pageHeader: {
          type: 'pageHeader',
          title: 'Cabeçalho da Página',
          height: 60,
          elements: [],
        },
        columnHeader: {
          type: 'columnHeader',
          title: 'Títulos das Colunas',
          height: 25,
          elements: [],
        },
        detail: {
          type: 'detail',
          title: 'Linhas do Documento',
          height: 40,
          elements: [],
        },
        pageFooter: {
          type: 'pageFooter',
          title: 'Rodapé da Página',
          height: 25,
          elements: [],
        },
        summary: {
          type: 'summary',
          title: 'Totais e Encerramento',
          height: 50,
          elements: [],
        },
      },
    },
  },
];

// Presets for the 3-step Wizard
export interface WizardDataSourcePreset {
  id: string;
  name: string;
  description: string;
  table: string;
  recommendedOrientation: 'Portrait' | 'Landscape';
  fields: {
    key: string;
    label: string;
    defaultChecked: boolean;
    class: string;
    width: number;
    align: 'Left' | 'Center' | 'Right';
    pattern?: string;
  }[];
  defaultQuery: string;
}

export const WIZARD_DATA_SOURCES: WizardDataSourcePreset[] = [
  {
    id: 'faturamento',
    name: 'Notas Fiscais & Faturamento (TGFCAB + TGFITE)',
    description: 'Documentos fiscais, vendas faturadas, romaneios e notas de saída.',
    table: 'TGFCAB + TGFITE',
    recommendedOrientation: 'Portrait',
    defaultQuery: `SELECT 
  CAB.NUNOTA, CAB.NUMNOTA, CAB.DTNEG, CAB.VLRNOTA,
  PAR.CODPARC, PAR.RAZAOSOCIAL,
  ITE.SEQUENCIA, ITE.CODPROD, PRO.DESCRPROD, ITE.QTDNEG, ITE.VLRUNIT, ITE.VLRTOT
FROM TGFCAB CAB
JOIN TGFPAR PAR ON CAB.CODPARC = PAR.CODPARC
JOIN TGFITE ITE ON CAB.NUNOTA = ITE.NUNOTA
JOIN TGFPRO PRO ON ITE.CODPROD = PRO.CODPROD
WHERE CAB.NUNOTA = $P{PK_NUNOTA}
ORDER BY ITE.SEQUENCIA`,
    fields: [
      { key: 'CODPROD', label: 'Código do Produto', defaultChecked: true, class: 'java.math.BigDecimal', width: 60, align: 'Left' },
      { key: 'DESCRPROD', label: 'Descrição do Produto', defaultChecked: true, class: 'java.lang.String', width: 220, align: 'Left' },
      { key: 'QTDNEG', label: 'Quantidade Negociada', defaultChecked: true, class: 'java.math.BigDecimal', width: 65, align: 'Right', pattern: '#,##0.00' },
      { key: 'VLRUNIT', label: 'Valor Unitário', defaultChecked: true, class: 'java.math.BigDecimal', width: 90, align: 'Right', pattern: 'R$ #,##0.00' },
      { key: 'VLRTOT', label: 'Valor Total do Item', defaultChecked: true, class: 'java.math.BigDecimal', width: 110, align: 'Right', pattern: 'R$ #,##0.00' },
    ],
  },
  {
    id: 'financeiro',
    name: 'Financeiro & Contas a Receber (TGFFIN)',
    description: 'Títulos em aberto, baixados, vencimentos e extrato de clientes.',
    table: 'TGFFIN',
    recommendedOrientation: 'Portrait',
    defaultQuery: `SELECT 
  FIN.NUFIN, FIN.NUMNOTA, FIN.DESDOBRAMENTO, FIN.DTVENC, FIN.VLRDESDOB,
  PAR.CODPARC, PAR.RAZAOSOCIAL
FROM TGFFIN FIN
JOIN TGFPAR PAR ON FIN.CODPARC = PAR.CODPARC
WHERE FIN.RECDESP = 1
ORDER BY FIN.DTVENC`,
    fields: [
      { key: 'NUFIN', label: 'Número Único Financeiro', defaultChecked: true, class: 'java.math.BigDecimal', width: 70, align: 'Left' },
      { key: 'RAZAOSOCIAL', label: 'Nome do Cliente / Parceiro', defaultChecked: true, class: 'java.lang.String', width: 190, align: 'Left' },
      { key: 'DESDOBRAMENTO', label: 'Parcela', defaultChecked: true, class: 'java.lang.String', width: 55, align: 'Center' },
      { key: 'DTVENC', label: 'Data de Vencimento', defaultChecked: true, class: 'java.sql.Timestamp', width: 90, align: 'Right', pattern: 'dd/MM/yyyy' },
      { key: 'VLRDESDOB', label: 'Valor do Título', defaultChecked: true, class: 'java.math.BigDecimal', width: 140, align: 'Right', pattern: 'R$ #,##0.00' },
    ],
  },
  {
    id: 'produtos',
    name: 'Catálogo de Produtos & Estoque (TGFPRO)',
    description: 'Listagem de mercadorias, marcas, preços e saldo de estoque.',
    table: 'TGFPRO',
    recommendedOrientation: 'Portrait',
    defaultQuery: `SELECT CODPROD, DESCRPROD, MARCA, CODBARRA, VLRVENDA FROM TGFPRO WHERE ATIVO = 'S' ORDER BY DESCRPROD`,
    fields: [
      { key: 'CODPROD', label: 'Código', defaultChecked: true, class: 'java.math.BigDecimal', width: 55, align: 'Left' },
      { key: 'DESCRPROD', label: 'Descrição Completa', defaultChecked: true, class: 'java.lang.String', width: 230, align: 'Left' },
      { key: 'MARCA', label: 'Marca / Fabricante', defaultChecked: true, class: 'java.lang.String', width: 100, align: 'Left' },
      { key: 'VLRVENDA', label: 'Preço de Venda', defaultChecked: true, class: 'java.math.BigDecimal', width: 160, align: 'Right', pattern: 'R$ #,##0.00' },
    ],
  },
];
