import React from 'react';
import { LucideIcon } from 'lucide-react';

export interface PageHeaderProps {
  breadcrumb?: {
    label: string;
    onClick?: () => void;
  }[];
  badge?: {
    text: string;
    variant?: 'gold' | 'slate' | 'neutral';
    icon?: LucideIcon;
  };
  subBadgeText?: string;
  title: string;
  description?: string;
  rightAction?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  breadcrumb,
  badge,
  subBadgeText,
  title,
  description,
  rightAction,
  className = '',
}) => {
  return (
    <section
      className={`page-header-section ${className}`}
      style={{
        backgroundColor: 'var(--surface-base)',
        padding: '36px 0 28px 0',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container">
        {/* Breadcrumb */}
        {breadcrumb && breadcrumb.length > 0 && (
          <nav
            aria-label="頁面導覽階層"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '12px',
              color: 'var(--text-muted)',
              marginBottom: '16px',
            }}
          >
            {breadcrumb.map((item, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <React.Fragment key={index}>
                  {item.onClick && !isLast ? (
                    <button
                      type="button"
                      onClick={item.onClick}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        cursor: 'pointer',
                        color: 'var(--text-secondary)',
                        fontSize: '12px',
                        textDecoration: 'underline',
                      }}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <span style={{ color: isLast ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: isLast ? 600 : 400 }}>
                      {item.label}
                    </span>
                  )}
                  {!isLast && <span aria-hidden="true">/</span>}
                </React.Fragment>
              );
            })}
          </nav>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            {badge && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                {badge.icon && <badge.icon size={16} color="var(--color-brand-gold)" />}
                <span className={`badge badge-${badge.variant || 'gold'}`}>{badge.text}</span>
                {subBadgeText && <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{subBadgeText}</span>}
              </div>
            )}
            <h1 className="text-h1" style={{ fontSize: '32px', marginBottom: '8px' }}>
              {title}
            </h1>
            {description && (
              <p className="text-lead" style={{ fontSize: '15px', maxWidth: '720px', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                {description}
              </p>
            )}
          </div>

          {rightAction && <div style={{ flexShrink: 0 }}>{rightAction}</div>}
        </div>
      </div>
    </section>
  );
};
