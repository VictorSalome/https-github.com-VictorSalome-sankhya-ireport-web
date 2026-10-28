import { XMLParser } from 'fast-xml-parser';
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
  ChartType,
  BarcodeType,
  JRXMLParameter,
  JRXMLField,
  JRXMLVariable,
  JRXMLGroup,
  JRXMLStyle,
  JRXMLConditionalStyle,
  BandType,
  JRXMLBox,
} from '../types/jrxml';

function ensureArray<T>(val: any): T[] {
  if (!val) return [];
  return Array.isArray(val) ? val : [val];
}

function parseTextNode(val: any): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string') return val;
  if (val.__cdata !== undefined) return String(val.__cdata);
  if (val['#text'] !== undefined) return String(val['#text']);
  return String(val);
}

function parseReportElement(rawElem: any): any {
  const rep = rawElem.reportElement || {};
  return {
    key: rep['@_key'],
    uuid: rep['@_uuid'] || crypto.randomUUID(),
    style: rep['@_style'],
    x: parseInt(rep['@_x'] || '0', 10),
    y: parseInt(rep['@_y'] || '0', 10),
    width: parseInt(rep['@_width'] || '100', 10),
    height: parseInt(rep['@_height'] || '20', 10),
    forecolor: rep['@_forecolor'],
    backcolor: rep['@_backcolor'],
    mode: rep['@_mode'],
    printWhenExpression: rep.printWhenExpression ? parseTextNode(rep.printWhenExpression) : undefined,
  };
}

function parseTextElement(rawElem: any): any {
  const te = rawElem.textElement;
  if (!te) return undefined;

  const font = te.font
    ? {
        fontName: te.font['@_fontName'],
        size: te.font['@_size'] ? parseInt(te.font['@_size'], 10) : undefined,
        isBold: te.font['@_isBold'] === 'true' || te.font['@_isBold'] === true,
        isItalic: te.font['@_isItalic'] === 'true' || te.font['@_isItalic'] === true,
        isUnderline: te.font['@_isUnderline'] === 'true' || te.font['@_isUnderline'] === true,
        pdfFontName: te.font['@_pdfFontName'],
        pdfEncoding: te.font['@_pdfEncoding'],
      }
    : undefined;

  return {
    textAlignment: te['@_textAlignment'],
    verticalAlignment: te['@_verticalAlignment'],
    font,
  };
}

function parseBox(rawElem: any): JRXMLBox | undefined {
  const boxNode = rawElem.box;
  if (!boxNode) return undefined;

  const penNode =
    boxNode.pen ||
    boxNode['jr:pen'] ||
    boxNode.topPen ||
    boxNode['jr:topPen'] ||
    boxNode.bottomPen ||
    boxNode['jr:bottomPen'] ||
    boxNode.leftPen ||
    boxNode['jr:leftPen'] ||
    boxNode.rightPen ||
    boxNode['jr:rightPen'];

  const rawLineWidth =
    penNode?.['@_lineWidth'] ??
    boxNode['@_lineWidth'] ??
    boxNode['@_penWidth'];

  const rawLineColor =
    penNode?.['@_lineColor'] ??
    boxNode['@_lineColor'] ??
    boxNode['@_penColor'];

  const rawLineStyle =
    penNode?.['@_lineStyle'] ??
    boxNode['@_lineStyle'] ??
    boxNode['@_penStyle'];

  const penWidth =
    rawLineWidth !== undefined && rawLineWidth !== null && rawLineWidth !== ''
      ? parseFloat(rawLineWidth)
      : undefined;

  const penColor =
    rawLineColor !== undefined && rawLineColor !== null && rawLineColor !== ''
      ? String(rawLineColor)
      : undefined;

  let penStyle: JRXMLBox['penStyle'] = undefined;
  if (rawLineStyle) {
    const s = String(rawLineStyle).trim();
    if (s === 'Solid' || s === 'Dashed' || s === 'Dotted' || s === 'Double') {
      penStyle = s;
    }
  }

  if (penWidth === undefined && penColor === undefined && penStyle === undefined) {
    return undefined;
  }

  return {
    penWidth: penWidth !== undefined && !isNaN(penWidth) ? penWidth : undefined,
    penColor,
    penStyle,
  };
}

