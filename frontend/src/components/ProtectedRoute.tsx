import React, { useEffect } from 'react';
import {
  Lock,
  ShieldAlert,
  AlertTriangle,
  RefreshCw,
  GraduationCap,
  School,
  Home,
  User as UserIcon,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';
import { Navbar } from './Navbar';
import { Footer } from './Footer';

export const INTENDED_ROUTE_STORAGE_KEY = 'ctk_intended_route';

/**
 * Expands transitional ADMIN / PLATFORM_ADMIN compatibility while strictly keeping
 * SYSTEM_OPERATOR isolated from educational/admin route permissions.
 */
export function expandCompatibleFrontendRoles(requiredRoles: string[] = []): string[] {
  const expanded = new Set<string>();
  for (const role of requiredRoles) {
    expanded.add(role);
    if (role === 'ADMIN') {
      expanded.add('PLATFORM_ADMIN');
    } else if (role === 'PLATFORM_ADMIN') {
      expanded.add('ADMIN');
    }
  }
  return Array.from(expanded);
}

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  pageTitle?: string;
  onOpenTeacherApply?: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRoles,
  pageTitle = '受保護專區',
  onOpenTeacherApply,
}) => {
  const { user, authStatus, authError, openAuth, refreshUser, isDemoMode, loginAsDemo } = useAuth();
  const { route, goToHome, goToStudentDashboard } = useNavigation();

  // When unauthenticated, preserve intended route in sessionStorage
  useEffect(() => {
    if (authStatus === 'unauthenticated' && route.hash) {
      try {
        sessionStorage.setItem(INTENDED_ROUTE_STORAGE_KEY, route.hash);
      } catch {
        // Ignore sessionStorage quota or disabled error
      }
    }
  }, [authStatus, route.hash]);

  // ==========================================
  // 1. Loading State (Auth Check in Progress)
  // ==========================================
  if (authStatus === 'loading') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface-base)',
        }}
      >
        <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />
        <main
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-12) var(--space-4)',
          }}
          aria-live="polite"
          aria-busy="true"
        >
          <div
            className="card"
            style={{
              maxWidth: '480px',
              width: '100%',
              textAlign: 'center',
              padding: 'var(--space-10) var(--space-8)',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(143, 169, 184, 0.15)',
                color: 'var(--color-brand-muted-blue)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4) auto',
              }}
            >
              <RefreshCw
                size={26}
                style={{
                  animation: 'spin 1.4s linear infinite',
                }}
              />
            </div>
            <h2
              className="text-h3"
              style={{
                fontSize: '20px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              正在驗證身分權限
            </h2>
            <p
              className="text-body-sm"
              style={{
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                margin: 0,
              }}
            >
              系統正在安全檢查您的帳號登入狀態與授權憑證，請稍候...
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ==========================================
  // 2. Error State (Network or Service Failure)
  // ==========================================
  if (authStatus === 'error') {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface-base)',
        }}
      >
        <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />
        <main
          style={{
            flex: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 'var(--space-12) var(--space-4)',
          }}
          role="alert"
        >
          <div
            className="card"
            style={{
              maxWidth: '520px',
              width: '100%',
              textAlign: 'center',
              padding: 'var(--space-10) var(--space-8)',
              backgroundColor: '#FFFFFF',
              borderRadius: 'var(--radius-xl)',
              boxShadow: 'var(--shadow-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#DC2626',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4) auto',
              }}
            >
              <AlertTriangle size={30} />
            </div>
            <span
              className="badge"
              style={{
                backgroundColor: 'rgba(239, 68, 68, 0.1)',
                color: '#DC2626',
                borderColor: 'rgba(239, 68, 68, 0.2)',
                marginBottom: 'var(--space-3)',
                display: 'inline-block',
              }}
            >
              連線異常 · Connection Error
            </span>
            <h2
              className="text-h3"
              style={{
                fontSize: '22px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                marginBottom: 'var(--space-2)',
              }}
            >
              認證服務暫時無法連線
            </h2>
            <p
              className="text-body-sm"
              style={{
                color: 'var(--text-secondary)',
                lineHeight: 1.6,
                marginBottom: 'var(--space-6)',
              }}
            >
              {authError || '系統連線至身分驗證伺服器時發生問題，這並非您的帳號失效。請檢查網路狀態或重試。'}
            </p>
            <div
              style={{
                display: 'flex',
                gap: '12px',
                justifyContent: 'center',
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => refreshUser()}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <RefreshCw size={16} />
                重新整理重試
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => goToHome('hero')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Home size={16} />
                返回首頁
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // ==========================================
  // 3. Unauthenticated State (Login Required)
  // ==========================================
  if (authStatus === 'unauthenticated' || !user) {
    const isTeacherRoute = requiredRoles?.includes('TEACHER');
    const isAdminRoute =
      !isTeacherRoute &&
      Boolean(requiredRoles?.some((role) => role === 'ADMIN' || role === 'PLATFORM_ADMIN'));

    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--surface-base)',
        }}
      >
        <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

        <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
          {/* Breadcrumb Header */}
          <section
            style={{
              backgroundColor: 'var(--surface-base)',
              borderBottom: '1px solid var(--border-subtle)',
              padding: 'var(--space-6) 0',
            }}
          >
            <div className="container">
              <nav className="breadcrumb-nav" aria-label="導覽路徑" style={{ marginBottom: '8px' }}>
                <a
                  href="#hero"
                  onClick={(e) => {
                    e.preventDefault();
                    goToHome('hero');
                  }}
                >
                  首頁
                </a>
                <span>/</span>
                <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{pageTitle}</span>
              </nav>
              <h1 className="text-h3" style={{ fontSize: '24px', margin: 0 }}>
                {pageTitle}
              </h1>
            </div>
          </section>

          {/* Central Access Card */}
          <div
            className="container"
            style={{
              display: 'flex',
              justifyContent: 'center',
              paddingTop: 'var(--space-12)',
            }}
          >
            <div
              className="card"
              style={{
                maxWidth: '560px',
                width: '100%',
                textAlign: 'center',
                padding: 'var(--space-10) var(--space-8)',
                backgroundColor: '#FFFFFF',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-lg)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '50%',
                  backgroundColor: isDemoMode ? 'rgba(189, 167, 126, 0.2)' : 'rgba(189, 167, 126, 0.15)',
                  color: 'var(--color-brand-champagne-gold)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto var(--space-4) auto',
                }}
              >
                {isDemoMode ? <Sparkles size={32} /> : <Lock size={30} />}
              </div>

              <div style={{ marginBottom: 'var(--space-3)' }}>
                <span className="badge badge-gold">
                  {isDemoMode
                    ? 'GitHub Pages 公開展示模式 · Demo Mode'
                    : isAdminRoute
                    ? '管理員專區 · 存取限制'
                    : isTeacherRoute
                    ? '教師專區 · 存取限制'
                    : '會員功能 · 需先登入'}
                </span>
              </div>

              <h2
                className="text-h2"
                style={{
                  fontSize: '24px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  marginBottom: 'var(--space-3)',
                }}
              >
                {isDemoMode ? `${pageTitle} · 示範預覽` : '請先登入帳號以繼續使用'}
              </h2>

              <p
                className="text-body"
                style={{
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6,
                  marginBottom: 'var(--space-8)',
                  maxWidth: '460px',
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
              >
                {isDemoMode
                  ? '本系統目前運行於 GitHub Pages 靜態公開展示版，無後端伺服器與資料庫連線。此專區在正式版需登入會員帳號，展示版中您可以直接點擊下方按鈕，以「示範學員」或「示範教師」身分即時體驗受保護專區完整介面。'
                  : isAdminRoute
                  ? '「官方證照題庫匯入與解析管理系統」僅限具備平台管理員身分之帳號登入存取。'
                  : isTeacherRoute
                  ? '「教師教學管理中心」包含班級進度追蹤、學生成績報表與教學分析，僅限認證教師登入存取。'
                  : '您所存取的頁面包含個人學習歷程、數據分析儀表板或錯題診斷功能。請先登入或註冊會員，系統將於登入完成後自動為您返回此頁面。'}
              </p>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  maxWidth: '360px',
                  margin: '0 auto',
                }}
              >
                {isDemoMode ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={() => loginAsDemo('STUDENT')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                      }}
                    >
                      <GraduationCap size={18} />
                      以示範學員身分預覽
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-lg"
                      onClick={() => loginAsDemo('TEACHER')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                      }}
                    >
                      <School size={18} />
                      以示範教師身分預覽
                    </button>

                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => openAuth('login')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <UserIcon size={16} />
                      開啟模擬登入視窗
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary btn-lg"
                      onClick={() => openAuth('login')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                      }}
                    >
                      <UserIcon size={18} />
                      立即登入帳號
                    </button>

                    <button
                      type="button"
                      className="btn btn-secondary btn-lg"
                      onClick={() => openAuth('register')}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        width: '100%',
                      }}
                    >
                      <GraduationCap size={18} />
                      免費註冊學習帳號
                    </button>
                  </>
                )}

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => goToHome('hero')}
                  style={{
                    marginTop: 'var(--space-2)',
                    color: 'var(--text-tertiary)',
                  }}
                >
                  返回首頁瀏覽公開課程
                </button>
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // ==========================================
  // 4. Role Authorization Check (Forbidden / 403)
  // ==========================================
  if (requiredRoles && requiredRoles.length > 0) {
    const userRoles = user.roles || [];
    const acceptedRoles = expandCompatibleFrontendRoles(requiredRoles);
    const hasRequiredRole = userRoles.some((role) => acceptedRoles.includes(role));

    if (!hasRequiredRole) {
      const isTeacherRequired = requiredRoles.includes('TEACHER');

      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'var(--surface-base)',
          }}
        >
          <Navbar onOpenAuth={openAuth} onOpenTeacherApply={onOpenTeacherApply} />

          <main style={{ flex: 1, paddingBottom: 'var(--space-16)' }}>
            {/* Breadcrumb Header */}
            <section
              style={{
                backgroundColor: 'var(--surface-base)',
                borderBottom: '1px solid var(--border-subtle)',
                padding: 'var(--space-6) 0',
              }}
            >
              <div className="container">
                <nav className="breadcrumb-nav" aria-label="導覽路徑" style={{ marginBottom: '8px' }}>
                  <a
                    href="#hero"
                    onClick={(e) => {
                      e.preventDefault();
                      goToHome('hero');
                    }}
                  >
                    首頁
                  </a>
                  <span>/</span>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>權限不足提示</span>
                </nav>
                <h1 className="text-h3" style={{ fontSize: '24px', margin: 0 }}>
                  權限不足 (403 Forbidden)
                </h1>
              </div>
            </section>

            {/* Central 403 Card */}
            <div
              className="container"
              style={{
                display: 'flex',
                justifyContent: 'center',
                paddingTop: 'var(--space-12)',
              }}
            >
              <div
                className="card"
                style={{
                  maxWidth: '580px',
                  width: '100%',
                  textAlign: 'center',
                  padding: 'var(--space-10) var(--space-8)',
                  backgroundColor: '#FFFFFF',
                  borderRadius: 'var(--radius-xl)',
                  boxShadow: 'var(--shadow-lg)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    color: '#DC2626',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    margin: '0 auto var(--space-4) auto',
                  }}
                >
                  <ShieldAlert size={32} />
                </div>

                <div style={{ marginBottom: 'var(--space-3)' }}>
                  <span
                    className="badge"
                    style={{
                      backgroundColor: 'rgba(239, 68, 68, 0.1)',
                      color: '#DC2626',
                      borderColor: 'rgba(239, 68, 68, 0.2)',
                    }}
                  >
                    權限受限 · 403 Access Denied
                  </span>
                </div>

                <h2
                  className="text-h2"
                  style={{
                    fontSize: '24px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 'var(--space-3)',
                  }}
                >
                  您的帳號尚無存取此專區之權限
                </h2>

                <p
                  className="text-body"
                  style={{
                    color: 'var(--text-secondary)',
                    lineHeight: 1.6,
                    marginBottom: 'var(--space-4)',
                    maxWidth: '460px',
                    marginLeft: 'auto',
                    marginRight: 'auto',
                  }}
                >
                  您目前登入的帳號為「<strong>{user.displayName || user.email}</strong>
                  」（身份角色：
                  {userRoles.length > 0 ? userRoles.join(', ') : 'STUDENT'}
                  ）。此頁面僅限具有 [
                  {requiredRoles
                    .map((r) => (r === 'TEACHER' ? '認證教師' : r === 'ADMIN' ? '平台管理員' : r))
                    .join(' 或 ')}]
                  身分的專屬管理人員存取。
                </p>

                {isTeacherRequired && (
                  <div
                    style={{
                      backgroundColor: 'var(--surface-subtle)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      marginBottom: isDemoMode ? 'var(--space-4)' : 'var(--space-8)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <School
                        size={20}
                        style={{ color: 'var(--color-brand-muted-blue)', flexShrink: 0, marginTop: '2px' }}
                      />
                      <div className="text-body-sm" style={{ color: 'var(--text-secondary)' }}>
                        <strong>您是學校或教育機構的任課教師嗎？</strong>
                        <br />
                        您可以線上提交教師身分資格認證，通過審核後系統將為您開通「教師教學管理中心」與班級管理功能。
                      </div>
                    </div>
                  </div>
                )}

                {isDemoMode && isTeacherRequired && (
                  <div
                    style={{
                      backgroundColor: 'rgba(189, 167, 126, 0.12)',
                      border: '1px solid var(--border-gold)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-4)',
                      marginBottom: 'var(--space-8)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <Sparkles
                        size={20}
                        style={{ color: 'var(--color-brand-champagne-gold)', flexShrink: 0, marginTop: '2px' }}
                      />
                      <div className="text-body-sm" style={{ color: 'var(--text-primary)' }}>
                        <strong>展示模式快速身分切換：</strong>
                        <br />
                        展示版支援一鍵切換為「示範認證教師」，無需真實審核流程即可體驗教師教學管理中心。
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={() => loginAsDemo('TEACHER')}
                      style={{
                        marginTop: '12px',
                        width: '100%',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                      }}
                    >
                      <School size={16} />
                      立即切換為示範教師身分預覽
                    </button>
                  </div>
                )}

                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                    flexWrap: 'wrap',
                  }}
                >
                  {isTeacherRequired && onOpenTeacherApply && (
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={onOpenTeacherApply}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                      }}
                    >
                      <School size={16} />
                      申請認證教師資格
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={goToStudentDashboard}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <GraduationCap size={16} />
                    前往學生中心
                  </button>

                  <button
                    type="button"
                    className="btn btn-ghost"
                    onClick={() => goToHome('hero')}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                  >
                    <Home size={16} />
                    返回首頁
                  </button>
                </div>
              </div>
            </div>
          </main>

          <Footer />
        </div>
      );
    }
  }

  // ==========================================
  // 5. Authenticated & Authorized -> Render Children
  // ==========================================
  return <>{children}</>;
};
