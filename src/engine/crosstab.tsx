import React from 'react';
import { Table2 } from 'lucide-react';
import { JRXMLCrosstab } from '../types/jrxml';

interface CrosstabVisualProps {
  crosstab: JRXMLCrosstab;
  width: number;
  height: number;
  isDarkCanvas?: boolean;
  sampleRows?: string[];
  sampleCols?: string[];
  sampleMatrix?: number[][];
}

const DEFAULT_SAMPLE_COLS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai'];
const DEFAULT_SAMPLE_ROWS = ['Matriz SP', 'Filial RJ', 'Filial BH', 'Filial PR'];
const DEFAULT_SAMPLE_MATRIX = [
  [12450.0, 15800.5, 14200.0, 18900.0, 21500.0],
  [8900.0, 9400.0, 11200.0, 10500.0, 13400.0],
  [6500.0, 7200.0, 8100.0, 7900.0, 9200.0],
  [4300.0, 5100.0, 4800.0, 6200.0, 7100.0],
];

export const CrosstabVisual: React.FC<CrosstabVisualProps> = ({
  crosstab,
  width,
  height,
  isDarkCanvas = false,
  sampleRows = DEFAULT_SAMPLE_ROWS,
  sampleCols = DEFAULT_SAMPLE_COLS,
  sampleMatrix = DEFAULT_SAMPLE_MATRIX,
}) => {
  const rowGroupName = crosstab.rowGroup.name || 'Linha';
  const colGroupName = crosstab.columnGroup.name || 'Coluna';
  const rowTotalActive = crosstab.rowGroup.totalPosition !== 'None';
  const colTotalActive = crosstab.columnGroup.totalPosition !== 'None';

  // Format currency
  const formatVal = (val: number) => {
    return val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Row totals
  const rowTotals = sampleRows.map((_, rIdx) => {
    return sampleMatrix[rIdx]?.reduce((acc, curr) => acc + curr, 0) || 0;
  });

  // Col totals
  const colTotals = sampleCols.map((_, cIdx) => {
    return sampleRows.reduce((acc, _, rIdx) => acc + (sampleMatrix[rIdx]?.[cIdx] || 0), 0);
  });

  // Grand total
  const grandTotal = rowTotals.reduce((acc, curr) => acc + curr, 0);

  // Colors
  const bgColor = isDarkCanvas ? 'bg-slate-950 text-slate-200' : 'bg-white text-slate-800';
  const borderColor = isDarkCanvas ? 'border-slate-800' : 'border-slate-200';
  const headerBg = isDarkCanvas ? 'bg-slate-900 text-slate-200' : 'bg-slate-100 text-slate-700';
  const totalBg = isDarkCanvas ? 'bg-slate-900/70 text-emerald-400 font-semibold' : 'bg-slate-50 text-emerald-800 font-semibold';
  const altRowBg = isDarkCanvas ? 'bg-slate-900/30' : 'bg-slate-50/50';

  return (
    <div
      className={`w-full h-full border ${borderColor} ${bgColor} overflow-hidden flex flex-col text-[10px] select-none rounded`}
      style={{ width: `${width}px`, height: `${height}px` }}
    >
      {/* Top Banner Tag */}
      <div className="bg-purple-950/40 border-b border-purple-800/40 px-2 py-0.5 flex items-center justify-between shrink-0">
        <div className="flex items-center space-x-1.5 text-purple-300 font-semibold text-[9px]">
          <Table2 className="w-3 h-3 text-purple-400" />
          <span>Matriz Cruzada: {rowGroupName} × {colGroupName}</span>
        </div>
        <span className="text-[8px] bg-purple-900/60 text-purple-200 font-mono px-1 rounded">
          &lt;crosstab&gt;
        </span>
      </div>

      {/* Grid Content */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className={`border-b ${borderColor} ${headerBg}`}>
              <th className={`p-1.5 text-left border-r ${borderColor} font-bold text-[9px] min-w-[80px]`}>
                {rowGroupName} \ {colGroupName}
              </th>
              {sampleCols.map((col, idx) => (
                <th key={idx} className={`p-1 text-center border-r ${borderColor} font-semibold min-w-[55px]`}>
                  {col}
                </th>
              ))}
              {colTotalActive && (
                <th className={`p-1 text-center font-bold text-emerald-600 dark:text-emerald-400 min-w-[65px]`}>
                  Total
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sampleRows.map((rowName, rIdx) => (
              <tr
                key={rIdx}
                className={`border-b ${borderColor} ${rIdx % 2 === 1 ? altRowBg : ''}`}
              >
                {/* Row Header */}
                <td className={`p-1 text-left border-r ${borderColor} font-medium truncate max-w-[100px]`}>
                  {rowName}
                </td>
                {/* Cells */}
                {sampleCols.map((_, cIdx) => (
                  <td key={cIdx} className={`p-1 text-right border-r ${borderColor} font-mono text-[9px]`}>
                    {formatVal(sampleMatrix[rIdx]?.[cIdx] || 0)}
                  </td>
                ))}
                {/* Row Total */}
                {colTotalActive && (
                  <td className={`p-1 text-right font-mono text-[9px] ${totalBg}`}>
                    {formatVal(rowTotals[rIdx] || 0)}
                  </td>
                )}
              </tr>
            ))}

            {/* Total Row */}
            {rowTotalActive && (
              <tr className={`border-t-2 ${borderColor} ${headerBg}`}>
                <td className={`p-1 text-left border-r ${borderColor} font-bold text-[9px]`}>
                  Total Geral
                </td>
                {sampleCols.map((_, cIdx) => (
                  <td key={cIdx} className={`p-1 text-right border-r ${borderColor} font-mono font-bold text-[9px]`}>
                    {formatVal(colTotals[cIdx] || 0)}
                  </td>
                ))}
                {colTotalActive && (
                  <td className={`p-1 text-right font-mono font-bold text-[9.5px] text-emerald-500`}>
                    {formatVal(grandTotal)}
                  </td>
                )}
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
