import React from 'react';
import { ChartType } from '../types/jrxml';

interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

interface SVGChartProps {
  type: ChartType;
  title?: string;
  width: number;
  height: number;
  data?: ChartDataPoint[];
  isShowLegend?: boolean;
  isShowLabels?: boolean;
  isDarkCanvas?: boolean;
}

const DEFAULT_CHART_COLORS = [
  '#10b981', // emerald-500
  '#3b82f6', // blue-500
  '#f59e0b', // amber-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
  '#f97316', // orange-500
];

const DEFAULT_SAMPLE_DATA: ChartDataPoint[] = [
  { label: 'Matriz', value: 45000 },
  { label: 'Filial SP', value: 32000 },
  { label: 'Filial RJ', value: 21500 },
  { label: 'Filial MG', value: 16800 },
  { label: 'Filial PR', value: 12400 },
];

export const SVGChart: React.FC<SVGChartProps> = ({
  type,
  title,
  width,
  height,
  data = DEFAULT_SAMPLE_DATA,
  isShowLegend = true,
  isShowLabels = true,
  isDarkCanvas = false,
}) => {
  const chartData = data.length > 0 ? data : DEFAULT_SAMPLE_DATA;
  const total = chartData.reduce((acc, d) => acc + (d.value > 0 ? d.value : 0), 0) || 1;

  // Title clearance
  const titleHeight = title ? 22 : 4;
  const padding = 10;
  const contentWidth = Math.max(20, width - padding * 2);
  const contentHeight = Math.max(20, height - titleHeight - padding);

  const textColor = isDarkCanvas ? '#cbd5e1' : '#334155';
  const gridColor = isDarkCanvas ? '#334155' : '#e2e8f0';
  const labelColor = isDarkCanvas ? '#94a3b8' : '#64748b';

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="overflow-hidden select-none"
      style={{ display: 'block' }}
    >
      {/* Background container */}
      <rect
        width={width}
        height={height}
        fill={isDarkCanvas ? '#090d16' : '#ffffff'}
        rx={3}
      />

      {/* Chart Title */}
      {title && (
        <text
          x={width / 2}
          y={15}
          textAnchor="middle"
          fill={textColor}
          fontSize={11}
          fontWeight="bold"
          fontFamily="system-ui, sans-serif"
        >
          {title}
        </text>
      )}

      {/* Render Chart Body according to type */}
      {type === 'pieChart' && (
        <PieChartBody
          data={chartData}
          total={total}
          x={padding}
          y={titleHeight}
          width={contentWidth}
          height={contentHeight}
          isShowLegend={isShowLegend}
          isShowLabels={isShowLabels}
          textColor={textColor}
          labelColor={labelColor}
        />
      )}

      {type === 'barChart' && (
        <BarChartBody
          data={chartData}
          x={padding}
          y={titleHeight}
          width={contentWidth}
          height={contentHeight}
          isShowLegend={isShowLegend}
          isShowLabels={isShowLabels}
          textColor={textColor}
          gridColor={gridColor}
          labelColor={labelColor}
        />
      )}

      {type === 'lineChart' && (
        <LineChartBody
          data={chartData}
          x={padding}
          y={titleHeight}
          width={contentWidth}
          height={contentHeight}
          isShowLegend={isShowLegend}
          isShowLabels={isShowLabels}
          textColor={textColor}
          gridColor={gridColor}
          labelColor={labelColor}
        />
      )}
    </svg>
  );
};

