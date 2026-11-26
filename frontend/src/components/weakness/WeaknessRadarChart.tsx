import React, { useId, useState } from 'react';
import { SubjectDiagnosisDto, WeaknessStatus } from '../../services/api';

interface WeaknessRadarChartProps {
  subjects: SubjectDiagnosisDto[];
  selectedSubjectId?: string | null;
  onSelectSubject?: (subjectId: string) => void;
}

// 4 official work items mapped to 4 cardinal directions (90 deg apart)
const AXIS_CONFIG = [
  { code: '17300-01', label: '作業準備', short: '作業準備', angle: -Math.PI / 2, align: 'middle', dy: -14 },
  { code: '17300-02', label: '應用軟體安裝及使用', short: '應用軟體', angle: 0, align: 'start', dx: 14, dy: 4 },
  { code: '17300-03', label: '系統軟體安裝及使用', short: '系統軟體', angle: Math.PI / 2, align: 'middle', dy: 22 },
  { code: '17300-04', label: '資訊及安全', short: '資訊安全', angle: Math.PI, align: 'end', dx: -14, dy: 4 },
];

export const WeaknessRadarChart: React.FC<WeaknessRadarChartProps> = ({
  subjects,
  selectedSubjectId,
  onSelectSubject,
}) => {
  const chartId = useId();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const cx = 180;
  const cy = 180;
  const maxR = 105;

  // Order subjects according to the 4 axes
  const axisSubjects = AXIS_CONFIG.map((cfg) => {
    return (
      subjects.find((s) => s.subjectCode === cfg.code) || {
        subjectId: cfg.code,
        subjectCode: cfg.code,
        subjectName: cfg.label,
        masteryLevel: 0,
        weaknessIndex: 0,
        status: 'NO_DATA' as WeaknessStatus,
        sampleSize: 0,
        accuracyRate: 0,
        unresolvedCount: 0,
        reviewingCount: 0,
        masteredCount: 0,
        recentWrongCount: 0,
        dataWatermark: '',
        calculatedAt: '',
        isFresh: true,
        suggestedAction: null,
      }
    );
  });

  // Calculate polygon points based on masteryLevel (0.0 to 1.0)
  const polygonPoints = axisSubjects.map((sub, idx) => {
    const angle = AXIS_CONFIG[idx].angle;
    // If NO_DATA or INSUFFICIENT_DATA with 0 attempts, place near center
    const level = sub.status === 'NO_DATA' ? 0.05 : Math.max(0.05, Math.min(1.0, sub.masteryLevel));
    const r = level * maxR;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    return { x, y, level, sub, config: AXIS_CONFIG[idx] };
  });

  const pointsString = polygonPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  // Grid concentric diamond levels: 25%, 50%, 75%, 100%
  const gridLevels = [0.25, 0.5, 0.75, 1.0];

  const getStatusColor = (status: WeaknessStatus) => {
    switch (status) {
      case 'CRITICAL_WEAKNESS':
        return '#DC2626'; // Red
      case 'MODERATE_WEAKNESS':
        return '#D97706'; // Amber
      case 'STEADY_PROGRESS':
        return '#2563EB'; // Blue
      case 'EXCELLENT_MASTERY':
        return '#059669'; // Emerald
      case 'INSUFFICIENT_DATA':
        return '#6B7280'; // Slate
      case 'NO_DATA':
      default:
        return '#9CA3AF'; // Light Gray
    }
  };

  const hasAnyData = subjects.some((s) => s.sampleSize > 0);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        maxWidth: '420px',
        margin: '0 auto',
      }}
    >
      <svg
        viewBox="0 0 360 360"
        style={{
          width: '100%',
          maxWidth: '360px',
          height: 'auto',
          overflow: 'visible',
          fontFamily: 'var(--font-sans-tc)',
        }}
        role="img"
        aria-labelledby={`${chartId}-title ${chartId}-desc`}
      >
        <title id={`${chartId}-title`}>官方四大工作項目掌握度四軸雷達圖</title>
        <desc id={`${chartId}-desc`}>
          展示學科考科一至四之能力掌握度與弱點指數分佈。
          {axisSubjects.map((s) => `${s.subjectCode} ${s.subjectName}: 掌握度 ${(s.masteryLevel * 100).toFixed(0)}%, 弱點指數 ${s.weaknessIndex}; `).join('')}
        </desc>

        <defs>
          {/* Subtle gradient fill for radar polygon */}
          <linearGradient id={`${chartId}-radar-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#BDA77E" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#526B7B" stopOpacity="0.25" />
          </linearGradient>

          {/* Glow filter for active/hovered node */}
          <filter id={`${chartId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. Concentric Background Grid Diamonds */}
        {gridLevels.map((lvl) => {
          const r = lvl * maxR;
          const diamondPoints = [
            `${cx},${cy - r}`, // Top
            `${cx + r},${cy}`, // Right
            `${cx},${cy + r}`, // Bottom
            `${cx - r},${cy}`, // Left
          ].join(' ');

          return (
            <g key={lvl}>
              <polygon
                points={diamondPoints}
                fill="none"
                stroke="var(--border-default)"
                strokeWidth={lvl === 1.0 ? '1.5' : '1'}
                strokeDasharray={lvl === 1.0 ? 'none' : '3,3'}
                opacity={0.8}
              />
              {/* Grid level indicator text (25%, 50%, 75%, 100%) */}
              <text
                x={cx + 4}
                y={cy - r + 11}
                fontSize="9"
                fill="var(--text-muted)"
                opacity={0.7}
                fontWeight="500"
              >
                {Math.round(lvl * 100)}%
              </text>
            </g>
          );
        })}

        {/* 2. Four Cardinal Axes (Cross lines) */}
        {AXIS_CONFIG.map((cfg, idx) => {
          const x2 = cx + maxR * Math.cos(cfg.angle);
          const y2 = cy + maxR * Math.sin(cfg.angle);
          return (
            <line
              key={idx}
              x1={cx}
              y1={cy}
              x2={x2}
              y2={y2}
              stroke="var(--border-strong)"
              strokeWidth="1.2"
              opacity={0.5}
            />
          );
        })}

        {/* 3. Render Data Polygon if data exists */}
        {hasAnyData ? (
          <g>
            <polygon
              points={pointsString}
              fill={`url(#${chartId}-radar-grad)`}
              stroke="var(--color-brand-deep-slate)"
              strokeWidth="2.5"
              strokeLinejoin="round"
              style={{
                transition: 'all 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            />
          </g>
        ) : (
          /* Empty baseline dotted line */
          <polygon
            points={pointsString}
            fill="rgba(217, 226, 234, 0.2)"
            stroke="var(--border-strong)"
            strokeWidth="1.5"
            strokeDasharray="4,4"
          />
        )}

        {/* 4. Vertex Points & Interactive Hotspots */}
        {polygonPoints.map((p, idx) => {
          const isSelected = selectedSubjectId === p.sub.subjectId;
          const isHovered = hoveredIndex === idx;
          const statusColor = getStatusColor(p.sub.status);

          return (
            <g
              key={p.sub.subjectCode}
              style={{ cursor: onSelectSubject ? 'pointer' : 'default' }}
              onClick={() => onSelectSubject && onSelectSubject(p.sub.subjectId)}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              role="button"
              tabIndex={0}
              aria-label={`${p.sub.subjectName} 掌握度 ${(p.sub.masteryLevel * 100).toFixed(0)}%`}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && onSelectSubject) {
                  e.preventDefault();
                  onSelectSubject(p.sub.subjectId);
                }
              }}
            >
              {/* Outer halo on active/hovered */}
              {(isSelected || isHovered) && (
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="10"
                  fill={statusColor}
                  opacity="0.25"
                  filter={`url(#${chartId}-glow)`}
                />
              )}

              {/* Point circle */}
              <circle
                cx={p.x}
                cy={p.y}
                r={isSelected || isHovered ? '6' : '4.5'}
                fill="#FFFFFF"
                stroke={statusColor}
                strokeWidth={isSelected || isHovered ? '3' : '2'}
                style={{ transition: 'all 0.2s ease' }}
              />

              {/* Hover Value Badge */}
              {isHovered && (
                <g>
                  <rect
                    x={p.x - 30}
                    y={p.y - 28}
                    width="60"
                    height="20"
                    rx="4"
                    fill="var(--color-brand-charcoal)"
                    opacity="0.9"
                  />
                  <text
                    x={p.x}
                    y={p.y - 14}
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="700"
                  >
                    {(p.sub.masteryLevel * 100).toFixed(0)}%
                  </text>
                </g>
              )}
            </g>
          );
        })}

        {/* 5. Axis Labels around the perimeter */}
        {polygonPoints.map((p, idx) => {
          const cfg = p.config;
          const textX = cx + (maxR + 24) * Math.cos(cfg.angle) + (cfg.dx || 0);
          const textY = cy + (maxR + 24) * Math.sin(cfg.angle) + (cfg.dy || 0);
          const isSelected = selectedSubjectId === p.sub.subjectId;
          const isHovered = hoveredIndex === idx;

          return (
            <g
              key={`label-${cfg.code}`}
              style={{ cursor: onSelectSubject ? 'pointer' : 'default' }}
              onClick={() => onSelectSubject && onSelectSubject(p.sub.subjectId)}
            >
              {/* Code badge */}
              <text
                x={textX}
                y={textY - 10}
                textAnchor={cfg.align as any}
                fontSize="10"
                fontWeight="700"
                fill="var(--text-muted)"
              >
                {cfg.code}
              </text>

              {/* Subject Title */}
              <text
                x={textX}
                y={textY + 4}
                textAnchor={cfg.align as any}
                fontSize="12"
                fontWeight={isSelected || isHovered ? '800' : '600'}
                fill={isSelected || isHovered ? 'var(--color-brand-deep-slate)' : 'var(--text-primary)'}
              >
                {cfg.short}
              </text>

              {/* Value indicator */}
              <text
                x={textX}
                y={textY + 18}
                textAnchor={cfg.align as any}
                fontSize="11"
                fontWeight="700"
                fill={getStatusColor(p.sub.status)}
              >
                {p.sub.status === 'NO_DATA'
                  ? '未開始'
                  : p.sub.status === 'INSUFFICIENT_DATA'
                  ? '樣本累積中'
                  : `${(p.sub.masteryLevel * 100).toFixed(0)}%`}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Legend below chart */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '16px',
          flexWrap: 'wrap',
          marginTop: '8px',
          fontSize: '11px',
          color: 'var(--text-muted)',
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#059669' }} />
          精通 (&lt;20)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#2563EB' }} />
          穩步 (20-40)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706' }} />
          中度 (40-65)
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#DC2626' }} />
          重度 (&ge;65)
        </span>
      </div>
    </div>
  );
};
