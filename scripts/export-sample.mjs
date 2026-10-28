import fs from 'fs';

// Default Sankhya Report AST
const report = {
  name: 'relatorio_sankhya',
  language: 'groovy',
  pageWidth: 595,
  pageHeight: 842,
  orientation: 'Portrait',
  columnWidth: 555,
  leftMargin: 20,
  rightMargin: 20,
  topMargin: 20,
  bottomMargin: 20,
  uuid: 'c82736b4-4ef8-4687-9bc6-e2ef64d1f5a9',
  queryString: `SELECT CAB.NUNOTA, CAB.NUMNOTA, CAB.DTNEG, PAR.CODPARC, PAR.RAZAOSOCIAL AS NOMEPARC, CAB.VLRNOTA FROM TGFCAB CAB INNER JOIN TGFPAR PAR ON (PAR.CODPARC = CAB.CODPARC) WHERE CAB.NUNOTA = $P{PK_NUNOTA}`,
  parameters: [
    {
      name: 'PK_NUNOTA',
      class: 'java.math.BigDecimal',
      isForPrompting: true,
      defaultValueExpression: '',
      description: 'Número Único da Nota Fiscal / Pedido Sankhya',
    },
    {
      name: 'PDIR_MODELO',
      class: 'java.lang.String',
      isForPrompting: false,
      defaultValueExpression: '""',
      description: 'Diretório base de templates Sankhya',
    },
  ],
  fields: [
    { name: 'NUNOTA', class: 'java.math.BigDecimal' },
    { name: 'NUMNOTA', class: 'java.math.BigDecimal' },
    { name: 'DTNEG', class: 'java.sql.Timestamp' },
    { name: 'CODPARC', class: 'java.math.BigDecimal' },
    { name: 'NOMEPARC', class: 'java.lang.String' },
    { name: 'VLRNOTA', class: 'java.math.BigDecimal' },
  ],
  variables: [
    {
      name: 'PAGE_NUMBER',
      class: 'java.lang.Integer',
      resetType: 'Report',
      calculation: 'Nothing',
    },
    {
      name: 'REPORT_COUNT',
      class: 'java.lang.Integer',
      resetType: 'Report',
      calculation: 'Count',
    },
  ],
  bands: {
    title: {
      type: 'title',
      title: 'Title',
      height: 75,
      splitType: 'Stretch',
      elements: [
        {
          id: 'elem-header-bg',
          type: 'rectangle',
          reportElement: {
            x: 0,
            y: 0,
            width: 555,
            height: 65,
            backcolor: '#1E293B',
            mode: 'Opaque',
          },
          radius: 4,
          penWidth: 0,
        },
        {
          id: 'elem-title-text',
          type: 'staticText',
          reportElement: {
            x: 15,
            y: 12,
            width: 350,
            height: 25,
            forecolor: '#FFFFFF',
          },
          textElement: {
            textAlignment: 'Left',
            verticalAlignment: 'Middle',
            font: { fontName: 'Arial', size: 18, isBold: true },
          },
          text: 'SANKHYA ERP - ESPELHO DE NOTA',
        },
      ],
    },
    pageHeader: {
      type: 'pageHeader',
      title: 'Page Header',
      height: 35,
      splitType: 'Stretch',
      elements: [
        {
          id: 'elem-ph-parc-lbl',
          type: 'staticText',
          reportElement: {
            x: 0,
            y: 8,
            width: 60,
            height: 18,
            forecolor: '#334155',
          },
          textElement: {
            verticalAlignment: 'Middle',
            font: { size: 9, isBold: true },
          },
          text: 'Cliente:',
        },
      ],
    },
    columnHeader: {
      type: 'columnHeader',
      title: 'Column Header',
      height: 26,
      splitType: 'Stretch',
      elements: [
        {
          id: 'elem-ch-c1',
          type: 'staticText',
          reportElement: {
            x: 8,
            y: 4,
            width: 70,
            height: 18,
            forecolor: '#475569',
          },
          textElement: {
            verticalAlignment: 'Middle',
            font: { size: 8, isBold: true },
          },
          text: 'NRO ÚNICO',
        },
      ],
    },
    detail: {
      type: 'detail',
      title: 'Detail',
      height: 24,
      splitType: 'Stretch',
      elements: [
        {
          id: 'elem-dt-c1',
          type: 'textField',
          reportElement: {
            x: 8,
            y: 2,
            width: 70,
            height: 18,
            forecolor: '#1E293B',
          },
          textElement: {
            verticalAlignment: 'Middle',
            font: { size: 9 },
          },
          expression: '$F{NUNOTA}',
        },
      ],
    },
    columnFooter: {
      type: 'columnFooter',
      title: 'Column Footer',
      height: 10,
      splitType: 'Stretch',
      elements: [],
    },
    pageFooter: {
      type: 'pageFooter',
      title: 'Page Footer',
      height: 25,
      splitType: 'Stretch',
      elements: [
        {
          id: 'elem-pf-copy',
          type: 'staticText',
          reportElement: {
            x: 0,
            y: 8,
            width: 250,
            height: 14,
            forecolor: '#94A3B8',
          },
          textElement: {
            verticalAlignment: 'Middle',
            font: { size: 8 },
          },
          text: 'Sankhya Gestão de Negócios - iReport Web Designer',
        },
      ],
    },
    summary: {
      type: 'summary',
      title: 'Summary',
      height: 40,
      splitType: 'Stretch',
      elements: [
        {
          id: 'elem-sum-lbl',
          type: 'staticText',
          reportElement: {
            x: 330,
            y: 12,
            width: 90,
            height: 18,
            forecolor: '#0F172A',
          },
          textElement: {
            verticalAlignment: 'Middle',
            font: { size: 9, isBold: true },
          },
          text: 'TOTAL GERAL:',
        },
      ],
    },
  },
};

