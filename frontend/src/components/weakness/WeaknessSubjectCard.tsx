import React from 'react';
import { AlertTriangle, CheckCircle, Clock, BookOpen, ArrowRight } from 'lucide-react';
import { SubjectDiagnosisDto, WeaknessStatus } from '../../services/api';

interface WeaknessSubjectCardProps {
  subject: SubjectDiagnosisDto;
  isSelected?: boolean;
  onSelect?: () => void;
  onPractice?: (subjectCode: string) => void;
}

export const WeaknessSubjectCard: React.FC<WeaknessSubjectCardProps> = ({
  subject,
  isSelected,
  onSelect,
  onPractice,
}) => {
  const getStatusBadge = (status: WeaknessStatus) => {
    switch (status) {
      case 'CRITICAL_WEAKNESS':
        return {
          label: '重大弱點',
          bg: '#FEF2F2',
          text: '#991B1B',
          border: '#F87171',
          icon: AlertTriangle,
        };
      case 'MODERATE_WEAKNESS':
        return {
          label: '中度弱點',
          bg: '#FFFBEB',
          text: '#92400E',
          border: '#FBBF24',
          icon: AlertTriangle,
        };
      case 'STEADY_PROGRESS':
        return {
          label: '穩步前進',
          bg: '#EFF6FF',
          text: '#1E40AF',
          border: '#93C5FD',
          icon: Clock,
        };
      case 'EXCELLENT_MASTERY':
        return {
          label: '精通掌握',
          bg: '#ECFDF5',
          text: '#065F46',
          border: '#34D399',
          icon: CheckCircle,
        };
      case 'INSUFFICIENT_DATA':
        return {
          label: '樣本累積中',
          bg: '#F3F4F6',
          text: '#4B5563',
          border: '#D1D5DB',
          icon: BookOpen,
        };
      case 'NO_DATA':
      default:
        return {
          label: '尚未作答',
          bg: '#F9FAFB',
          text: '#6B7280',
          border: '#E5E7EB',
          icon: BookOpen,
        };
    }
  };

  const badge = getStatusBadge(subject.status);
  const StatusIcon = badge.icon;
  const isInsufficient = subject.status === 'INSUFFICIENT_DATA';
  const isNoData = subject.status === 'NO_DATA';

  return (
    <div
      className="card"
      style={{
        padding: '20px',
        border: isSelected ? '2px solid var(--color-brand-deep-slate)' : '1px solid var(--border-default)',
        backgroundColor: isSelected ? '#FFFFFF' : 'var(--surface-raised)',
        borderRadius: 'var(--radius-sm)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: onSelect ? 'pointer' : 'default',
        transition: 'all 0.2s ease',
        boxShadow: isSelected ? '0 4px 12px rgba(82, 107, 123, 0.12)' : 'none',
      }}
      onClick={onSelect}
    >
      <div>
        {/* Header: Code & Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
          <div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.04em',
              }}
            >
              {subject.subjectCode}
            </span>
            <h4
              style={{
                fontSize: '15px',
                fontWeight: 700,
                color: 'var(--text-primary)',
                margin: '2px 0 0 0',
              }}
            >
              {subject.subjectName}
            </h4>
          </div>

          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px 8px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 700,
              backgroundColor: badge.bg,
              color: badge.text,
              border: `1px solid ${badge.border}`,
            }}
          >
            <StatusIcon size={12} />
            <span>{badge.label}</span>
          </span>
        </div>

        {/* Weakness Index & Mastery Level Metric */}
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: '12px',
            marginTop: '12px',
            marginBottom: '14px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>弱點指數 (WI)</div>
            <div
              style={{
                fontSize: '22px',
                fontWeight: 800,
                color: isNoData || isInsufficient ? 'var(--text-muted)' : badge.text,
              }}
            >
              {isNoData || isInsufficient ? '--' : subject.weaknessIndex.toFixed(1)}
              {!isNoData && !isInsufficient && (
                <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-muted)', marginLeft: '2px' }}>
                  分
                </span>
              )}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>掌握度</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {isNoData ? '0%' : `${(subject.masteryLevel * 100).toFixed(0)}%`}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid var(--border-subtle)', paddingLeft: '12px' }}>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>作答題數</div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {subject.sampleSize}
              <span style={{ fontSize: '11px', fontWeight: 500, color: 'var(--text-muted)' }}> 題</span>
            </div>
          </div>
        </div>

        {/* Sub-Metrics: Unresolved, Reviewing, Mastered */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px', fontSize: '11px' }}>
          <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>未攻克</div>
            <div style={{ fontWeight: 700, color: subject.unresolvedCount > 0 ? '#DC2626' : 'var(--text-primary)' }}>
              {subject.unresolvedCount}
            </div>
          </div>
          <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>複習中</div>
            <div style={{ fontWeight: 700, color: subject.reviewingCount > 0 ? '#D97706' : 'var(--text-primary)' }}>
              {subject.reviewingCount}
            </div>
          </div>
          <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '6px 8px', borderRadius: '4px', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-muted)', marginBottom: '2px' }}>已掌握</div>
            <div style={{ fontWeight: 700, color: '#059669' }}>
              {subject.masteredCount}
            </div>
          </div>
        </div>

        {/* Insufficient Data Callout */}
        {isInsufficient && (
          <div
            style={{
              marginTop: '10px',
              padding: '6px 10px',
              backgroundColor: '#F3F4F6',
              borderRadius: '4px',
              fontSize: '11px',
              color: '#4B5563',
            }}
          >
            目前累積 {subject.sampleSize} 題，至少需作答 5 題啟用深度診斷。
          </div>
        )}
      </div>

      {/* Action Shortcut Button */}
      {onPractice && (
        <button
          type="button"
          className="btn btn-outline btn-sm"
          onClick={(e) => {
            e.stopPropagation();
            onPractice(subject.subjectCode);
          }}
          style={{
            marginTop: '14px',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            fontSize: '12px',
          }}
        >
          <span>前往本科練習</span>
          <ArrowRight size={13} />
        </button>
      )}
    </div>
  );
};
