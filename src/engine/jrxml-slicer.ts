import { parseJRXML } from './parser';
import { JRXMLBand, JRXMLElement, JRXMLReportElement } from '../types/jrxml';

export interface SlicedComponent {
  title: string;
  category: string;
  description: string;
  band: string;
  elements: any[];
  height: number;
}

/**
 * Verifica se um elemento está geometricamente contido dentro de um retângulo delimitador
 */
function isContainedInRect(
  inner: JRXMLReportElement,
  outer: JRXMLReportElement,
  tolerance = 4
): boolean {
  return (
    inner.x >= outer.x - tolerance &&
    inner.y >= outer.y - tolerance &&
    inner.x + inner.width <= outer.x + outer.width + tolerance &&
    inner.y + inner.height <= outer.y + outer.height + tolerance
  );
}

/**
 * Mapeia nome técnico de banda para rótulo legível
 */
function formatBandName(bandName: string): string {
  const map: Record<string, string> = {
    title: 'Título',
    pageHeader: 'Cabeçalho da Página',
    columnHeader: 'Cabeçalho das Colunas',
    detail: 'Detalhes / Itens',
    columnFooter: 'Subtotais da Coluna',
    pageFooter: 'Rodapé da Página',
    summary: 'Resumo / Totais',
  };
  return map[bandName] || bandName;
}

/**
 * Deduz categoria padrão baseada na banda
 */
function getDefaultCategory(bandName: string): string {
  if (bandName === 'title' || bandName === 'pageHeader' || bandName.startsWith('groupHeader')) {
    return 'Cabeçalho';
  }
  if (bandName === 'columnHeader' || bandName === 'detail') {
    return 'Itens';
  }
  if (bandName === 'columnFooter' || bandName === 'summary' || bandName.startsWith('groupFooter')) {
    return 'Totais';
  }
  if (bandName === 'pageFooter') {
    return 'Rodapé';
  }
  return 'Geral';
}

/**
 * Cria um componente modular com coordenadas normalizadas e metadados inferidos
 */
function createComponentFromElements(
  rawElements: JRXMLElement[],
  bandName: string,
  index: number
): SlicedComponent {
  const minY = Math.min(...rawElements.map((e) => e.reportElement.y));
  const minX = Math.min(...rawElements.map((e) => e.reportElement.x));
  const maxY = Math.max(...rawElements.map((e) => e.reportElement.y + e.reportElement.height));
  const calculatedHeight = Math.max(15, maxY - minY);

  // Clona e normaliza coordenadas relativas para o topo (y=0)
  const normalizedElements = rawElements.map((el) => {
    const cloned = JSON.parse(JSON.stringify(el));
    cloned.id = crypto.randomUUID();
    cloned.reportElement.y = Math.max(0, el.reportElement.y - minY);
    cloned.reportElement.x = Math.max(0, el.reportElement.x - minX);
    return cloned;
  });

  // Inferência semântica de Título e Categoria a partir do conteúdo
  const staticTexts = rawElements
    .filter((e) => e.type === 'staticText')
    .map((e) => (e as any).text?.trim())
    .filter(Boolean);

  const textDump = staticTexts.join(' ').toUpperCase();
  const firstText = staticTexts[0] || '';

  let title = '';
  let category = getDefaultCategory(bandName);

  if (textDump.includes('CANHOTO') || textDump.includes('RECEBEMOS DE')) {
    title = 'Canhoto de Recebimento';
    category = 'Fiscal';
  } else if (
    textDump.includes('DESTINAT') ||
    textDump.includes('REMETENTE') ||
    textDump.includes('CLIENTE')
  ) {
    title = 'Dados do Destinatário / Cliente';
    category = 'Cabeçalho';
  } else if (
    textDump.includes('TRANSPORTE') ||
    textDump.includes('TRANSPORTADOR') ||
    textDump.includes('VOLUMES') ||
    textDump.includes('VEICULO') ||
    textDump.includes('PLACA')
  ) {
    title = 'Transporte e Volumes';
    category = 'Transporte';
  } else if (
    textDump.includes('FATURA') ||
    textDump.includes('DUPLICATA') ||
    textDump.includes('VENCIMENTO') ||
    textDump.includes('PARCELA')
  ) {
    title = 'Faturas e Duplicatas';
    category = 'Financeiro';
  } else if (
    textDump.includes('BOLETO') ||
    textDump.includes('LINHA DIGIT') ||
    rawElements.some(
      (e) => e.type === 'barcode' && (e as any).barcodeType === 'Interleaved2Of5'
    )
  ) {
    title = 'Boleto Bancário FEBRABAN';
    category = 'Financeiro';
  } else if (
    textDump.includes('BASE DE CÁLCULO') ||
    textDump.includes('VALOR DO ICMS') ||
    textDump.includes('TOTAL DA NOTA') ||
    textDump.includes('TOTAL GERAL')
  ) {
    title = 'Totais e Impostos';
    category = 'Totais';
  } else if (
    bandName === 'detail' ||
    textDump.includes('PRODUTO') ||
    textDump.includes('VALOR UNIT') ||
    textDump.includes('NRO ÚNICO')
  ) {
    title = 'Itens e Produtos';
    category = 'Itens';
  } else if (
    textDump.includes('OBSERVAÇÕES') ||
    textDump.includes('DADOS ADICIONAIS') ||
    bandName === 'pageFooter'
  ) {
    title = 'Dados Adicionais e Observações';
    category = 'Rodapé';
  } else if (firstText && firstText.length >= 3 && firstText.length <= 40) {
    title = firstText.replace(/[:]$/, '');
  } else {
    title = `${formatBandName(bandName)} - Bloco ${index + 1}`;
  }

  const description = `Componente extraído da banda ${formatBandName(bandName)} contendo ${rawElements.length} elemento(s).`;

  return {
    title,
    category,
    description,
    band: bandName,
    elements: normalizedElements,
    height: calculatedHeight,
  };
}