function escapeXml(unsafe) {
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function renderReportElement(elem, indent) {
  const rel = elem.reportElement;
  const parts = [
    `x="${rel.x}"`,
    `y="${rel.y}"`,
    `width="${rel.width}"`,
    `height="${rel.height}"`,
  ];
  if (rel.uuid) parts.push(`uuid="${rel.uuid}"`);
  if (rel.key) parts.push(`key="${escapeXml(rel.key)}"`);
  if (rel.forecolor) parts.push(`forecolor="${rel.forecolor}"`);
  if (rel.backcolor) parts.push(`backcolor="${rel.backcolor}"`);
  if (rel.mode) parts.push(`mode="${rel.mode}"`);
  return `${indent}<reportElement ${parts.join(' ')}/>`;
}

function renderTextElement(elem, indent) {
  const te = elem.textElement;
  if (!te) return '';
  const teAttrs = [];
  if (te.textAlignment) teAttrs.push(`textAlignment="${te.textAlignment}"`);
  if (te.verticalAlignment) teAttrs.push(`verticalAlignment="${te.verticalAlignment}"`);

  const fontAttrs = [];
  if (te.font) {
    if (te.font.fontName) fontAttrs.push(`fontName="${escapeXml(te.font.fontName)}"`);
    if (te.font.size) fontAttrs.push(`size="${te.font.size}"`);
    if (te.font.isBold !== undefined) fontAttrs.push(`isBold="${te.font.isBold}"`);
    if (te.font.isItalic !== undefined) fontAttrs.push(`isItalic="${te.font.isItalic}"`);
    if (te.font.isUnderline !== undefined) fontAttrs.push(`isUnderline="${te.font.isUnderline}"`);
  }
  const fontXml = fontAttrs.length > 0 ? `\n${indent}  <font ${fontAttrs.join(' ')}/>` : '';
  const teOpen = teAttrs.length > 0 ? `<textElement ${teAttrs.join(' ')}>` : '<textElement>';
  return `${indent}${teOpen}${fontXml}\n${indent}</textElement>`;
}

function renderElement(elem, indent) {
  if (elem.type === 'staticText') {
    return [
      `${indent}<staticText>`,
      renderReportElement(elem, `${indent}  `),
      renderTextElement(elem, `${indent}  `),
      `${indent}  <text><![CDATA[${elem.text}]]></text>`,
      `${indent}</staticText>`,
    ].filter(Boolean).join('\n');
  }
  if (elem.type === 'textField') {
    return [
      `${indent}<textField>`,
      renderReportElement(elem, `${indent}  `),
      renderTextElement(elem, `${indent}  `),
      `${indent}  <textFieldExpression><![CDATA[${elem.expression}]]></textFieldExpression>`,
      `${indent}</textField>`,
    ].filter(Boolean).join('\n');
  }
  if (elem.type === 'rectangle') {
    return [
      `${indent}<rectangle>`,
      renderReportElement(elem, `${indent}  `),
      `${indent}</rectangle>`,
    ].filter(Boolean).join('\n');
  }
  return '';
}

function renderBand(band, tagName, indent) {
  if (!band) return '';
  const innerElements = band.elements.map((el) => renderElement(el, `${indent}    `)).join('\n');
  return [
    `${indent}<${tagName}>`,
    `${indent}  <band height="${band.height}" splitType="${band.splitType || 'Stretch'}">`,
    innerElements,
    `${indent}  </band>`,
    `${indent}</${tagName}>`,
  ].filter(Boolean).join('\n');
}

function serialize(rep) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="${rep.name}" language="${rep.language}" pageWidth="${rep.pageWidth}" pageHeight="${rep.pageHeight}" columnWidth="${rep.columnWidth}" leftMargin="${rep.leftMargin}" rightMargin="${rep.rightMargin}" topMargin="${rep.topMargin}" bottomMargin="${rep.bottomMargin}">`,
    '  <property name="ireport.zoom" value="1.0"/>',
    '  <property name="ireport.x" value="0"/>',
    '  <property name="ireport.y" value="0"/>',
  ];

  for (const p of rep.parameters) {
    lines.push(`  <parameter name="${p.name}" class="${p.class}"/>`);
  }
  lines.push(`  <queryString>\n    <![CDATA[${rep.queryString}]]>\n  </queryString>`);
  for (const f of rep.fields) {
    lines.push(`  <field name="${f.name}" class="${f.class}"/>`);
  }
  for (const v of rep.variables) {
    lines.push(`  <variable name="${v.name}" class="${v.class}" calculation="${v.calculation}"/>`);
  }

  lines.push(renderBand(rep.bands.title, 'title', '  '));
  lines.push(renderBand(rep.bands.pageHeader, 'pageHeader', '  '));
  lines.push(renderBand(rep.bands.columnHeader, 'columnHeader', '  '));
  lines.push(renderBand(rep.bands.detail, 'detail', '  '));
  lines.push(renderBand(rep.bands.columnFooter, 'columnFooter', '  '));
  lines.push(renderBand(rep.bands.pageFooter, 'pageFooter', '  '));
  lines.push(renderBand(rep.bands.summary, 'summary', '  '));
  lines.push('</jasperReport>');

  return lines.join('\n');
}

const xml = serialize(report);
fs.writeFileSync('engine/test_sankhya.jrxml', xml, 'utf-8');
console.log('Saved engine/test_sankhya.jrxml! Size:', xml.length);
