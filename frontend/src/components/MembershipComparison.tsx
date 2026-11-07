import React from 'react';
import {
  Check,
  Sparkles,
  ArrowRight,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '../context/NavigationContext';

export interface MembershipComparisonProps {
  onOpenAuth?: (mode?: 'login' | 'register') => void;
}

export const MembershipComparison: React.FC<MembershipComparisonProps> = ({ onOpenAuth }) => {
  const { openAuth } = useAuth();
  const { goToCertifications } = useNavigation();

  const handleRegisterClick = () => {
    if (onOpenAuth) {
      onOpenAuth('register');
    } else {
      openAuth('register');
    }
  };

  const handleLoginClick = () => {
    if (onOpenAuth) {
      onOpenAuth('login');
    } else {
      openAuth('login');
    }
  };

  const comparisonItems = [
    {
      id: 'cert-info',
      title: '1. 瀏覽證照資訊',
      desc: '檢定大綱、科目規範與題庫結構',
      guest: {
        access: true,
        text: '完整開放瀏覽',
        note: '全站各類證照與科目詳細大綱公開查閱',
      },
      member: {
        access: true,
        text: '完整開放瀏覽',
        note: '支援收藏至個人專屬目標（目標設定規劃中）',
      },
      status: {
        label: '已實作',
        type: 'success',
      },
    },
    {
      id: 'theory-practice',
      title: '2. 學科題庫',
      desc: '官方學科試題練習與詳解',
      guest: {
        access: true,
        text: '開放本機練習與解析查看',
        note: '免登入直接自測（使用規則待確認）',
      },
      member: {
        access: true,
        text: '開放題庫練習',
        note: '跨裝置作答進度同步（雲端同步規劃中）',
      },
      status: {
        label: '部分實作',
        type: 'warning',
      },
    },
    {
      id: 'mock-exam',
      title: '3. 模擬考',
      desc: '全真模擬測驗與試卷評分',
      guest: {
        access: true,
        text: '支援單次全真模擬測驗',
        note: '即時計時與成績結算（使用規則待確認）',
      },
      member: {
        access: true,
        text: '支援模擬測驗與成績存檔',
        note: '歷次成績趨勢與弱點分析（存檔規劃中）',
      },
      status: {
        label: '部分實作',
        type: 'warning',
      },
    },
    {
      id: 'practical-tasks',
      title: '4. 術科實作',
      desc: '五大題組與代碼工作台',
      guest: {
        access: true,
        text: '考點解析、85 份素材與工作台',
        note: '支援線上代碼即時編輯與畫面預覽',
      },
      member: {
        access: true,
        text: '完整術科與專案儲存',
        note: '個人代碼專案雲端備份（存檔規劃中）',
      },
      status: {
        label: '部分實作',
        type: 'warning',
      },
    },
    {
      id: 'learning-progress',
      title: '5. 學習進度',
      desc: '個人章節進度與學習歷程',
      guest: {
        access: 'partial',
        text: '僅限當前瀏覽器本地暫存',
        note: '更換設備或清除瀏覽器快取即遺失',
      },
      member: {
        access: true,
        text: '跨裝置個人學習歷程保存',
        note: 'Student Hub 儀表板（雲端同步尚未串接）',
      },
      status: {
        label: '部分實作',
        type: 'warning',
      },
    },
    {
      id: 'bookmarks-errors',
      title: '6. 錯題與收藏',
      desc: '高頻錯題本與重點題目標籤',
      guest: {
        access: false,
        text: '無法跨工作階段保存',
        note: '未開放未登入跨工作階段儲存',
      },
      member: {
        access: 'planned',
        text: '專屬錯題本自動收錄',
        note: '高頻錯題強化複習（尚未串接後端儲存 API）',
      },
      status: {
        label: '規劃中',
        type: 'planned',
      },
    },
    {
      id: 'notes',
      title: '7. 個人學習筆記',
      desc: '解題備忘與知識點筆記',
      guest: {
        access: false,
        text: '無法使用',
        note: '未開放訪客筆記功能',
      },
      member: {
        access: 'planned',
        text: '筆記雲端歸檔與速記',
        note: '個人試題筆記庫（規劃中）',
      },
      status: {
        label: '規劃中',
        type: 'planned',
      },
    },
    {
      id: 'ai-coach',
      title: '8. AI 學習教練',
      desc: '4 階啟發式助教對話',
      guest: {
        access: 'partial',
        text: '4 階引導示範與固定對話體驗',
        note: '可體驗階梯式提示邏輯',
      },
      member: {
        access: true,
        text: '4 階引導互動與脈絡分析',
        note: '階梯助教已就緒（真實 AI API 尚未串接）',
      },
      status: {
        label: '部分實作',
        type: 'warning',
      },
    },
  ];

  return (
    <section
      id="learning-options"
      className="section-padding"
      style={{
        backgroundColor: 'var(--surface-sunken)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
      }}
    >
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto var(--space-10) auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: 'var(--space-3)' }}>
            <span className="badge badge-gold">✦ FLEXIBLE LEARNING MODES // 選擇你的學習方式</span>
          </div>
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>
            無論是否登入，都能立即啟動學習探索
          </h2>
          <p
            className="text-body"
            style={{
              fontSize: 'var(--font-size-md)',
              color: 'var(--text-secondary)',
              maxWidth: '640px',
              margin: '0 auto',
            }}
          >
            無論是否登入，都能開始探索學習；成為會員後，還能逐步建立自己的學習歷程。
          </p>
        </div>

        {/* Two Comparison Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '28px',
            marginBottom: '48px',
          }}
        >
          {/* 1. Guest Card */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <span className="badge badge-neutral">免登入體驗 · 本機暫存模式</span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-brand-charcoal)', marginBottom: '8px' }}>
              未登入訪客 (Guest)
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
              零門檻即刻體驗核心題庫與代碼工具。適合快速瀏覽試題大綱、單次自測演練與工具操作。
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Check size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>自由瀏覽全站公開內容</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    完整探索證照中心、各科考試大綱與官方規範
                  </div>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Check size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>學科題庫本機自主練習</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    可直接進行題目作答並查閱詳盡解析（使用規則待確認）
                  </div>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Check size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>全真單次模擬測驗</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    支援考科倒數計時、交卷評分與成績單計算（使用規則待確認）
                  </div>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Check size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>術科五大題組與 85 份官方素材</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    瀏覽考點架構，隨時開啟線上代碼編輯器即時預覽
                  </div>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Check size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>4 階 AI 啟發式引導示範</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    體驗核心概念引導與思路點撥示範流程
                  </div>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55, color: 'var(--text-muted)' }}>
                <AlertCircle size={18} color="var(--status-warning)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <span>暫存限制：數據僅保存在當前瀏覽器</span>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    更換設備或清除快取時，暫存進度將會遺失
                  </div>
                </div>
              </li>
            </ul>

            <div style={{ marginTop: 'auto' }}>
              <button
                type="button"
                className="btn btn-outline btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => goToCertifications()}
              >
                <span>開始探索學習內容</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>

          {/* 2. Member Card */}
          <div
            className="card"
            style={{
              backgroundColor: 'var(--surface-raised)',
              border: '1px solid rgba(189, 167, 126, 0.45)',
              background: 'linear-gradient(180deg, rgba(189, 167, 126, 0.05) 0%, var(--surface-raised) 24%)',
              borderRadius: 'var(--radius-lg)',
              padding: '36px 32px',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: 'var(--shadow-sm)',
              position: 'relative',
            }}
          >
            <div style={{ marginBottom: '16px' }}>
              <span className="badge badge-gold">專屬學習帳號 · 建立學習歷程</span>
            </div>
            <h3 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--color-brand-charcoal)', marginBottom: '8px' }}>
              已登入會員 (Member)
            </h3>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '24px' }}>
              解鎖個人化學習首頁，完整記錄跨章節學習歷程與模擬考成果，打造個人專屬技能檔案。
            </p>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 32px 0', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Sparkles size={18} color="var(--color-brand-gold)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>包含訪客所有開放功能</strong>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    享有全站公開資源與完整試題檢索
                  </div>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Check size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong>個人學習首頁 (Student Hub)</strong>
                    <span className="badge badge-warning" style={{ fontSize: '11px', padding: '1px 6px' }}>部分實作</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    視覺化學習儀表板，即時掌握整體複習狀態
                  </div>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Check size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong>學習進度追蹤與雲端同步</strong>
                    <span className="badge badge-warning" style={{ fontSize: '11px', padding: '1px 6px' }}>部分實作</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    跨章節掌握度統計（跨裝置雲端資料同步規劃中）
                  </div>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Check size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong>模擬考歷史紀錄與弱點分析</strong>
                    <span className="badge badge-warning" style={{ fontSize: '11px', padding: '1px 6px' }}>部分實作</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    單次測驗已就緒（歷史成績單與盲點分析圖表規劃中）
                  </div>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Clock size={18} color="var(--color-brand-deep-slate)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong>專屬學科錯題本與收藏庫</strong>
                    <span className="badge badge-subtle" style={{ fontSize: '11px', padding: '1px 6px' }}>規劃中</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    自動收錄答錯題目，高頻盲點集中複習（尚未串接後端儲存 API）
                  </div>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Clock size={18} color="var(--color-brand-deep-slate)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong>個人學習筆記與專案備份</strong>
                    <span className="badge badge-subtle" style={{ fontSize: '11px', padding: '1px 6px' }}>規劃中</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    試題隨堂筆記與術科代碼專案雲端儲存（規劃中）
                  </div>
                </div>
              </li>

              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '14px', lineHeight: 1.55 }}>
                <Check size={18} color="var(--status-success)" style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <strong>4 階 AI 學習教練脈絡引導</strong>
                    <span className="badge badge-warning" style={{ fontSize: '11px', padding: '1px 6px' }}>部分實作</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                    階梯式啟發引導已就緒（深度個人化 LLM 雲端連線尚未串接）
                  </div>
                </div>
              </li>
            </ul>

            <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <button
                type="button"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={handleRegisterClick}
              >
                <span>免費註冊會員</span>
                <ArrowRight size={16} />
              </button>
              <div
                style={{
                  textAlign: 'center',
                  fontSize: '13px',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px',
                }}
              >
                <span>已有帳號？</span>
                <button
                  type="button"
                  className="btn btn-ghost"
                  style={{
                    padding: '2px 6px',
                    fontSize: '13px',
                    textDecoration: 'underline',
                    color: 'var(--color-brand-deep-slate)',
                  }}
                  onClick={handleLoginClick}
                >
                  會員登入
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Comparison Table Container */}
        <div
          style={{
            backgroundColor: 'var(--surface-raised)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          {/* Table Header / Subtitle */}
          <div
            style={{
              padding: '24px 28px',
              borderBottom: '1px solid var(--border-subtle)',
              backgroundColor: '#FAFAF8',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <h4 style={{ fontSize: '17px', fontWeight: 700, color: 'var(--color-brand-charcoal)', marginBottom: '4px' }}>
                功能詳細比較與開放狀態
              </h4>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: 0 }}>
                透明公開每項服務的實際開放狀況，依真實系統能力如實呈現。
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <span className="badge badge-success">✓ 已實作</span>
              <span className="badge badge-warning">◐ 部分實作</span>
              <span className="badge badge-subtle">⏳ 規劃中 / 尚未串接</span>
            </div>
          </div>

          {/* Table Scroll Wrapper */}
          <div style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                textAlign: 'left',
                fontSize: '14px',
                minWidth: '660px',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: 'var(--surface-sunken)', borderBottom: '1px solid var(--border-default)' }}>
                  <th style={{ padding: '16px 24px', width: '22%', color: 'var(--color-brand-deep-slate)', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                    學習功能
                  </th>
                  <th style={{ padding: '16px 24px', width: '33%', color: 'var(--color-brand-deep-slate)', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                    未登入訪客 (Guest)
                  </th>
                  <th style={{ padding: '16px 24px', width: '33%', color: 'var(--color-brand-deep-slate)', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                    已登入會員 (Member)
                  </th>
                  <th style={{ padding: '16px 24px', width: '12%', color: 'var(--color-brand-deep-slate)', fontWeight: 700, fontSize: '13px', whiteSpace: 'nowrap' }}>
                    實作狀態
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonItems.map((item, idx) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: idx === comparisonItems.length - 1 ? 'none' : '1px solid var(--border-subtle)',
                      backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(245, 242, 234, 0.2)',
                    }}
                  >
                    <td style={{ padding: '18px 24px', verticalAlign: 'top' }}>
                      <strong style={{ color: 'var(--text-primary)' }}>{item.title}</strong>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                        {item.desc}
                      </div>
                    </td>

                    <td style={{ padding: '18px 24px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                        {item.guest.access === true ? (
                          <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>✓</span>
                        ) : item.guest.access === 'partial' ? (
                          <span style={{ color: 'var(--status-warning)', fontWeight: 700 }}>◐</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontWeight: 700 }}>—</span>
                        )}
                        <span>{item.guest.text}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                        {item.guest.note}
                      </div>
                    </td>

                    <td style={{ padding: '18px 24px', verticalAlign: 'top' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-primary)' }}>
                        {item.member.access === true ? (
                          <span style={{ color: 'var(--status-success)', fontWeight: 700 }}>✓</span>
                        ) : item.member.access === 'planned' ? (
                          <span style={{ color: 'var(--color-brand-deep-slate)', fontWeight: 700 }}>⏳</span>
                        ) : (
                          <span style={{ color: 'var(--status-warning)', fontWeight: 700 }}>◐</span>
                        )}
                        <span>{item.member.text}</span>
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', lineHeight: 1.4 }}>
                        {item.member.note}
                      </div>
                    </td>

                    <td style={{ padding: '18px 24px', verticalAlign: 'top', whiteSpace: 'nowrap' }}>
                      {item.status.type === 'success' && (
                        <span className="badge badge-success">{item.status.label}</span>
                      )}
                      {item.status.type === 'warning' && (
                        <span className="badge badge-warning">{item.status.label}</span>
                      )}
                      {item.status.type === 'planned' && (
                        <span className="badge badge-subtle">{item.status.label}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  );
};
