import React from 'react';
import { LucideIcon, Search, RotateCcw } from 'lucide-react';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  className?: string;
  maxWidth?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Search,
  title,
  description,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = RotateCcw,
  className = '',
  maxWidth = '540px',
}) => {
  return (
    <div
      className={`card ${className}`}
      style={{
        backgroundColor: '#FFFFFF',
        border: '1px dashed var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        padding: 'var(--space-12) var(--space-6)',
        textAlign: 'center',
        maxWidth,
        margin: '0 auto',
      }}
      role="status"
      aria-live="polite"
    >
      <div
        style={{
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: 'var(--surface-sunken)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 16px auto',
          color: 'var(--text-muted)',
        }}
        aria-hidden="true"
      >
        <Icon size={24} />
      </div>

      <h3 className="text-h3" style={{ fontSize: '18px', marginBottom: '8px', color: 'var(--color-brand-charcoal)' }}>
        {title}
      </h3>

      <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: actionLabel ? '20px' : '0', lineHeight: 1.6 }}>
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          type="button"
          className="btn btn-secondary btn-sm"
          onClick={onAction}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
        >
          {ActionIcon && <ActionIcon size={14} />}
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
