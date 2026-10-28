'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { BarcodeVisual } from '../engine/barcode';
import { SVGChart } from '../engine/chart';
import { CrosstabVisual } from '../engine/crosstab';
import { Image as ImageIcon, FolderGit2, Sparkles } from 'lucide-react';
import {
  JRXMLElement,
  JRXMLStaticText,
  JRXMLTextField,
  JRXMLRectangle,
  JRXMLLine,
  JRXMLBarcode,
  JRXMLChart,
  JRXMLCrosstab,
  JRXMLImage,
  JRXMLSubreport,
} from '../types/jrxml';
import { SankhyaCatalogComponent, ComponentCustomProps } from '../engine/sankhya-components';

interface SankhyaComponentPreviewProps {
  component: SankhyaCatalogComponent;
  customProps?: ComponentCustomProps;
  columnWidth?: number;
  mode?: 'thumbnail' | 'full';
  className?: string;
  onClick?: () => void;
}

function evaluateTernary(
  cond: string,
  branchA: string,
  branchB: string,
  sampleResolver: (key: string) => string
): string {
  const cleanCond = cond.trim();
  const eqMatch = cleanCond.match(/(\$[FVP]\{[^}]+\})\s*==\s*"([^"]+)"/);
  if (eqMatch) {
    const val = sampleResolver(eqMatch[1]);
    return (val === eqMatch[2] ? branchA : branchB).trim();
  }

  const notNullMatch = cleanCond.match(/(\$[FVP]\{[^}]+\})\s*!=\s*null/);
  if (notNullMatch) {
    const val = sampleResolver(notNullMatch[1]);
    return val && val !== 'null' && !val.startsWith('$F{') ? branchA.trim() : branchB.trim();
  }

  return branchA.trim();
}

/**
 * Mock data resolver for realistic preview representation
 */
