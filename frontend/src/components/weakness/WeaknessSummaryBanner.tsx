import React from 'react';
import { RefreshCw, Activity, CheckCircle2, AlertTriangle, ShieldAlert } from 'lucide-react';
import { StudentWeaknessSummaryDto } from '../../services/api';

interface WeaknessSummaryBannerProps {
  summary: StudentWeaknessSummaryDto;
  isFresh?: boolean;
  isDegraded?: boolean;
  recalculating: boolean;
  cooldownSeconds: number;
  onRecalculate: () => void;
}

export const WeaknessSummaryBanner: React.FC<WeaknessSummaryBannerProps> = ({
  summary,
  isFresh = true,
  isDegraded = false,
  recalculating,
  cooldownSeconds,
  onRecalculate,
}) => {
  const formatTime = (isoString?: string) => {
    if (!isoString) return '--';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return '--';
    }
  };

  return (
    <div
      className="card"
      style={{
        padding: '24px',
        marginBottom: '24px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--radius-sm)',
        border: '1px solid var(--border-default)',
      }}
    >
      {/* Degraded Alert Banner */}
      {isDegraded && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: '#FFFBEB',
            border: '1px solid #FCD34D',
            padding: '10px 14px',
            borderRadius: '6px',
            color: '#92400E',
            fontSize: '12px',
            marginBottom: '16px',
          }}
        >
          <ShieldAlert size={16} />
          <span>弱點分析服務處於防護降級狀態，當前呈現最後安全快照資料。</span>
        </div>
      )}

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        {/* Left: Headline & Overall Statement */}
        <div style={{ flex: 1, minWidth: '280px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                color: isFresh ? '#059669' : '#D97706',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  backgroundColor: isFresh ? '#10B981' : '#F59E0B',
                }}
              />
              {isFresh ? '資料為最新水位' : '資料等待校正中'}
            </span>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
              最後分析：{formatTime(summary.lastAnalyzedAt)}
            </span>
          </div>

          <h3
            style={{
              fontSize: '17px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              margin: '0 0 6px 0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <Activity size={18} color="var(--color-brand-deep-slate)" />
            <span>官方考科全維度弱點診斷模型 (INT-007)</span>
          </h3>

          <p
            style={{
              fontSize: '13px',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              margin: 0,
            }}
          >
            {summary.overallDiagnosisZh}
          </p>
        </div>

        {/* Right: Macro Badges & Recalculate Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
          {/* Status Metric Badges */}
          <div style={{ display: 'flex', gap: '6px', fontSize: '11px' }}>
            {summary.criticalCount > 0 && (
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#FEF2F2',
                  color: '#991B1B',
                  border: '1px solid #F87171',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <AlertTriangle size={11} />
                {summary.criticalCount} 重大弱點
              </span>
            )}
            {summary.moderateCount > 0 && (
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#FFFBEB',
                  color: '#92400E',
                  border: '1px solid #FBBF24',
                  fontWeight: 700,
                }}
              >
                {summary.moderateCount} 中度弱點
              </span>
            )}
            {summary.masteryCount > 0 && (
              <span
                style={{
                  padding: '4px 8px',
                  borderRadius: '4px',
                  backgroundColor: '#ECFDF5',
                  color: '#065F46',
                  border: '1px solid #34D399',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CheckCircle2 size={11} />
                {summary.masteryCount} 精通
              </span>
            )}
          </div>

          {/* Recalculate Button */}
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={onRecalculate}
            disabled={recalculating || cooldownSeconds > 0}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              minWidth: '110px',
              justifyContent: 'center',
            }}
            title={cooldownSeconds > 0 ? `請稍候 ${cooldownSeconds} 秒後再試` : '強制重新核算四大考科最新快照'}
          >
            <RefreshCw size={13} className={recalculating ? 'animate-spin' : ''} />
            <span>
              {recalculating
                ? '分析中...'
                : cooldownSeconds > 0
                ? `重新分析 (${cooldownSeconds}s)`
                : '重新分析'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
