import React from 'react';
import { BarcodeType } from '../types/jrxml';

interface BarcodeSVGProps {
  type: BarcodeType;
  value: string;
  width: number;
  height: number;
  textPosition?: 'none' | 'bottom' | 'top';
  forecolor?: string;
}

/**
 * Tabela de codificação Interleaved 2 of 5 (I25 / FEBRABAN)
 * Cada dígito possui 5 elementos: 2 largos (W) e 3 estreitos (N)
 */
const I25_PATTERNS: Record<string, string> = {
  '0': 'NNWWN',
  '1': 'WNNNW',
  '2': 'NWNNW',
  '3': 'WWNNN',
  '4': 'NNWNW',
  '5': 'WNWNN',
  '6': 'NWWNN',
  '7': 'NNNWW',
  '8': 'WNNWN',
  '9': 'NWNWN',
};

interface BarElement {
  isBar: boolean;
  widthUnits: number;
}

/**
 * Converte linha digitável (47 dígitos) em código de barras FEBRABAN (44 dígitos)
 */
function linhaDigitavelToBarcode44(linha: string): string {
  const digits = linha.replace(/\D/g, '');
  if (digits.length !== 47) return digits;

  const bancoMoeda = digits.slice(0, 4);
  const campo1Livre = digits.slice(4, 9);
  const campo2Livre = digits.slice(10, 20);
  const campo3Livre = digits.slice(21, 31);
  const dvGeral = digits.slice(32, 33);
  const fatorValor = digits.slice(33, 47);

  return `${bancoMoeda}${dvGeral}${fatorValor}${campo1Livre}${campo2Livre}${campo3Livre}`;
}

function formatBoletoDisplay(digits: string): string {
  if (digits.length === 47) {
    return `${digits.slice(0, 5)}.${digits.slice(5, 10)} ${digits.slice(10, 15)}.${digits.slice(15, 21)} ${digits.slice(21, 26)}.${digits.slice(26, 32)} ${digits.slice(32, 33)} ${digits.slice(33)}`;
  }
  if (digits.length === 44) {
    return `${digits.slice(0, 4)}.${digits.slice(4, 9)} ${digits.slice(9, 19)} ${digits.slice(19, 24)} ${digits.slice(24, 34)} ${digits.slice(34)}`;
  }
  return digits;
}

/**
 * Gera barras e espaços vetoriais no padrão Interleaved 2 of 5 (Boleto Bancário FEBRABAN)
 */
function generateI25Elements(value: string, wideRatio = 2.5): { elements: BarElement[]; cleanDigits: string } {
  let digits = value.replace(/\D/g, '');

  // Fallback para boleto padrão de 44 dígitos se for vazio ou expressão
  if (digits.length < 2) {
    digits = '34191790010104351004791020150008291070026000';
  } else if (digits.length === 47 || digits.length === 48) {
    digits = linhaDigitavelToBarcode44(digits);
  }

  // I25 codifica pares de dígitos
  if (digits.length % 2 !== 0) {
    digits = '0' + digits;
  }

  const elements: BarElement[] = [];

  // Start pattern: Bar N, Space N, Bar N, Space N
  elements.push(
    { isBar: true, widthUnits: 1 },
    { isBar: false, widthUnits: 1 },
    { isBar: true, widthUnits: 1 },
    { isBar: false, widthUnits: 1 }
  );

  // Pares de dígitos intercalados
  for (let i = 0; i < digits.length; i += 2) {
    const d1 = digits[i];
    const d2 = digits[i + 1];
    const p1 = I25_PATTERNS[d1] || 'NNWWN';
    const p2 = I25_PATTERNS[d2] || 'NNWWN';

    for (let k = 0; k < 5; k++) {
      elements.push({
        isBar: true,
        widthUnits: p1[k] === 'W' ? wideRatio : 1,
      });
      elements.push({
        isBar: false,
        widthUnits: p2[k] === 'W' ? wideRatio : 1,
      });
    }
  }

  // Stop pattern: Bar W, Space N, Bar N
  elements.push(
    { isBar: true, widthUnits: wideRatio },
    { isBar: false, widthUnits: 1 },
    { isBar: true, widthUnits: 1 }
  );

  return { elements, cleanDigits: digits };
}

/**
 * Deterministic bar widths generator for 1D barcodes
 */
function generate1DBars(value: string, count: number): number[] {
  const bars: number[] = [];
  let seed = 0;
  for (let i = 0; i < value.length; i++) {
    seed = (seed * 31 + value.charCodeAt(i)) >>> 0;
  }

  // Guard rails
  bars.push(2, 1, 2); // Start pattern

  for (let i = 0; i < count; i++) {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    const w = (seed % 3) + 1; // 1, 2, or 3 units
    bars.push(w);
  }

  bars.push(2, 1, 2); // Stop pattern
  return bars;
}

/**
 * 2D Matrix generator for QR Code & DataMatrix
 */
