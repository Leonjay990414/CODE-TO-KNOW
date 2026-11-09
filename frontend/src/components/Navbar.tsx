import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, User as UserIcon, LogOut, School } from 'lucide-react';
import { useAuth, AuthModalMode } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';

interface NavbarProps {
  onOpenAuth?: (mode: AuthModalMode) => void;
  onOpenTeacherApply?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAuth, onOpenTeacherApply }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, openAuth: contextOpenAuth, logout } = useAuth();
  const { route, navigate } = useNavigation();

  const handleOpenAuth = (mode: AuthModalMode) => {
    if (onOpenAuth) {
      onOpenAuth(mode);
    } else {
      contextOpenAuth(mode);
    }
  };

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: '首頁', href: '#hero' },
    { label: '證照中心', href: '#certifications' },
    { label: '學科題庫', href: '#theory' },
    { label: '術科實作', href: '#practical' },
    { label: '全真模考', href: '#mock-exam' },
    { label: '程式沙盒', href: '#code-editor' },
    { label: 'AI 教練', href: '#ai-coach' },
    { label: '學習進度', href: '#progress' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);

    if (
      href.startsWith('#certifications') ||
      href === '#theory' ||
      href === '#practical' ||
      href === '#mock-exam' ||
      href.startsWith('#code-editor') ||
      href === '#ai-coach' ||
      href === '#progress' ||
      href === '#student' ||
      href === '#teacher' ||
      href === '#sources'
    ) {
      navigate(href);
      return;
    }

    if (route.page !== 'home') {
      navigate(href);
      setTimeout(() => {
        const target = document.querySelector(href);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }, 120);
    } else {
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const isLinkActive = (itemHref: string) => {
    if (itemHref === '#certifications') {
      return route.page === 'certifications' || route.page === 'certification-detail' || route.page === 'web-design-demo';
    }
    if (itemHref === '#theory') return route.page === 'theory-practice';
    if (itemHref === '#practical') return route.page === 'practical-learning';
    if (itemHref === '#mock-exam') return route.page === 'mock-exam';
    if (itemHref === '#code-editor') return route.page === 'code-editor';
    if (itemHref === '#ai-coach') return route.page === 'ai-coach';
    if (itemHref === '#progress') return route.page === 'learning-progress';
    if (itemHref === '#sources') return route.page === 'import-system';
    if (itemHref === '#hero' && route.page === 'home') return true;
    return false;
  };

  const getRoleBadge = (roles: string[] = []) => {
    if (roles.includes('ADMIN')) return <span className="badge badge-gold" style={{ fontSize: '11px', padding: '2px 8px' }}>管理員</span>;
    if (roles.includes('TEACHER')) return <span className="badge badge-slate" style={{ fontSize: '11px', padding: '2px 8px' }}>認證教師</span>;
    return <span className="badge badge-subtle" style={{ fontSize: '11px', padding: '2px 8px' }}>學員</span>;
  };

  return (
    <>
      <header className={`glass-nav ${isScrolled ? 'scrolled' : ''}`}>
        <div className="container" style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Brand Logo Lockup */}
          <a
            href="#hero"
            onClick={(e) => handleNavClick(e, '#hero')}
            className="brand-logo-lockup"
            aria-label="碼上學 CODE TO KNOW 首頁"
          >
            {/* The Folio Monogram SVG Symbol */}
            <div className="brand-logo-symbol">
              <svg viewBox="0 0 256 256" width="100%" height="100%" role="img" aria-label="碼上學 Logo">
                <path fill="#526B7B" d="M 140 48 C 84 48 40 84 40 128 C 40 172 84 208 140 208 C 149 208 156 201 156 192 C 156 183 149 176 140 176 C 102 176 70 154 70 128 C 70 102 102 80 140 80 C 149 80 156 73 156 64 C 156 55 149 48 140 48 Z"/>
                <path fill="#8FA9B8" d="M 130 126 C 135 121 143 121 148 126 L 194 172 C 200 178 200 186 194 192 C 188 198 180 198 174 192 L 130 148 C 124 142 124 132 130 126 Z"/>
                <path fill="#BDA77E" d="M 126 114 L 176 64 C 181 59 189 59 194 64 C 199 69 199 77 194 82 L 144 132 C 139 137 131 137 126 132 C 121 127 121 119 126 114 Z"/>
                <path fill="#BDA77E" d="M 200 38 C 200 48 194 54 184 56 C 194 58 200 64 200 74 C 200 64 206 58 216 56 C 206 54 200 48 200 38 Z"/>
              </svg>
            </div>
            <div className="brand-logo-text">
              <span className="brand-name-zh">碼上學</span>
              <span className="brand-divider" aria-hidden="true" />
              <span className="brand-name-en">CODE TO KNOW</span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '32px' }} className="desktop-only-nav">
            {navLinks.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  style={{
                    fontSize: '14px',
                    fontWeight: active ? 700 : 500,
                    color: active ? 'var(--color-brand-deep-slate)' : 'var(--text-primary)',
                    position: 'relative',
                    padding: '6px 0',
                    borderBottom: active ? '2px solid var(--color-brand-gold)' : '2px solid transparent',
                    transition: 'all var(--transition-fast)',
                  }}
                  className="nav-link-item"
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          {/* Action CTAs / User Auth Info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }} className="desktop-only-cta">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  type="button"
                  onClick={() => navigate('#student')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 12px',
                    backgroundColor: route.page === 'student-dashboard' ? '#EFECE3' : 'var(--surface-sunken)',
                    borderRadius: 'var(--radius-full)',
                    border: '1px solid var(--border-subtle)',
                    cursor: 'pointer',
                  }}
                  title="進入學生中心"
                >
                  <UserIcon size={16} color="var(--color-brand-deep-slate)" />
                  <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                    {user.displayName}
                  </span>
                  {getRoleBadge(user.roles)}
                </button>

                {(user.roles.includes('TEACHER') || user.roles.includes('ADMIN')) && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={() => navigate('#teacher')}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '0 10px', height: '30px' }}
                  >
                    <School size={13} />
                    <span>教師中心</span>
                  </button>
                )}

                {!user.roles.includes('TEACHER') && !user.roles.includes('ADMIN') && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm"
                    onClick={onOpenTeacherApply}
                    style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', padding: '0 10px', height: '30px' }}
                  >
                    <School size={13} />
                    <span>申請教師資格</span>
                  </button>
                )}

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={logout}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
                >
                  <LogOut size={14} />
                  <span>登出</span>
                </button>
              </div>
            ) : (
              <>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleOpenAuth('login')}
                >
                  登入
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => handleOpenAuth('register')}
                >
                  <span>免費開始學習</span>
                  <ArrowRight size={14} />
                </button>
              </>
            )}
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            className="mobile-only-toggle"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label={mobileMenuOpen ? '關閉選單' : '開啟導覽選單'}
            style={{
              display: 'none',
              alignItems: 'center',
              justifyContent: 'center',
              width: '44px',
              height: '44px',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
            }}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div
          style={{
            position: 'fixed',
            top: '72px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(38, 52, 61, 0.45)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            zIndex: 'var(--z-index-drawer)',
            display: 'flex',
            flexDirection: 'column',
          }}
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            style={{
              backgroundColor: 'var(--surface-base)',
              padding: '24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              borderBottom: '1px solid var(--border-default)',
              boxShadow: 'var(--shadow-lg)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {navLinks.map((item) => {
              const active = isLinkActive(item.href);
              return (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={(e) => handleNavClick(e, item.href)}
                  style={{
                    fontSize: '16px',
                    fontWeight: active ? 700 : 600,
                    color: active ? 'var(--color-brand-deep-slate)' : 'var(--text-primary)',
                    padding: '12px 8px',
                    borderBottom: '1px solid var(--border-subtle)',
                    borderLeft: active ? '4px solid var(--color-brand-gold)' : '4px solid transparent',
                    paddingLeft: active ? '12px' : '8px',
                    backgroundColor: active ? 'var(--surface-sunken)' : 'transparent',
                    borderRadius: 'var(--radius-xs)',
                  }}
                >
                  {item.label}
                </a>
              );
            })}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '12px' }}>
              {user ? (
                <>
                  <div
                    onClick={() => { setMobileMenuOpen(false); navigate('#student'); }}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', backgroundColor: 'var(--surface-sunken)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}
                    title="點擊進入學生中心"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserIcon size={18} color="var(--color-brand-deep-slate)" />
                      <span style={{ fontSize: '14px', fontWeight: 600 }}>{user.displayName}</span>
                    </div>
                    {getRoleBadge(user.roles)}
                  </div>

                  {(user.roles.includes('TEACHER') || user.roles.includes('ADMIN')) && (
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => { setMobileMenuOpen(false); navigate('#teacher'); }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}
                    >
                      <School size={15} />
                      <span>進入教師管理中心</span>
                    </button>
                  )}

                  {!user.roles.includes('TEACHER') && !user.roles.includes('ADMIN') && (
                    <button
                      type="button"
                      className="btn btn-outline btn-mobile-full"
                      onClick={() => {
                        setMobileMenuOpen(false);
                        if (onOpenTeacherApply) onOpenTeacherApply();
                      }}
                      style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                    >
                      <School size={16} />
                      <span>申請成為認證教師</span>
                    </button>
                  )}

                  <button
                    type="button"
                    className="btn btn-secondary btn-mobile-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                  >
                    <LogOut size={16} />
                    <span>登出系統</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-secondary btn-mobile-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleOpenAuth('login');
                    }}
                  >
                    登入
                  </button>
                  <button
                    type="button"
                    className="btn btn-primary btn-mobile-full"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleOpenAuth('register');
                    }}
                  >
                    <span>免費開始學習</span>
                    <ArrowRight size={16} />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .brand-logo-lockup {
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
          text-decoration: none;
          white-space: nowrap;
        }
        .brand-logo-symbol {
          width: 36px;
          height: 36px;
          flex-shrink: 0;
        }
        .brand-logo-text {
          display: flex;
          align-items: center;
          gap: 8px;
          white-space: nowrap;
          flex-shrink: 0;
        }
        .brand-name-zh {
          font-size: 19px;
          font-weight: 700;
          letter-spacing: 0.05em;
          color: var(--color-brand-charcoal);
          line-height: 1;
        }
        .brand-divider {
          width: 1px;
          height: 14px;
          background-color: var(--color-brand-sand);
          display: inline-block;
          flex-shrink: 0;
        }
        .brand-name-en {
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.12em;
          color: var(--color-brand-deep-slate);
          text-transform: uppercase;
          line-height: 1;
        }
        @media (max-width: 480px) {
          .brand-logo-lockup {
            gap: 8px;
          }
          .brand-logo-symbol {
            width: 28px;
            height: 28px;
          }
          .brand-name-zh {
            font-size: 16px;
          }
          .brand-divider {
            height: 12px;
          }
          .brand-name-en {
            font-size: 9px;
            letter-spacing: 0.08em;
          }
        }
        @media (max-width: 1023px) {
          .desktop-only-nav, .desktop-only-cta {
            display: none !important;
          }
          .mobile-only-toggle {
            display: flex !important;
          }
        }
        .nav-link-item:hover {
          color: var(--color-brand-deep-slate) !important;
        }
        .nav-link-item::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: 50%;
          width: 0;
          height: 2px;
          background-color: var(--color-brand-gold);
          transition: all var(--duration-fast) var(--ease-out);
          transform: translateX(-50%);
        }
        .nav-link-item:hover::after {
          width: 100%;
        }
      `}</style>
    </>
  );
};