function parseBandElements(rawBand: any): JRXMLElement[] {
  if (!rawBand) return [];
  const elements: JRXMLElement[] = [];

  // Static Texts
  const staticTexts = ensureArray<any>(rawBand.staticText);
  for (const st of staticTexts) {
    const item: JRXMLStaticText = {
      id: crypto.randomUUID(),
      type: 'staticText',
      reportElement: parseReportElement(st),
      box: parseBox(st),
      textElement: parseTextElement(st),
      text: parseTextNode(st.text),
    };
    elements.push(item);
  }

  // Text Fields
  const textFields = ensureArray<any>(rawBand.textField);
  for (const tf of textFields) {
    const item: JRXMLTextField = {
      id: crypto.randomUUID(),
      type: 'textField',
      reportElement: parseReportElement(tf),
      box: parseBox(tf),
      textElement: parseTextElement(tf),
      pattern: tf['@_pattern'],
      isBlankWhenNull: tf['@_isBlankWhenNull'] === 'true' || tf['@_isBlankWhenNull'] === true,
      expression: parseTextNode(tf.textFieldExpression),
    };
    elements.push(item);
  }

  // Lines
  const lines = ensureArray<any>(rawBand.line);
  for (const ln of lines) {
    const pen = ln.graphicElement?.pen;
    const item: JRXMLLine = {
      id: crypto.randomUUID(),
      type: 'line',
      reportElement: parseReportElement(ln),
      penWidth: pen?.['@_lineWidth'] ? parseFloat(pen['@_lineWidth']) : 1,
      penColor: pen?.['@_lineColor'],
    };
    elements.push(item);
  }

  // Rectangles
  const rectangles = ensureArray<any>(rawBand.rectangle);
  for (const rc of rectangles) {
    const pen = rc.graphicElement?.pen;
    const item: JRXMLRectangle = {
      id: crypto.randomUUID(),
      type: 'rectangle',
      reportElement: parseReportElement(rc),
      radius: rc['@_radius'] ? parseInt(rc['@_radius'], 10) : undefined,
      penWidth: pen?.['@_lineWidth'] ? parseFloat(pen['@_lineWidth']) : 1,
      penColor: pen?.['@_lineColor'],
    };
    elements.push(item);
  }

  // Images
  const images = ensureArray<any>(rawBand.image);
  for (const img of images) {
    const item: JRXMLImage = {
      id: crypto.randomUUID(),
      type: 'image',
      reportElement: parseReportElement(img),
      scaleImage: img['@_scaleImage'],
      expression: parseTextNode(img.imageExpression),
    };
    elements.push(item);
  }

  // Component Elements (Barcodes)
  const compElements = ensureArray<any>(rawBand.componentElement);
  for (const ce of compElements) {
    const barcodeKeys: BarcodeType[] = [
      'Code128',
      'EAN13',
      'Interleaved2Of5',
      'Code39',
      'DataMatrix',
    ];

    let foundType: BarcodeType = 'Code128';
    let bcNode: any = null;

    for (const bType of barcodeKeys) {
      if (ce[`c:${bType}`]) {
        foundType = bType;
        bcNode = ce[`c:${bType}`];
        break;
      }
      if (ce[bType]) {
        foundType = bType;
        bcNode = ce[bType];
        break;
      }
    }

    if (!bcNode) {
      for (const k of Object.keys(ce)) {
        if (
          k.endsWith('Code128') ||
          k.endsWith('EAN13') ||
          k.endsWith('Interleaved2Of5') ||
          k.endsWith('Code39') ||
          k.endsWith('DataMatrix')
        ) {
          foundType = k.replace(/^.*:/, '') as BarcodeType;
          bcNode = ce[k];
          break;
        }
      }
    }

    const codeExp = parseTextNode(bcNode?.['c:codeExpression'] || bcNode?.codeExpression);
    const item: JRXMLBarcode = {
      id: crypto.randomUUID(),
      type: 'barcode',
      barcodeType: foundType,
      reportElement: parseReportElement(ce),
      expression: codeExp || '$F{CHAVENFE}',
      textPosition: bcNode?.['@_textPosition'],
      moduleWidth: bcNode?.['@_moduleWidth'] ? parseFloat(bcNode['@_moduleWidth']) : undefined,
      orientation: bcNode?.['@_orientation'] ? (parseInt(bcNode['@_orientation'], 10) as any) : undefined,
      wideFactor: bcNode?.['@_wideFactor'] ? parseFloat(bcNode['@_wideFactor']) : undefined,
      checksumMode: bcNode?.['@_checksumMode'],
      displayChecksum:
        bcNode?.['@_displayChecksum'] === 'true' || bcNode?.['@_displayChecksum'] === true
          ? true
          : bcNode?.['@_displayChecksum'] === 'false'
          ? false
          : undefined,
    };
    elements.push(item);
  }

  // Subreports
  const subreports = ensureArray<any>(rawBand.subreport);
  for (const sr of subreports) {
    const params: JRXMLSubreportParameter[] = [];
    for (const p of ensureArray<any>(sr.subreportParameter)) {
      params.push({
        name: p['@_name'] || 'PARAM',
        expression: parseTextNode(p.subreportParameterExpression),
      });
    }

    const item: JRXMLSubreport = {
      id: crypto.randomUUID(),
      type: 'subreport',
      reportElement: parseReportElement(sr),
      subreportExpression: parseTextNode(sr.subreportExpression) || '$P{PDIR_MODELO} + "sub.jasper"',
      connectionExpression: parseTextNode(sr.connectionExpression),
      parameters: params,
      isUsingCache: sr['@_isUsingCache'] === 'true' || sr['@_isUsingCache'] === true,
      runToBottom: sr['@_runToBottom'] === 'true' || sr['@_runToBottom'] === true,
    };
    elements.push(item);
  }

  // Charts: pieChart
  const pieCharts = ensureArray<any>(rawBand.pieChart);
  for (const pc of pieCharts) {
    const chartNode = pc.chart || {};
    const datasetNode = pc.pieDataset || {};
    const plotNode = pc.piePlot || {};
    const titleExp = parseTextNode(chartNode.chartTitle?.titleExpression);
    const cleanTitle = titleExp?.replace(/^"|"$/g, '') || undefined;

    elements.push({
      id: crypto.randomUUID(),
      type: 'chart',
      chartType: 'pieChart',
      reportElement: parseReportElement(chartNode),
      title: cleanTitle,
      isShowLegend: chartNode['@_isShowLegend'] !== 'false',
      isShowLabels: plotNode['@_isShowLabels'] !== 'false',
      keyExpression: parseTextNode(datasetNode.keyExpression) || '$F{APELIDO}',
      valueExpression: parseTextNode(datasetNode.valueExpression) || '$F{VLRTOT}',
    } as JRXMLChart);
  }

  // Charts: barChart
  const barCharts = ensureArray<any>(rawBand.barChart);
  for (const bc of barCharts) {
    const chartNode = bc.chart || {};
    const datasetNode = bc.categoryDataset || {};
    const seriesList = ensureArray<any>(datasetNode.categorySeries);
    const seriesNode = seriesList[0] || {};
    const plotNode = bc.barPlot || {};
    const titleExp = parseTextNode(chartNode.chartTitle?.titleExpression);
    const cleanTitle = titleExp?.replace(/^"|"$/g, '') || undefined;

    elements.push({
      id: crypto.randomUUID(),
      type: 'chart',
      chartType: 'barChart',
      reportElement: parseReportElement(chartNode),
      title: cleanTitle,
      isShowLegend: chartNode['@_isShowLegend'] !== 'false',
      isShowLabels: plotNode['@_isShowLabels'] !== 'false',
      seriesExpression: parseTextNode(seriesNode.seriesExpression) || '"Vendas"',
      categoryExpression: parseTextNode(seriesNode.categoryExpression) || '$F{MES}',
      valueExpression: parseTextNode(seriesNode.valueExpression) || '$F{VLRTOT}',
    } as JRXMLChart);
  }

  // Charts: lineChart
  const lineCharts = ensureArray<any>(rawBand.lineChart);
  for (const lc of lineCharts) {
    const chartNode = lc.chart || {};
    const datasetNode = lc.categoryDataset || {};
    const seriesList = ensureArray<any>(datasetNode.categorySeries);
    const seriesNode = seriesList[0] || {};
    const plotNode = lc.linePlot || {};
    const titleExp = parseTextNode(chartNode.chartTitle?.titleExpression);
    const cleanTitle = titleExp?.replace(/^"|"$/g, '') || undefined;

    elements.push({
      id: crypto.randomUUID(),
      type: 'chart',
      chartType: 'lineChart',
      reportElement: parseReportElement(chartNode),
      title: cleanTitle,
      isShowLegend: chartNode['@_isShowLegend'] !== 'false',
      isShowLabels: plotNode['@_isShowLabels'] !== 'false',
      seriesExpression: parseTextNode(seriesNode.seriesExpression) || '"Evolução"',
      categoryExpression: parseTextNode(seriesNode.categoryExpression) || '$F{DTNEG}',
      valueExpression: parseTextNode(seriesNode.valueExpression) || '$F{VLRTOT}',
    } as JRXMLChart);
  }

  // Crosstabs
  const crosstabs = ensureArray<any>(rawBand.crosstab);
  for (const ct of crosstabs) {
    const rowGNode = ct.rowGroup || {};
    const colGNode = ct.columnGroup || {};
    const measureNode = ct.measure || {};
    const cellNode = ensureArray<any>(ct.crosstabCell)[0] || {};

    const rowBucketExp = parseTextNode(rowGNode.bucket?.bucketExpression) || '$F{APELIDO}';
    const colBucketExp = parseTextNode(colGNode.bucket?.bucketExpression) || '$F{MES}';
    const measExp = parseTextNode(measureNode.measureExpression) || '$F{VLRTOT}';

    elements.push({
      id: crypto.randomUUID(),
      type: 'crosstab',
      reportElement: parseReportElement(ct),
      rowGroup: {
        name: rowGNode['@_name'] || 'Linha',
        width: parseInt(rowGNode['@_width'] || '120', 10),
        totalPosition: rowGNode['@_totalPosition'] || 'End',
        bucketExpression: rowBucketExp,
        totalText: parseTextNode(rowGNode.crosstabTotalRowHeader?.cellContents?.staticText?.text),
      },
      columnGroup: {
        name: colGNode['@_name'] || 'Coluna',
        height: parseInt(colGNode['@_height'] || '20', 10),
        totalPosition: colGNode['@_totalPosition'] || 'End',
        bucketExpression: colBucketExp,
        totalText: parseTextNode(colGNode.crosstabTotalColumnHeader?.cellContents?.staticText?.text),
      },
      measure: {
        name: measureNode['@_name'] || 'Total',
        calculation: measureNode['@_calculation'] || 'Sum',
        expression: measExp,
        pattern: cellNode.cellContents?.textField?.['@_pattern'] || '#,##0.00',
      },
      cellWidth: parseInt(cellNode['@_width'] || '60', 10),
      cellHeight: parseInt(cellNode['@_height'] || '20', 10),
    } as JRXMLCrosstab);
  }

  // Sort by Y coordinate so layering is predictable
  return elements.sort((a, b) => a.reportElement.y - b.reportElement.y);
}

