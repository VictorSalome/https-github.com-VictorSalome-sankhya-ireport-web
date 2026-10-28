import {
  JRXMLReport,
  JRXMLBand,
  JRXMLElement,
  JRXMLStaticText,
  JRXMLTextField,
  JRXMLLine,
  JRXMLRectangle,
  JRXMLImage,
  JRXMLBarcode,
  JRXMLSubreport,
  JRXMLSubreportParameter,
  JRXMLChart,
  JRXMLCrosstab,
  JRXMLStyle,
  JRXMLConditionalStyle,
  JRXMLBox,
  JasperReportsVersion,
} from '../types/jrxml';

export interface SerializeOptions {
  version?: JasperReportsVersion;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

let currentSerializeVersion: JasperReportsVersion = '4.0.1';

function getOrGenerateUuid(seed?: string, existing?: string): string {
  if (existing && existing.trim()) return existing;
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

function renderReportElement(elem: JRXMLElement, indent: string): string {
  const rel = elem.reportElement;
  const parts: string[] = [
    `x="${rel.x}"`,
    `y="${rel.y}"`,
    `width="${rel.width}"`,
    `height="${rel.height}"`,
  ];

  if (currentSerializeVersion !== '4.0.1') {
    const uuid = getOrGenerateUuid(elem.id, rel.uuid);
    parts.push(`uuid="${uuid}"`);
  }
  if (rel.key) parts.push(`key="${escapeXml(rel.key)}"`);
  if (rel.style) parts.push(`style="${escapeXml(rel.style)}"`);
  if (rel.forecolor) parts.push(`forecolor="${rel.forecolor}"`);
  if (rel.backcolor) parts.push(`backcolor="${rel.backcolor}"`);
  if (rel.mode) parts.push(`mode="${rel.mode}"`);

  if (rel.printWhenExpression && rel.printWhenExpression.trim()) {
    return [
      `${indent}<reportElement ${parts.join(' ')}>`,
      `${indent}  <printWhenExpression><![CDATA[${rel.printWhenExpression.trim()}]]></printWhenExpression>`,
      `${indent}</reportElement>`,
    ].join('\n');
  }

  return `${indent}<reportElement ${parts.join(' ')}/>`;
}

function renderStyle(style: JRXMLStyle, indent: string): string {
  const attrs: string[] = [`name="${escapeXml(style.name)}"`];
  if (style.isDefault) attrs.push('isDefault="true"');
  if (style.style) attrs.push(`style="${escapeXml(style.style)}"`);
  if (style.mode) attrs.push(`mode="${style.mode}"`);
  if (style.forecolor) attrs.push(`forecolor="${style.forecolor}"`);
  if (style.backcolor) attrs.push(`backcolor="${style.backcolor}"`);
  if (style.fontSize) attrs.push(`fontSize="${style.fontSize}"`);
  if (style.isBold !== undefined) attrs.push(`isBold="${style.isBold}"`);
  if (style.isItalic !== undefined) attrs.push(`isItalic="${style.isItalic}"`);

  const condLines: string[] = [];
  if (style.conditionalStyles && style.conditionalStyles.length > 0) {
    for (const cs of style.conditionalStyles) {
      const innerAttrs: string[] = [];
      if (cs.mode) innerAttrs.push(`mode="${cs.mode}"`);
      if (cs.forecolor) innerAttrs.push(`forecolor="${cs.forecolor}"`);
      if (cs.backcolor) innerAttrs.push(`backcolor="${cs.backcolor}"`);

      const innerStyleXml = innerAttrs.length > 0
        ? `\n${indent}    <style ${innerAttrs.join(' ')}/>`
        : `\n${indent}    <style/>`;

      condLines.push(
        `${indent}  <conditionalStyle>\n${indent}    <conditionExpression><![CDATA[${cs.conditionExpression}]]></conditionExpression>${innerStyleXml}\n${indent}  </conditionalStyle>`
      );
    }
  }

  if (condLines.length > 0) {
    return `${indent}<style ${attrs.join(' ')}>\n${condLines.join('\n')}\n${indent}</style>`;
  }

  return `${indent}<style ${attrs.join(' ')}/>`;
}

function renderTextElement(elem: JRXMLStaticText | JRXMLTextField, indent: string): string {
  const te = elem.textElement;
  if (!te) return '';

  const teAttrs: string[] = [];
  if (te.textAlignment) teAttrs.push(`textAlignment="${te.textAlignment}"`);
  if (te.verticalAlignment) teAttrs.push(`verticalAlignment="${te.verticalAlignment}"`);

  const fontAttrs: string[] = [];
  if (te.font) {
    if (te.font.fontName) fontAttrs.push(`fontName="${escapeXml(te.font.fontName)}"`);
    if (te.font.size) fontAttrs.push(`size="${te.font.size}"`);
    if (te.font.isBold !== undefined) fontAttrs.push(`isBold="${te.font.isBold}"`);
    if (te.font.isItalic !== undefined) fontAttrs.push(`isItalic="${te.font.isItalic}"`);
    if (te.font.isUnderline !== undefined) fontAttrs.push(`isUnderline="${te.font.isUnderline}"`);

    let pdfFont = te.font.pdfFontName;
    if (currentSerializeVersion === '4.0.1' && !pdfFont) {
      if (te.font.isBold && te.font.isItalic) {
        pdfFont = 'Helvetica-BoldOblique';
      } else if (te.font.isBold) {
        pdfFont = 'Helvetica-Bold';
      } else if (te.font.isItalic) {
        pdfFont = 'Helvetica-Oblique';
      } else {
        pdfFont = 'Helvetica';
      }
    }

    const pdfEncoding =
      te.font.pdfEncoding || (currentSerializeVersion === '4.0.1' ? 'CP1252' : undefined);
    const isPdfEmbedded =
      te.font.isPdfEmbedded !== undefined
        ? te.font.isPdfEmbedded
        : (currentSerializeVersion === '4.0.1' ? false : undefined);

    if (pdfFont) fontAttrs.push(`pdfFontName="${escapeXml(pdfFont)}"`);
    if (pdfEncoding) fontAttrs.push(`pdfEncoding="${escapeXml(pdfEncoding)}"`);
    if (isPdfEmbedded !== undefined) fontAttrs.push(`isPdfEmbedded="${isPdfEmbedded}"`);
  }

  const fontXml = fontAttrs.length > 0 ? `\n${indent}  <font ${fontAttrs.join(' ')}/>` : '';
  const teOpen = teAttrs.length > 0 ? `<textElement ${teAttrs.join(' ')}>` : '<textElement>';

  return `${indent}${teOpen}${fontXml}\n${indent}</textElement>`;
}

function renderBox(box: JRXMLBox | undefined, indent: string): string {
  if (!box) return '';

  const penAttrs: string[] = [];
  if (box.penWidth !== undefined) penAttrs.push(`lineWidth="${box.penWidth}"`);
  if (box.penColor) penAttrs.push(`lineColor="${box.penColor}"`);
  if (box.penStyle) penAttrs.push(`lineStyle="${box.penStyle}"`);

  if (penAttrs.length === 0) {
    return '';
  }

  return [
    `${indent}<box>`,
    `${indent}  <pen ${penAttrs.join(' ')}/>`,
    `${indent}</box>`,
  ].join('\n');
}

function renderElement(elem: JRXMLElement, indent: string): string {
  switch (elem.type) {
    case 'staticText': {
      const st = elem as JRXMLStaticText;
      return [
        `${indent}<staticText>`,
        renderReportElement(st, `${indent}  `),
        renderBox(st.box, `${indent}  `),
        renderTextElement(st, `${indent}  `),
        `${indent}  <text><![CDATA[${st.text}]]></text>`,
        `${indent}</staticText>`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'textField': {
      const tf = elem as JRXMLTextField;
      const tfAttrs: string[] = [];
      if (tf.pattern) tfAttrs.push(`pattern="${escapeXml(tf.pattern)}"`);
      if (tf.isBlankWhenNull !== undefined) tfAttrs.push(`isBlankWhenNull="${tf.isBlankWhenNull}"`);

      const openTag = tfAttrs.length > 0 ? `<textField ${tfAttrs.join(' ')}>` : '<textField>';
      return [
        `${indent}${openTag}`,
        renderReportElement(tf, `${indent}  `),
        renderBox(tf.box, `${indent}  `),
        renderTextElement(tf, `${indent}  `),
        `${indent}  <textFieldExpression><![CDATA[${tf.expression}]]></textFieldExpression>`,
        `${indent}</textField>`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'line': {
      const ln = elem as JRXMLLine;
      const penAttrs: string[] = [];
      if (ln.penWidth !== undefined) penAttrs.push(`lineWidth="${ln.penWidth}"`);
      if (ln.penColor) penAttrs.push(`lineColor="${ln.penColor}"`);

      const graphicElem =
        penAttrs.length > 0
          ? `${indent}  <graphicElement>\n${indent}    <pen ${penAttrs.join(' ')}/>\n${indent}  </graphicElement>`
          : '';

      return [
        `${indent}<line>`,
        renderReportElement(ln, `${indent}  `),
        graphicElem,
        `${indent}</line>`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'rectangle': {
      const rc = elem as JRXMLRectangle;
      const rcAttrs: string[] = [];
      if (rc.radius) rcAttrs.push(`radius="${rc.radius}"`);

      const penAttrs: string[] = [];
      if (rc.penWidth !== undefined) penAttrs.push(`lineWidth="${rc.penWidth}"`);
      if (rc.penColor) penAttrs.push(`lineColor="${rc.penColor}"`);

      const graphicElem =
        penAttrs.length > 0
          ? `${indent}  <graphicElement>\n${indent}    <pen ${penAttrs.join(' ')}/>\n${indent}  </graphicElement>`
          : '';

      const openTag = rcAttrs.length > 0 ? `<rectangle ${rcAttrs.join(' ')}>` : '<rectangle>';
      return [
        `${indent}${openTag}`,
        renderReportElement(rc, `${indent}  `),
        graphicElem,
        `${indent}</rectangle>`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'image': {
      const img = elem as JRXMLImage;
      const imgAttrs: string[] = [];
      if (img.scaleImage) imgAttrs.push(`scaleImage="${img.scaleImage}"`);

      const openTag = imgAttrs.length > 0 ? `<image ${imgAttrs.join(' ')}>` : '<image>';
      return [
        `${indent}${openTag}`,
        renderReportElement(img, `${indent}  `),
        `${indent}  <imageExpression><![CDATA[${img.expression}]]></imageExpression>`,
        `${indent}</image>`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'barcode': {
      const bc = elem as JRXMLBarcode;
      const bcType = bc.barcodeType;

      if (bcType === 'QRCode') {
        return [
          `${indent}<image scaleImage="RetainShape">`,
          renderReportElement(bc, `${indent}  `),
          `${indent}  <imageExpression><![CDATA[com.google.zxing.client.j2se.MatrixToImageWriter.toBufferedImage(new com.google.zxing.qrcode.QRCodeWriter().encode(${bc.expression}, com.google.zxing.BarcodeFormat.QR_CODE, 250, 250))]]></imageExpression>`,
          `${indent}</image>`,
        ]
          .filter(Boolean)
          .join('\n');
      }

      const attrs: string[] = [];
      if (bc.textPosition) attrs.push(`textPosition="${bc.textPosition}"`);
      if (bc.moduleWidth) attrs.push(`moduleWidth="${bc.moduleWidth}"`);
      if (bc.orientation !== undefined && bc.orientation !== 0) {
        attrs.push(`orientation="${bc.orientation}"`);
      }
      if (bc.checksumMode) attrs.push(`checksumMode="${bc.checksumMode}"`);
      if (bc.displayChecksum !== undefined) attrs.push(`displayChecksum="${bc.displayChecksum}"`);
      if (bc.wideFactor !== undefined) attrs.push(`wideFactor="${bc.wideFactor}"`);

      const attrStr = attrs.length > 0 ? ` ${attrs.join(' ')}` : '';

      return [
        `${indent}<componentElement>`,
        renderReportElement(bc, `${indent}  `),
        `${indent}  <c:${bcType}${attrStr}>`,
        `${indent}    <c:codeExpression><![CDATA[${bc.expression}]]></c:codeExpression>`,
        `${indent}  </c:${bcType}>`,
        `${indent}</componentElement>`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'subreport': {
      const sr = elem as JRXMLSubreport;
      const srAttrs: string[] = [];
      if (sr.isUsingCache !== undefined) srAttrs.push(`isUsingCache="${sr.isUsingCache}"`);
      if (sr.runToBottom !== undefined) srAttrs.push(`runToBottom="${sr.runToBottom}"`);

      const openTag = srAttrs.length > 0 ? `<subreport ${srAttrs.join(' ')}>` : '<subreport>';

      const paramXml = (sr.parameters || (sr as any).subreportParameters || [])
        .map(
          (p: JRXMLSubreportParameter) =>
            `${indent}  <subreportParameter name="${escapeXml(p.name)}">\n${indent}    <subreportParameterExpression><![CDATA[${p.expression}]]></subreportParameterExpression>\n${indent}  </subreportParameter>`
        )
        .join('\n');

      const connXml = sr.connectionExpression
        ? `${indent}  <connectionExpression><![CDATA[${sr.connectionExpression}]]></connectionExpression>`
        : '';

      const exprXml = sr.subreportExpression
        ? `${indent}  <subreportExpression><![CDATA[${sr.subreportExpression}]]></subreportExpression>`
        : '';

      return [
        `${indent}${openTag}`,
        renderReportElement(sr, `${indent}  `),
        paramXml,
        connXml,
        exprXml,
        `${indent}</subreport>`,
      ]
        .filter(Boolean)
        .join('\n');
    }

    case 'chart': {
      const ch = elem as JRXMLChart;
      const cType = ch.chartType || 'barChart';
      const isShowLegend = ch.isShowLegend !== false ? 'true' : 'false';
      const isShowLabels = ch.isShowLabels !== false ? 'true' : 'false';

      const titleXml = ch.title
        ? `${indent}    <chartTitle>\n${indent}      <titleExpression><![CDATA["${escapeXml(ch.title)}"]]></titleExpression>\n${indent}    </chartTitle>`
        : '';

      const chartCommonXml = [
        `${indent}  <chart isShowLegend="${isShowLegend}">`,
        renderReportElement(ch, `${indent}    `),
        titleXml,
        `${indent}  </chart>`,
      ]
        .filter(Boolean)
        .join('\n');

      if (cType === 'pieChart') {
        const keyExp = ch.keyExpression || '$F{APELIDO}';
        const valExp = ch.valueExpression || '$F{VLRTOT}';
        return [
          `${indent}<pieChart>`,
          chartCommonXml,
          `${indent}  <pieDataset>`,
          `${indent}    <keyExpression><![CDATA[${keyExp}]]></keyExpression>`,
          `${indent}    <valueExpression><![CDATA[${valExp}]]></valueExpression>`,
          `${indent}  </pieDataset>`,
          `${indent}  <piePlot isShowLabels="${isShowLabels}">`,
          `${indent}    <plot/>`,
          `${indent}  </piePlot>`,
          `${indent}</pieChart>`,
        ].join('\n');
      }

      if (cType === 'lineChart') {
        const serExp = ch.seriesExpression || '"Evolução"';
        const catExp = ch.categoryExpression || '$F{DTNEG}';
        const valExp = ch.valueExpression || '$F{VLRTOT}';
        return [
          `${indent}<lineChart>`,
          chartCommonXml,
          `${indent}  <categoryDataset>`,
          `${indent}    <categorySeries>`,
          `${indent}      <seriesExpression><![CDATA[${serExp}]]></seriesExpression>`,
          `${indent}      <categoryExpression><![CDATA[${catExp}]]></categoryExpression>`,
          `${indent}      <valueExpression><![CDATA[${valExp}]]></valueExpression>`,
          `${indent}    </categorySeries>`,
          `${indent}  </categoryDataset>`,
          `${indent}  <linePlot isShowLines="true" isShowShapes="true">`,
          `${indent}    <plot/>`,
          `${indent}  </linePlot>`,
          `${indent}</lineChart>`,
        ].join('\n');
      }

      // Default: barChart
      const serExp = ch.seriesExpression || '"Vendas"';
      const catExp = ch.categoryExpression || '$F{MES}';
      const valExp = ch.valueExpression || '$F{VLRTOT}';
      return [
        `${indent}<barChart>`,
        chartCommonXml,
        `${indent}  <categoryDataset>`,
        `${indent}    <categorySeries>`,
        `${indent}      <seriesExpression><![CDATA[${serExp}]]></seriesExpression>`,
        `${indent}      <categoryExpression><![CDATA[${catExp}]]></categoryExpression>`,
        `${indent}      <valueExpression><![CDATA[${valExp}]]></valueExpression>`,
        `${indent}    </categorySeries>`,
        `${indent}  </categoryDataset>`,
        `${indent}  <barPlot isShowLabels="${isShowLabels}">`,
        `${indent}    <plot/>`,
        `${indent}  </barPlot>`,
        `${indent}</barChart>`,
      ].join('\n');
    }

    case 'crosstab': {
      const ct = elem as JRXMLCrosstab;
      const rowG = ct.rowGroup;
      const colG = ct.columnGroup;
      const meas = ct.measure;
      const cellW = ct.cellWidth || 60;
      const cellH = ct.cellHeight || 20;
      const rowTotPos = rowG.totalPosition || 'End';
      const colTotPos = colG.totalPosition || 'End';

      const rowTotHeaderXml =
        rowTotPos !== 'None'
          ? [
              `${indent}    <crosstabTotalRowHeader>`,
              `${indent}      <cellContents>`,
              `${indent}        <staticText>`,
              `${indent}          <reportElement x="0" y="0" width="${rowG.width}" height="${cellH}"/>`,
              `${indent}          <text><![CDATA[${escapeXml(rowG.totalText || 'Total ' + rowG.name)}]]></text>`,
              `${indent}        </staticText>`,
              `${indent}      </cellContents>`,
              `${indent}    </crosstabTotalRowHeader>`,
            ].join('\n')
          : '';

      const colTotHeaderXml =
        colTotPos !== 'None'
          ? [
              `${indent}    <crosstabTotalColumnHeader>`,
              `${indent}      <cellContents>`,
              `${indent}        <staticText>`,
              `${indent}          <reportElement x="0" y="0" width="${cellW}" height="${colG.height}"/>`,
              `${indent}          <text><![CDATA[${escapeXml(colG.totalText || 'Total Geral')}]]></text>`,
              `${indent}        </staticText>`,
              `${indent}      </cellContents>`,
              `${indent}    </crosstabTotalColumnHeader>`,
            ].join('\n')
          : '';

      // Base cell
      const baseCellXml = [
        `${indent}  <crosstabCell width="${cellW}" height="${cellH}">`,
        `${indent}    <cellContents>`,
        `${indent}      <textField pattern="${meas.pattern || '#,##0.00'}">`,
        `${indent}        <reportElement x="0" y="0" width="${cellW}" height="${cellH}"/>`,
        `${indent}        <textFieldExpression><![CDATA[$V{${meas.name}}]]></textFieldExpression>`,
        `${indent}      </textField>`,
        `${indent}    </cellContents>`,
        `${indent}  </crosstabCell>`,
      ].join('\n');

      // Row total cell
      const rowTotalCellXml =
        rowTotPos !== 'None'
          ? [
              `${indent}  <crosstabCell width="${cellW}" height="${cellH}" rowTotalGroup="${rowG.name}">`,
              `${indent}    <cellContents>`,
              `${indent}      <textField pattern="${meas.pattern || '#,##0.00'}">`,
              `${indent}        <reportElement x="0" y="0" width="${cellW}" height="${cellH}"/>`,
              `${indent}        <textFieldExpression><![CDATA[$V{${meas.name}}]]></textFieldExpression>`,
              `${indent}      </textField>`,
              `${indent}    </cellContents>`,
              `${indent}  </crosstabCell>`,
            ].join('\n')
          : '';

      // Column total cell
      const colTotalCellXml =
        colTotPos !== 'None'
          ? [
              `${indent}  <crosstabCell width="${cellW}" height="${cellH}" columnTotalGroup="${colG.name}">`,
              `${indent}    <cellContents>`,
              `${indent}      <textField pattern="${meas.pattern || '#,##0.00'}">`,
              `${indent}        <reportElement x="0" y="0" width="${cellW}" height="${cellH}"/>`,
              `${indent}        <textFieldExpression><![CDATA[$V{${meas.name}}]]></textFieldExpression>`,
              `${indent}      </textField>`,
              `${indent}    </cellContents>`,
              `${indent}  </crosstabCell>`,
            ].join('\n')
          : '';

      // Grand total cell
      const grandTotalCellXml =
        rowTotPos !== 'None' && colTotPos !== 'None'
          ? [
              `${indent}  <crosstabCell width="${cellW}" height="${cellH}" rowTotalGroup="${rowG.name}" columnTotalGroup="${colG.name}">`,
              `${indent}    <cellContents>`,
              `${indent}      <textField pattern="${meas.pattern || '#,##0.00'}">`,
              `${indent}        <reportElement x="0" y="0" width="${cellW}" height="${cellH}"/>`,
              `${indent}        <textFieldExpression><![CDATA[$V{${meas.name}}]]></textFieldExpression>`,
              `${indent}      </textField>`,
              `${indent}    </cellContents>`,
              `${indent}  </crosstabCell>`,
            ].join('\n')
          : '';

      return [
        `${indent}<crosstab>`,
        renderReportElement(ct, `${indent}  `),
        `${indent}  <rowGroup name="${rowG.name}" width="${rowG.width}" totalPosition="${rowTotPos}">`,
        `${indent}    <bucket class="java.lang.String">`,
        `${indent}      <bucketExpression><![CDATA[${rowG.bucketExpression}]]></bucketExpression>`,
        `${indent}    </bucket>`,
        `${indent}    <crosstabRowHeader>`,
        `${indent}      <cellContents>`,
        `${indent}        <textField>`,
        `${indent}          <reportElement x="0" y="0" width="${rowG.width}" height="${cellH}"/>`,
        `${indent}          <textFieldExpression><![CDATA[$V{${rowG.name}}]]></textFieldExpression>`,
        `${indent}        </textField>`,
        `${indent}      </cellContents>`,
        `${indent}    </crosstabRowHeader>`,
        rowTotHeaderXml,
        `${indent}  </rowGroup>`,
        `${indent}  <columnGroup name="${colG.name}" height="${colG.height}" totalPosition="${colTotPos}">`,
        `${indent}    <bucket class="java.lang.String">`,
        `${indent}      <bucketExpression><![CDATA[${colG.bucketExpression}]]></bucketExpression>`,
        `${indent}    </bucket>`,
        `${indent}    <crosstabColumnHeader>`,
        `${indent}      <cellContents>`,
        `${indent}        <textField>`,
        `${indent}          <reportElement x="0" y="0" width="${cellW}" height="${colG.height}"/>`,
        `${indent}          <textFieldExpression><![CDATA[$V{${colG.name}}]]></textFieldExpression>`,
        `${indent}        </textField>`,
        `${indent}      </cellContents>`,
        `${indent}    </crosstabColumnHeader>`,
        colTotHeaderXml,
        `${indent}  </columnGroup>`,
        `${indent}  <measure name="${meas.name}" class="java.math.BigDecimal" calculation="${meas.calculation || 'Sum'}">`,
        `${indent}    <measureExpression><![CDATA[${meas.expression}]]></measureExpression>`,
        `${indent}  </measure>`,
        baseCellXml,
        rowTotalCellXml,
        colTotalCellXml,
        grandTotalCellXml,
        `${indent}</crosstab>`,
      ]
        .filter(Boolean)
        .join('\n');
    }
  }
}

function renderBand(band: JRXMLBand | undefined, tagName: string, indent: string): string {
  if (!band) return '';
  const bandAttrs: string[] = [`height="${band.height}"`];
  if (band.splitType) bandAttrs.push(`splitType="${band.splitType}"`);

  const innerElements = band.elements
    .map((elem) => renderElement(elem, `${indent}    `))
    .join('\n');

  return [
    `${indent}<${tagName}>`,
    `${indent}  <band ${bandAttrs.join(' ')}>`,
    innerElements,
    `${indent}  </band>`,
    `${indent}</${tagName}>`,
  ]
    .filter(Boolean)
    .join('\n');
}

/**
 * Serializes a JRXMLReport into standard JasperReports XML
 * matching jasperreport.xsd and Sankhya ERP specifications.
 */
export function serializeJRXML(
  report: JRXMLReport,
  options?: { version?: JasperReportsVersion }
): string {
  const targetVersion: JasperReportsVersion = options?.version || report.targetVersion || '4.0.1';
  currentSerializeVersion = targetVersion;
  const hasBarcodes =
    Object.values(report.bands).some(
      (b) => b?.elements.some((el) => el.type === 'barcode' && el.barcodeType !== 'QRCode')
    ) ||
    (report.groups || []).some(
      (g) =>
        g.headerBand?.elements.some((el) => el.type === 'barcode' && el.barcodeType !== 'QRCode') ||
        g.footerBand?.elements.some((el) => el.type === 'barcode' && el.barcodeType !== 'QRCode')
    );

  const rootAttrs: string[] = [
    'xmlns="http://jasperreports.sourceforge.net/jasperreports"',
    'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
  ];

  if (hasBarcodes) {
    rootAttrs.push('xmlns:c="http://jasperreports.sourceforge.net/jasperreports/components"');
    rootAttrs.push(
      'xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd http://jasperreports.sourceforge.net/jasperreports/components http://jasperreports.sourceforge.net/xsd/components.xsd"'
    );
  } else {
    rootAttrs.push(
      'xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"'
    );
  }

  rootAttrs.push(
    `name="${escapeXml(report.name)}"`,
    `language="${report.language || 'groovy'}"`,
    `pageWidth="${report.pageWidth}"`,
    `pageHeight="${report.pageHeight}"`,
    `orientation="${report.orientation || 'Portrait'}"`,
    `columnWidth="${report.columnWidth}"`,
    `leftMargin="${report.leftMargin}"`,
    `rightMargin="${report.rightMargin}"`,
    `topMargin="${report.topMargin}"`,
    `bottomMargin="${report.bottomMargin}"`
  );

  if (currentSerializeVersion !== '4.0.1') {
    const rootUuid = getOrGenerateUuid('report_root', report.uuid);
    rootAttrs.push(`uuid="${rootUuid}"`);
  }

  const lines: string[] = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    `<jasperReport ${rootAttrs.join(' ')}>`,
    '  <property name="ireport.zoom" value="1.0"/>',
    '  <property name="ireport.x" value="0"/>',
    '  <property name="ireport.y" value="0"/>',
  ];

  // Styles (Defined at report level according to jasperreport.xsd sequence)
  if (report.styles && report.styles.length > 0) {
    for (const s of report.styles) {
      lines.push(renderStyle(s, '  '));
    }
  }

  // Parameters
  if (report.parameters && report.parameters.length > 0) {
    for (const p of report.parameters) {
      const pAttrs: string[] = [`name="${escapeXml(p.name)}"`, `class="${p.class}"`];
      if (p.isForPrompting !== undefined) pAttrs.push(`isForPrompting="${p.isForPrompting}"`);

      const defExp = p.defaultValueExpression
        ? `\n    <defaultValueExpression><![CDATA[${p.defaultValueExpression}]]></defaultValueExpression>`
        : '';
      const desc = p.description
        ? `\n    <parameterDescription><![CDATA[${p.description}]]></parameterDescription>`
        : '';

      if (defExp || desc) {
        lines.push(`  <parameter ${pAttrs.join(' ')}>${desc}${defExp}\n  </parameter>`);
      } else {
        lines.push(`  <parameter ${pAttrs.join(' ')}/>`);
      }
    }
  }

  // Query String
  if (report.queryString && report.queryString.trim()) {
    lines.push(`  <queryString>\n    <![CDATA[${report.queryString}]]>\n  </queryString>`);
  }

  // Fields
  if (report.fields && report.fields.length > 0) {
    for (const f of report.fields) {
      lines.push(`  <field name="${escapeXml(f.name)}" class="${f.class}"/>`);
    }
  }

  // Variables
  if (report.variables && report.variables.length > 0) {
    for (const v of report.variables) {
      const vAttrs: string[] = [`name="${escapeXml(v.name)}"`, `class="${v.class}"`];
      if (v.resetType) vAttrs.push(`resetType="${v.resetType}"`);
      if (v.resetGroup) vAttrs.push(`resetGroup="${escapeXml(v.resetGroup)}"`);
      if (v.calculation) vAttrs.push(`calculation="${v.calculation}"`);

      if (v.variableExpression) {
        lines.push(
          `  <variable ${vAttrs.join(' ')}>\n    <variableExpression><![CDATA[${v.variableExpression}]]></variableExpression>\n  </variable>`
        );
      } else {
        lines.push(`  <variable ${vAttrs.join(' ')}/>`);
      }
    }
  }

  // Groups (in exact schema position: between variables and bands!)
  if (report.groups && report.groups.length > 0) {
    for (const g of report.groups) {
      const gAttrs: string[] = [`name="${escapeXml(g.name)}"`];
      if (g.isStartNewPage) gAttrs.push('isStartNewPage="true"');
      if (g.isResetPageNumber) gAttrs.push('isResetPageNumber="true"');
      if (g.isReprintHeaderOnEachPage) gAttrs.push('isReprintHeaderOnEachPage="true"');

      lines.push(`  <group ${gAttrs.join(' ')}>`);
      if (g.expression) {
        lines.push(`    <groupExpression><![CDATA[${g.expression}]]></groupExpression>`);
      }
      if (g.headerBand) {
        lines.push(renderBand(g.headerBand, 'groupHeader', '    '));
      }
      if (g.footerBand) {
        lines.push(renderBand(g.footerBand, 'groupFooter', '    '));
      }
      lines.push('  </group>');
    }
  }

  // Bands (in official schema order!)
  if (report.bands.title) lines.push(renderBand(report.bands.title, 'title', '  '));
  if (report.bands.pageHeader) lines.push(renderBand(report.bands.pageHeader, 'pageHeader', '  '));
  if (report.bands.columnHeader) lines.push(renderBand(report.bands.columnHeader, 'columnHeader', '  '));
  if (report.bands.detail) lines.push(renderBand(report.bands.detail, 'detail', '  '));
  if (report.bands.columnFooter) lines.push(renderBand(report.bands.columnFooter, 'columnFooter', '  '));
  if (report.bands.pageFooter) lines.push(renderBand(report.bands.pageFooter, 'pageFooter', '  '));
  if (report.bands.summary) lines.push(renderBand(report.bands.summary, 'summary', '  '));

  lines.push('</jasperReport>');

  return lines.join('\n');
}