/**
 * Fatiador de JRXML (Sankhya JRXML Slicer)
 * Faz o parse do JRXML e extrai blocos visuais das bandas
 * (agrupando por retângulos delimitadores <rectangle> ou clusters de elementos por proximidade vertical).
 */
export function sliceJrxmlToComponents(
  xmlContent: string
): { title: string; category: string; description: string; band: string; elements: any[]; height: number }[] {
  const report = parseJRXML(xmlContent);
  const slicedComponents: SlicedComponent[] = [];

  // Lista de bandas a processar
  const bandEntries: { bandKey: string; band: JRXMLBand }[] = [];

  const standardBands: (keyof typeof report.bands)[] = [
    'title',
    'pageHeader',
    'columnHeader',
    'detail',
    'columnFooter',
    'pageFooter',
    'summary',
  ];

  for (const bKey of standardBands) {
    const b = report.bands[bKey];
    if (b && b.elements && b.elements.length > 0) {
      bandEntries.push({ bandKey: bKey, band: b });
    }
  }

  if (report.groups) {
    for (const g of report.groups) {
      if (g.headerBand && g.headerBand.elements.length > 0) {
        bandEntries.push({ bandKey: `groupHeader_${g.name}`, band: g.headerBand });
      }
      if (g.footerBand && g.footerBand.elements.length > 0) {
        bandEntries.push({ bandKey: `groupFooter_${g.name}`, band: g.footerBand });
      }
    }
  }

  // Processa cada banda
  for (const { bandKey, band } of bandEntries) {
    const elements = [...band.elements];
    const consumedIds = new Set<string>();
    let blockCounter = 0;

    // 1. Identifica retângulos delimitadores (containers visuais)
    const containerRects = elements.filter(
      (e) => e.type === 'rectangle' && e.reportElement.width >= 50 && e.reportElement.height >= 15
    );

    for (const rect of containerRects) {
      if (consumedIds.has(rect.id)) continue;

      const innerElements = elements.filter(
        (el) =>
          el.id !== rect.id &&
          !consumedIds.has(el.id) &&
          isContainedInRect(el.reportElement, rect.reportElement)
      );

      // Se há elementos dentro do retângulo (além do próprio retângulo)
      if (innerElements.length > 0) {
        const block = [rect, ...innerElements];
        consumedIds.add(rect.id);
        innerElements.forEach((el) => consumedIds.add(el.id));

        slicedComponents.push(createComponentFromElements(block, bandKey, blockCounter++));
      }
    }

    // 2. Elementos restantes: agrupa por clusters de proximidade vertical
    const remainingElements = elements.filter((el) => !consumedIds.has(el.id));
    if (remainingElements.length > 0) {
      // Ordena por posição vertical Y
      remainingElements.sort(
        (a, b) => a.reportElement.y - b.reportElement.y || a.reportElement.x - b.reportElement.x
      );

      const GAP_THRESHOLD = 20; // Limiar de separação de blocos por salto vertical
      const clusters: JRXMLElement[][] = [];
      let currentCluster: JRXMLElement[] = [];
      let currentBottom = -1;

      for (const el of remainingElements) {
        const top = el.reportElement.y;
        const bottom = top + el.reportElement.height;

        if (currentCluster.length === 0) {
          currentCluster.push(el);
          currentBottom = bottom;
        } else {
          if (top - currentBottom <= GAP_THRESHOLD) {
            currentCluster.push(el);
            currentBottom = Math.max(currentBottom, bottom);
          } else {
            clusters.push(currentCluster);
            currentCluster = [el];
            currentBottom = bottom;
          }
        }
      }

      if (currentCluster.length > 0) {
        clusters.push(currentCluster);
      }

      for (const cluster of clusters) {
        slicedComponents.push(createComponentFromElements(cluster, bandKey, blockCounter++));
      }
    }
  }

  return slicedComponents;
}
