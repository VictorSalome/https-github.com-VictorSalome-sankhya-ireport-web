/**
 * Sankhya iReport Web - JRXML Type Definitions
 * Derived from JasperReports 5.6.0 schema (jasperreport.xsd) and Sankhya ERP standards.
 */

export type JasperReportsVersion = '4.0.1' | '5.6.0' | '6.0.0';

export type BandType =
  | 'title'
  | 'pageHeader'
  | 'columnHeader'
  | 'detail'
  | 'columnFooter'
  | 'pageFooter'
  | 'summary';

export type ElementType =
  | 'staticText'
  | 'textField'
  | 'line'
  | 'rectangle'
  | 'image'
  | 'barcode'
  | 'subreport'
  | 'chart'
  | 'crosstab';

export type TextHAlign = 'Left' | 'Center' | 'Right' | 'Justified';
export type TextVAlign = 'Top' | 'Middle' | 'Bottom';

export interface JRXMLReportElement {
  key?: string;
  uuid?: string;
  style?: string; // Reference to JRXMLStyle name
  x: number;
  y: number;
  width: number;
  height: number;
  forecolor?: string;
  backcolor?: string;
  mode?: 'Opaque' | 'Transparent';
  printWhenExpression?: string; // Java/Groovy boolean expression e.g. "$F{VLRNOTA} != null"
}

export interface JRXMLFont {
  fontName?: string;
  size?: number;
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  pdfFontName?: string;
  pdfEncoding?: string;
  isPdfEmbedded?: boolean;
}

export interface JRXMLTextElement {
  textAlignment?: TextHAlign;
  verticalAlignment?: TextVAlign;
  font?: JRXMLFont;
}

export interface JRXMLBox {
  penWidth?: number;
  penColor?: string;
  penStyle?: 'Solid' | 'Dashed' | 'Dotted' | 'Double';
}

export interface JRXMLStaticText {
  id: string;
  type: 'staticText';
  reportElement: JRXMLReportElement;
  textElement?: JRXMLTextElement;
  box?: JRXMLBox;
  text: string;
}

export interface JRXMLTextField {
  id: string;
  type: 'textField';
  reportElement: JRXMLReportElement;
  textElement?: JRXMLTextElement;
  box?: JRXMLBox;
  pattern?: string;
  isBlankWhenNull?: boolean;
  expression: string; // e.g. "$F{NOMEPARC}", "$P{PK_NUNOTA}"
}

export interface JRXMLLine {
  id: string;
  type: 'line';
  reportElement: JRXMLReportElement;
  penWidth?: number;
  penColor?: string;
  direction?: 'TopDown' | 'BottomUp';
}

export interface JRXMLRectangle {
  id: string;
  type: 'rectangle';
  reportElement: JRXMLReportElement;
  radius?: number;
  penWidth?: number;
  penColor?: string;
}

export interface JRXMLImage {
  id: string;
  type: 'image';
  reportElement: JRXMLReportElement;
  scaleImage?: 'Clip' | 'FillFrame' | 'RetainShape' | 'RealHeight' | 'RealSize';
  expression: string; // e.g. '$P{PDIR_MODELO} + "logo.jpg"'
}

export type BarcodeType =
  | 'Code128'
  | 'EAN13'
  | 'Interleaved2Of5'
  | 'Code39'
  | 'DataMatrix'
  | 'QRCode';

export interface JRXMLBarcode {
  id: string;
  type: 'barcode';
  barcodeType: BarcodeType;
  reportElement: JRXMLReportElement;
  expression: string; // e.g. "$F{CHAVENFE}", "$F{CODBARRA}", "$F{LINHADIG}"
  textPosition?: 'none' | 'bottom' | 'top';
  moduleWidth?: number;
  orientation?: 0 | 90 | 180 | 270;
  wideFactor?: number;
  checksumMode?: 'auto' | 'ignore' | 'add' | 'check';
  displayChecksum?: boolean;
}

export interface JRXMLSubreportParameter {
  name: string;
  expression: string;
}

export interface JRXMLSubreport {
  id: string;
  type: 'subreport';
  reportElement: JRXMLReportElement;
  subreportExpression: string; // e.g. '$P{PDIR_MODELO} + "sub_itens.jasper"'
  connectionExpression?: string; // e.g. '$P{REPORT_CONNECTION}'
  parameters?: JRXMLSubreportParameter[];
  isUsingCache?: boolean;
  runToBottom?: boolean;
}

export type ChartType = 'pieChart' | 'barChart' | 'lineChart';

