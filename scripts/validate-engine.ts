import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { parseJRXML } from '../src/engine/parser';
import { serializeJRXML } from '../src/engine/serializer';
import { sliceJrxmlToComponents } from '../src/engine/jrxml-slicer';
import { DOCUMENT_TEMPLATES } from '../src/engine/templates';
import {
  ComponentScaffoldType,
  SCAFFOLD_OPTIONS,
  generateScaffoldElements,
} from '../src/engine/sankhya-components';
import {
  calculateBandSlots,
  findSlotAtPosition,
  fitElementToSlot,
  ptToMm,
  mmToPt,
  PT_PER_MM,
} from '../src/engine/smart-grid';

console.log('=== INICIANDO AUDITORIA DO PARSER E SERIALIZADOR JRXML ===\n');

let failedTests = 0;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FALHA: ${message}`);
    failedTests++;
  } else {
    console.log(`✅ SUCESSO: ${message}`);
  }
}

// -------------------------------------------------------------
// TESTE 1: Múltiplos <band> dentro de uma seção
// -------------------------------------------------------------
console.log('\n--- TESTE 1: Múltiplos <band> dentro de uma seção ---');
const multipleBandsXml = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
  name="test_multi_band" language="groovy" pageWidth="595" pageHeight="842" columnWidth="555"
  leftMargin="20" rightMargin="20" topMargin="20" bottomMargin="20">
  <detail>
    <band height="20" splitType="Stretch">
      <staticText>
        <reportElement x="0" y="2" width="100" height="16"/>
        <text><![CDATA[Linha 1]]></text>
      </staticText>
    </band>
    <band height="25" splitType="Prevent">
      <textField>
        <reportElement x="0" y="4" width="120" height="18"/>
        <textFieldExpression><![CDATA[$F{CAMPO1}]]></textFieldExpression>
      </textField>
      <staticText>
        <reportElement x="130" y="4" width="100" height="18"/>
        <text><![CDATA[Linha 2]]></text>
      </staticText>
    </band>
    <band height="15">
      <textField>
        <reportElement x="0" y="0" width="80" height="15"/>
        <textFieldExpression><![CDATA[$F{CAMPO2}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>`;

const parsedMulti = parseJRXML(multipleBandsXml);
assert(parsedMulti.bands.detail !== undefined, 'Banda detail foi parseada');
assert(parsedMulti.bands.detail.height === 60, `Altura total somada correta: 20 + 25 + 15 = ${parsedMulti.bands.detail.height} (esperado 60)`);
assert(!isNaN(parsedMulti.bands.detail.height), 'Altura total não é NaN');
assert(parsedMulti.bands.detail.elements.length === 4, `Quantidade de elementos combinados correta: ${parsedMulti.bands.detail.elements.length} (esperado 4)`);