function resolveSankhyaSampleText(expr?: string): string {
  if (!expr) return '';
  if (/^"[^"]*"$/.test(expr)) return expr.slice(1, -1);

  let result = expr.trim();

  // Strip Java wrapper calls e.g. CustomReportUtils.str(...), String.valueOf(...)
  result = result.replace(/(?:br\.com\.sankhya\.[\w\.]+\.)?CustomReportUtils\.str\s*\(([^()]+)\)/g, '$1');
  result = result.replace(/(?:java\.lang\.)?String\.valueOf\s*\(([^()]+)\)/g, '$1');

  const samples: Record<string, string> = {
    // 1. Fiscal & Vendas (TGFCAB, TGFITE, TGFPAR)
    '$F{NUMNOTA}': '128401',
    '$F{CODPARC}': '1042',
    '$F{NOMEPARC}': 'SANKHYA GESTAO DE NEGOCIOS S/A',
    '$F{CGC_CPF}': '12.345.678/0001-90',
    '$F{DTNEG}': '21/10/2026',
    '$F{BASEICMS}': '15.420,00',
    '$F{VLRICMS}': '2.775,60',
    '$F{BASESUBST}': '18.500,00',
    '$F{VLRSUBST}': '845,30',
    '$F{VLRPROD}': '15.420,00',
    '$F{VLRFRETE}': '180,00',
    '$F{VLRDESC}': '0,00',
    '$F{VLRTOT}': '15.420,00',
    '$F{OUTRASDESP}': '0,00',
    '$F{VLRIPI}': '0,00',
    '$F{VLRNOTA}': '16.445,30',
    '$F{NOMEPARC_TRANSP}': 'EXPRESSO BRASIL LOGISTICA LTDA',
    '$F{CIF_FOB}': 'C',
    '$F{PLACA}': 'ABC-1234',
    '$F{UFVEICULO}': 'MG',
    '$F{QTDVOL}': '12',
    '$F{ESPECIE}': 'CX',
    '$F{PESOBRUTO}': '145,50',
    '$F{DTVENC}': '25/11/2026',
    '$F{VLRDESDOB}': '16.445,30',
    '$F{DESCRPROD}': 'PARAFUSO SEXTAVADO INOX 304 1/4 X 2',
    '$F{CODPROD}': '40281',
    '$F{VLRUNIT}': '14,80',
    '$F{QTDNEG}': '50,00',
    '$F{LOGRADOURO}': 'AV. BRASIL',
    '$F{NUMEND}': '1500',
    '$F{BAIRRO}': 'CENTRO',
    '$F{CIDADE}': 'UBERLANDIA',
    '$F{UF}': 'MG',
    '$F{CEP}': '38400-000',
    '$F{OBSERVACAO}':
      'DOCUMENTO EMITIDO POR ME OU EPP OPTANTE PELO SIMPLES NACIONAL; NAO GERA DIREITO A CREDITO FISCAL DE IPI.',
    '$F{CHAVENFE}': '35261012345678000195550010000284011000284010',

    // 2. Boleto Bancário FEBRABAN
    '$F{LINHA_DIGITAVEL}': '34191.79001 01043.510047 91020.150008 5 91750000164453',
    '$F{COD_BARRAS}': '34195917500001644531790001043510049102015000',
    '$F{NOSSONUM}': '09/12345678-9',
    '$F{BANCO_NOME}': 'BANCO ITAÚ UNIBANCO S.A. (341)',
    '$F{AGENCIA_CONTA}': '1234 / 56789-0',
    '$F{CEDENTE_NOME}': 'SANKHYA GESTAO DE NEGOCIOS S/A',
    '$F{CEDENTE_CNPJ}': '05.847.123/0001-44',
    '$F{SACADO_NOME}': 'DISTRIBUIDORA ALFA BRASIL LTDA',
    '$F{SACADO_CPF}': '12.345.678/0001-90',
    '$F{VLRBOLETO}': '16.445,30',
    '$F{INSTRUCOES}': 'APOS O VENCIMENTO COBRAR MULTA DE 2% E JUROS DE 1% AO MES',

    // 3. Emitente / Filial (TSIEMP)
    '$F{RAZAOSOCIAL_EMP}': 'SANKHYA TECNOLOGIA DA INFORMACAO S.A.',
    '$F{CNPJ_EMP}': '05.847.123/0001-44',
    '$F{CGC_EMP}': '05.847.123/0001-44',
    '$F{INSCREST_EMP}': '062.847.123.001',
    '$F{INSCEST_EMP}': '062.847.123.001',
    '$F{END_EMP}': 'AV. BRASIL, 1500 - CENTRO - UBERLANDIA/MG - CEP 38400-000',
    '$F{LOGRADOURO_EMP}': 'AV. BRASIL',
    '$F{NUMERO_EMP}': '1500',
    '$F{CIDADE_EMP}': 'UBERLANDIA',
    '$F{UF_EMP}': 'MG',
    '$F{TEL_EMP}': '(34) 3239-0000',
    '$F{EMAIL_EMP}': 'contato@sankhya.com.br',

    // 4. Retenções Federais (TGFRET, TGFFIN)
    '$F{VLR_PIS_RET}': '100,23',
    '$F{VLRPISRET}': '100,23',
    '$F{VLR_COFINS_RET}': '462,60',
    '$F{VLRCOFINSRET}': '462,60',
    '$F{VLR_CSLL_RET}': '154,20',
    '$F{VLRCSLLRET}': '154,20',
    '$F{VLR_IRRF_RET}': '231,30',
    '$F{VLRIRFRET}': '231,30',
    '$F{VLR_ISS_RET}': '308,40',
    '$F{VLRISSRET}': '308,40',
    '$F{TOTRET}': '1.256,73',

    // 5. Romaneio e Picking / WMS (TGFEST, TGFCTE)
    '$F{LOCAL_ESTOQUE}': 'GALPAO PRINCIPAL - MATRIZ',
    '$F{RUA}': 'RUA B',
    '$F{PREDIO}': 'PRD 04',
    '$F{NIVEL}': 'NV 02',
    '$F{LOTE}': 'LT-202610A',
    '$F{CONTROLE}': 'LT-202610A',
    '$F{DTVAL}': '21/10/2028',
    '$F{CONFERENCIA}': 'CONFIRMADA',
    '$F{MOTORISTA}': 'CARLOS EDUARDO SILVA',
    '$F{PLACA_VEIC}': 'BRA-2E19',

    // 6. Recursos Humanos / Holerite (TFPFUN, TFPHOL)
    '$F{PROVENTOS}': '8.450,00',
    '$F{DESCONTOS}': '1.890,25',
    '$F{SALARIO_BASE}': '4.680,00',
    '$F{SALARIOBASE}': '4.680,00',
    '$F{BASE_INSS}': '4.680,00',
    '$F{BASE_FGTS}': '4.680,00',
    '$F{VLR_LIQUIDO}': '3.952,80',
    '$F{LIQUIDO}': '3.952,80',
    '$F{MES_COMPETENCIA}': 'OUTUBRO / 2026',

    // 7. Ordem de Serviço (TCSOSE, TCSITE)
    '$F{NUMOS}': 'OS-84920',
    '$F{EQUIPAMENTO}': 'IMPRESSORA TERMICA ZEBRA ZD220',
    '$F{NUMSERIE}': 'ZB-9482014',
    '$F{DEFEITO}': 'FALHA NA TRACAO DA BOBINA E DESALINHAMENTO DO CABECOTE',
    '$F{DEFEITO_RELATADO}': 'FALHA NA TRACAO DA BOBINA E DESALINHAMENTO DO CABECOTE',
    '$F{LAUDO_TECNICO}': 'SUBSTITUICAO DA FONTE DE ALIMENTACAO E FUSIVEL PRIMARIO',
    '$F{STATUS_OS}': 'CONCLUIDA / APROVADA',

    // 8. Chaves Comerciais & Tributárias Adicionais
    '$F{CODTIPOPER}': '1001',
    '$F{STATUSNOTA}': 'L',
    '$F{CODVEND}': '102',
    '$F{APELIDO_VEND}': 'CARLOS SILVA',
    '$F{COMISSAO}': '3,50',
    '$F{VLRFED}': '2.211,89',
    '$F{VLREST}': '2.960,15',
    '$F{NUMNOTA_ORIG}': '104820',
    '$F{MOTIVODEV}': 'MERCADORIA EM DESACORDO COM O PEDIDO DE COMPRA',
    '$F{CODCR}': '02.01',
    '$F{DESCRNAT}': 'RECEITA COM VENDAS DE MERCADORIAS',
    '$P{NOMEUSU}': 'VICTOR',
    '$V{PAGE_NUMBER}': '1',
    '$V{PAGE_COUNT}': '1',
    '$V{REPORT_COUNT}': '1',
    'new java.util.Date()': '21/10/2026 14:30:00',
    'new java.math.BigDecimal(0)': '0,00',
  };

  const sampleResolver = (key: string): string => {
    if (samples[key]) return samples[key];
    if (key.includes('.')) {
      const afterDot = key.split('.').pop()!.trim();
      if (samples[`$F{${afterDot}}`]) return samples[`$F{${afterDot}}`];
    }
    return '';
  };

  // Evaluate ternaries before string concatenation
  // 1. Parenthesized ternaries: (...) ? ... : ... or "text " + (cond ? a : b)
  result = result.replace(/\(\s*([^\?]+?)\s*\?\s*([^:]+?)\s*:\s*([^()]+?)\s*\)/g, (_, cond, branchA, branchB) => {
    return evaluateTernary(cond, branchA, branchB, sampleResolver);
  });

  // 2. Top-level ternary
  if (result.includes('?') && result.includes(':')) {
    result = result.replace(/^([^\?]+?)\s*\?\s*([^:]+?)\s*:\s*(.+)$/, (_, cond, branchA, branchB) => {
      return evaluateTernary(cond, branchA, branchB, sampleResolver);
    });
  }

  // Direct replace of sample tokens
  for (const [k, v] of Object.entries(samples)) {
    if (result.includes(k)) {
      result = result.replaceAll(k, v);
    }
  }

  // Fallback for dotted aliases: $F{CAB.NUMNOTA} -> NUMNOTA
  result = result.replace(/\$F\{([^}]+)\}/g, (fullMatch, fieldName) => {
    const cleanName = fieldName.trim();
    if (samples[`$F{${cleanName}}`]) return samples[`$F{${cleanName}}`];
    if (cleanName.includes('.')) {
      const afterDot = cleanName.split('.').pop()!.trim();
      if (samples[`$F{${afterDot}}`]) return samples[`$F{${afterDot}}`];
    }
    return fullMatch;
  });

  // Clean string concatenations: "text" + "text" -> texttext
  result = result
    .replace(/"\s*\+\s*"/g, '')
    .replace(/"\s*\+\s*/g, '')
    .replace(/\s*\+\s*"/g, '')
    .replace(/^"|"$/g, '');

  // Remaining unresolved tokens default to sensible placeholder
  result = result.replace(/\$[FVP]\{[^}]+\}/g, 'VALOR');

  return result.trim();
}

