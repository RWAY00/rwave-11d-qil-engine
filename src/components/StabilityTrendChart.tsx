import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  RotateCcw,
  Sparkles,
  Filter,
  CheckSquare,
  Square,
  ArrowUpRight,
  Maximize2,
  Eye,
  Flame,
  Info,
} from 'lucide-react';
import { LabHistoryEntry, QILComputationResult, ScientificInsightResult } from '../types';

interface StabilityTrendChartProps {
  history: LabHistoryEntry[];
  currentComputation?: QILComputationResult;
  currentInsight?: ScientificInsightResult | null;
  onRestoreVector?: (vector: number[]) => void;
  onSelectForComparison?: (historyId: string) => void;
  language: 'en' | 'hi';
}

interface TrendPoint {
  id: string;
  date: Date;
  timestamp: string;
  stabilityIndex: number;
  riskLevel: 'CRITICAL' | 'ELEVATED' | 'BALANCED' | 'OPTIMAL';
  presetName: string;
  entropy?: number;
  seed?: number;
  isCurrent?: boolean;
}

export const StabilityTrendChart: React.FC<StabilityTrendChartProps> = ({
  history,
  currentComputation,
  currentInsight,
  onRestoreVector,
  onSelectForComparison,
  language,
}) => {
  const isHi = language === 'hi';
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Maintain selected set of history IDs to visualize
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    history.forEach((h) => initial.add(h.id));
    return initial;
  });

  // Include current computation in the trend line?
  const [includeCurrent, setIncludeCurrent] = useState<boolean>(true);

  // Active focused point from hover or click
  const [focusedPointId, setFocusedPointId] = useState<string | null>(null);

  // Keep selectedIds updated when new history records arrive
  useEffect(() => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      history.forEach((h) => {
        if (!prev.has(h.id) && prev.size === 0) {
          next.add(h.id);
        } else if (!prev.has(h.id) && history.length <= 10) {
          next.add(h.id);
        }
      });
      return next;
    });
  }, [history]);

  // Transform historical records into structured points sorted chronologically
  const allPoints: TrendPoint[] = useMemo(() => {
    const list: TrendPoint[] = [];

    history.forEach((h) => {
      const stability = h.stabilityIndex ?? (h.riskLevel === 'CRITICAL' ? 42 : h.riskLevel === 'ELEVATED' ? 62 : 85);
      const parsedDate = new Date(h.timestamp);
      const validDate = isNaN(parsedDate.getTime()) ? new Date() : parsedDate;

      list.push({
        id: h.id,
        date: validDate,
        timestamp: h.timestamp,
        stabilityIndex: stability,
        riskLevel: h.riskLevel || (stability < 50 ? 'CRITICAL' : stability < 65 ? 'ELEVATED' : stability < 80 ? 'BALANCED' : 'OPTIMAL'),
        presetName: h.presetName || '11D Computation Run',
        entropy: h.entropy,
        seed: h.seed,
        isCurrent: false,
      });
    });

    // Optionally append Current in-memory computation
    if (includeCurrent && currentComputation) {
      const currentStability = currentInsight?.riskAssessment?.stabilityIndex ?? 82.5;
      const currentRisk = currentInsight?.riskAssessment?.level || (currentStability < 50 ? 'CRITICAL' : currentStability < 65 ? 'ELEVATED' : 'BALANCED');
      list.push({
        id: 'current-live-run',
        date: new Date(currentComputation.timestamp || Date.now()),
        timestamp: currentComputation.timestamp || new Date().toISOString(),
        stabilityIndex: currentStability,
        riskLevel: currentRisk,
        presetName: isHi ? 'वर्तमान सक्रिय गणना (Live)' : 'Current In-Memory Run (Live)',
        entropy: currentComputation.entropy,
        seed: currentComputation.seed,
        isCurrent: true,
      });
    }

    // Sort ascending chronologically for line plot
    return list.sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [history, currentComputation, currentInsight, includeCurrent, isHi]);

  // Filtered dataset according to user selection
  const chartPoints = useMemo(() => {
    return allPoints.filter((p) => p.isCurrent || selectedIds.has(p.id));
  }, [allPoints, selectedIds]);

  // Statistical aggregates
  const stats = useMemo(() => {
    if (chartPoints.length === 0) {
      return { avg: 0, min: 0, max: 0, delta: 0, trend: 'neutral' as const };
    }
    const values = chartPoints.map((p) => p.stabilityIndex);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);
    const first = values[0];
    const last = values[values.length - 1];
    const delta = last - first;
    const trend = delta > 1 ? 'up' : delta < -1 ? 'down' : 'neutral';

    return { avg, min, max, delta, trend };
  }, [chartPoints]);

  // Batch selection handlers
  const handleSelectAll = () => {
    const next = new Set<string>();
    history.forEach((h) => next.add(h.id));
    setSelectedIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleSelectCriticalOnly = () => {
    const next = new Set<string>();
    history.forEach((h) => {
      const stab = h.stabilityIndex ?? 80;
      if (stab < 50 || h.riskLevel === 'CRITICAL') {
        next.add(h.id);
      }
    });
    setSelectedIds(next);
  };

  const handleSelectOptimalOnly = () => {
    const next = new Set<string>();
    history.forEach((h) => {
      const stab = h.stabilityIndex ?? 80;
      if (stab >= 75 || h.riskLevel === 'OPTIMAL') {
        next.add(h.id);
      }
    });
    setSelectedIds(next);
  };

  const togglePointSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Focused point details
  const focusedPoint = useMemo(() => {
    if (!focusedPointId) return chartPoints[chartPoints.length - 1] || null;
    return allPoints.find((p) => p.id === focusedPointId) || null;
  }, [focusedPointId, chartPoints, allPoints]);

  // Corresponding history record if focused point is from history
  const focusedHistoryRecord = useMemo(() => {
    if (!focusedPoint || focusedPoint.isCurrent) return null;
    return history.find((h) => h.id === focusedPoint.id) || null;
  }, [focusedPoint, history]);

  // D3 Chart Render Hook
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove(); // clear prior elements

    const containerWidth = containerRef.current.clientWidth || 640;
    const height = 280;
    const margin = { top: 25, right: 35, bottom: 40, left: 52 };
    const innerWidth = containerWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    svg
      .attr('width', containerWidth)
      .attr('height', height)
      .attr('viewBox', `0 0 ${containerWidth} ${height}`);

    if (chartPoints.length === 0) {
      // Empty state inside SVG
      svg
        .append('text')
        .attr('x', containerWidth / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#94a3b8')
        .attr('font-size', '13px')
        .attr('font-family', 'monospace')
        .text(isHi ? 'कोई चयनित गणना उपलब्ध नहीं है (कृपया नीचे से चुनें)' : 'No computations selected (Select past runs below to plot)');
      return;
    }

    // 1. Defs & Gradients
    const defs = svg.append('defs');

    // Gradient for line
    const lineGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-stability-line-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '100%')
      .attr('y2', '0%');
    lineGradient.append('stop').attr('offset', '0%').attr('stop-color', '#38bdf8');
    lineGradient.append('stop').attr('offset', '50%').attr('stop-color', '#00f2ff');
    lineGradient.append('stop').attr('offset', '100%').attr('stop-color', '#10b981');

    // Area Fill Gradient
    const areaGradient = defs
      .append('linearGradient')
      .attr('id', 'd3-stability-area-grad')
      .attr('x1', '0%')
      .attr('y1', '0%')
      .attr('x2', '0%')
      .attr('y2', '100%');
    areaGradient.append('stop').attr('offset', '0%').attr('stop-color', '#00f2ff').attr('stop-opacity', 0.28);
    areaGradient.append('stop').attr('offset', '60%').attr('stop-color', '#0284c7').attr('stop-opacity', 0.1);
    areaGradient.append('stop').attr('offset', '100%').attr('stop-color', '#ff003c').attr('stop-opacity', 0.02);

    // Glow filter
    const glowFilter = defs.append('filter').attr('id', 'd3-glow').attr('x', '-30%').attr('y', '-30%').attr('width', '160%').attr('height', '160%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4').attr('result', 'coloredBlur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'coloredBlur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);

    // 2. Scales
    // If only 1 point, pad domain slightly so point isn't pinned to edge
    let xExtent = d3.extent(chartPoints, (d) => d.date) as [Date, Date];
    if (xExtent[0].getTime() === xExtent[1].getTime()) {
      xExtent = [new Date(xExtent[0].getTime() - 60000), new Date(xExtent[1].getTime() + 60000)];
    }

    const xScale = d3.scaleTime().domain(xExtent).range([0, innerWidth]);
    const yScale = d3.scaleLinear().domain([0, 100]).range([innerHeight, 0]);

    // 3. Safety Threshold Reference Bands
    // Critical Zone (< 50%)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(50))
      .attr('width', innerWidth)
      .attr('height', innerHeight - yScale(50))
      .attr('fill', 'rgba(255, 0, 60, 0.05)')
      .attr('stroke', 'none');

    // Optimal Zone (>= 80%)
    g.append('rect')
      .attr('x', 0)
      .attr('y', yScale(100))
      .attr('width', innerWidth)
      .attr('height', yScale(80) - yScale(100))
      .attr('fill', 'rgba(16, 185, 129, 0.04)')
      .attr('stroke', 'none');

    // Threshold lines
    const thresholds = [
      { val: 80, label: 'Optimal (80%)', color: '#10b981', dash: '3 3' },
      { val: 65, label: 'Balanced (65%)', color: '#00f2ff', dash: '2 2' },
      { val: 50, label: 'Critical Risk (50%)', color: '#ff003c', dash: '4 3' },
    ];

    thresholds.forEach((t) => {
      g.append('line')
        .attr('x1', 0)
        .attr('y1', yScale(t.val))
        .attr('x2', innerWidth)
        .attr('y2', yScale(t.val))
        .attr('stroke', t.color)
        .attr('stroke-opacity', 0.45)
        .attr('stroke-width', 1)
        .attr('stroke-dasharray', t.dash);

      g.append('text')
        .attr('x', innerWidth + 4)
        .attr('y', yScale(t.val) + 3)
        .attr('fill', t.color)
        .attr('font-size', '9px')
        .attr('font-family', 'monospace')
        .attr('opacity', 0.8)
        .text(`${t.val}%`);
    });

    // 4. Grid lines
    // Y Gridlines
    const yGrid = d3.axisLeft(yScale).ticks(5).tickSize(-innerWidth).tickFormat(() => '');
    g.append('g')
      .attr('class', 'y-grid')
      .call(yGrid)
      .selectAll('line')
      .attr('stroke', '#1a2234')
      .attr('stroke-opacity', 0.5)
      .attr('stroke-dasharray', '1 3');
    g.select('.y-grid .domain').remove();

    // 5. Axes
    const xAxis = d3
      .axisBottom(xScale)
      .ticks(Math.min(6, Math.max(2, chartPoints.length)))
      .tickFormat((d) => d3.timeFormat('%H:%M:%S')(d as Date));

    const yAxis = d3
      .axisLeft(yScale)
      .ticks(5)
      .tickFormat((d) => `${d}%`);

    const xAxisGroup = g
      .append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(xAxis);
    xAxisGroup.select('.domain').attr('stroke', '#1a2234');
    xAxisGroup.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');
    xAxisGroup.selectAll('line').attr('stroke', '#1a2234');

    const yAxisGroup = g.append('g').call(yAxis);
    yAxisGroup.select('.domain').attr('stroke', '#1a2234');
    yAxisGroup.selectAll('text').attr('fill', '#94a3b8').attr('font-size', '10px').attr('font-family', 'monospace');
    yAxisGroup.selectAll('line').attr('stroke', '#1a2234');

    // Y Axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -38)
      .attr('x', -innerHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#64748b')
      .attr('font-size', '10px')
      .attr('font-family', 'monospace')
      .attr('letter-spacing', '1px')
      .text('STABILITY INDEX (%)');

    // 6. Area generator
    const area = d3
      .area<TrendPoint>()
      .x((d) => xScale(d.date))
      .y0(innerHeight)
      .y1((d) => yScale(d.stabilityIndex))
      .curve(chartPoints.length > 2 ? d3.curveMonotoneX : d3.curveLinear);

    g.append('path').datum(chartPoints).attr('fill', 'url(#d3-stability-area-grad)').attr('d', area);

    // 7. Line generator
    const line = d3
      .line<TrendPoint>()
      .x((d) => xScale(d.date))
      .y((d) => yScale(d.stabilityIndex))
      .curve(chartPoints.length > 2 ? d3.curveMonotoneX : d3.curveLinear);

    // Glow line behind
    g.append('path')
      .datum(chartPoints)
      .attr('fill', 'none')
      .attr('stroke', '#00f2ff')
      .attr('stroke-width', 4)
      .attr('stroke-opacity', 0.25)
      .attr('filter', 'url(#d3-glow)')
      .attr('d', line);

    // Main line path
    const path = g
      .append('path')
      .datum(chartPoints)
      .attr('fill', 'none')
      .attr('stroke', 'url(#d3-stability-line-grad)')
      .attr('stroke-width', 2.5)
      .attr('d', line);

    // Smooth path entrance animation
    const totalLength = path.node()?.getTotalLength() || 0;
    path
      .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
      .attr('stroke-dashoffset', totalLength)
      .transition()
      .duration(750)
      .ease(d3.easeCubicOut)
      .attr('stroke-dashoffset', 0);

    // 8. Crosshair guideline element
    const crosshair = g
      .append('line')
      .attr('stroke', '#00f2ff')
      .attr('stroke-width', 1)
      .attr('stroke-dasharray', '3 3')
      .attr('stroke-opacity', 0.6)
      .attr('y1', 0)
      .attr('y2', innerHeight)
      .style('opacity', 0);

    // 9. Data Points
    const nodesGroup = g.append('g').attr('class', 'data-nodes');

    chartPoints.forEach((point) => {
      const cx = xScale(point.date);
      const cy = yScale(point.stabilityIndex);
      const isCritical = point.stabilityIndex < 50;
      const isOptimal = point.stabilityIndex >= 80;
      const isFocused = focusedPointId === point.id;

      const nodeGroup = nodesGroup.append('g').attr('class', 'node-item').attr('cursor', 'pointer');

      // Critical Pulsating Ring
      if (isCritical) {
        nodeGroup
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 13)
          .attr('fill', 'rgba(255, 0, 60, 0.15)')
          .attr('stroke', '#ff003c')
          .attr('stroke-width', 1.2)
          .attr('stroke-dasharray', '2 2')
          .attr('opacity', 0.85);
      }

      // Focused halo ring
      if (isFocused) {
        nodeGroup
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 10)
          .attr('fill', 'none')
          .attr('stroke', '#00f2ff')
          .attr('stroke-width', 2)
          .attr('filter', 'url(#d3-glow)');
      }

      // Live computation outer ring marker
      if (point.isCurrent) {
        nodeGroup
          .append('circle')
          .attr('cx', cx)
          .attr('cy', cy)
          .attr('r', 8.5)
          .attr('fill', 'none')
          .attr('stroke', '#38bdf8')
          .attr('stroke-width', 1.5)
          .attr('stroke-dasharray', '2 2');
      }

      // Core Circle
      const circleColor = isCritical ? '#ff003c' : isOptimal ? '#10b981' : point.stabilityIndex < 65 ? '#f59e0b' : '#00f2ff';

      nodeGroup
        .append('circle')
        .attr('cx', cx)
        .attr('cy', cy)
        .attr('r', point.isCurrent ? 6 : isCritical ? 5.5 : 4.5)
        .attr('fill', circleColor)
        .attr('stroke', '#020408')
        .attr('stroke-width', 2)
        .attr('filter', isCritical || point.isCurrent ? 'url(#d3-glow)' : 'none')
        .on('mouseenter', (event) => {
          setFocusedPointId(point.id);
          crosshair.attr('x1', cx).attr('x2', cx).style('opacity', 1);

          if (tooltipRef.current) {
            const rect = containerRef.current?.getBoundingClientRect();
            if (rect) {
              const tooltipX = Math.min(innerWidth - 120, Math.max(20, cx + margin.left));
              const tooltipY = Math.max(10, cy + margin.top - 50);
              tooltipRef.current.style.left = `${tooltipX}px`;
              tooltipRef.current.style.top = `${tooltipY}px`;
              tooltipRef.current.style.opacity = '1';
            }
          }
        })
        .on('mouseleave', () => {
          crosshair.style('opacity', 0);
          if (tooltipRef.current) {
            tooltipRef.current.style.opacity = '0';
          }
        })
        .on('click', () => {
          setFocusedPointId(point.id);
        });

      // Value label on top of point for easy scanning
      if (chartPoints.length <= 12 || isFocused || isCritical) {
        nodeGroup
          .append('text')
          .attr('x', cx)
          .attr('y', cy - 10)
          .attr('text-anchor', 'middle')
          .attr('fill', circleColor)
          .attr('font-size', '9px')
          .attr('font-family', 'monospace')
          .attr('font-weight', 'bold')
          .attr('pointer-events', 'none')
          .text(`${point.stabilityIndex.toFixed(1)}%`);
      }
    });
  }, [chartPoints, focusedPointId, isHi]);

  return (
    <div className="bg-[#050810] rounded-lg border border-[#1a2234] shadow-2xl p-4 sm:p-5 flex flex-col space-y-4 relative overflow-hidden">
      {/* Header & Metric Summary */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-[#1a2234]">
        <div className="flex items-center space-x-3">
          <div className="w-2.5 h-2.5 rounded-full bg-[#00f2ff] shadow-[0_0_10px_#00f2ff]" />
          <div>
            <h3 className="text-xs uppercase tracking-[0.2em] font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#00f2ff]" />
              <span>{isHi ? 'D3.js ऐतिहासिक स्थिरता सूचकांक रुझान' : 'D3.js Historical Stability Index Trend'}</span>
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30">
                Vector Dynamics
              </span>
            </h3>
            <p className="text-[11px] text-gray-400 font-mono mt-0.5">
              {isHi
                ? 'चयनित ऐतिहासिक गणनाओं के स्थायित्व सूचकांक (Stability Index %) का कालक्रमानुसार प्रदर्शन'
                : 'Interactive D3 time-series tracking deterministic stability across selected past QIL runs'}
            </p>
          </div>
        </div>

        {/* Statistical Summary Pills */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Average Stability */}
          <div className="bg-[#0a0f1d] px-2.5 py-1.5 rounded border border-[#1a2234] flex items-center gap-1.5">
            <span className="text-gray-400 text-[10px] uppercase">Mean:</span>
            <span className="font-bold text-[#00f2ff]">{stats.avg.toFixed(1)}%</span>
          </div>

          {/* Min & Max Range */}
          <div className="bg-[#0a0f1d] px-2.5 py-1.5 rounded border border-[#1a2234] flex items-center gap-1.5">
            <span className="text-gray-400 text-[10px] uppercase">Range:</span>
            <span className="text-rose-400 font-bold">{stats.min.toFixed(1)}%</span>
            <span className="text-gray-500">→</span>
            <span className="text-emerald-400 font-bold">{stats.max.toFixed(1)}%</span>
          </div>

          {/* Net Drift / Trend */}
          <div
            className={`px-2.5 py-1.5 rounded border flex items-center gap-1.5 ${
              stats.trend === 'up'
                ? 'bg-emerald-950/60 text-emerald-300 border-emerald-800'
                : stats.trend === 'down'
                ? 'bg-rose-950/60 text-rose-300 border-rose-800'
                : 'bg-[#0a0f1d] text-gray-300 border-[#1a2234]'
            }`}
          >
            {stats.trend === 'up' ? (
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
            ) : stats.trend === 'down' ? (
              <TrendingDown className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Activity className="w-3.5 h-3.5 text-gray-400" />
            )}
            <span className="font-bold">
              {stats.delta > 0 ? `+${stats.delta.toFixed(1)}%` : `${stats.delta.toFixed(1)}%`}
            </span>
            <span className="text-[10px] opacity-80">
              {stats.trend === 'up'
                ? isHi ? 'सुधार' : 'Improving'
                : stats.trend === 'down'
                ? isHi ? 'क्षरण' : 'Degrading'
                : isHi ? 'स्थिर' : 'Steady'}
            </span>
          </div>
        </div>
      </div>

      {/* Filter / Selection Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono bg-[#080d1a] p-2.5 rounded border border-[#1a2234]">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-gray-400 text-[11px] flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3 text-[#00f2ff]" />
            <span>{isHi ? 'चयन प्रीसेट:' : 'Filter:'}</span>
          </span>

          <button
            type="button"
            onClick={handleSelectAll}
            className="px-2 py-0.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-gray-200 border border-gray-600 transition"
          >
            {isHi ? 'सभी चुनें' : 'Select All'} ({history.length})
          </button>

          <button
            type="button"
            onClick={handleSelectCriticalOnly}
            className="px-2 py-0.5 rounded bg-rose-950/70 hover:bg-rose-900 text-rose-200 border border-rose-700/80 transition flex items-center gap-1"
          >
            <Flame className="w-3 h-3 text-rose-400" />
            <span>{isHi ? 'केवल संकट (<50%)' : 'Critical Only (<50%)'}</span>
          </button>

          <button
            type="button"
            onClick={handleSelectOptimalOnly}
            className="px-2 py-0.5 rounded bg-emerald-950/70 hover:bg-emerald-900 text-emerald-200 border border-emerald-700/80 transition flex items-center gap-1"
          >
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>{isHi ? 'इष्टतम (≥75%)' : 'Optimal (≥75%)'}</span>
          </button>

          <button
            type="button"
            onClick={handleDeselectAll}
            className="px-2 py-0.5 rounded bg-[#0a0f1d] hover:bg-[#1a2234] text-gray-400 hover:text-gray-200 border border-[#1a2234] transition"
          >
            {isHi ? 'साफ करें' : 'Clear'}
          </button>
        </div>

        {/* Current in-memory toggle */}
        {currentComputation && (
          <label className="flex items-center space-x-1.5 cursor-pointer text-gray-300 select-none">
            <input
              type="checkbox"
              checked={includeCurrent}
              onChange={(e) => setIncludeCurrent(e.target.checked)}
              className="rounded border-[#1a2234] bg-[#050810] text-[#00f2ff] focus:ring-[#00f2ff]/50"
            />
            <span className="text-[11px] text-[#38bdf8] font-bold">
              {isHi ? 'वर्तमान रन जोड़ें (Live In-Memory)' : 'Plot Current In-Memory State'}
            </span>
          </label>
        )}
      </div>

      {/* D3 SVG Line Chart Viewport */}
      <div ref={containerRef} className="relative w-full overflow-hidden bg-[#070b14] rounded-lg border border-[#1a2234]/90 p-1">
        <svg ref={svgRef} className="w-full h-[280px] select-none block" />

        {/* Dynamic D3 HTML Floating Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none transition-opacity duration-150 opacity-0 z-30 bg-[#0a0f1d]/95 backdrop-blur-md border border-[#00f2ff]/50 rounded p-2 text-xs font-mono shadow-2xl text-white max-w-[200px]"
          style={{ transform: 'translate(-50%, -100%)' }}
        >
          {focusedPoint && (
            <div className="space-y-1">
              <div className="font-bold text-[#00f2ff] truncate">{focusedPoint.presetName}</div>
              <div className="text-[10px] text-gray-400">{d3.timeFormat('%b %d, %H:%M:%S')(focusedPoint.date)}</div>
              <div className="flex items-center justify-between border-t border-[#1a2234] pt-1">
                <span>Stability:</span>
                <span className="font-bold text-white">{focusedPoint.stabilityIndex.toFixed(1)}%</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span>Risk State:</span>
                <span
                  className={`px-1 rounded font-bold ${
                    focusedPoint.riskLevel === 'CRITICAL'
                      ? 'text-rose-400 bg-rose-950'
                      : focusedPoint.riskLevel === 'OPTIMAL'
                      ? 'text-emerald-400 bg-emerald-950'
                      : 'text-amber-400 bg-amber-950'
                  }`}
                >
                  {focusedPoint.riskLevel}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Computation Multi-Select Checklist & Inspector Tray */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 pt-1">
        {/* Left 2 Cols: Checklist of Past Computations to Toggle in Chart */}
        <div className="lg:col-span-2 bg-[#080d1a] p-3 rounded-lg border border-[#1a2234] flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-mono font-bold text-gray-300 uppercase flex items-center gap-1.5">
              <CheckSquare className="w-3.5 h-3.5 text-[#00f2ff]" />
              <span>{isHi ? 'ऐतिहासिक गणना चयन सूची' : 'Past Computations Selection Checklist'}</span>
              <span className="text-[10px] text-gray-500 font-normal">
                ({selectedIds.size} / {history.length} {isHi ? 'सक्रिय' : 'Active'})
              </span>
            </span>

            <span className="text-[10px] font-mono text-gray-400">
              {isHi ? 'ग्राफ में शामिल करने हेतु टॉगल करें' : 'Click to toggle on/off in D3 chart'}
            </span>
          </div>

          <div className="max-h-[160px] overflow-y-auto space-y-1 pr-1 custom-scrollbar">
            {history.map((item) => {
              const isSelected = selectedIds.has(item.id);
              const isFocused = focusedPointId === item.id;
              const stability = item.stabilityIndex ?? (item.riskLevel === 'CRITICAL' ? 42 : 85);
              const isCritical = stability < 50 || item.riskLevel === 'CRITICAL';
              const isOptimal = stability >= 80 || item.riskLevel === 'OPTIMAL';

              return (
                <div
                  key={`checklist-${item.id}`}
                  onClick={() => setFocusedPointId(item.id)}
                  className={`flex items-center justify-between p-1.5 rounded border text-xs font-mono transition cursor-pointer ${
                    isFocused
                      ? 'bg-[#1a2234] border-[#00f2ff]/60 shadow-[0_0_8px_rgba(0,242,255,0.2)]'
                      : isSelected
                      ? 'bg-[#0a0f1d] border-[#1a2234] hover:border-gray-600'
                      : 'bg-[#050810]/60 border-[#1a2234]/50 opacity-50 hover:opacity-80'
                  }`}
                >
                  <div className="flex items-center space-x-2 truncate">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePointSelection(item.id);
                      }}
                      className="text-gray-400 hover:text-[#00f2ff] p-0.5"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-3.5 h-3.5 text-[#00f2ff]" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-gray-600" />
                      )}
                    </button>

                    <span className="text-gray-400 text-[10px] shrink-0">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>

                    <span className="text-gray-200 truncate font-sans text-xs" title={item.presetName}>
                      {item.presetName || '11D Computation'}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 shrink-0 ml-2">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                        isCritical
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : isOptimal
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : 'bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/30'
                      }`}
                    >
                      {stability.toFixed(1)}%
                    </span>

                    {onSelectForComparison && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectForComparison(item.id);
                        }}
                        className="text-gray-400 hover:text-[#00f2ff] p-1 rounded hover:bg-[#1a2234]"
                        title="Open Side-by-Side Comparison"
                      >
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Col: Focused Computation Inspection Card */}
        <div className="bg-[#080d1a] p-3 rounded-lg border border-[#1a2234] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-1.5 border-b border-[#1a2234] mb-2">
              <span className="text-[11px] font-mono font-bold text-[#00f2ff] flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>{isHi ? 'चयनित रन विवरण' : 'Selected Run Telemetry'}</span>
              </span>
              {focusedPoint?.isCurrent && (
                <span className="px-1.5 py-0.2 rounded bg-sky-950 text-sky-300 border border-sky-600 text-[9px] font-mono font-bold">
                  LIVE IN-MEMORY
                </span>
              )}
            </div>

            {focusedPoint ? (
              <div className="space-y-2 text-xs font-mono">
                <div className="font-bold text-white font-sans text-xs truncate" title={focusedPoint.presetName}>
                  {focusedPoint.presetName}
                </div>

                <div className="grid grid-cols-2 gap-1.5 bg-[#050810] p-2 rounded border border-[#1a2234] text-[11px]">
                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase">Stability:</span>
                    <span
                      className={`font-bold text-sm ${
                        focusedPoint.stabilityIndex < 50
                          ? 'text-rose-400'
                          : focusedPoint.stabilityIndex >= 80
                          ? 'text-emerald-400'
                          : 'text-[#00f2ff]'
                      }`}
                    >
                      {focusedPoint.stabilityIndex.toFixed(1)}%
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase">Risk Level:</span>
                    <span
                      className={`font-bold text-xs ${
                        focusedPoint.riskLevel === 'CRITICAL' ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {focusedPoint.riskLevel}
                    </span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase">Entropy:</span>
                    <span className="text-gray-300">{focusedPoint.entropy?.toFixed(4) ?? '2.3418'} bits</span>
                  </div>

                  <div>
                    <span className="text-gray-500 block text-[9px] uppercase">Seed:</span>
                    <span className="text-gray-300">#{focusedPoint.seed ?? 42}</span>
                  </div>
                </div>

                <div className="text-[10px] text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-gray-500" />
                  <span>{new Date(focusedPoint.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-500 text-xs text-center py-4">
                {isHi ? 'विवरण देखने के लिए किसी बिंदु पर क्लिक करें' : 'Click a data point to inspect details'}
              </div>
            )}
          </div>

          {/* Action buttons for focused computation */}
          <div className="pt-2 border-t border-[#1a2234] flex flex-wrap items-center gap-2 mt-2">
            {focusedHistoryRecord && onRestoreVector && (
              <button
                type="button"
                onClick={() => onRestoreVector(focusedHistoryRecord.rawInput)}
                className="flex-1 px-2 py-1.5 rounded bg-[#1a2234] hover:bg-[#25324d] text-[#00f2ff] text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition border border-[#00f2ff]/30"
                title="Restore this past computation's raw 11D input vector into the active lattice"
              >
                <RotateCcw className="w-3 h-3" />
                <span>{isHi ? 'वेक्टर पुनः लोड करें' : 'Restore State'}</span>
              </button>
            )}

            {focusedHistoryRecord && onSelectForComparison && (
              <button
                type="button"
                onClick={() => onSelectForComparison(focusedHistoryRecord.id)}
                className="flex-1 px-2 py-1.5 rounded bg-[#00f2ff] hover:bg-[#70fffa] text-[#020408] text-[11px] font-mono font-bold flex items-center justify-center gap-1.5 transition shadow-[0_0_10px_rgba(0,242,255,0.2)]"
                title="Open side-by-side comparison between this run and active calculation"
              >
                <ArrowUpRight className="w-3 h-3" />
                <span>{isHi ? 'तुलना करें' : 'Compare'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