export interface JRXMLChart {
  id: string;
  type: 'chart';
  chartType: ChartType;
  reportElement: JRXMLReportElement;
  title?: string;
  subtitle?: string;
  isShowLegend?: boolean;
  isShowLabels?: boolean;
  // For pieChart
  keyExpression?: string; // e.g. "$F{APELIDO}"
  // For barChart / lineChart
  categoryExpression?: string; // e.g. "$F{MES}"
  seriesExpression?: string; // e.g. '"Vendas"'
  // Common
  valueExpression: string; // e.g. "$F{VLRTOT}"
  labelExpression?: string;
  // Aesthetic options
  theme?: string;
}

export interface JRXMLCrosstabRowGroup {
  name: string;
  width: number;
  totalPosition?: 'Start' | 'End' | 'None';
  bucketExpression: string; // e.g. "$F{APELIDO}"
  headerText?: string;
  totalText?: string;
}

export interface JRXMLCrosstabColumnGroup {
  name: string;
  height: number;
  totalPosition?: 'Start' | 'End' | 'None';
  bucketExpression: string; // e.g. "$F{MES}"
  headerText?: string;
  totalText?: string;
}

export interface JRXMLCrosstabMeasure {
  name: string;
  calculation: 'Sum' | 'Count' | 'Average' | 'Lowest' | 'Highest' | 'Nothing';
  expression: string; // e.g. "$F{VLRTOT}"
  pattern?: string; // e.g. "#,##0.00"
}

export interface JRXMLCrosstab {
  id: string;
  type: 'crosstab';
  reportElement: JRXMLReportElement;
  rowGroup: JRXMLCrosstabRowGroup;
  columnGroup: JRXMLCrosstabColumnGroup;
  measure: JRXMLCrosstabMeasure;
  cellWidth: number;
  cellHeight: number;
}

export type JRXMLElement =
  | JRXMLStaticText
  | JRXMLTextField
  | JRXMLLine
  | JRXMLRectangle
  | JRXMLImage
  | JRXMLBarcode
  | JRXMLSubreport
  | JRXMLChart
  | JRXMLCrosstab;

export interface JRXMLBand {
  type: BandType;
  title: string;
  height: number;
  splitType?: 'Stretch' | 'Prevent' | 'Immediate';
  elements: JRXMLElement[];
}

export interface JRXMLParameter {
  name: string;
  class: string;
  isForPrompting?: boolean;
  defaultValueExpression?: string;
  description?: string;
}

export interface JRXMLField {
  name: string;
  class: string;
  description?: string;
}

export interface JRXMLVariable {
  name: string;
  class: string;
  calculation?: 'Nothing' | 'Count' | 'Sum' | 'Average' | 'Lowest' | 'Highest' | 'StandardDeviation' | 'Variance' | 'DistinctCount';
  resetType?: 'Report' | 'Page' | 'Column' | 'Group' | 'None';
  resetGroup?: string;
  variableExpression?: string;
  initialValueExpression?: string;
}

export interface JRXMLConditionalStyle {
  conditionExpression: string; // e.g. "new Boolean($V{REPORT_COUNT}.intValue() % 2 == 0)"
  mode?: 'Opaque' | 'Transparent';
  forecolor?: string;
  backcolor?: string;
}

export interface JRXMLStyle {
  name: string;
  isDefault?: boolean;
  style?: string; // parent style
  mode?: 'Opaque' | 'Transparent';
  forecolor?: string;
  backcolor?: string;
  fontSize?: number;
  isBold?: boolean;
  isItalic?: boolean;
  conditionalStyles?: JRXMLConditionalStyle[];
}

export interface JRXMLGroup {
  id: string;
  name: string;
  expression: string; // e.g. "$F{CODPARC}"
  label?: string; // e.g. "Cliente (CODPARC)"
  isStartNewPage?: boolean;
  isResetPageNumber?: boolean;
  isReprintHeaderOnEachPage?: boolean;
  headerBand?: JRXMLBand;
  footerBand?: JRXMLBand;
}

export interface JRXMLReport {
  name: string;
  targetVersion?: JasperReportsVersion;
  language?: 'groovy' | 'java';
  pageWidth: number;
  pageHeight: number;
  orientation?: 'Portrait' | 'Landscape';
  columnWidth: number;
  leftMargin: number;
  rightMargin: number;
  topMargin: number;
  bottomMargin: number;
  uuid?: string;
  queryString?: string;
  styles?: JRXMLStyle[];
  parameters: JRXMLParameter[];
  fields: JRXMLField[];
  variables: JRXMLVariable[];
  groups?: JRXMLGroup[];
  bands: {
    title?: JRXMLBand;
    pageHeader?: JRXMLBand;
    columnHeader?: JRXMLBand;
    detail: JRXMLBand;
    columnFooter?: JRXMLBand;
    pageFooter?: JRXMLBand;
    summary?: JRXMLBand;
  };
}

export interface SankhyaPresetVariable {
  name: string;
  expression: string;
  label: string;
  category: 'parameter' | 'field' | 'system';
  description: string;
}
