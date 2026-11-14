import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface StatCardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  iconColor?: string;
  trendText?: string;
  trendType?: 'positive' | 'neutral' | 'subtle';
  subText?: string;
  onClick?: () => void;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  iconColor = 'var(--color-brand-deep-slate)',
  trendText,
  trendType = 'positive',
  subText,
  onClick,
  className = '',
}) => {
  const getTrendColor = () => {
    switch (trendType) {
      case 'positive':
        return '#2E7D32';
      case 'neutral':
        return 'var(--text-secondary)';
      case 'subtle':
        return 'var(--text-muted)';
      default:
        return '#2E7D32';
    }
  };

  return (
    <div
      className={`card ${onClick ? 'interactive-card' : ''} ${className}`}
      onClick={onClick}
      style={{
        padding: '20px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {label}
        </span>
        {Icon && <Icon size={16} color={iconColor} />}
      </div>

      <div
        style={{
          fontSize: '28px',
          fontWeight: 800,
          color: 'var(--color-brand-charcoal)',
          lineHeight: 1.1,
          fontFamily: 'var(--font-sans-en), var(--font-sans-tc)',
        }}
      >
        {value}{' '}
        {unit && (
          <span style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-secondary)' }}>
            {unit}
          </span>
        )}
      </div>

      {trendText && (
        <div style={{ fontSize: '11px', color: getTrendColor(), marginTop: '6px', fontWeight: 500 }}>
          {trendText}
        </div>
      )}

      {subText && (
        <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          {subText}
        </div>
      )}
    </div>
  );
};
