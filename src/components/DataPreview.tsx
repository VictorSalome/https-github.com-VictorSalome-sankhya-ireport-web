'use client';

import React, { useState, useMemo } from 'react';
import {
  JRXMLReport,
  JRXMLElement,
  JRXMLStaticText,
  JRXMLTextField,
  JRXMLBarcode,
  JRXMLSubreport,
  JRXMLChart,
  JRXMLCrosstab,
} from '../types/jrxml';
import { BarcodeVisual } from '../engine/barcode';
import { SVGChart } from '../engine/chart';
import { CrosstabVisual } from '../engine/crosstab';
import { Play, Printer, FolderTree, FolderGit2, Layers } from 'lucide-react';

interface DataPreviewProps {
  report: JRXMLReport;
}

/**
 * Splits Java argument lists while respecting quoted strings
 */
function splitJavaArgs(argsStr: string): string[] {
  const args: string[] = [];
  let current = '';
  let inQuotes = false;
  let quoteChar = '';

  for (let i = 0; i < argsStr.length; i++) {
    const ch = argsStr[i];
    if ((ch === '"' || ch === "'") && (i === 0 || argsStr[i - 1] !== '\\')) {
      if (!inQuotes) {
        inQuotes = true;
        quoteChar = ch;
      } else if (quoteChar === ch) {
        inQuotes = false;
      }
    }

    if (ch === ',' && !inQuotes) {
      args.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim()) {
    args.push(current.trim());
  }
  return args;
}

/**
 * Unwraps Sankhya Java utility calls (CustomReportUtils, BigDecimalUtil, StringUtils)
 * so that simulated previews display the clean underlying field values.
 */
function cleanJavaSankhyaCalls(expr: string): string {
  let result = expr;

  // 1. CustomReportUtils.str(arg1, arg2, ...) -> (arg1 + arg2 + ...)
  const strCallRegex = /(?:br\.com\.sankhya\.[\w\.]+\.)?CustomReportUtils\.str\s*\(([^()]+)\)/g;
  while (strCallRegex.test(result)) {
    result = result.replace(strCallRegex, (_, args) => {
      const parts = splitJavaArgs(args);
      return parts.length > 1 ? '(' + parts.join(' + ') + ')' : parts[0] || '';
    });
  }

  // 2. CustomReportUtils.format, mask, date, truncate -> unwrap first argument
  const fmtCallRegex = /(?:br\.com\.sankhya\.[\w\.]+\.)?CustomReportUtils\.(?:format|mask|date|truncate)\s*\(([^()]+)\)/g;
  while (fmtCallRegex.test(result)) {
    result = result.replace(fmtCallRegex, (_, args) => {
      const parts = splitJavaArgs(args);
      return parts[0] || '';
    });
  }

  // 3. Generic fallback: any remaining br.com.sankhya.* call
  const genericSankhyaRegex = /br\.com\.sankhya\.[\w\.]+\s*\(([^()]*)\)/g;
  while (genericSankhyaRegex.test(result)) {
    result = result.replace(genericSankhyaRegex, (_, args) => {
      const parts = splitJavaArgs(args);
      return parts[0] || '';
    });
  }

  // 4. Strip Java type casts e.g. (String), (Number), (BigDecimal)
  result = result.replace(/\((?:java\.(?:lang|math)\.)?(?:String|Number|BigDecimal|Integer|Double)\)/g, '');

  // 5. Strip String.valueOf(...)
  result = result.replace(/(?:java\.lang\.)?String\.valueOf\s*\(([^()]+)\)/g, '$1');

  // 6. Strip trailing Java utility methods: .toString(), .doubleValue(), .intValue(), .longValue(), .trim()
  result = result.replace(/\.(?:toString|doubleValue|intValue|longValue|trim)\s*\(\)/g, '');

  return result;
}

/**
 * Safely looks up a field in a row record, supporting:
 * - Direct match
 * - Case-insensitive match
 * - Dotted aliases e.g. CAB.NUNOTA, PAR.NOMEPARC, Descr.Parceiro
 * - Common Sankhya alias fallbacks
 */
function getFieldValue(row: Record<string, any> | undefined, rawName: string): any {
  if (!row) return undefined;
  const clean = rawName.trim();

  // 1. Direct match
  if (row[clean] !== undefined) return row[clean];

  // 2. Case-insensitive direct match
  const lowerClean = clean.toLowerCase();
  for (const k of Object.keys(row)) {
    if (k.toLowerCase() === lowerClean) return row[k];
  }

  // 3. Dotted notation: check token after last dot (e.g. CAB.NUNOTA -> NUNOTA)
  if (clean.includes('.')) {
    const afterDot = clean.split('.').pop()!.trim();
    if (row[afterDot] !== undefined) return row[afterDot];
    const lowerAfterDot = afterDot.toLowerCase();
    for (const k of Object.keys(row)) {
      if (k.toLowerCase() === lowerAfterDot) return row[k];
    }
  }

  // 4. Common Sankhya alias heuristics
  if (lowerClean.includes('parceiro') || lowerClean.includes('parc')) {
    if (lowerClean.includes('descr') || lowerClean.includes('nome') || lowerClean.includes('razao')) {
      return row.NOMEPARC ?? row.RAZAOSOCIAL;
    }
    if (lowerClean.includes('cod')) return row.CODPARC;
    if (lowerClean.includes('cnpj') || lowerClean.includes('cpf') || lowerClean.includes('cgc')) {
      return row.CGC_CPF;
    }
  }

  if (lowerClean.includes('nunota')) return row.NUNOTA;
  if (lowerClean.includes('numnota')) return row.NUMNOTA;
  if (lowerClean.includes('dtneg') || lowerClean.includes('emissao')) return row.DTNEG;
  if (lowerClean.includes('vlrnota')) return row.VLRNOTA;
  if (lowerClean.includes('vlrtot')) return row.VLRTOT ?? row.VLRNOTA;
  if (lowerClean.includes('codprod')) return row.CODPROD;
  if (lowerClean.includes('descrprod')) return row.DESCRPROD;
  if (lowerClean.includes('chavenfe')) return row.CHAVENFE;
  if (lowerClean.includes('observacao') || lowerClean.includes('obs')) return row.OBSERVACAO;
  if (lowerClean.includes('numos')) return row.NUMOS;
  if (lowerClean.includes('linha_digitavel')) return row.LINHA_DIGITAVEL;
  if (lowerClean.includes('cod_barras')) return row.COD_BARRAS;
  if (lowerClean.includes('nossonum')) return row.NOSSONUM;
  if (lowerClean.includes('vlrboleto')) return row.VLRBOLETO;
  if (lowerClean.includes('proventos')) return row.PROVENTOS;
  if (lowerClean.includes('descontos')) return row.DESCONTOS;
  if (lowerClean.includes('vlr_liquido')) return row.VLR_LIQUIDO;
  if (lowerClean.includes('salario_base')) return row.SALARIO_BASE;
  if (lowerClean.includes('laudo_tecnico')) return row.LAUDO_TECNICO;
  if (lowerClean.includes('defeito')) return row.DEFEITO ?? row.DEFEITO_RELATADO;
  if (lowerClean.includes('status_os')) return row.STATUS_OS;
  if (lowerClean.includes('local_estoque')) return row.LOCAL_ESTOQUE;
  if (lowerClean.includes('razaosocial_emp')) return row.RAZAOSOCIAL_EMP;
  if (lowerClean.includes('cnpj_emp') || lowerClean.includes('cgc_emp')) return row.CGC_EMP ?? row.CNPJ_EMP;
  if (lowerClean.includes('inscrest_emp') || lowerClean.includes('inscest_emp')) return row.INSCEST_EMP ?? row.INSCREST_EMP;
  if (lowerClean.includes('logradouro_emp')) return row.LOGRADOURO_EMP;
  if (lowerClean.includes('numero_emp')) return row.NUMERO_EMP;
  if (lowerClean.includes('cidade_emp')) return row.CIDADE_EMP;
  if (lowerClean.includes('uf_emp')) return row.UF_EMP;
  if (lowerClean.includes('pisret')) return row.VLRPISRET ?? row.VLR_PIS_RET;
  if (lowerClean.includes('cofinsret')) return row.VLRCOFINSRET ?? row.VLR_COFINS_RET;
  if (lowerClean.includes('csllret')) return row.VLRCSLLRET ?? row.VLR_CSLL_RET;
  if (lowerClean.includes('irfret') || lowerClean.includes('irrfret')) return row.VLRIRFRET ?? row.VLR_IRRF_RET;
  if (lowerClean.includes('issret')) return row.VLRISSRET ?? row.VLR_ISS_RET;
  if (lowerClean.includes('totret')) return row.TOTRET ?? '1256.73';
  if (lowerClean.includes('controle')) return row.CONTROLE ?? row.LOTE;
  if (lowerClean.includes('salariobase')) return row.SALARIOBASE ?? row.SALARIO_BASE;
  if (lowerClean.includes('liquido')) return row.LIQUIDO ?? row.VLR_LIQUIDO;
  if (lowerClean.includes('equipamento')) return row.EQUIPAMENTO;
  if (lowerClean.includes('numserie')) return row.NUMSERIE;
  if (lowerClean.includes('vlrfed')) return row.VLRFED;
  if (lowerClean.includes('vlrest')) return row.VLREST;
  if (lowerClean.includes('numnota_orig')) return row.NUMNOTA_ORIG;
  if (lowerClean.includes('motivodev')) return row.MOTIVODEV;
  if (lowerClean.includes('codcr')) return row.CODCR;
  if (lowerClean.includes('descrnat')) return row.DESCRNAT;
  if (lowerClean.includes('statusnota')) return row.STATUSNOTA;
  if (lowerClean.includes('codtipoper')) return row.CODTIPOPER;
  if (lowerClean.includes('apelido_vend')) return row.APELIDO_VEND;
  if (lowerClean.includes('comissao')) return row.COMISSAO;

  return undefined;
}

/**
 * Checks that an expression code contains only safe JavaScript expression tokens
 */
function isExpressionSafe(code: string): boolean {
  const forbidden = /\b(process|window|document|global|globalThis|require|import|eval|Function|constructor|prototype|while|for|do|class|let|const|var|return|delete)\b/;
  if (forbidden.test(code)) return false;
  if (/[;{}]/.test(code)) return false;
  return true;
}

export const DataPreview: React.FC<DataPreviewProps> = ({ report }) => {
  const [paramNunota, setParamNunota] = useState('10452');

  // Multi-client mock records from Sankhya ERP covering Fiscal, Finance, Logistics & Products
  const mockRows: Record<string, any>[] = useMemo(
    () => [
      {
        NUNOTA: '10452',
        NUMNOTA: '28401',
        DTNEG: '20/10/2026',
        CODPARC: '105',
        NOMEPARC: 'DISTRIBUIDORA ALFA BRASIL S/A',
        RAZAOSOCIAL: 'DISTRIBUIDORA ALFA BRASIL S/A',
        VLRNOTA: '15420.50',
        CODVEND: '10',
        APELIDO_VEND: 'JOÃO SILVA',
        CODEMP: '1',
        CGC_CPF: '12.345.678/0001-90',
        LOGRADOURO: 'AV. AFONSO PENA',
        NUMEND: '1500',
        BAIRRO: 'CENTRO',
        CIDADE: 'UBERLÂNDIA',
        UF: 'MG',
        CEP: '38400-100',
        BASEICMS: '15420.50',
        VLRICMS: '2775.69',
        BASESUBST: '0.00',
        VLRSUBST: '0.00',
        VLRPROD: '15420.50',
        VLRFRETE: '0.00',
        VLRDESC: '0.00',
        NOMEPARC_TRANSP: 'RODONAVES TRANSPORTES LTDA',
        CIF_FOB: 'C',
        PLACA: 'ABC-1234',
        UFVEICULO: 'MG',
        QTDVOL: '15',
        ESPECIE: 'VOLUMES',
        PESOBRUTO: '340.50',
        DTVENC: '20/11/2026',
        VLRDESDOB: '15420.50',
        CODPROD: '1001',
        DESCRPROD: 'PARAFUSO SEXTAVADO M8',
        QTDNEG: '50',
        VLRUNIT: '3.00',
        VLRTOT: '150.00',
        CODGRUPOPROD: '100',
        DESCRGRUPOPROD: 'FIXADORES',
        OBSERVACAO:
          'DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL; NAO GERA DIREITO A CREDITO FISCAL DE IPI.',
        CHAVENFE: '35261012345678000195550010000284011000284010',
        APELIDO: 'ALFA BRASIL',
        MES: 'OUT/2026',
        LINHA_DIGITAVEL: '34191.79001 01043.510047 91020.150008 5 91750000164453',
        COD_BARRAS: '34195917500001644531790001043510049102015000',
        NOSSONUM: '09/12345678-9',
        BANCO_NOME: 'BANCO ITAÚ UNIBANCO S.A. (341)',
        AGENCIA_CONTA: '1234 / 56789-0',
        CEDENTE_NOME: 'SANKHYA GESTAO DE NEGOCIOS S/A',
        CEDENTE_CNPJ: '05.847.123/0001-44',
        SACADO_NOME: 'DISTRIBUIDORA ALFA BRASIL S/A',
        SACADO_CPF: '12.345.678/0001-90',
        VLRBOLETO: '15420.50',
        INSTRUCOES: 'APOS O VENCIMENTO COBRAR MULTA DE 2% E JUROS DE 1% AO MES',
        RAZAOSOCIAL_EMP: 'SANKHYA TECNOLOGIA DA INFORMACAO S.A.',
        CNPJ_EMP: '05.847.123/0001-44',
        INSCREST_EMP: '062.847.123.001',
        END_EMP: 'AV. BRASIL, 1500 - CENTRO - UBERLANDIA/MG - CEP 38400-000',
        TEL_EMP: '(34) 3239-0000',
        EMAIL_EMP: 'contato@sankhya.com.br',
        VLR_PIS_RET: '106.89',
        VLR_COFINS_RET: '493.36',
        VLR_CSLL_RET: '164.45',
        VLR_IRRF_RET: '246.68',
        VLR_ISS_RET: '822.27',
        LOCAL_ESTOQUE: 'GALPAO PRINCIPAL - MATRIZ',
        RUA: 'RUA B',
        PREDIO: 'PRD 04',
        NIVEL: 'NV 02',
        LOTE: 'LT-20261021',
        DTVAL: '21/10/2028',
        CONFERENCIA: 'CONFIRMADA',
        MOTORISTA: 'CARLOS EDUARDO SILVA',
        PLACA_VEIC: 'BRA-2E19',
        PROVENTOS: '8450.00',
        DESCONTOS: '1890.25',
        SALARIO_BASE: '7500.00',
        BASE_INSS: '7500.00',
        BASE_FGTS: '7500.00',
        VLR_LIQUIDO: '6559.75',
        MES_COMPETENCIA: 'OUTUBRO / 2026',
        NUMOS: 'OS-84920',
        DEFEITO_RELATADO: 'EQUIPAMENTO NAO LIGA APOS QUEDA DE ENERGIA',
        LAUDO_TECNICO: 'SUBSTITUICAO DA FONTE DE ALIMENTACAO E FUSIVEL PRIMARIO',
        STATUS_OS: 'CONCLUIDA / APROVADA',
        CGC_EMP: '05.847.123/0001-44',
        INSCEST_EMP: '062.847.123.001',
        LOGRADOURO_EMP: 'AV. BRASIL',
        NUMERO_EMP: '1500',
        CIDADE_EMP: 'UBERLÂNDIA',
        UF_EMP: 'MG',
        VLRPISRET: '100.23',
        VLRCOFINSRET: '462.60',
        VLRCSLLRET: '154.20',
        VLRIRFRET: '231.30',
        VLRISSRET: '308.40',
        TOTRET: '1256.73',
        CONTROLE: 'LT-202610A',
        SALARIOBASE: '7500.00',
        LIQUIDO: '6559.75',
        EQUIPAMENTO: 'IMPRESSORA TERMICA ZEBRA ZD220',
        NUMSERIE: 'ZB-9482014',
        DEFEITO: 'FALHA NA TRACAO DA BOBINA E DESALINHAMENTO DO CABECOTE',
        VLRFED: '2211.89',
        VLREST: '2960.15',
        NUMNOTA_ORIG: '104820',
        MOTIVODEV: 'MERCADORIA EM DESACORDO COM O PEDIDO DE COMPRA',
        CODCR: '02.01',
        DESCRNAT: 'RECEITA COM VENDAS DE MERCADORIAS',
        CODTIPOPER: '1001',
        STATUSNOTA: 'L',
        COMISSAO: '3.50',
      },
      {
        NUNOTA: '10453',
        NUMNOTA: '28402',
        DTNEG: '20/10/2026',
        CODPARC: '105',
        NOMEPARC: 'DISTRIBUIDORA ALFA BRASIL S/A',
        RAZAOSOCIAL: 'DISTRIBUIDORA ALFA BRASIL S/A',
        VLRNOTA: '3200.00',
        CODVEND: '10',
        APELIDO_VEND: 'JOÃO SILVA',
        CODEMP: '1',
        CGC_CPF: '12.345.678/0001-90',
        LOGRADOURO: 'AV. AFONSO PENA',
        NUMEND: '1500',
        BAIRRO: 'CENTRO',
        CIDADE: 'UBERLÂNDIA',
        UF: 'MG',
        CEP: '38400-100',
        BASEICMS: '3200.00',
        VLRICMS: '576.00',
        BASESUBST: '0.00',
        VLRSUBST: '0.00',
        VLRPROD: '3200.00',
        VLRFRETE: '0.00',
        VLRDESC: '0.00',
        NOMEPARC_TRANSP: 'RODONAVES TRANSPORTES LTDA',
        CIF_FOB: 'C',
        PLACA: 'ABC-1234',
        UFVEICULO: 'MG',
        QTDVOL: '4',
        ESPECIE: 'VOLUMES',
        PESOBRUTO: '85.20',
        DTVENC: '20/11/2026',
        VLRDESDOB: '3200.00',
        CODPROD: '1002',
        DESCRPROD: 'ARRUELA DE PRESSAO 5/16',
        QTDNEG: '100',
        VLRUNIT: '0.80',
        VLRTOT: '80.00',
        CODGRUPOPROD: '100',
        DESCRGRUPOPROD: 'FIXADORES',
        OBSERVACAO:
          'DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL; NAO GERA DIREITO A CREDITO FISCAL DE IPI.',
        CHAVENFE: '35261012345678000195550010000284011000284028',
        APELIDO: 'ALFA BRASIL',
        MES: 'OUT/2026',
      },
      {
        NUNOTA: '10454',
        NUMNOTA: '28403',
        DTNEG: '21/10/2026',
        CODPARC: '210',
        NOMEPARC: 'COMERCIAL BETA LTDA',
        RAZAOSOCIAL: 'COMERCIAL BETA LTDA',
        VLRNOTA: '8950.25',
        CODVEND: '20',
        APELIDO_VEND: 'MARIA SANTOS',
        CODEMP: '1',
        CGC_CPF: '98.765.432/0001-10',
        LOGRADOURO: 'RUA FLORIANO PEIXOTO',
        NUMEND: '340',
        BAIRRO: 'BRASIL',
        CIDADE: 'UBERLÂNDIA',
        UF: 'MG',
        CEP: '38400-700',
        BASEICMS: '8950.25',
        VLRICMS: '1611.05',
        BASESUBST: '0.00',
        VLRSUBST: '0.00',
        VLRPROD: '8950.25',
        VLRFRETE: '0.00',
        VLRDESC: '0.00',
        NOMEPARC_TRANSP: 'BRASPRESS TRANSPORTES LTDA',
        CIF_FOB: 'F',
        PLACA: 'XYZ-9876',
        UFVEICULO: 'SP',
        QTDVOL: '8',
        ESPECIE: 'CAIXAS',
        PESOBRUTO: '190.00',
        DTVENC: '21/11/2026',
        VLRDESDOB: '8950.25',
        CODPROD: '2001',
        DESCRPROD: 'VALVULA ESFERA TRIPARTIDA 1 POL',
        QTDNEG: '10',
        VLRUNIT: '895.02',
        VLRTOT: '8950.20',
        CODGRUPOPROD: '200',
        DESCRGRUPOPROD: 'VALVULAS',
        OBSERVACAO: 'MERCADORIA DESTINADA A REVENDA COMERCIAL.',
        CHAVENFE: '35261012345678000195550010000284011000284036',
        APELIDO: 'BETA LTDA',
        MES: 'OUT/2026',
      },
      {
        NUNOTA: '10455',
        NUMNOTA: '28404',
        DTNEG: '21/10/2026',
        CODPARC: '210',
        NOMEPARC: 'COMERCIAL BETA LTDA',
        RAZAOSOCIAL: 'COMERCIAL BETA LTDA',
        VLRNOTA: '1140.00',
        CODVEND: '20',
        APELIDO_VEND: 'MARIA SANTOS',
        CODEMP: '1',
        CGC_CPF: '98.765.432/0001-10',
        LOGRADOURO: 'RUA FLORIANO PEIXOTO',
        NUMEND: '340',
        BAIRRO: 'BRASIL',
        CIDADE: 'UBERLÂNDIA',
        UF: 'MG',
        CEP: '38400-700',
        BASEICMS: '1140.00',
        VLRICMS: '205.20',
        BASESUBST: '0.00',
        VLRSUBST: '0.00',
        VLRPROD: '1140.00',
        VLRFRETE: '0.00',
        VLRDESC: '0.00',
        NOMEPARC_TRANSP: 'BRASPRESS TRANSPORTES LTDA',
        CIF_FOB: 'F',
        PLACA: 'XYZ-9876',
        UFVEICULO: 'SP',
        QTDVOL: '2',
        ESPECIE: 'CAIXAS',
        PESOBRUTO: '35.00',
        DTVENC: '21/11/2026',
        VLRDESDOB: '1140.00',
        CODPROD: '2002',
        DESCRPROD: 'CONEXAO TEE ACO CARBONO 1 POL',
        QTDNEG: '20',
        VLRUNIT: '57.00',
        VLRTOT: '1140.00',
        CODGRUPOPROD: '200',
        DESCRGRUPOPROD: 'CONEXOES',
        OBSERVACAO: 'MERCADORIA DESTINADA A REVENDA COMERCIAL.',
        CHAVENFE: '35261012345678000195550010000284011000284044',
        APELIDO: 'BETA LTDA',
        MES: 'OUT/2026',
      },
    ],
    []
  );

  // Group rows if report has active groups with accurate subtotals
  const groupedData = useMemo(() => {
    const groups = report.groups || [];
    if (groups.length === 0) {
      const sum = mockRows.reduce(
        (acc, curr) => acc + (parseFloat(curr.VLRNOTA || curr.VLRTOT || curr.VLRDESDOB || '0') || 0),
        0
      );
      return [{ groupKey: 'all', rows: mockRows, subtotal: sum }];
    }

    const primaryGroup = groups[0];
    const fieldMatch = primaryGroup.expression?.match(/\$F\{([^}]+)\}/);
    const groupField = fieldMatch ? fieldMatch[1] : primaryGroup.expression || 'CODPARC';

    const map = new Map<string, typeof mockRows>();
    for (const r of mockRows) {
      const keyVal = getFieldValue(r, groupField);
      const key =
        keyVal !== undefined && keyVal !== null && String(keyVal).trim() !== ''
          ? String(keyVal)
          : 'Sem Grupo';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(r);
    }

    return Array.from(map.entries()).map(([k, rows]) => {
      const subtotal = rows.reduce(
        (acc, curr) => acc + (parseFloat(curr.VLRNOTA || curr.VLRTOT || curr.VLRDESDOB || '0') || 0),
        0
      );
      return { groupKey: k, rows, subtotal };
    });
  }, [report.groups, mockRows]);

  const totalGeral = useMemo(() => {
    return mockRows.reduce(
      (acc, r) => acc + (parseFloat(r.VLRNOTA || r.VLRTOT || r.VLRDESDOB || '0') || 0),
      0
    );
  }, [mockRows]);

  const evaluateExpression = (
    expr: string,
    row: Record<string, any>,
    subtotalGroup?: number
  ): string => {
    if (!expr || !expr.trim()) return '';

    // 1. Clean Java Sankhya calls (e.g. CustomReportUtils.str)
    let cleaned = cleanJavaSankhyaCalls(expr.trim());

    // 2. Pure single field match e.g. "$F{Descr.Parceiro}" or "$F{CAB.NUNOTA}"
    const pureFieldMatch = cleaned.match(/^\$F\{([^}]+)\}$/);
    if (pureFieldMatch) {
      const val = getFieldValue(row, pureFieldMatch[1]);
      if (val !== undefined && val !== null) {
        const upper = pureFieldMatch[1].toUpperCase();
        if (
          upper.includes('VLR') ||
          upper.includes('VALOR') ||
          upper === 'BASEICMS' ||
          upper === 'BASESUBST'
        ) {
          const num = parseFloat(val);
          if (!isNaN(num)) {
            return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          }
        }
        return String(val);
      }
      return `[${pureFieldMatch[1]}]`;
    }

    // 3. Pure subtotal variable match e.g. "$V{SUBTOTAL_CODPARC}" or "$V{SUBTOTAL}"
    const pureSubtotalMatch = cleaned.match(/^\$V\{(SUBTOTAL[^}]*|TOTAL[^}]*|SUM[^}]*)\}$/i);
    if (pureSubtotalMatch && subtotalGroup !== undefined) {
      return subtotalGroup.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
    }

    // 4. Pure parameter match
    if (cleaned === '$P{PK_NUNOTA}') return paramNunota || '10452';

    // 5. Pure system variable match
    if (cleaned === '$V{PAGE_NUMBER}') return '1';
    if (cleaned === '$V{REPORT_COUNT}') return String(mockRows.length);

    // 6. Replace $V{...} inside compound expressions
    cleaned = cleaned.replace(/\$V\{([^}]+)\}/g, (_, varName) => {
      const vn = varName.trim();
      if (vn === 'PAGE_NUMBER') return '1';
      if (vn === 'REPORT_COUNT') return String(mockRows.length);
      if (
        (vn.startsWith('SUBTOTAL') || vn.startsWith('TOTAL') || vn.startsWith('SUM')) &&
        subtotalGroup !== undefined
      ) {
        return JSON.stringify(
          subtotalGroup.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
        );
      }
      return JSON.stringify(`[V:${vn}]`);
    });

    // 7. Replace $P{...} inside compound expressions
    cleaned = cleaned.replace(/\$P\{([^}]+)\}/g, (_, paramName) => {
      const pn = paramName.trim();
      if (pn === 'PK_NUNOTA') return JSON.stringify(paramNunota || '10452');
      if (pn === 'PDIR_MODELO') return JSON.stringify('/modelos/');
      if (pn === 'CODEMP') return JSON.stringify('1');
      if (pn === 'DTINIC') return JSON.stringify('01/10/2026');
      if (pn === 'DTFIM') return JSON.stringify('31/10/2026');

      // Check parameters from report
      const repParam = report.parameters?.find(
        (p) => p.name.toLowerCase() === pn.toLowerCase()
      );
      if (repParam?.defaultValueExpression) {
        const cleanedDef = repParam.defaultValueExpression.replace(/^["']|["']$/g, '');
        return JSON.stringify(cleanedDef);
      }

      return JSON.stringify(`[P:${pn}]`);
    });

    // 8. Replace $F{...} inside compound expressions (supporting dots and any valid character)
    cleaned = cleaned.replace(/\$F\{([^}]+)\}/g, (_, fieldName) => {
      const val = getFieldValue(row, fieldName);
      if (val !== undefined && val !== null) {
        return JSON.stringify(String(val));
      }
      return 'null';
    });

    // 9. Safely evaluate string concatenations and ternary operators
    try {
      if (isExpressionSafe(cleaned)) {
        const evaluated = Function('return (' + cleaned + ')')();
        if (evaluated !== undefined && evaluated !== null) {
          return String(evaluated);
        }
      }
    } catch {
      // Graceful fallback: return string without wrapping quotes
    }

    return cleaned.replace(/^["']|["']$/g, '');
  };

  const shouldPrintElement = (
    expr: string | undefined,
    row?: Record<string, any>,
    rowIndex?: number
  ): boolean => {
    if (!expr || !expr.trim()) return true;

    try {
      const cleanExpr = expr.trim();

      // Quick check for literal boolean constants
      if (/^(false|Boolean\.FALSE|new\s+Boolean\s*\(\s*false\s*\))$/i.test(cleanExpr)) {
        return false;
      }
      if (/^(true|Boolean\.TRUE|new\s+Boolean\s*\(\s*true\s*\))$/i.test(cleanExpr)) {
        return true;
      }

      const effectiveRow = row || mockRows[0] || {};

      // Simulated page check
      if (cleanExpr.includes('$V{PAGE_NUMBER}')) {
        if (cleanExpr.includes('$V{PAGE_NUMBER} == 1') || cleanExpr.includes('$V{PAGE_NUMBER} <= 1')) {
          return true;
        }
        if (cleanExpr.includes('$V{PAGE_NUMBER} > 1') || cleanExpr.includes('$V{PAGE_NUMBER} != 1')) {
          return false;
        }
      }

      // Unpack new Boolean(...)
      let processed = cleanExpr.replace(/^new\s+Boolean\s*\((.*)\)$/s, '$1').trim();

      // Strip Java type casts e.g. ((Number)$F{...})
      processed = processed.replace(
        /\((?:java\.(?:lang|math)\.)?(?:String|Number|BigDecimal|Integer|Double)\)/g,
        ''
      );

      // Simplify Java instanceof Number and Double.parseDouble
      processed = processed.replace(
        /([a-zA-Z0-9_$.{}]+)\s+instanceof\s+Number\s*\?\s*\(?\s*([a-zA-Z0-9_$.{}]+)\s*\)?\.doubleValue\(\)\s*>\s*0\s*:\s*Double\.parseDouble\([a-zA-Z0-9_$.{}]+\.toString\(\)\)\s*>\s*0/g,
        'Number($1 || 0) > 0'
      );

      // Replace Java empty checks
      processed = processed.replace(
        /!([a-zA-Z0-9_$.{}]+)(?:\.toString\(\))?(?:\.trim\(\))?\.isEmpty\(\)/g,
        '($1 != null && String($1).trim() !== "")'
      );
      processed = processed.replace(
        /([a-zA-Z0-9_$.{}]+)(?:\.toString\(\))?(?:\.trim\(\))?\.isEmpty\(\)/g,
        '($1 == null || String($1).trim() === "")'
      );

      // Replace $F{...} with dot and all character support
      processed = processed.replace(/\$F\{([^}]+)\}/g, (_, fieldName) => {
        const val = getFieldValue(effectiveRow, fieldName);
        if (val === null || val === undefined) return 'null';
        const num = Number(val);
        if (!isNaN(num) && String(val).trim() !== '') {
          return String(num);
        }
        return JSON.stringify(String(val));
      });

      // Replace $P{...}
      processed = processed.replace(/\$P\{([^}]+)\}/g, (_, paramName) => {
        const pn = paramName.trim();
        const val = pn === 'PK_NUNOTA' ? paramNunota : '1';
        return JSON.stringify(String(val));
      });

      // Replace $V{...}
      processed = processed.replace(/\$V\{([^}]+)\}/g, (_, varName) => {
        const vn = varName.trim();
        if (vn === 'PAGE_NUMBER') return '1';
        if (vn === 'REPORT_COUNT') return String(mockRows.length);
        return '0';
      });

      if (isExpressionSafe(processed)) {
        const result = Function('return Boolean(' + processed + ')')();
        return Boolean(result);
      }
    } catch {
      // In case of evaluation error, never throw TypeError; fallback safely to true
      return true;
    }

    return true;
  };

  const renderSimulatedElement = (
    elem: JRXMLElement,
    row?: Record<string, any>,
    subtotal?: number,
    rowIndex?: number
  ) => {
    const rel = elem.reportElement;

    if (rel.printWhenExpression && !shouldPrintElement(rel.printWhenExpression, row, rowIndex)) {
      return null;
    }

    const isZebraRow =
      (rel.style === 'Zebra' || report.styles?.some((s) => s.name === 'Zebra')) &&
      rowIndex !== undefined &&
      rowIndex % 2 === 0;

    const computedBg = isZebraRow
      ? '#f1f5f9'
      : rel.mode === 'Opaque' && rel.backcolor
      ? rel.backcolor
      : 'transparent';

    if (elem.type === 'staticText') {
      const st = elem as JRXMLStaticText;
      return (
        <div
          key={elem.id}
          className="absolute overflow-hidden truncate"
          style={{
            left: `${rel.x}px`,
            top: `${rel.y}px`,
            width: `${rel.width}px`,
            height: `${rel.height}px`,
            fontSize: st.textElement?.font?.size ? `${st.textElement.font.size}px` : '10px',
            fontWeight: st.textElement?.font?.isBold ? 'bold' : 'normal',
            textAlign: (st.textElement?.textAlignment?.toLowerCase() as any) || 'left',
            color: rel.forecolor || '#000000',
            backgroundColor: computedBg,
          }}
        >
          {st.text}
        </div>
      );
    }

    if (elem.type === 'textField') {
      const tf = elem as JRXMLTextField;
      const effectiveRow = row || mockRows[0] || {};
      let textVal = evaluateExpression(tf.expression, effectiveRow, subtotal);

      // Apply pattern if present and textVal is a plain number
      if (tf.pattern && textVal && !isNaN(Number(textVal)) && !textVal.includes('R$')) {
        const num = parseFloat(textVal);
        if (tf.pattern.includes('¤') || tf.pattern.includes('R$')) {
          textVal = num.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        } else if (tf.pattern.includes('#,##0.00')) {
          textVal = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
      }

      return (
        <div
          key={elem.id}
          className="absolute overflow-hidden truncate"
          style={{
            left: `${rel.x}px`,
            top: `${rel.y}px`,
            width: `${rel.width}px`,
            height: `${rel.height}px`,
            fontSize: tf.textElement?.font?.size ? `${tf.textElement.font.size}px` : '10px',
            fontWeight: tf.textElement?.font?.isBold ? 'bold' : 'normal',
            textAlign: (tf.textElement?.textAlignment?.toLowerCase() as any) || 'left',
            color: rel.forecolor || '#000000',
            backgroundColor: computedBg,
          }}
        >
          {textVal}
        </div>
      );
    }

    if (elem.type === 'line') {
      const ln = elem as any;
      const strokeWidth = ln.penWidth || 1;
      const strokeColor = ln.penColor || rel.forecolor || '#000000';
      const isVertical = rel.width <= 1 && rel.height > 1;

      return (
        <svg
          key={elem.id}
          className="absolute overflow-visible pointer-events-none"
          style={{
            left: `${rel.x}px`,
            top: `${rel.y}px`,
            width: `${Math.max(rel.width, 1)}px`,
            height: `${Math.max(rel.height, 1)}px`,
          }}
        >
          <line
            x1={isVertical ? 0.5 : 0}
            y1={isVertical ? 0 : 0.5}
            x2={isVertical ? 0.5 : rel.width}
            y2={isVertical ? rel.height : 0.5}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            shapeRendering="crispEdges"
          />
        </svg>
      );
    }

    if (elem.type === 'rectangle') {
      return (
        <div
          key={elem.id}
          className="absolute"
          style={{
            left: `${rel.x}px`,
            top: `${rel.y}px`,
            width: `${rel.width}px`,
            height: `${rel.height}px`,
            backgroundColor: computedBg,
            borderColor: rel.forecolor || '#cbd5e1',
            borderWidth: '1px',
            borderStyle: 'solid',
            borderRadius: '2px',
          }}
        />
      );
    }

    if (elem.type === 'barcode') {
      const bc = elem as JRXMLBarcode;
      const effectiveRow = row || mockRows[0] || {};
      let codeVal = evaluateExpression(bc.expression, effectiveRow, subtotal);
      if (!codeVal || codeVal.startsWith('[') || codeVal.includes('?')) {
        codeVal = '35261012345678000195550010000284011000284010';
      }
      codeVal = codeVal.replace(/["'$FP{}]/g, '').trim() || '35261012345678000195550010000284011000284010';

      return (
        <div
          key={elem.id}
          className="absolute overflow-hidden flex items-center justify-center p-0.5"
          style={{
            left: `${rel.x}px`,
            top: `${rel.y}px`,
            width: `${rel.width}px`,
            height: `${rel.height}px`,
            backgroundColor: computedBg,
          }}
        >
          <BarcodeVisual
            type={bc.barcodeType}
            value={codeVal}
            width={rel.width - 4}
            height={rel.height - 4}
            textPosition={bc.textPosition}
            forecolor={rel.forecolor || '#000000'}
          />
        </div>
      );
    }

    if (elem.type === 'subreport') {
      const sr = elem as JRXMLSubreport;
      const isItens =
        sr.subreportExpression.includes('sub_itens') ||
        sr.subreportExpression.includes('item');
      const isDuplicatas =
        sr.subreportExpression.includes('duplicata') ||
        sr.subreportExpression.includes('fin');

      return (
        <div
          key={elem.id}
          className="absolute border border-indigo-300 bg-white rounded shadow-xs overflow-hidden"
          style={{
            left: `${rel.x}px`,
            top: `${rel.y}px`,
            width: `${rel.width}px`,
            height: `${rel.height}px`,
            backgroundColor: computedBg !== 'transparent' ? computedBg : '#FFFFFF',
          }}
        >
          {isItens ? (
            <div className="w-full text-[8px] p-1">
              <div className="bg-slate-100 font-bold text-slate-700 grid grid-cols-5 px-1 py-0.5 border-b border-slate-300 text-[8px]">
                <span className="col-span-1">CÓD</span>
                <span className="col-span-2">DESCRIÇÃO DO ITEM</span>
                <span className="text-right">QTD</span>
                <span className="text-right">TOTAL</span>
              </div>
              <div className="divide-y divide-slate-100 text-[7px] text-slate-600">
                <div className="grid grid-cols-5 px-1 py-0.5">
                  <span className="col-span-1 font-mono">1001</span>
                  <span className="col-span-2 truncate">PARAFUSO SEXTAVADO M8</span>
                  <span className="text-right font-mono">50</span>
                  <span className="text-right font-mono">R$ 150,00</span>
                </div>
                <div className="grid grid-cols-5 px-1 py-0.5">
                  <span className="col-span-1 font-mono">1002</span>
                  <span className="col-span-2 truncate">ARRUELA DE PRESSAO 5/16</span>
                  <span className="text-right font-mono">100</span>
                  <span className="text-right font-mono">R$ 80,00</span>
                </div>
              </div>
            </div>
          ) : isDuplicatas ? (
            <div className="w-full text-[8px] p-1">
              <div className="bg-slate-100 font-bold text-slate-700 grid grid-cols-3 px-1 py-0.5 border-b border-slate-300">
                <span>PARCELA</span>
                <span>VENCIMENTO</span>
                <span className="text-right">VALOR</span>
              </div>
              <div className="divide-y divide-slate-100 text-[7px] text-slate-600">
                <div className="grid grid-cols-3 px-1 py-0.5">
                  <span>01/02</span>
                  <span>10/11/2026</span>
                  <span className="text-right font-mono">R$ 7.710,25</span>
                </div>
                <div className="grid grid-cols-3 px-1 py-0.5">
                  <span>02/02</span>
                  <span>10/12/2026</span>
                  <span className="text-right font-mono">R$ 7.710,25</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex items-center justify-center p-1 text-[9px] text-indigo-700 font-mono space-x-1">
              <FolderGit2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
              <span>[Sub-relatório: {sr.subreportExpression}]</span>
            </div>
          )}
        </div>
      );
    }

    if (elem.type === 'chart') {
      const ch = elem as JRXMLChart;

      // Dynamic calculation from mock rows if expression matches partner/seller
      const previewData = [
        { label: 'Alfa Brasil', value: 18620.5 },
        { label: 'Beta Ltda', value: 8950.25 },
        { label: 'Gama Eireli', value: 42100.0 },
        { label: 'Delta Com.', value: 15300.0 },
        { label: 'Epsilon S/A', value: 9800.0 },
      ];

      return (
        <div
          key={elem.id}
          className="absolute border border-slate-200 bg-white rounded shadow-xs overflow-hidden"
          style={{
            left: `${rel.x}px`,
            top: `${rel.y}px`,
            width: `${rel.width}px`,
            height: `${rel.height}px`,
          }}
        >
          <SVGChart
            type={ch.chartType || 'barChart'}
            title={ch.title}
            width={rel.width}
            height={rel.height}
            data={previewData}
            isShowLegend={ch.isShowLegend !== false}
            isShowLabels={ch.isShowLabels !== false}
            isDarkCanvas={false}
          />
        </div>
      );
    }

    if (elem.type === 'crosstab') {
      const ct = elem as JRXMLCrosstab;
      return (
        <div
          key={elem.id}
          className="absolute border border-slate-200 bg-white rounded shadow-xs overflow-hidden"
          style={{
            left: `${rel.x}px`,
            top: `${rel.y}px`,
            width: `${rel.width}px`,
            height: `${rel.height}px`,
          }}
        >
          <CrosstabVisual
            crosstab={ct}
            width={rel.width}
            height={rel.height}
            isDarkCanvas={false}
          />
        </div>
      );
    }

    return null;
  };

  const hasGroups = (report.groups || []).length > 0;

  return (
    <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden select-none preview-container print:bg-white print:overflow-visible print:h-auto">
      {/* Simulation Controls Header */}
      <div className="no-print h-12 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1.5 text-slate-300 font-semibold">
            <Play className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulador Sankhya em Tempo Real</span>
          </div>

          {hasGroups && (
            <div className="flex items-center space-x-1.5 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/40 text-emerald-300 text-[11px]">
              <FolderTree className="w-3 h-3 text-emerald-400" />
              <span>Agrupamento Ativo ({groupedData.length} grupos com subtotais)</span>
            </div>
          )}

          {report.styles?.some((s) => s.name === 'Zebra') && (
            <div className="flex items-center space-x-1.5 bg-indigo-950/60 px-2 py-0.5 rounded border border-indigo-800/40 text-indigo-300 text-[11px]">
              <Layers className="w-3 h-3 text-indigo-400" />
              <span>Linhas Zebradas Ativas</span>
            </div>
          )}

          <div className="flex items-center space-x-1 bg-slate-950 px-2 py-1 rounded border border-slate-800">
            <span className="text-slate-400 font-mono text-[11px]">$P&#123;PK_NUNOTA&#125;:</span>
            <input
              type="text"
              value={paramNunota}
              onChange={(e) => setParamNunota(e.target.value)}
              className="bg-transparent border-0 text-sky-400 font-mono text-[11px] w-16 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded font-medium transition text-xs"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Imprimir / PDF</span>
        </button>
      </div>

      {/* Rendered Virtual Paper */}
      <div className="flex-1 overflow-auto p-8 flex justify-center bg-slate-950 preview-wrapper print:bg-white print:p-0 print:m-0 print:overflow-visible">
        <div
          className="printable-page report-paper bg-white text-slate-900 shadow-2xl rounded p-6 print:p-0 print:shadow-none print:rounded-none"
          style={{
            width: `${report.pageWidth}px`,
            minHeight: `${report.pageHeight}px`,
          }}
        >
          {/* Printable columns area */}
          <div className="relative mx-auto print:mx-auto" style={{ width: `${report.columnWidth}px` }}>
            {/* Title */}
            {report.bands.title && (
              <div className="relative" style={{ height: `${report.bands.title.height}px` }}>
                {report.bands.title.elements.map((el) => renderSimulatedElement(el, mockRows[0]))}
              </div>
            )}

            {/* Page Header */}
            {report.bands.pageHeader && (
              <div className="relative" style={{ height: `${report.bands.pageHeader.height}px` }}>
                {report.bands.pageHeader.elements.map((el) => renderSimulatedElement(el, mockRows[0]))}
              </div>
            )}

            {/* Column Header */}
            {report.bands.columnHeader && (
              <div className="relative" style={{ height: `${report.bands.columnHeader.height}px` }}>
                {report.bands.columnHeader.elements.map((el) => renderSimulatedElement(el, mockRows[0]))}
              </div>
            )}

            {/* Group Sections or Direct Detail */}
            {groupedData.map((grp, gIdx) => (
              <div key={gIdx} className="space-y-0.5">
                {/* Group Header Band */}
                {report.groups &&
                  report.groups.map(
                    (g) =>
                      g.headerBand && (
                        <div
                          key={`gh-${g.id}-${gIdx}`}
                          className="relative"
                          style={{ height: `${g.headerBand.height}px` }}
                        >
                          {g.headerBand.elements.map((el) =>
                            renderSimulatedElement(el, grp.rows[0])
                          )}
                        </div>
                      )
                  )}

                {/* Detail (Repeated for each row inside this group) */}
                {report.bands.detail &&
                  grp.rows.map((row, rIdx) => (
                    <div
                      key={`dt-${gIdx}-${rIdx}`}
                      className="relative"
                      style={{ height: `${report.bands.detail.height}px` }}
                    >
                      {report.bands.detail.elements.map((el) =>
                        renderSimulatedElement(el, row, undefined, rIdx + 1)
                      )}
                    </div>
                  ))}

                {/* Group Footer Band with Real Subtotal */}
                {report.groups &&
                  report.groups.map(
                    (g) =>
                      g.footerBand && (
                        <div
                          key={`gf-${g.id}-${gIdx}`}
                          className="relative"
                          style={{ height: `${g.footerBand.height}px` }}
                        >
                          {g.footerBand.elements.map((el) =>
                            renderSimulatedElement(el, grp.rows[0], grp.subtotal)
                          )}
                        </div>
                      )
                  )}
              </div>
            ))}

            {/* Column Footer */}
            {report.bands.columnFooter && (
              <div className="relative" style={{ height: `${report.bands.columnFooter.height}px` }}>
                {report.bands.columnFooter.elements.map((el) => renderSimulatedElement(el, mockRows[0]))}
              </div>
            )}

            {/* Summary (Total Geral) */}
            {report.bands.summary && (
              <div className="relative mt-2" style={{ height: `${report.bands.summary.height}px` }}>
                {report.bands.summary.elements.map((el) =>
                  renderSimulatedElement(
                    el,
                    {
                      ...mockRows[0],
                      VLRNOTA: totalGeral.toFixed(2),
                      VLRTOT: totalGeral.toFixed(2),
                      VLRDESDOB: totalGeral.toFixed(2),
                    },
                    totalGeral
                  )
                )}
              </div>
            )}

            {/* Page Footer */}
            {report.bands.pageFooter && (
              <div className="relative mt-8" style={{ height: `${report.bands.pageFooter.height}px` }}>
                {report.bands.pageFooter.elements.map((el) => renderSimulatedElement(el, mockRows[0]))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