/**
 * Single JRXML Element Renderer for Component Preview
 */
const PreviewElementRenderer: React.FC<{
  elem: JRXMLElement;
  mode: 'thumbnail' | 'full';
}> = ({ elem, mode }) => {
  const rel = elem.reportElement;

  switch (elem.type) {
    case 'staticText': {
      const st = elem as JRXMLStaticText;
      const te = st.textElement;
      const font = te?.font;

      const alignMap: Record<string, string> = {
        Left: 'justify-start text-left',
        Center: 'justify-center text-center',
        Right: 'justify-end text-right',
        Justified: 'justify-between text-justify',
      };

      const valigMap: Record<string, string> = {
        Top: 'items-start',
        Middle: 'items-center',
        Bottom: 'items-end',
      };

      return (
        <div
          className={`w-full h-full flex overflow-hidden leading-tight select-none px-0.5 ${
            alignMap[te?.textAlignment || 'Left'] || 'justify-start text-left'
          } ${valigMap[te?.verticalAlignment || 'Top'] || 'items-start'}`}
          style={{
            fontSize: font?.size ? `${font.size}px` : '8px',
            fontWeight: font?.isBold ? 'bold' : 'normal',
            fontStyle: font?.isItalic ? 'italic' : 'normal',
            textDecoration: font?.isUnderline ? 'underline' : 'none',
            color: rel.forecolor || '#334155',
          }}
        >
          <span className="truncate w-full block">{st.text}</span>
        </div>
      );
    }

    case 'textField': {
      const tf = elem as JRXMLTextField;
      const te = tf.textElement;
      const font = te?.font;

      const alignMap: Record<string, string> = {
        Left: 'justify-start text-left',
        Center: 'justify-center text-center',
        Right: 'justify-end text-right',
        Justified: 'justify-between text-justify',
      };

      const valigMap: Record<string, string> = {
        Top: 'items-start',
        Middle: 'items-center',
        Bottom: 'items-end',
      };

      const displayText = resolveSankhyaSampleText(tf.expression);

      return (
        <div
          className={`w-full h-full flex overflow-hidden leading-tight select-none px-0.5 ${
            alignMap[te?.textAlignment || 'Left'] || 'justify-start text-left'
          } ${valigMap[te?.verticalAlignment || 'Top'] || 'items-start'}`}
          style={{
            fontSize: font?.size ? `${font.size}px` : '8px',
            fontWeight: font?.isBold ? 'bold' : 'normal',
            fontStyle: font?.isItalic ? 'italic' : 'normal',
            textDecoration: font?.isUnderline ? 'underline' : 'none',
            color: rel.forecolor || '#0F172A',
          }}
        >
          <span className="truncate w-full block">{displayText}</span>
        </div>
      );
    }

    case 'rectangle': {
      const rc = elem as JRXMLRectangle;
      const borderWidth = rc.penWidth !== undefined ? rc.penWidth : 1;
      const borderColor = rc.penColor || '#CBD5E1';

      return (
        <div
          className="w-full h-full pointer-events-none"
          style={{
            borderRadius: rc.radius ? `${rc.radius}px` : '2px',
            borderWidth: `${borderWidth}px`,
            borderColor,
            borderStyle: 'solid',
            backgroundColor:
              rel.mode === 'Transparent' ? 'transparent' : rel.backcolor || '#F8FAFC',
          }}
        />
      );
    }

    case 'line': {
      const ln = elem as JRXMLLine;
      const strokeWidth = ln.penWidth || 1;
      const strokeColor = ln.penColor || rel.forecolor || '#94A3B8';
      const isVertical = rel.width <= 1 && rel.height > 1;

      return (
        <svg
          className="w-full h-full overflow-visible pointer-events-none"
          style={{
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

    case 'barcode': {
      const bc = elem as JRXMLBarcode;
      const resolved = resolveSankhyaSampleText(bc.expression);
      const cleanVal =
        resolved.replace(/["'$FP{}]/g, '').trim() ||
        '35261012345678000195550010000284011000284010';

      return (
        <div className="w-full h-full flex items-center justify-center overflow-hidden bg-white/60 rounded p-0.5">
          <BarcodeVisual
            type={bc.barcodeType}
            value={cleanVal}
            width={rel.width - 4}
            height={rel.height - 4}
            textPosition={bc.textPosition}
            forecolor={rel.forecolor || '#000000'}
          />
        </div>
      );
    }

    case 'chart': {
      const ch = elem as JRXMLChart;
      return (
        <div className="w-full h-full rounded border border-emerald-500/40 bg-white overflow-hidden flex flex-col pointer-events-none">
          <SVGChart
            type={ch.chartType || 'barChart'}
            title={ch.title}
            width={rel.width}
            height={rel.height}
            isShowLegend={ch.isShowLegend !== false}
            isShowLabels={ch.isShowLabels !== false}
            isDarkCanvas={false}
          />
        </div>
      );
    }

    case 'crosstab': {
      const ct = elem as JRXMLCrosstab;
      return (
        <div className="w-full h-full pointer-events-none rounded overflow-hidden">
          <CrosstabVisual
            crosstab={ct}
            width={rel.width}
            height={rel.height}
            isDarkCanvas={false}
          />
        </div>
      );
    }

    case 'image': {
      return (
        <div className="w-full h-full border border-dashed border-pink-400 bg-pink-50/60 flex flex-col items-center justify-center text-pink-700 text-[8px] p-0.5 font-mono">
          <ImageIcon className="w-3 h-3 text-pink-500 mb-0.5" />
          <span>[IMAGEM]</span>
        </div>
      );
    }

    case 'subreport': {
      return (
        <div className="w-full h-full border border-dashed border-indigo-400 bg-indigo-50/60 flex items-center justify-center space-x-1 text-indigo-700 text-[8px] p-0.5 font-mono">
          <FolderGit2 className="w-3 h-3 text-indigo-500" />
          <span>&lt;subreport&gt;</span>
        </div>
      );
    }

    default:
      return null;
  }
};

export const SankhyaComponentPreview: React.FC<SankhyaComponentPreviewProps> = ({
  component,
  customProps,
  columnWidth = 555,
  mode = 'thumbnail',
  className = '',
  onClick,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(mode === 'thumbnail' ? 260 : columnWidth);

  // Measure container width for responsive scaling
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          setContainerWidth(entry.contentRect.width);
        }
      }
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Generate JRXML elements in real-time
  const elements = useMemo(() => {
    return component.generate(columnWidth, customProps);
  }, [component, columnWidth, customProps]);

  // Compute bounding box height
  const totalHeight = useMemo(() => {
    if (!elements.length) return component.height || 60;
    const maxY = Math.max(...elements.map((e) => (e.reportElement?.y || 0) + (e.reportElement?.height || 0)));
    return Math.max(maxY + 4, component.height || 60);
  }, [elements, component.height]);

  // Calculate proportional scale
  const scale = useMemo(() => {
    if (mode === 'full') {
      return Math.min(1, containerWidth / columnWidth);
    }
    // Thumbnail mode
    return Math.min(1, containerWidth / columnWidth);
  }, [mode, containerWidth, columnWidth]);

  const scaledHeight = totalHeight * scale;

  if (mode === 'thumbnail') {
    return (
      <div
        ref={containerRef}
        onClick={onClick}
        className={`w-full overflow-hidden select-none bg-slate-900/60 rounded border border-slate-800/80 hover:border-emerald-500/50 transition relative group ${className}`}
        style={{ height: `${Math.max(38, Math.min(scaledHeight, 95))}px` }}
      >
        {/* Scale Container */}
        <div
          className="absolute top-0 left-0 bg-white"
          style={{
            width: `${columnWidth}px`,
            height: `${totalHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {elements.map((elem) => {
            const rel = elem.reportElement;
            const isLine = elem.type === 'line';
            return (
              <div
                key={elem.id}
                className={isLine ? 'absolute overflow-visible' : 'absolute overflow-hidden'}
                style={{
                  left: `${rel.x}px`,
                  top: `${rel.y}px`,
                  width: `${Math.max(rel.width, 1)}px`,
                  height: `${Math.max(rel.height, 1)}px`,
                }}
              >
                <PreviewElementRenderer elem={elem} mode="thumbnail" />
              </div>
            );
          })}
        </div>

        {/* Subtle Bottom Fade if clamped */}
        {scaledHeight > 95 && (
          <div className="absolute inset-x-0 bottom-0 h-4 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
        )}
      </div>
    );
  }

  // mode === 'full'
  return (
    <div
      ref={containerRef}
      className={`w-full flex flex-col items-center justify-start overflow-auto p-4 bg-slate-950/60 rounded-xl border border-slate-800 ${className}`}
    >
      {/* Paper Sheet Preview Container */}
      <div
        className="relative bg-white shadow-2xl rounded-md border border-slate-300 transition-all select-none"
        style={{
          width: `${columnWidth * scale}px`,
          height: `${totalHeight * scale}px`,
        }}
      >
        <div
          className="absolute top-0 left-0 bg-white"
          style={{
            width: `${columnWidth}px`,
            height: `${totalHeight}px`,
            transform: `scale(${scale})`,
            transformOrigin: 'top left',
          }}
        >
          {elements.map((elem) => {
            const rel = elem.reportElement;
            const isLine = elem.type === 'line';
            return (
              <div
                key={elem.id}
                className={isLine ? 'absolute overflow-visible' : 'absolute overflow-hidden'}
                style={{
                  left: `${rel.x}px`,
                  top: `${rel.y}px`,
                  width: `${Math.max(rel.width, 1)}px`,
                  height: `${Math.max(rel.height, 1)}px`,
                }}
              >
                <PreviewElementRenderer elem={elem} mode="full" />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