// -------------------------------------------------------------
// 1. Pie Chart Body
// -------------------------------------------------------------
function PieChartBody({
  data,
  total,
  x,
  y,
  width,
  height,
  isShowLegend,
  isShowLabels,
  textColor,
  labelColor,
}: {
  data: ChartDataPoint[];
  total: number;
  x: number;
  y: number;
  width: number;
  height: number;
  isShowLegend: boolean;
  isShowLabels: boolean;
  textColor: string;
  labelColor: string;
}) {
  const legendWidth = isShowLegend ? Math.min(130, width * 0.45) : 0;
  const pieAreaWidth = width - legendWidth;
  const radius = Math.max(15, Math.min(pieAreaWidth, height) / 2 - 12);
  const cx = x + pieAreaWidth / 2;
  const cy = y + height / 2;

  let startAngle = -Math.PI / 2;

  return (
    <g>
      {/* Slices */}
      {data.map((item, idx) => {
        const sliceAngle = (item.value / total) * (Math.PI * 2);
        const endAngle = startAngle + sliceAngle;
        const color = item.color || DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length];

        const x1 = cx + radius * Math.cos(startAngle);
        const y1 = cy + radius * Math.sin(startAngle);
        const x2 = cx + radius * Math.cos(endAngle);
        const y2 = cy + radius * Math.sin(endAngle);

        const largeArcFlag = sliceAngle > Math.PI ? 1 : 0;
        const pathData =
          data.length === 1
            ? `M ${cx} ${cy - radius} A ${radius} ${radius} 0 1 1 ${cx - 0.01} ${cy - radius} Z`
            : `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

        // Mid point for optional label
        const midAngle = startAngle + sliceAngle / 2;
        const labelRadius = radius * 0.65;
        const lx = cx + labelRadius * Math.cos(midAngle);
        const ly = cy + labelRadius * Math.sin(midAngle);
        const pct = Math.round((item.value / total) * 100);

        startAngle = endAngle;

        return (
          <g key={idx}>
            <path d={pathData} fill={color} stroke="#ffffff" strokeWidth={1} opacity={0.9} />
            {isShowLabels && pct > 7 && (
              <text
                x={lx}
                y={ly + 3}
                textAnchor="middle"
                fill="#ffffff"
                fontSize={9}
                fontWeight="bold"
              >
                {pct}%
              </text>
            )}
          </g>
        );
      })}

      {/* Legend */}
      {isShowLegend && (
        <g transform={`translate(${x + pieAreaWidth + 6}, ${y + 10})`}>
          {data.slice(0, 6).map((item, idx) => {
            const color = item.color || DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length];
            return (
              <g key={idx} transform={`translate(0, ${idx * 16})`}>
                <rect width={9} height={9} rx={2} fill={color} />
                <text
                  x={14}
                  y={8}
                  fill={labelColor}
                  fontSize={8.5}
                  fontFamily="system-ui, sans-serif"
                >
                  {item.label.length > 12 ? item.label.slice(0, 11) + '…' : item.label}
                </text>
              </g>
            );
          })}
        </g>
      )}
    </g>
  );
}

// -------------------------------------------------------------
// 2. Bar Chart Body
// -------------------------------------------------------------
function BarChartBody({
  data,
  x,
  y,
  width,
  height,
  isShowLegend,
  isShowLabels,
  textColor,
  gridColor,
  labelColor,
}: {
  data: ChartDataPoint[];
  x: number;
  y: number;
  width: number;
  height: number;
  isShowLegend: boolean;
  isShowLabels: boolean;
  textColor: string;
  gridColor: string;
  labelColor: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const bottomMargin = 20;
  const topMargin = 10;
  const leftMargin = 30;
  const chartW = width - leftMargin;
  const chartH = height - bottomMargin - topMargin;

  const barCount = data.length;
  const barGap = 6;
  const totalBarWidth = (chartW - (barCount + 1) * barGap) / barCount;
  const barWidth = Math.max(6, Math.min(36, totalBarWidth));

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Horizontal gridlines */}
      {[0, 0.33, 0.66, 1].map((step, idx) => {
        const lineY = topMargin + chartH * (1 - step);
        const val = Math.round(maxVal * step);
        return (
          <g key={idx}>
            <line
              x1={leftMargin}
              y1={lineY}
              x2={width}
              y2={lineY}
              stroke={gridColor}
              strokeDasharray="2,2"
              strokeWidth={1}
            />
            <text
              x={leftMargin - 4}
              y={lineY + 3}
              textAnchor="end"
              fill={labelColor}
              fontSize={7.5}
            >
              {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
            </text>
          </g>
        );
      })}

      {/* Axis line */}
      <line
        x1={leftMargin}
        y1={topMargin + chartH}
        x2={width}
        y2={topMargin + chartH}
        stroke={gridColor}
        strokeWidth={1.5}
      />

      {/* Bars */}
      {data.map((item, idx) => {
        const barH = (item.value / maxVal) * chartH;
        const bx = leftMargin + barGap + idx * (barWidth + barGap);
        const by = topMargin + chartH - barH;
        const color = item.color || DEFAULT_CHART_COLORS[idx % DEFAULT_CHART_COLORS.length];

        return (
          <g key={idx}>
            <rect
              x={bx}
              y={by}
              width={barWidth}
              height={Math.max(2, barH)}
              fill={color}
              rx={2}
              opacity={0.9}
            />
            {/* Value on top of bar */}
            {isShowLabels && (
              <text
                x={bx + barWidth / 2}
                y={by - 3}
                textAnchor="middle"
                fill={labelColor}
                fontSize={7}
                fontWeight="500"
              >
                {item.value >= 1000 ? `${(item.value / 1000).toFixed(0)}k` : item.value}
              </text>
            )}
            {/* Category label under axis */}
            <text
              x={bx + barWidth / 2}
              y={topMargin + chartH + 12}
              textAnchor="middle"
              fill={labelColor}
              fontSize={7.5}
            >
              {item.label.length > 7 ? item.label.slice(0, 6) + '…' : item.label}
            </text>
          </g>
        );
      })}
    </g>
  );
}

// -------------------------------------------------------------
// 3. Line Chart Body
// -------------------------------------------------------------
function LineChartBody({
  data,
  x,
  y,
  width,
  height,
  isShowLegend,
  isShowLabels,
  textColor,
  gridColor,
  labelColor,
}: {
  data: ChartDataPoint[];
  x: number;
  y: number;
  width: number;
  height: number;
  isShowLegend: boolean;
  isShowLabels: boolean;
  textColor: string;
  gridColor: string;
  labelColor: string;
}) {
  const maxVal = Math.max(...data.map((d) => d.value), 1);
  const bottomMargin = 20;
  const topMargin = 12;
  const leftMargin = 30;
  const chartW = width - leftMargin - 10;
  const chartH = height - bottomMargin - topMargin;

  const points = data.map((d, idx) => {
    const px = leftMargin + (idx / Math.max(1, data.length - 1)) * chartW;
    const py = topMargin + chartH - (d.value / maxVal) * chartH;
    return { x: px, y: py, ...d };
  });

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  // Gradient area path
  const areaPath =
    points.length > 0
      ? `M ${points[0].x} ${topMargin + chartH} L ${points.map((p) => `${p.x} ${p.y}`).join(' L ')} L ${points[points.length - 1].x} ${topMargin + chartH} Z`
      : '';

  return (
    <g transform={`translate(${x}, ${y})`}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
          <stop offset="100%" stopColor="#10b981" stopOpacity={0.0} />
        </linearGradient>
      </defs>

      {/* Grid */}
      {[0, 0.33, 0.66, 1].map((step, idx) => {
        const lineY = topMargin + chartH * (1 - step);
        const val = Math.round(maxVal * step);
        return (
          <g key={idx}>
            <line
              x1={leftMargin}
              y1={lineY}
              x2={leftMargin + chartW}
              y2={lineY}
              stroke={gridColor}
              strokeDasharray="2,2"
              strokeWidth={1}
            />
            <text
              x={leftMargin - 4}
              y={lineY + 3}
              textAnchor="end"
              fill={labelColor}
              fontSize={7.5}
            >
              {val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}
            </text>
          </g>
        );
      })}

      {/* Axis */}
      <line
        x1={leftMargin}
        y1={topMargin + chartH}
        x2={leftMargin + chartW}
        y2={topMargin + chartH}
        stroke={gridColor}
        strokeWidth={1.5}
      />

      {/* Gradient Fill under Line */}
      {areaPath && <path d={areaPath} fill="url(#lineGrad)" />}

      {/* Connecting Polyline */}
      <polyline
        fill="none"
        stroke="#10b981"
        strokeWidth={2.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        points={polylinePoints}
      />

      {/* Data dots */}
      {points.map((p, idx) => (
        <g key={idx}>
          <circle cx={p.x} cy={p.y} r={3.5} fill="#10b981" stroke="#ffffff" strokeWidth={1.5} />
          {isShowLabels && (
            <text
              x={p.x}
              y={p.y - 6}
              textAnchor="middle"
              fill={labelColor}
              fontSize={7}
              fontWeight="bold"
            >
              {p.value >= 1000 ? `${(p.value / 1000).toFixed(0)}k` : p.value}
            </text>
          )}
          {/* Label under axis */}
          <text
            x={p.x}
            y={topMargin + chartH + 12}
            textAnchor="middle"
            fill={labelColor}
            fontSize={7.5}
          >
            {p.label.length > 7 ? p.label.slice(0, 6) + '…' : p.label}
          </text>
        </g>
      ))}
    </g>
  );
}
