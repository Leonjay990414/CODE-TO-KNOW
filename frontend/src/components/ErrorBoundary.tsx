import React, { Component, ErrorInfo, ReactNode } from 'react';

export type ErrorBoundaryLevel = 'global' | 'route' | 'component';

export interface ErrorBoundaryProps {
  children: ReactNode;
  /**
   * 防護層級：
   * - 'global': 全域頂層防護，整頁滿版安全區
   * - 'route': 路由頁面層級防護，提供安全頂部導航與頁面級卡片
   * - 'component': 局部元件層級防護，提供輕量局部警示方塊
   */
  level?: ErrorBoundaryLevel;
  /**
   * 外部重置鍵（如 route.page）。當外部鍵變更且當前處於錯誤狀態時自動重置。
   */
  resetKey?: unknown;
  /**
   * 自訂 Fallback 節點或渲染函數
   */
  fallback?: ReactNode | ((error: Error | null, reset: () => void) => ReactNode);
  /**
   * 錯誤攔截回呼（供內部安全遙測記錄，嚴禁向外傳送未脫敏之個資與 Token）
   */
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  /**
   * 狀態重設回呼
   */
  onReset?: () => void;
  /**
   * 自訂提示主標題
   */
  title?: string;
  /**
   * 自訂輔助說明文案
   */
  message?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  /**
   * 內部重置計數器：每次重試時遞增，作為子樹 Fragment 的 key，
   * 強制 React 徹底卸載舊實例並掛載全新實例，避免重複崩潰。
   */
  remountKey: number;
}

