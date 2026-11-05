import React from 'react';
import { Sparkles, BookOpen, Clock, ShieldCheck } from 'lucide-react';
import { QuestionSourceType } from '../data/questionBankSchema';

interface SourceBadgeProps {
  sourceType: QuestionSourceType;
  sourceName?: string;
  sourceVersion?: string;
  sourcePage?: number;
  showDetails?: boolean;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({
  sourceType,
  sourceName,
  sourceVersion,
  sourcePage,
  showDetails = false,
}) => {
  const getBadgeConfig = () => {
    switch (sourceType) {
      case 'official_verified':
        return {
          icon: <ShieldCheck size={12} color="#2E7D32" />,
          label: '官方題目',
          bg: 'rgba(46, 125, 50, 0.08)',
          border: '1px solid rgba(46, 125, 50, 0.25)',
          color: '#2E7D32',
          tooltip: '由主辦機關公開題庫解析，已核實標準答案',
        };
      case 'official_curated':
        return {
          icon: <BookOpen size={12} color="var(--color-brand-deep-slate)" />,
          label: '官方考綱整理',
          bg: 'var(--surface-sunken)',
          border: '1px solid var(--border-subtle)',
          color: 'var(--color-brand-deep-slate)',
          tooltip: '依官方公告大綱與釋出範例整理之試題',
        };
      case 'ai_practice':
        return {
          icon: <Sparkles size={12} color="#7C663D" />,
          label: 'AI 考綱練習題',
          bg: 'rgba(189, 167, 126, 0.15)',
          border: '1px solid var(--color-brand-gold)',
          color: '#7C663D',
          tooltip: 'AI 依據官方認證大綱生成之練習題，非官方歷屆試題',
        };
      case 'pending_verification':
      default:
        return {
          icon: <Clock size={12} color="#E65100" />,
          label: '待人工審查',
          bg: 'rgba(230, 81, 0, 0.08)',
          border: '1px solid rgba(230, 81, 0, 0.3)',
          color: '#E65100',
          tooltip: '答案或解析待專家進行二次核對',
        };
    }
  };

  const config = getBadgeConfig();

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', gap: '4px' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '2px 8px',
          borderRadius: 'var(--radius-xs)',
          backgroundColor: config.bg,
          border: config.border,
          color: config.color,
          fontSize: '11px',
          fontWeight: 700,
        }}
        title={config.tooltip}
      >
        {config.icon}
        <span>{config.label}</span>
      </div>

      {showDetails && sourceName && (
        <div style={{ fontSize: '11px', color: 'var(--text-muted)', lineHeight: 1.4 }}>
          出處：{sourceName} {sourceVersion && `(${sourceVersion})`} {sourcePage && `· 第 ${sourcePage} 頁`}
        </div>
      )}
    </div>
  );
};