function parseBand(rawSection: any, type: BandType, title: string): JRXMLBand | undefined {
  if (!rawSection) return undefined;
  if (!rawSection.band) return undefined;

  const rawBands = ensureArray<any>(rawSection.band);
  if (rawBands.length === 0) return undefined;

  let totalHeight = 0;
  const allElements: JRXMLElement[] = [];
  let splitType: 'Stretch' | 'Prevent' | 'Immediate' | undefined = undefined;

  for (const b of rawBands) {
    if (!b) continue;
    const h = parseInt(b['@_height'] || '0', 10);
    totalHeight += isNaN(h) ? 0 : h;

    if (!splitType && b['@_splitType']) {
      splitType = b['@_splitType'];
    }

    const elems = parseBandElements(b);
    allElements.push(...elems);
  }

  // Sort by Y coordinate so layering is predictable
  allElements.sort((a, b) => a.reportElement.y - b.reportElement.y);

  return {
    type,
    title,
    height: totalHeight,
    splitType: splitType || 'Stretch',
    elements: allElements,
  };
}

/**
 * Parses raw JRXML XML string into a structured JRXMLReport object.
 */
export function parseJRXML(xmlString: string): JRXMLReport {
  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@_',
    textNodeName: '#text',
    cdataPropName: '__cdata',
    allowBooleanAttributes: true,
  });

  const parsed = parser.parse(xmlString);
  const root = parsed.jasperReport;

  if (!root) {
    throw new Error('Formato JRXML inválido: tag raiz <jasperReport> não encontrada.');
  }

  // Styles
  const styles: JRXMLStyle[] = [];
  for (const s of ensureArray<any>(root.style)) {
    const sName = s['@_name'];
    if (!sName) continue;

    const conditionalStyles: JRXMLConditionalStyle[] = [];
    for (const cs of ensureArray<any>(s.conditionalStyle)) {
      const condExp = parseTextNode(cs.conditionExpression);
      const innerStyle = cs.style || {};
      conditionalStyles.push({
        conditionExpression: condExp,
        mode: innerStyle['@_mode'],
        forecolor: innerStyle['@_forecolor'],
        backcolor: innerStyle['@_backcolor'],
      });
    }

    styles.push({
      name: sName,
      isDefault: s['@_isDefault'] === 'true' || s['@_isDefault'] === true,
      style: s['@_style'],
      mode: s['@_mode'],
      forecolor: s['@_forecolor'],
      backcolor: s['@_backcolor'],
      fontSize: s['@_fontSize'] ? parseInt(s['@_fontSize'], 10) : undefined,
      isBold: s['@_isBold'] === 'true' || s['@_isBold'] === true,
      isItalic: s['@_isItalic'] === 'true' || s['@_isItalic'] === true,
      conditionalStyles: conditionalStyles.length > 0 ? conditionalStyles : undefined,
    });
  }

  // Parameters
  const parameters: JRXMLParameter[] = [];
  for (const p of ensureArray<any>(root.parameter)) {
    parameters.push({
      name: p['@_name'],
      class: p['@_class'] || 'java.lang.String',
      isForPrompting: p['@_isForPrompting'] !== 'false',
      defaultValueExpression: parseTextNode(p.defaultValueExpression),
      description: parseTextNode(p.parameterDescription),
    });
  }

  // Query String
  const queryString = parseTextNode(root.queryString);

  // Fields
  const fields: JRXMLField[] = [];
  for (const f of ensureArray<any>(root.field)) {
    fields.push({
      name: f['@_name'],
      class: f['@_class'] || 'java.lang.String',
      description: parseTextNode(f.fieldDescription),
    });
  }

  // Variables
  const variables: JRXMLVariable[] = [];
  for (const v of ensureArray<any>(root.variable)) {
    variables.push({
      name: v['@_name'],
      class: v['@_class'] || 'java.lang.String',
      resetType: v['@_resetType'],
      resetGroup: v['@_resetGroup'],
      calculation: v['@_calculation'],
      variableExpression: parseTextNode(v.variableExpression),
    });
  }

  // Groups
  const groups: JRXMLGroup[] = [];
  for (const g of ensureArray<any>(root.group)) {
    const gName = g['@_name'] || 'Grupo';
    groups.push({
      id: crypto.randomUUID(),
      name: gName,
      expression: parseTextNode(g.groupExpression),
      isStartNewPage: g['@_isStartNewPage'] === 'true' || g['@_isStartNewPage'] === true,
      isResetPageNumber: g['@_isResetPageNumber'] === 'true' || g['@_isResetPageNumber'] === true,
      isReprintHeaderOnEachPage:
        g['@_isReprintHeaderOnEachPage'] === 'true' || g['@_isReprintHeaderOnEachPage'] === true,
      headerBand: parseBand(g.groupHeader, 'groupHeader' as any, `Cabeçalho: ${gName}`),
      footerBand: parseBand(g.groupFooter, 'groupFooter' as any, `Subtotal: ${gName}`),
    });
  }

  // Detail band is required
  const detailBand = parseBand(root.detail, 'detail', 'Detail') || {
    type: 'detail',
    title: 'Detail',
    height: 30,
    splitType: 'Stretch',
    elements: [],
  };

  const report: JRXMLReport = {
    name: root['@_name'] || 'relatorio_sankhya',
    language: root['@_language'] || 'groovy',
    pageWidth: parseInt(root['@_pageWidth'] || '595', 10),
    pageHeight: parseInt(root['@_pageHeight'] || '842', 10),
    orientation: root['@_orientation'] || 'Portrait',
    columnWidth: parseInt(root['@_columnWidth'] || '555', 10),
    leftMargin: parseInt(root['@_leftMargin'] || '20', 10),
    rightMargin: parseInt(root['@_rightMargin'] || '20', 10),
    topMargin: parseInt(root['@_topMargin'] || '20', 10),
    bottomMargin: parseInt(root['@_bottomMargin'] || '20', 10),
    uuid: root['@_uuid'] || crypto.randomUUID(),
    queryString,
    styles,
    parameters,
    fields,
    variables,
    groups,
    bands: {
      title: parseBand(root.title, 'title', 'Title'),
      pageHeader: parseBand(root.pageHeader, 'pageHeader', 'Page Header'),
      columnHeader: parseBand(root.columnHeader, 'columnHeader', 'Column Header'),
      detail: detailBand,
      columnFooter: parseBand(root.columnFooter, 'columnFooter', 'Column Footer'),
      pageFooter: parseBand(root.pageFooter, 'pageFooter', 'Page Footer'),
      summary: parseBand(root.summary, 'summary', 'Summary'),
    },
  };

  return report;
}