/**
 * CODE TO KNOW (碼上學) 雙層系統錯誤韌性邊界 (Error Boundary)
 * 遵循 WCAG 2.1 AA 與品牌色系設計，提供純靜態、零外部 Context 依賴之安全降級畫面。
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      remountKey: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // 嚴格脫敏：僅提取錯誤名稱與簡短訊息，嚴禁輸出 Token、Cookie、原始請求或個人機敏資料
    const safeErrorMeta = {
      name: error?.name || 'Error',
      message: error?.message || 'Unknown render exception',
      level: this.props.level || 'component',
      timestamp: new Date().toISOString(),
    };

    const isDev = import.meta.env.MODE !== 'production';

    if (isDev) {
      console.error(
        '[CODE TO KNOW ErrorBoundary] Render exception intercepted safely:',
        safeErrorMeta.name,
        safeErrorMeta.message
      );
    } else {
      console.warn(
        '[CODE TO KNOW ErrorBoundary] Recovered from unexpected component exception at level:',
        safeErrorMeta.level
      );
    }

    if (this.props.onError) {
      try {
        this.props.onError(error, errorInfo);
      } catch {
        // 保證回呼錯誤不破壞 ErrorBoundary 本身之穩定性
      }
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps): void {
    // 當外部 resetKey（如路由 page）改變時，若當前處於錯誤態，自動觸發重設重試
    if (prevProps.resetKey !== this.props.resetKey && this.state.hasError) {
      this.handleReset();
    }
  }

  handleReset = (): void => {
    this.setState((prevState) => ({
      hasError: false,
      error: null,
      remountKey: prevState.remountKey + 1,
    }));
    if (this.props.onReset) {
      try {
        this.props.onReset();
      } catch {
        // 忽略重置回呼例外
      }
    }
  };

  handleReload = (): void => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  };

  handleGoHome = (): void => {
    if (typeof window !== 'undefined' && window.location) {
      window.location.href = '/#hero';
    }
  };

  renderDefaultFallback(): ReactNode {
    const { level = 'component', title, message } = this.props;
    const isGlobal = level === 'global';
    const isRoute = level === 'route';

    const defaultTitle = isGlobal
      ? '學習環境遇到非預期狀況'
      : isRoute
      ? '本頁面載入遇到非預期狀況'
      : '模組載入異常';

    const defaultMessage = isGlobal
      ? '系統已自動啟動全域安全保護機制，您的帳號狀態與學習進度已妥善保留。請嘗試重新整理或返回首頁。'
      : isRoute
      ? '本頁面因元件例外暫時中斷，您的資料不受影響。您可以重新嘗試載入本頁，或返回平台首頁繼續學習。'
      : '此學習區塊暫時無法正常顯示，請嘗試重新載入。';

    const headline = title || defaultTitle;
    const desc = message || defaultMessage;

    return (
      <div
        role="alert"
        aria-live="assertive"
        aria-labelledby="c2k-error-title"
        aria-describedby="c2k-error-desc"
        style={{
          minHeight: isGlobal ? '100vh' : isRoute ? '75vh' : 'auto',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: isGlobal ? 'center' : isRoute ? 'flex-start' : 'center',
          backgroundColor: isGlobal
            ? 'var(--surface-base, #F5F2EA)'
            : 'transparent',
          padding: isGlobal
            ? 'var(--space-8, 32px) var(--space-4, 16px)'
            : isRoute
            ? 'var(--space-6, 24px) var(--space-4, 16px)'
            : 'var(--space-4, 16px)',
          boxSizing: 'border-box',
          fontFamily: "'Noto Sans TC', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Route Level Safe Navigation Bar (零 Context 依賴，確保路由層出錯時仍有導航能力) */}
        {isRoute && (
          <header
            style={{
              width: '100%',
              maxWidth: '880px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 18px',
              marginBottom: '28px',
              borderRadius: 'var(--radius-lg, 12px)',
              backgroundColor: 'var(--color-brand-cream, #FAF8F2)',
              border: '1px solid var(--color-brand-ice-slate, #D9E2EA)',
              boxShadow: '0 2px 8px rgba(38, 52, 61, 0.04)',
              boxSizing: 'border-box',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  backgroundColor: 'var(--color-brand-ivory, #F5F2EA)',
                  border: '1px solid var(--color-brand-oat, #EBE5D8)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg viewBox="0 0 256 256" width="20" height="20" role="img" aria-label="碼上學 Logo">
                  <path fill="#526B7B" d="M 140 48 C 84 48 40 84 40 128 C 40 172 84 208 140 208 C 149 208 156 201 156 192 C 156 183 149 176 140 176 C 102 176 70 154 70 128 C 70 102 102 80 140 80 C 149 80 156 73 156 64 C 156 55 149 48 140 48 Z"/>
                  <path fill="#8FA9B8" d="M 130 126 C 135 121 143 121 148 126 L 194 172 C 200 178 200 186 194 192 C 188 198 180 198 174 192 L 130 148 C 124 142 124 132 130 126 Z"/>
                  <path fill="#BDA77E" d="M 126 114 L 176 64 C 181 59 189 59 194 64 C 199 69 199 77 194 82 L 144 132 C 139 137 131 137 126 132 C 121 127 121 119 126 114 Z"/>
                  <path fill="#BDA77E" d="M 200 38 C 200 48 194 54 184 56 C 194 58 200 64 200 74 C 200 64 206 58 216 56 C 206 54 200 48 200 38 Z"/>
                </svg>
              </div>
              <div>
                <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-charcoal, #26343D)' }}>
                  碼上學
                </span>
                <span style={{ fontSize: '11px', color: 'var(--color-brand-deep-slate, #526B7B)', marginLeft: '6px' }}>
                  CODE TO KNOW
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={this.handleGoHome}
              aria-label="安全返回平台首頁"
              style={{
                minHeight: '36px',
                padding: '0 14px',
                borderRadius: '6px',
                backgroundColor: 'transparent',
                border: '1px solid var(--color-brand-slate, #8FA9B8)',
                color: 'var(--color-brand-deep-slate, #526B7B)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.15s ease',
              }}
            >
              返回平台首頁
            </button>
          </header>
        )}

        {/* Central Brand Protection Card */}
        <div
          style={{
            maxWidth: isGlobal ? '460px' : isRoute ? '520px' : '100%',
            width: '100%',
            backgroundColor: 'var(--color-brand-cream, #FAF8F2)',
            border: '1px solid var(--color-brand-ice-slate, #D9E2EA)',
            borderRadius: 'var(--radius-xl, 16px)',
            padding: '36px 30px',
            boxShadow: '0 10px 30px -5px rgba(38, 52, 61, 0.06), 0 0 0 1px rgba(235, 229, 216, 0.6)',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          {/* Status Badge: Academic Sage */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '12px',
              backgroundColor: 'var(--color-brand-sage-light, #EBF2EE)',
              color: 'var(--color-brand-sage, #5A7D6C)',
              fontSize: '11px',
              fontWeight: 600,
              marginBottom: '16px',
              border: '1px solid rgba(90, 125, 108, 0.2)',
            }}
          >
            <span
              style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-brand-sage, #5A7D6C)',
              }}
            />
            {isGlobal ? '系統環境安全防護中' : '學習狀態安全保存中'}
          </div>

          {/* Calm Ambient Icon: Shield / Recovery Indicator */}
          <div
            style={{
              width: '60px',
              height: '60px',
              margin: '0 auto 18px',
              borderRadius: '18px',
              backgroundColor: 'var(--color-brand-ivory, #F5F2EA)',
              border: '1px solid var(--color-brand-oat, #EBE5D8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(189, 167, 126, 0.15)',
            }}
          >
            <svg
              width="30"
              height="30"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--color-brand-deep-slate, #526B7B)"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              role="img"
              aria-hidden="true"
            >
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              <path d="M9 12l2 2 4-4" stroke="var(--color-brand-gold, #BDA77E)" />
            </svg>
          </div>

          {/* Heading */}
          <h2
            id="c2k-error-title"
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: 'var(--color-brand-charcoal, #26343D)',
              letterSpacing: '0.01em',
              lineHeight: 1.35,
              margin: '0 0 10px 0',
            }}
          >
            {headline}
          </h2>

          {/* Description (Strictly no stack trace or internal secrets exposed) */}
          <p
            id="c2k-error-desc"
            style={{
              fontSize: '13px',
              fontWeight: 500,
              color: 'var(--color-brand-deep-slate, #526B7B)',
              lineHeight: 1.65,
              margin: '0 0 24px 0',
            }}
          >
            {desc}
          </p>

          {/* Action Button Row: ≥ 44px touch targets */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: '12px',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={this.handleReset}
              aria-label="重新嘗試載入此模組"
              style={{
                minHeight: '44px',
                minWidth: '120px',
                padding: '0 20px',
                borderRadius: '8px',
                backgroundColor: 'var(--color-brand-deep-slate, #526B7B)',
                color: '#FFFFFF',
                border: 'none',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                boxShadow: '0 2px 6px rgba(82, 107, 123, 0.2)',
                transition: 'background-color 0.15s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/>
              </svg>
              重新嘗試
            </button>

            {isGlobal ? (
              <button
                type="button"
                onClick={this.handleReload}
                aria-label="重新整理整個網頁"
                style={{
                  minHeight: '44px',
                  minWidth: '120px',
                  padding: '0 20px',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: 'var(--color-brand-charcoal, #26343D)',
                  border: '1px solid var(--color-brand-ice-slate, #D9E2EA)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  transition: 'background-color 0.15s ease',
                }}
              >
                重新整理
              </button>
            ) : null}

            <button
              type="button"
              onClick={this.handleGoHome}
              aria-label="返回平台首頁"
              style={{
                minHeight: '44px',
                minWidth: '120px',
                padding: '0 20px',
                borderRadius: '8px',
                backgroundColor: isGlobal ? 'transparent' : '#FFFFFF',
                color: 'var(--color-brand-charcoal, #26343D)',
                border: isGlobal ? 'none' : '1px solid var(--color-brand-ice-slate, #D9E2EA)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                transition: 'background-color 0.15s ease',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              返回首頁
            </button>
          </div>

          {/* Academic Footer Tagline */}
          <div
            style={{
              marginTop: '22px',
              paddingTop: '16px',
              borderTop: '1px solid rgba(217, 226, 234, 0.6)',
              fontSize: '11px',
              fontWeight: 500,
              color: 'var(--color-brand-deep-slate, #526B7B)',
              letterSpacing: '0.04em',
            }}
          >
            碼上學，學無止境。｜Learn Beyond Limits.
          </div>
        </div>
      </div>
    );
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(this.state.error, this.handleReset);
      }
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return this.renderDefaultFallback();
    }

    // 利用 remountKey 作為 Fragment key，在重試時強制 React 重新掛載全新實例
    return (
      <React.Fragment key={this.state.remountKey}>
        {this.props.children}
      </React.Fragment>
    );
  }
}

export default ErrorBoundary;