function generate2DMatrix(size: number, seedStr: string): boolean[][] {
  const matrix: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false)
  );

  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }

  // Fill pseudo-random cells
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      seed = (seed * 1664525 + 1013904223) >>> 0;
      matrix[r][c] = (seed % 100) < 48;
    }
  }

  // Draw 3 QR Finder Patterns (Top-Left, Top-Right, Bottom-Left)
  const drawFinder = (top: number, left: number) => {
    for (let r = 0; r < 7; r++) {
      for (let c = 0; c < 7; c++) {
        const isBorder = r === 0 || r === 6 || c === 0 || c === 6;
        const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4;
        matrix[top + r][left + c] = isBorder || isCenter;
      }
    }
  };

  if (size >= 15) {
    drawFinder(0, 0);
    drawFinder(0, size - 7);
    drawFinder(size - 7, 0);
  }

  return matrix;
}

export const BarcodeVisual: React.FC<BarcodeSVGProps> = ({
  type,
  value,
  width,
  height,
  textPosition = 'bottom',
  forecolor = '#000000',
}) => {
  const displayVal = value || '35261012345678000195550010000284011000284010';
  const showText = textPosition !== 'none';
  const textHeight = showText ? 12 : 0;
  const barHeight = Math.max(10, height - textHeight);

  if (type === 'QRCode' || type === 'DataMatrix') {
    const matrixSize = type === 'QRCode' ? 21 : 16;
    const matrix = generate2DMatrix(matrixSize, displayVal);
    const cellSize = Math.min(width, height) / matrixSize;
    const startX = Math.max(0, (width - cellSize * matrixSize) / 2);
    const startY = Math.max(0, (height - cellSize * matrixSize) / 2);

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full pointer-events-none select-none"
      >
        <rect width={width} height={height} fill="transparent" />
        {matrix.map((row, r) =>
          row.map((cell, c) =>
            cell ? (
              <rect
                key={`${r}-${c}`}
                x={startX + c * cellSize}
                y={startY + r * cellSize}
                width={cellSize}
                height={cellSize}
                fill={forecolor}
              />
            ) : null
          )
        )}
      </svg>
    );
  }

  // Interleaved 2 of 5 (Boleto Bancário FEBRABAN)
  if (type === 'Interleaved2Of5') {
    const { elements, cleanDigits } = generateI25Elements(displayVal, 2.5);
    const totalUnits = elements.reduce((acc, el) => acc + el.widthUnits, 0);
    const unitWidth = width / totalUnits;
    const displayText = formatBoletoDisplay(cleanDigits);

    let currentX = 0;

    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-full pointer-events-none select-none"
      >
        <rect width={width} height={height} fill="transparent" />

        {textPosition === 'top' && (
          <text
            x={width / 2}
            y={textHeight - 2}
            textAnchor="middle"
            fontSize="9"
            fontFamily="monospace"
            fill={forecolor}
          >
            {displayText}
          </text>
        )}

        <g transform={textPosition === 'top' ? `translate(0, ${textHeight})` : undefined}>
          {elements.map((el, idx) => {
            const x = currentX;
            const w = el.widthUnits * unitWidth;
            currentX += w;

            if (!el.isBar) return null;

            return (
              <rect
                key={idx}
                x={x}
                y={0}
                width={w}
                height={barHeight}
                fill={forecolor}
              />
            );
          })}
        </g>

        {textPosition === 'bottom' && (
          <text
            x={width / 2}
            y={height - 2}
            textAnchor="middle"
            fontSize="9"
            fontFamily="monospace"
            fill={forecolor}
          >
            {displayText}
          </text>
        )}
      </svg>
    );
  }

  // 1D Barcode (Code128, EAN13, Code39)
  const barCount = type === 'EAN13' ? 30 : 50;
  const bars = generate1DBars(displayVal, barCount);
  const totalUnits = bars.reduce((a, b) => a + b, 0);
  const unitWidth = width / totalUnits;

  let currentX = 0;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full h-full pointer-events-none select-none"
    >
      <rect width={width} height={height} fill="transparent" />

      {textPosition === 'top' && (
        <text
          x={width / 2}
          y={textHeight - 2}
          textAnchor="middle"
          fontSize="9"
          fontFamily="monospace"
          fill={forecolor}
        >
          {displayVal.length > 32 ? `${displayVal.slice(0, 32)}...` : displayVal}
        </text>
      )}

      <g transform={textPosition === 'top' ? `translate(0, ${textHeight})` : undefined}>
        {bars.map((w, idx) => {
          const x = currentX;
          currentX += w * unitWidth;
          const isBlack = idx % 2 === 0;

          if (!isBlack) return null;

          return (
            <rect
              key={idx}
              x={x}
              y={0}
              width={w * unitWidth}
              height={barHeight}
              fill={forecolor}
            />
          );
        })}
      </g>

      {textPosition === 'bottom' && (
        <text
          x={width / 2}
          y={height - 2}
          textAnchor="middle"
          fontSize="9"
          fontFamily="monospace"
          fill={forecolor}
        >
          {displayVal.length > 32 ? `${displayVal.slice(0, 32)}...` : displayVal}
        </text>
      )}
    </svg>
  );
};