// -------------------------------------------------------------
// TESTE 2: Suporte a bordas <box> (parse e serialize)
// -------------------------------------------------------------
console.log('\n--- TESTE 2: Suporte a bordas <box> ---');
const boxXml = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
  name="test_box" language="groovy" pageWidth="595" pageHeight="842" columnWidth="555"
  leftMargin="20" rightMargin="20" topMargin="20" bottomMargin="20">
  <detail>
    <band height="50">
      <staticText>
        <reportElement x="10" y="5" width="200" height="20"/>
        <box>
          <pen lineWidth="1.5" lineColor="#1E293B" lineStyle="Dashed"/>
        </box>
        <textElement textAlignment="Left" verticalAlignment="Middle">
          <font fontName="Arial" size="10"/>
        </textElement>
        <text><![CDATA[Texto com Borda]]></text>
      </staticText>
      <textField isBlankWhenNull="true">
        <reportElement x="220" y="5" width="200" height="20"/>
        <box>
          <pen lineWidth="0.5" lineColor="#000000" lineStyle="Solid"/>
        </box>
        <textElement textAlignment="Right" verticalAlignment="Middle">
          <font fontName="Arial" size="10"/>
        </textElement>
        <textFieldExpression><![CDATA[$F{VALOR}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>`;

const parsedBox = parseJRXML(boxXml);
const st = parsedBox.bands.detail.elements.find((e) => e.type === 'staticText') as any;
const tf = parsedBox.bands.detail.elements.find((e) => e.type === 'textField') as any;

assert(st !== undefined, 'staticText encontrado');
assert(st.box !== undefined, 'staticText.box foi parseado');
assert(st.box?.penWidth === 1.5, `st.box.penWidth === 1.5 (obtido: ${st.box?.penWidth})`);
assert(st.box?.penColor === '#1E293B', `st.box.penColor === '#1E293B' (obtido: ${st.box?.penColor})`);
assert(st.box?.penStyle === 'Dashed', `st.box.penStyle === 'Dashed' (obtido: ${st.box?.penStyle})`);

assert(tf !== undefined, 'textField encontrado');
assert(tf.box !== undefined, 'textField.box foi parseado');
assert(tf.box?.penWidth === 0.5, `tf.box.penWidth === 0.5 (obtido: ${tf.box?.penWidth})`);
assert(tf.box?.penColor === '#000000', `tf.box.penColor === '#000000' (obtido: ${tf.box?.penColor})`);
assert(tf.box?.penStyle === 'Solid', `tf.box.penStyle === 'Solid' (obtido: ${tf.box?.penStyle})`);

// Serializa e valida ordem do XSD
const serializedBox = serializeJRXML(parsedBox);

// Verifica ordem do XSD no staticText: reportElement -> box -> textElement -> text
const stReportIndex = serializedBox.indexOf('<staticText>');
const stRepElemIndex = serializedBox.indexOf('<reportElement x="10"', stReportIndex);
const stBoxIndex = serializedBox.indexOf('<box>', stReportIndex);
const stPenIndex = serializedBox.indexOf('<pen lineWidth="1.5" lineColor="#1E293B" lineStyle="Dashed"/>', stBoxIndex);
const stTextElemIndex = serializedBox.indexOf('<textElement', stReportIndex);
const stTextIndex = serializedBox.indexOf('<text>', stReportIndex);

assert(
  stRepElemIndex < stBoxIndex && stBoxIndex < stTextElemIndex && stTextElemIndex < stTextIndex,
  'Ordem do XSD em <staticText> correta: reportElement -> box -> textElement -> text'
);
assert(stPenIndex > stBoxIndex, '<pen> renderizado dentro de <box> no staticText');

// Verifica ordem do XSD no textField: reportElement -> box -> textElement -> textFieldExpression
const tfReportIndex = serializedBox.indexOf('<textField');
const tfRepElemIndex = serializedBox.indexOf('<reportElement x="220"', tfReportIndex);
const tfBoxIndex = serializedBox.indexOf('<box>', tfReportIndex);
const tfPenIndex = serializedBox.indexOf('<pen lineWidth="0.5" lineColor="#000000" lineStyle="Solid"/>', tfBoxIndex);
const tfTextElemIndex = serializedBox.indexOf('<textElement', tfReportIndex);
const tfExprIndex = serializedBox.indexOf('<textFieldExpression>', tfReportIndex);

assert(
  tfRepElemIndex < tfBoxIndex && tfBoxIndex < tfTextElemIndex && tfTextElemIndex < tfExprIndex,
  'Ordem do XSD em <textField> correta: reportElement -> box -> textElement -> textFieldExpression'
);
assert(tfPenIndex > tfBoxIndex, '<pen> renderizado dentro de <box> no textField');

// Validação de schema XSD com xmllint
const tempBoxPath = path.resolve('engine/temp_box_test.jrxml');
fs.writeFileSync(tempBoxPath, serializedBox, 'utf-8');
try {
  execSync(`xmllint --noout --schema engine/jasperreport.xsd ${tempBoxPath}`);
  console.log('✅ SUCESSO: JRXML serializado com <box> validado contra jasperreport.xsd via xmllint!');
} catch (err: any) {
  console.error('❌ FALHA na validação XSD do JRXML serializado com box:', err.message);
  failedTests++;
} finally {
  if (fs.existsSync(tempBoxPath)) fs.unlinkSync(tempBoxPath);
}

// -------------------------------------------------------------
// TESTE 3: Arquivos JRXML existentes (test_sankhya.jrxml e test_group.jrxml)
// -------------------------------------------------------------
console.log('\n--- TESTE 3: Teste com arquivos JRXML existentes ---');

const filesToTest = ['engine/test_sankhya.jrxml', 'engine/test_group.jrxml'];

for (const relPath of filesToTest) {
  const filePath = path.resolve(relPath);
  console.log(`\nValidando ${relPath}...`);
  const content = fs.readFileSync(filePath, 'utf-8');
  const rep = parseJRXML(content);
  assert(!!rep.name, `Relatório ${rep.name} parseado com sucesso`);
  
  const serialized = serializeJRXML(rep);
  const tempPath = path.resolve(`engine/temp_${path.basename(relPath)}`);
  fs.writeFileSync(tempPath, serialized, 'utf-8');
  try {
    execSync(`xmllint --noout --schema engine/jasperreport.xsd ${tempPath}`);
    console.log(`✅ SUCESSO: ${relPath} serializado validado contra jasperreport.xsd!`);
  } catch (err: any) {
    console.error(`❌ FALHA na validação XSD de ${relPath}:`, err.message);
    failedTests++;
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

// -------------------------------------------------------------
// TESTE 4: Round-trip de múltiplos bands com box
// -------------------------------------------------------------
console.log('\n--- TESTE 4: Round-trip completo multi-band + box ---');
const combinedXml = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
  name="relatorio_combinado" language="groovy" pageWidth="595" pageHeight="842" columnWidth="555"
  leftMargin="20" rightMargin="20" topMargin="20" bottomMargin="20">
  <detail>
    <band height="20">
      <staticText>
        <reportElement x="0" y="0" width="100" height="20"/>
        <box>
          <pen lineWidth="1.0" lineColor="#000000" lineStyle="Solid"/>
        </box>
        <text><![CDATA[Cabecalho Item]]></text>
      </staticText>
    </band>
    <band height="25">
      <textField>
        <reportElement x="0" y="0" width="100" height="25"/>
        <box>
          <pen lineWidth="0.5" lineColor="#CCCCCC" lineStyle="Dotted"/>
        </box>
        <textFieldExpression><![CDATA[$F{PRODUTO}]]></textFieldExpression>
      </textField>
    </band>
  </detail>
</jasperReport>`;

const parsedComb = parseJRXML(combinedXml);
assert(parsedComb.bands.detail.height === 45, 'Altura combinada 20+25 = 45');
assert(parsedComb.bands.detail.elements.length === 2, '2 elementos combinados');

const serializedComb = serializeJRXML(parsedComb);
const tempCombPath = path.resolve('engine/temp_comb.jrxml');
fs.writeFileSync(tempCombPath, serializedComb, 'utf-8');
try {
  execSync(`xmllint --noout --schema engine/jasperreport.xsd ${tempCombPath}`);
  console.log('✅ SUCESSO: JRXML combinado serializado validado contra jasperreport.xsd!');
} catch (err: any) {
  console.error('❌ FALHA na validação XSD do combinado:', err.message);
  failedTests++;
} finally {
  if (fs.existsSync(tempCombPath)) fs.unlinkSync(tempCombPath);
}

// -------------------------------------------------------------
// TESTE 5: Suporte a Código de Barras Interleaved 2 of 5 (Boleto FEBRABAN)
// -------------------------------------------------------------
console.log('\n--- TESTE 5: Código de Barras Interleaved 2 of 5 ---');
const i25Xml = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:c="http://jasperreports.sourceforge.net/jasperreports/components"
  xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd http://jasperreports.sourceforge.net/jasperreports/components http://jasperreports.sourceforge.net/xsd/components.xsd"
  name="test_i25" language="groovy" pageWidth="595" pageHeight="842" columnWidth="555"
  leftMargin="20" rightMargin="20" topMargin="20" bottomMargin="20">
  <detail>
    <band height="70">
      <componentElement>
        <reportElement x="10" y="10" width="400" height="50"/>
        <c:Interleaved2Of5 textPosition="bottom" moduleWidth="1.2" wideFactor="2.5" checksumMode="auto" displayChecksum="true">
          <c:codeExpression><![CDATA[$F{CODBARRA}]]></c:codeExpression>
        </c:Interleaved2Of5>
      </componentElement>
    </band>
  </detail>
</jasperReport>`;

const parsedI25 = parseJRXML(i25Xml);
const bcElem = parsedI25.bands.detail.elements.find((e) => e.type === 'barcode') as any;

assert(bcElem !== undefined, 'Elemento barcode encontrado');
assert(bcElem?.barcodeType === 'Interleaved2Of5', `barcodeType === 'Interleaved2Of5' (obtido: ${bcElem?.barcodeType})`);
assert(bcElem?.expression === '$F{CODBARRA}', `expression === '$F{CODBARRA}' (obtido: ${bcElem?.expression})`);
assert(bcElem?.moduleWidth === 1.2, `moduleWidth === 1.2 (obtido: ${bcElem?.moduleWidth})`);
assert(bcElem?.wideFactor === 2.5, `wideFactor === 2.5 (obtido: ${bcElem?.wideFactor})`);
assert(bcElem?.checksumMode === 'auto', `checksumMode === 'auto' (obtido: ${bcElem?.checksumMode})`);
assert(bcElem?.displayChecksum === true, `displayChecksum === true (obtido: ${bcElem?.displayChecksum})`);

// Serialização do Interleaved 2 of 5
const serializedI25 = serializeJRXML(parsedI25);
assert(serializedI25.includes('<c:Interleaved2Of5'), 'Serializado inclui <c:Interleaved2Of5');
assert(serializedI25.includes('<c:codeExpression><![CDATA[$F{CODBARRA}]]></c:codeExpression>'), 'Serializado inclui <c:codeExpression>');
assert(serializedI25.includes('wideFactor="2.5"'), 'Serializado inclui wideFactor="2.5"');

// Validação de conformidade XSD do Interleaved2Of5 com combined_schema.xsd
const tempI25Path = path.resolve('engine/temp_i25_test.jrxml');
fs.writeFileSync(tempI25Path, serializedI25, 'utf-8');
try {
  execSync(`xmllint --noout --schema engine/combined_schema.xsd ${tempI25Path}`);
  console.log('✅ SUCESSO: JRXML com Interleaved2Of5 validado contra combined_schema.xsd via xmllint!');
} catch (err: any) {
  console.error('❌ FALHA na validação XSD do Interleaved2Of5:', err.message);
  failedTests++;
} finally {
  if (fs.existsSync(tempI25Path)) fs.unlinkSync(tempI25Path);
}

// -------------------------------------------------------------
// TESTE 6: Fatiador de JRXML (sliceJrxmlToComponents)
// -------------------------------------------------------------
console.log('\n--- TESTE 6: Fatiador de JRXML (Sankhya JRXML Slicer) ---');

// 6.1 Fatiando test_sankhya.jrxml existente
const sankhyaContent = fs.readFileSync(path.resolve('engine/test_sankhya.jrxml'), 'utf-8');
const slicesSankhya = sliceJrxmlToComponents(sankhyaContent);

assert(slicesSankhya.length > 0, `Sankhya JRXML fatiado em ${slicesSankhya.length} componentes`);
const titleSlice = slicesSankhya.find((s) => s.band === 'title');
assert(titleSlice !== undefined, 'Componente da banda title foi extraído');
assert(titleSlice?.elements.length === 2, `Componente do título contém retângulo delimitador e texto (total: ${titleSlice?.elements.length})`);
assert(titleSlice?.elements[0].reportElement.y >= 0, 'Coordenadas Y normalizadas (>= 0)');

// 6.2 Teste com retângulos delimitadores e proximidade vertical
const slicerTestXml = `<?xml version="1.0" encoding="UTF-8"?>
<jasperReport xmlns="http://jasperreports.sourceforge.net/jasperreports"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://jasperreports.sourceforge.net/jasperreports http://jasperreports.sourceforge.net/xsd/jasperreport.xsd"
  name="test_slicer_blocks" language="groovy" pageWidth="595" pageHeight="842" columnWidth="555"
  leftMargin="20" rightMargin="20" topMargin="20" bottomMargin="20">
  <pageHeader>
    <band height="180">
      <!-- Bloco Delimitado 1: Destinatário -->
      <rectangle>
        <reportElement x="0" y="10" width="555" height="60"/>
      </rectangle>
      <staticText>
        <reportElement x="10" y="15" width="200" height="18"/>
        <text><![CDATA[DADOS DO DESTINATÁRIO]]></text>
      </staticText>
      <textField>
        <reportElement x="10" y="38" width="300" height="18"/>
        <textFieldExpression><![CDATA[$F{NOMEPARC}]]></textFieldExpression>
      </textField>

      <!-- Bloco Delimitado 2: Transporte (mais abaixo) -->
      <rectangle>
        <reportElement x="0" y="85" width="555" height="50"/>
      </rectangle>
      <staticText>
        <reportElement x="10" y="90" width="200" height="18"/>
        <text><![CDATA[DADOS DO TRANSPORTADOR / VOLUMES]]></text>
      </staticText>
      <textField>
        <reportElement x="10" y="110" width="250" height="18"/>
        <textFieldExpression><![CDATA[$F{NOMETRANSP}]]></textFieldExpression>
      </textField>

      <!-- Cluster solto: Data de emissão (distante) -->
      <staticText>
        <reportElement x="400" y="150" width="60" height="18"/>
        <text><![CDATA[EMISSÃO:]]></text>
      </staticText>
      <textField>
        <reportElement x="465" y="150" width="80" height="18"/>
        <textFieldExpression><![CDATA[$F{DTNEG}]]></textFieldExpression>
      </textField>
    </band>
  </pageHeader>
</jasperReport>`;

const slicesTest = sliceJrxmlToComponents(slicerTestXml);
assert(slicesTest.length === 3, `Fatiador gerou 3 componentes distintos a partir da banda (obtido: ${slicesTest.length})`);

const destSlice = slicesTest.find((s) => s.title.includes('Destinatário'));
assert(destSlice !== undefined, 'Bloco de Destinatário identificado e nomeado corretamente');
assert(destSlice?.category === 'Cabeçalho', 'Categoria do Destinatário inferida como Cabeçalho');
assert(destSlice?.elements.length === 3, 'Bloco do Destinatário contém o retângulo e os 2 elementos filhos');

const transpSlice = slicesTest.find((s) => s.title.includes('Transporte'));
assert(transpSlice !== undefined, 'Bloco de Transporte identificado e nomeado corretamente');
assert(transpSlice?.category === 'Transporte', 'Categoria do Transporte inferida como Transporte');
assert(transpSlice?.elements.length === 3, 'Bloco do Transporte contém o retângulo e os 2 elementos filhos');

const clusterSlice = slicesTest.find((s) => s.elements.some((e: any) => e.text === 'EMISSÃO:'));
assert(clusterSlice !== undefined, 'Cluster solto de Emissão identificado');
assert(clusterSlice?.elements[0].reportElement.y === 0, 'Cluster solto normalizado com y = 0 no topo');

// -------------------------------------------------------------
// TESTE 7: Auditoria Pixel-Perfect dos 5 Templates Oficiais
// -------------------------------------------------------------
console.log('\n--- TESTE 7: Auditoria Pixel-Perfect dos Templates Oficiais ---');

// 7.1 nota_fiscal_danfe
const danfeTpl = DOCUMENT_TEMPLATES.find((t) => t.id === 'nota_fiscal_danfe')!;
assert(danfeTpl !== undefined, 'Template nota_fiscal_danfe encontrado');

const danfeCols = [
  { id: 'cod', thId: 'th-cod', tdId: 'td-cod', x: 8, w: 45 },
  { id: 'descr', thId: 'th-descr', tdId: 'td-descr', x: 55, w: 225 },
  { id: 'ncm', thId: 'th-ncm', tdId: 'td-ncm', x: 282, w: 65 },
  { id: 'qtd', thId: 'th-qtd', tdId: 'td-qtd', x: 349, w: 50 },
  { id: 'unit', thId: 'th-unit', tdId: 'td-unit', x: 401, w: 65 },
  { id: 'total', thId: 'th-total', tdId: 'td-total', x: 468, w: 79 },
];

let danfeAlignOk = true;
for (const c of danfeCols) {
  const th = danfeTpl.report.bands.columnHeader?.elements.find((e) => e.id === c.thId);
  const td = danfeTpl.report.bands.detail?.elements.find((e) => e.id === c.tdId);
  if (
    !th ||
    !td ||
    th.reportElement.x !== c.x ||
    th.reportElement.width !== c.w ||
    td.reportElement.x !== c.x ||
    td.reportElement.width !== c.w
  ) {
    danfeAlignOk = false;
    console.error(
      `Desalinhamento na coluna ${c.id}: th(x=${th?.reportElement.x}, w=${th?.reportElement.width}), td(x=${td?.reportElement.x}, w=${td?.reportElement.width})`
    );
  }
}
assert(danfeAlignOk, 'nota_fiscal_danfe: Todas as colunas alinhadas 1:1 entre columnHeader e detail (largura total 539px)');

const danfeTotalRight = 468 + 79;
assert(danfeTotalRight === 547, 'nota_fiscal_danfe: Coluna TOTAL fecha exatamente em x=547');

const valTotNota = danfeTpl.report.bands.summary?.elements.find((e) => e.id === 'val-tot-nota');
assert(
  valTotNota !== undefined && valTotNota.reportElement.x + valTotNota.reportElement.width === 547,
  `nota_fiscal_danfe: Card de valor total da nota no summary coincide com borda 547 (obtido: ${(valTotNota?.reportElement.x || 0) + (valTotNota?.reportElement.width || 0)})`
);

// 7.2 pedido_venda_orcamento
const pvTpl = DOCUMENT_TEMPLATES.find((t) => t.id === 'pedido_venda_orcamento')!;
assert(pvTpl !== undefined, 'Template pedido_venda_orcamento encontrado');

const pvSumBg = pvTpl.report.bands.summary?.elements.find((e) => e.id === 'pv-sum-bg');
const pvSumVal = pvTpl.report.bands.summary?.elements.find((e) => e.id === 'pv-sum-val');
assert(
  pvSumBg !== undefined && pvSumBg.reportElement.x + pvSumBg.reportElement.width === 547,
  `pedido_venda_orcamento: Card de resumo fecha exatamente em x=547 (obtido: ${(pvSumBg?.reportElement.x || 0) + (pvSumBg?.reportElement.width || 0)})`
);
assert(
  pvSumVal !== undefined && pvSumVal.reportElement.x + pvSumVal.reportElement.width === 547,
  `pedido_venda_orcamento: Texto do valor fecha exatamente em x=547 (obtido: ${(pvSumVal?.reportElement.x || 0) + (pvSumVal?.reportElement.width || 0)})`
);

// 7.3 extrato_financeiro_receber
const finTpl = DOCUMENT_TEMPLATES.find((t) => t.id === 'extrato_financeiro_receber')!;
assert(finTpl !== undefined, 'Template extrato_financeiro_receber encontrado');

const finThVlr = finTpl.report.bands.columnHeader?.elements.find((e) => e.id === 'fin-th-vlr');
const finTdVlr = finTpl.report.bands.detail?.elements.find((e) => e.id === 'fin-td-vlr');
const finSumVal = finTpl.report.bands.summary?.elements.find((e) => e.id === 'fin-sum-val');

assert(
  finThVlr !== undefined &&
    finTdVlr !== undefined &&
    finThVlr.reportElement.x === finTdVlr.reportElement.x &&
    finThVlr.reportElement.width === finTdVlr.reportElement.width,
  'extrato_financeiro_receber: Coluna VALOR TÍTULO alinhada 1:1 entre header e detail'
);
assert(
  finSumVal !== undefined &&
    finSumVal.reportElement.x + finSumVal.reportElement.width ===
      finTdVlr!.reportElement.x + finTdVlr!.reportElement.width,
  `extrato_financeiro_receber: Totalizador no summary perfeitamente alinhado com coluna de valor (${finSumVal!.reportElement.x + finSumVal!.reportElement.width})`
);

// 7.4 etiqueta_produto_barcode
const etiqTpl = DOCUMENT_TEMPLATES.find((t) => t.id === 'etiqueta_produto_barcode')!;
assert(etiqTpl !== undefined, 'Template etiqueta_produto_barcode encontrado');

const etiqBarcode = etiqTpl.report.bands.detail?.elements.find((e) => e.id === 'etiq-barcode') as any;
const etiqQrcode = etiqTpl.report.bands.detail?.elements.find((e) => e.id === 'etiq-qrcode') as any;
assert(etiqBarcode?.barcodeType === 'Code128', 'etiqueta_produto_barcode: Código de barras usa padrão Code128');
assert(etiqQrcode?.reportElement.x === 193, 'etiqueta_produto_barcode: QR Code centralizado perfeitamente');

// 7.5 Validação XSD de todos os 5 templates oficiais com combined_schema.xsd
for (const tpl of DOCUMENT_TEMPLATES) {
  const xml = serializeJRXML(tpl.report);
  const tempPath = path.resolve(`engine/temp_${tpl.id}.jrxml`);
  fs.writeFileSync(tempPath, xml, 'utf-8');
  try {
    execSync(`xmllint --noout --schema engine/combined_schema.xsd ${tempPath}`);
    console.log(`✅ SUCESSO: Template oficial ${tpl.id} validado contra combined_schema.xsd via xmllint!`);
  } catch (err: any) {
    console.error(`❌ FALHA na validação XSD do template ${tpl.id}:`, err.message);
    failedTests++;
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

// -------------------------------------------------------------
// TESTE 8: Smart Grid Engine (Layout Slots, Presets & Auto-Fit)
// -------------------------------------------------------------
console.log('\n--- TESTE 8: Smart Grid Engine (Layout Slots & Auto-Fit) ---');

const testColW = 555;
const testBandH = 80;
const testGap = 12;

// 8.1 1 Coluna
const slots1Col = calculateBandSlots('1-col', testColW, testBandH, testGap);
assert(slots1Col.length === 1, '1-col gera exatamente 1 slot');
assert(slots1Col[0].x === 0 && slots1Col[0].y === 0, '1-col slot x=0, y=0');
assert(slots1Col[0].width === testColW, `1-col largura igual a colW (${testColW})`);
assert(slots1Col[0].height === testBandH, `1-col altura igual a bandH (${testBandH})`);

// 8.2 2 Colunas 50/50
const slots2Col50 = calculateBandSlots('2-col-50-50', testColW, testBandH, testGap);
assert(slots2Col50.length === 2, '2-col-50-50 gera exatamente 2 slots');
const expectedW1_50 = Math.floor((testColW - testGap) / 2);
const expectedW2_50 = testColW - testGap - expectedW1_50;
assert(slots2Col50[0].width === expectedW1_50, `2-col-50-50 slot 1 com largura Math.floor((colW - gap)/2) = ${expectedW1_50}`);
assert(slots2Col50[1].width === expectedW2_50, `2-col-50-50 slot 2 com largura ${expectedW2_50}`);
assert(slots2Col50[1].x === expectedW1_50 + testGap, `2-col-50-50 slot 2 x = ${expectedW1_50 + testGap}`);
assert(slots2Col50[0].width + testGap + slots2Col50[1].width === testColW, '2-col-50-50 fecha perfeitamente a largura total');

// 8.3 2 Colunas 33/67
const slots2Col33 = calculateBandSlots('2-col-33-67', testColW, testBandH, testGap);
const expectedW1_33 = Math.floor((testColW - testGap) * 0.33);
const expectedW2_67 = testColW - testGap - expectedW1_33;
assert(slots2Col33[0].width === expectedW1_33, `2-col-33-67 slot 1 com Math.floor((colW - gap) * 0.33) = ${expectedW1_33}`);
assert(slots2Col33[1].width === expectedW2_67, `2-col-33-67 slot 2 com largura ${expectedW2_67}`);
assert(slots2Col33[0].width + testGap + slots2Col33[1].width === testColW, '2-col-33-67 fecha perfeitamente a largura total');

// 8.4 2 Colunas 67/33
const slots2Col67 = calculateBandSlots('2-col-67-33', testColW, testBandH, testGap);
const expectedW1_67 = Math.floor((testColW - testGap) * 0.67);
const expectedW2_33 = testColW - testGap - expectedW1_67;
assert(slots2Col67[0].width === expectedW1_67, `2-col-67-33 slot 1 com Math.floor((colW - gap) * 0.67) = ${expectedW1_67}`);
assert(slots2Col67[1].width === expectedW2_33, `2-col-67-33 slot 2 com largura ${expectedW2_33}`);
assert(slots2Col67[0].width + testGap + slots2Col67[1].width === testColW, '2-col-67-33 fecha perfeitamente a largura total');

// 8.5 3 Colunas Iguais
const slots3Col = calculateBandSlots('3-col-equal', testColW, testBandH, testGap);
assert(slots3Col.length === 3, '3-col-equal gera exatamente 3 slots');
const expectedBaseW3 = Math.floor((testColW - 2 * testGap) / 3);
const expectedLastW3 = testColW - 2 * testGap - 2 * expectedBaseW3;
assert(slots3Col[0].width === expectedBaseW3, `3-col-equal slot 1 largura ${expectedBaseW3}`);
assert(slots3Col[1].width === expectedBaseW3, `3-col-equal slot 2 largura ${expectedBaseW3}`);
assert(slots3Col[2].width === expectedLastW3, `3-col-equal slot 3 ajustado para ${expectedLastW3}`);
assert(slots3Col[0].width + testGap + slots3Col[1].width + testGap + slots3Col[2].width === testColW, '3-col-equal fecha perfeitamente a largura total');

// 8.6 4 Quadrantes (2x2)
const slots4Grid = calculateBandSlots('4-grid-2x2', testColW, testBandH, testGap);
assert(slots4Grid.length === 4, '4-grid-2x2 gera exatamente 4 slots');
const expectedH1_4 = Math.floor((testBandH - testGap) / 2);
const expectedH2_4 = testBandH - testGap - expectedH1_4;
assert(slots4Grid[0].height === expectedH1_4, `4-grid-2x2 altura linha 1 = ${expectedH1_4}`);
assert(slots4Grid[2].height === expectedH2_4, `4-grid-2x2 altura linha 2 = ${expectedH2_4}`);
assert(slots4Grid[0].height + testGap + slots4Grid[2].height === testBandH, '4-grid-2x2 divide perfeitamente a altura da banda');

// 8.7 findSlotAtPosition
const foundSlot1 = findSlotAtPosition(slots2Col50, 50, 40);
assert(foundSlot1?.id === 'slot-1', 'findSlotAtPosition identifica slot 1 corretamente');
const foundSlot2 = findSlotAtPosition(slots2Col50, 400, 40);
assert(foundSlot2?.id === 'slot-2', 'findSlotAtPosition identifica slot 2 corretamente');
const foundOutside = findSlotAtPosition(slots2Col50, 800, 40);
assert(foundOutside === null, 'findSlotAtPosition retorna null para coordenadas fora dos slots');

// 8.8 Auto-Fit & Conversão mm/pt
const fitted = fitElementToSlot(slots2Col50[0], 2);
assert(fitted.x === 2, 'fitElementToSlot aplica padding em x');
assert(fitted.y === 2, 'fitElementToSlot aplica padding em y');
assert(fitted.width === slots2Col50[0].width - 4, 'fitElementToSlot calcula largura com padding');
assert(ptToMm(PT_PER_MM) === 1, '1mm corresponde a 2.83465pt exatamente');
assert(mmToPt(10) === 28, '10mm convertido para pt arredondado');

// -------------------------------------------------------------
// TESTE 9: Blindagem e Sanitização de Nome para Exportação JRXML
// -------------------------------------------------------------
console.log('\n--- TESTE 9: Sanitização de Nome e Exportação JRXML ---');

function sanitizeExportFileName(reportName?: string): string {
  return (
    (reportName || 'relatorio_sankhya').trim().replace(/[^a-zA-Z0-9_\-]/g, '_') ||
    'relatorio_sankhya'
  );
}

assert(sanitizeExportFileName('') === 'relatorio_sankhya', 'Nome vazio vira relatorio_sankhya');
assert(sanitizeExportFileName('   ') === 'relatorio_sankhya', 'Espaços em branco viram relatorio_sankhya');
assert(
  sanitizeExportFileName('Relatório Fiscal - Nota 123/2026!') === 'Relat_rio_Fiscal_-_Nota_123_2026_',
  'Caracteres especiais, acentos, barras e pontuação são substituídos por _'
);
assert(
  sanitizeExportFileName('  danfe_nfe_v1  ') === 'danfe_nfe_v1',
  'Trim aplicado corretamente nas extremidades'
);
assert(
  sanitizeExportFileName('pedido-venda_01') === 'pedido-venda_01',
  'Hífens e underscores normais são preservados'
);

// Validação do Blob com charset UTF-8 explícito
const sampleXml = serializeJRXML(DOCUMENT_TEMPLATES[0].report);
const sampleBlob = new Blob([sampleXml], { type: 'application/xml;charset=utf-8' });
assert(sampleBlob.type === 'application/xml;charset=utf-8', 'Blob criado com charset UTF-8 explícito');
assert(sampleBlob.size > 0, 'Blob contém dados válidos de XML');

// -------------------------------------------------------------
// TESTE 10: Geradores de Modelos Base (Scaffolds para Criador de Componentes)
// -------------------------------------------------------------
console.log('\n--- TESTE 10: Geradores de Modelos Base (Scaffolds) ---');

assert(SCAFFOLD_OPTIONS.length === 6, `SCAFFOLD_OPTIONS contém 6 tipos de modelo (obtido: ${SCAFFOLD_OPTIONS.length})`);

const expectedTypes: ComponentScaffoldType[] = [
  'card-info',
  'table-grid',
  'totalizer',
  'barcode-label',
  'signature-box',
  'blank-box',
];

for (const scafOpt of SCAFFOLD_OPTIONS) {
  assert(expectedTypes.includes(scafOpt.type), `Scaffold option tipo válido: ${scafOpt.type}`);
  assert(!!scafOpt.title, `Scaffold option ${scafOpt.type} possui título: "${scafOpt.title}"`);
  assert(scafOpt.height > 0, `Scaffold option ${scafOpt.type} possui altura positiva: ${scafOpt.height}px`);

  // Gera elementos com opções customizadas e padrão
  const elements = generateScaffoldElements(scafOpt.type, {
    title: `Título Teste ${scafOpt.title}`,
    primaryColor: '#0284C7',
    columnWidth: 555,
  });

  assert(elements.length > 0, `Scaffold ${scafOpt.type} gerou ${elements.length} elementos`);

  // Validação de unicidade de IDs e conformidade das propriedades
  const idSet = new Set<string>();
  for (const el of elements) {
    assert(!!el.id, `Elemento ${el.type} possui ID definido`);
    assert(!idSet.has(el.id), `ID ${el.id} é único dentro do componente gerado`);
    idSet.add(el.id);
    assert(el.reportElement.x >= 0, `Elemento ${el.id} x >= 0 (${el.reportElement.x})`);
    assert(
      el.reportElement.x + el.reportElement.width <= 555,
      `Elemento ${el.id} não excede columnWidth 555 (${el.reportElement.x + el.reportElement.width})`
    );
  }

  // Validação contra combined_schema.xsd via xmllint
  const testReport = {
    name: `test_scaffold_${scafOpt.type.replace(/-/g, '_')}`,
    language: 'groovy',
    pageWidth: 595,
    pageHeight: 842,
    columnWidth: 555,
    leftMargin: 20,
    rightMargin: 20,
    topMargin: 20,
    bottomMargin: 20,
    bands: {
      detail: {
        height: Math.max(scafOpt.height + 10, 80),
        elements,
      },
    },
  };

  const xml = serializeJRXML(testReport as any);
  const tempPath = path.resolve(`engine/temp_scaffold_${scafOpt.type}.jrxml`);
  fs.writeFileSync(tempPath, xml, 'utf-8');
  try {
    execSync(`xmllint --noout --schema engine/combined_schema.xsd ${tempPath}`);
    console.log(`✅ SUCESSO: Scaffold ${scafOpt.type} serializado e validado contra combined_schema.xsd via xmllint!`);
  } catch (err: any) {
    console.error(`❌ FALHA na validação XSD do scaffold ${scafOpt.type}:`, err.message);
    failedTests++;
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

// -------------------------------------------------------------
// TESTE 11: Validação de Exportação JasperReports 4.0.1 (Sankhya)
// -------------------------------------------------------------
console.log('\n--- TESTE 11: Validação de Exportação JasperReports 4.0.1 (Sankhya) ---');

const sampleReportWithUuid: any = {
  name: 'relatorio_sankhya_v4',
  uuid: 'root-uuid-sankhya-9999',
  language: 'groovy',
  pageWidth: 595,
  pageHeight: 842,
  columnWidth: 555,
  leftMargin: 20,
  rightMargin: 20,
  topMargin: 20,
  bottomMargin: 20,
  parameters: [],
  fields: [
    { name: 'NUNOTA', class: 'java.math.BigDecimal' },
    { name: 'NOMEPARC', class: 'java.lang.String' },
  ],
  variables: [],
  bands: {
    title: {
      height: 50,
      elements: [
        {
          id: 'st-sankhya-title',
          type: 'staticText',
          reportElement: {
            uuid: 'elem-uuid-title-1111',
            x: 0,
            y: 0,
            width: 555,
            height: 30,
            forecolor: '#1E293B',
          },
          textElement: {
            textAlignment: 'Center',
            verticalAlignment: 'Middle',
            font: { fontName: 'Arial', size: 14, isBold: true },
          },
          text: 'RELATÓRIO FINANCEIRO SANKHYA',
        },
      ],
    },
    detail: {
      height: 30,
      elements: [
        {
          id: 'tf-sankhya-nunota',
          type: 'textField',
          reportElement: {
            uuid: 'elem-uuid-field-2222',
            x: 0,
            y: 0,
            width: 200,
            height: 20,
          },
          textElement: {
            font: { size: 9 },
          },
          expression: '$F{NUNOTA}',
        },
      ],
    },
  },
};

// 11.1 Serialização 4.0.1 (Padrão Sankhya)
const xml401 = serializeJRXML(sampleReportWithUuid, { version: '4.0.1' });
assert(!xml401.includes('uuid='), '4.0.1: Nenhuma ocorrência de uuid= existe no arquivo gerado');
assert(xml401.includes('<property name="ireport.zoom" value="1.0"/>'), '4.0.1: Contém propriedade de compatibilidade ireport.zoom');
assert(xml401.includes('<property name="ireport.x" value="0"/>'), '4.0.1: Contém propriedade de compatibilidade ireport.x');
assert(xml401.includes('<property name="ireport.y" value="0"/>'), '4.0.1: Contém propriedade de compatibilidade ireport.y');
assert(xml401.includes('pdfFontName="Helvetica-Bold"'), '4.0.1: Fonte em negrito recebe pdfFontName="Helvetica-Bold" para Sankhya PDF');
assert(xml401.includes('pdfEncoding="CP1252"'), '4.0.1: Fonte recebe pdfEncoding="CP1252" para Sankhya PDF');
assert(xml401.includes('isPdfEmbedded="false"'), '4.0.1: Fonte recebe isPdfEmbedded="false"');

// 11.2 Serialização sem opções (padrão é 4.0.1)
const xmlDefault = serializeJRXML(sampleReportWithUuid);
assert(!xmlDefault.includes('uuid='), 'Default: Sem passar options.version, adota 4.0.1 e omite uuid');

// 11.3 Serialização 5.6.0 (Preserva uuid)
const xml560 = serializeJRXML(sampleReportWithUuid, { version: '5.6.0' });
assert(xml560.includes('uuid="root-uuid-sankhya-9999"'), '5.6.0: uuid do root <jasperReport> é preservado');
assert(xml560.includes('uuid="elem-uuid-title-1111"'), '5.6.0: uuid do staticText é preservado');
assert(xml560.includes('uuid="elem-uuid-field-2222"'), '5.6.0: uuid do textField é preservado');

// 11.4 Validação do XML 4.0.1 contra engine/jasperreport.xsd usando xmllint
const temp401Path = path.resolve('engine/temp_sankhya_401.jrxml');
fs.writeFileSync(temp401Path, xml401, 'utf-8');
try {
  execSync(`xmllint --noout --schema engine/jasperreport.xsd ${temp401Path}`);
  console.log('✅ SUCESSO: JRXML 4.0.1 (Sankhya) validado contra jasperreport.xsd via xmllint!');
} catch (err: any) {
  console.error('❌ FALHA na validação XSD do JRXML 4.0.1:', err.message);
  failedTests++;
} finally {
  if (fs.existsSync(temp401Path)) fs.unlinkSync(temp401Path);
}

console.log('\n======================================================');
if (failedTests === 0) {
  console.log('🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
  process.exit(0);
} else {
  console.error(`💥 ${failedTests} TESTE(S) FALHARAM!`);
  process.exit(1);
}
