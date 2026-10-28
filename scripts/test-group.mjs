import fs from 'fs';

// Group test report matching XSD 5.6.0
const report = {
  name: 'relatorio_com_grupos',
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
  queryString: `SELECT NUNOTA, NUMNOTA, CODPARC, NOMEPARC, VLRNOTA FROM TGFCAB`,
  parameters: [
    { name: 'PK_NUNOTA', class: 'java.math.BigDecimal' }
  ],
  fields: [
    { name: 'NUNOTA', class: 'java.math.BigDecimal' },
    { name: 'NUMNOTA', class: 'java.math.BigDecimal' },
    { name: 'CODPARC', class: 'java.math.BigDecimal' },
    { name: 'NOMEPARC', class: 'java.lang.String' },
    { name: 'VLRNOTA', class: 'java.math.BigDecimal' },
  ],
  variables: [
    {
      name: 'SUBTOTAL_CLIENTE',
      class: 'java.math.BigDecimal',
      resetType: 'Group',
      resetGroup: 'GrupoCliente',
      calculation: 'Sum',
      variableExpression: '$F{VLRNOTA}',
    },
  ],
  groups: [
    {
      name: 'GrupoCliente',
      expression: '$F{CODPARC}',
      isStartNewPage: false,
      headerBand: {
        height: 24,
        splitType: 'Stretch',
        elements: [
          {
            type: 'textField',
            reportElement: { x: 0, y: 2, width: 300, height: 18 },
            expression: '$F{NOMEPARC}',
          }
        ]
      },
      footerBand: {
        height: 26,
        splitType: 'Stretch',
        elements: [
          {
            type: 'textField',
            reportElement: { x: 400, y: 4, width: 155, height: 18 },
            expression: '$V{SUBTOTAL_CLIENTE}',
          }
        ]
      }
    }
  ],
  bands: {
    detail: {
      type: 'detail',
      height: 20,
      splitType: 'Stretch',
      elements: [
        {
          type: 'textField',
          reportElement: { x: 0, y: 2, width: 100, height: 16 },
          expression: '$F{NUNOTA}',
        }
      ]
    }
  }
};

function renderBand(band, tagName, indent) {
  if (!band) return '';
  const inner = (band.elements || []).map(el => {
    return `${indent}    <textField>\n${indent}      <reportElement x="${el.reportElement.x}" y="${el.reportElement.y}" width="${el.reportElement.width}" height="${el.reportElement.height}"/>\n${indent}      <textFieldExpression><![CDATA[${el.expression}]]></textFieldExpression>\n${indent}    </textField>`;
  }).join('\n');
  return `${indent}<${tagName}>\n${indent}  <band height="${band.height}" splitType="${band.splitType}">\n${inner}\n${indent}  </band>\n${indent}</${tagName}>`;
}

function serialize(rep) {
  const lines = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd" name="${rep.name}" language="${rep.language}" pageWidth="${rep.pageWidth}" pageHeight="${rep.pageHeight}" columnWidth="${rep.columnWidth}" leftMargin="${rep.leftMargin}" rightMargin="${rep.rightMargin}" topMargin="${rep.topMargin}" bottomMargin="${rep.bottomMargin}">`,
  ];
  for (const p of rep.parameters) lines.push(`  <parameter name="${p.name}" class="${p.class}"/>`);
  lines.push(`  <queryString><![CDATA[${rep.queryString}]]></queryString>`);
  for (const f of rep.fields) lines.push(`  <field name="${f.name}" class="${f.class}"/>`);
  for (const v of rep.variables) {
    lines.push(`  <variable name="${v.name}" class="${v.class}" resetType="${v.resetType}" resetGroup="${v.resetGroup}" calculation="${v.calculation}">\n    <variableExpression><![CDATA[${v.variableExpression}]]></variableExpression>\n  </variable>`);
  }
  for (const g of rep.groups) {
    lines.push(`  <group name="${g.name}">`);
    lines.push(`    <groupExpression><![CDATA[${g.expression}]]></groupExpression>`);
    if (g.headerBand) lines.push(renderBand(g.headerBand, 'groupHeader', '    '));
    if (g.footerBand) lines.push(renderBand(g.footerBand, 'groupFooter', '    '));
    lines.push(`  </group>`);
  }
  lines.push(renderBand(rep.bands.detail, 'detail', '  '));
  lines.push('</jasperReport>');
  return lines.join('\n');
}

const xml = serialize(report);
fs.writeFileSync('engine/test_group.jrxml', xml, 'utf-8');
console.log('Saved engine/test_group.jrxml! Size:', xml.length);
