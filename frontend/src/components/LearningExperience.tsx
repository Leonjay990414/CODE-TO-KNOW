import React, { useState } from 'react';
import { BookOpen, CheckSquare, Sparkles, BarChart3, Layers, ArrowUpRight } from 'lucide-react';

export const LearningExperience: React.FC = () => {
  const [activeTab, setActiveTab] = useState<number>(0);

  const pillars = [
    {
      id: 'theory',
      icon: BookOpen,
      title: '學科知識與理論建構',
      subtitle: '深厚基石',
      desc: '將龐雜的電腦科學與學術知識，拆解為架構分明、配圖精緻的文字教材。採用嚴謹的 Typography 排版，讓理論沉浸閱讀不再枯燥。',
      mockupType: 'theory',
    },
    {
      id: 'practice',
      icon: CheckSquare,
      title: '階梯題庫與實作演練',
      subtitle: '動手實踐',
      desc: '涵蓋觀念選擇、代碼填空、演算法實作與完整模擬考試。即時執行反饋與邊界測試，將知識徹底鍛鍊為解決真實問題的肌肉記憶。',
      mockupType: 'practice',
    },
    {
      id: 'ai-tutor',
      icon: Sparkles,
      title: 'AI 啟發式分階段引導',
      subtitle: '思維鷹架',
      desc: '遇到卡點時，AI 不直接宣讀答案，而是分階提供提示：觀念聚焦、思路拓寬、關鍵語法提點，一步步引導你親自找到解方。',
      mockupType: 'ai-tutor',
    },
    {
      id: 'analytics',
      icon: BarChart3,
      title: '個人化學習歷程與弱點診斷',
      subtitle: '數據洞察',
      desc: '動態追蹤理解穩定度、作答時長與知識節點掌握率。視覺化六角能力雷達圖，為你量身打造效率最高的複習路徑。',
      mockupType: 'analytics',
    },
  ];

  return (
    <section id="experience" className="section-padding" style={{ backgroundColor: 'var(--surface-base)' }}>
      <div className="container">

        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '720px', margin: '0 auto var(--space-12) auto' }}>
          <span className="text-caption" style={{ color: 'var(--color-brand-deep-slate)', display: 'block', marginBottom: 'var(--space-2)' }}>
            LEARNING ECOSYSTEM // 學習體驗架構
          </span>
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>
            四維一體的完整沉浸式學習閉環
          </h2>
          <p className="text-body" style={{ fontSize: 'var(--font-size-md)' }}>
            從理論閱讀、刻意練習，到智能輔助與數據反饋，打造有深度、有節奏的學習旅程。
          </p>
        </div>

        {/* Pillars Grid & Interactive Showcase */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 'var(--space-10)', alignItems: 'center' }} className="experience-grid">

          {/* Left: Tab Selector List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {pillars.map((pillar, idx) => {
              const IconComp = pillar.icon;
              const isActive = activeTab === idx;
              return (
                <div
                  key={pillar.id}
                  onClick={() => setActiveTab(idx)}
                  className={`card card-interactive`}
                  style={{
                    padding: '20px',
                    borderColor: isActive ? 'var(--color-brand-deep-slate)' : 'var(--border-default)',
                    backgroundColor: isActive ? 'var(--surface-raised)' : 'transparent',
                    boxShadow: isActive ? 'var(--shadow-md)' : 'none',
                    borderLeft: isActive ? '4px solid var(--color-brand-gold)' : '1px solid var(--border-default)',
                    transition: 'all var(--duration-normal) var(--ease-out)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: isActive ? 'var(--color-brand-deep-slate)' : 'var(--color-brand-ice-slate)',
                        color: isActive ? 'var(--color-brand-ivory)' : 'var(--color-brand-deep-slate)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <IconComp size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-brand-gold)', letterSpacing: '0.05em' }}>
                        {pillar.subtitle}
                      </div>
                      <h4 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                        {pillar.title}
                      </h4>
                    </div>
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0, paddingLeft: '48px' }}>
                    {pillar.desc}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right: Dynamic Interactive Preview Canvas */}
          <div className="card glass-card" style={{ padding: '28px', minHeight: '440px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>

            {/* Top Bar of the Mockup */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Layers size={16} color="var(--color-brand-deep-slate)" />
                <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  平台介面模擬 // {pillars[activeTab].title}
                </span>
              </div>
              <span className="badge badge-neutral" style={{ fontSize: '11px' }}>
                UI 原型預覽
              </span>
            </div>

            {/* Dynamic View Mockups based on activeTab */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>

              {activeTab === 0 && (
                /* Theory Reading Mockup */
                <div style={{ backgroundColor: 'var(--surface-raised)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <span className="badge badge-gold" style={{ marginBottom: '8px' }}>章節 03 · 計算機理論</span>
                  <h4 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
                    什麼是動態規劃（Dynamic Programming）？
                  </h4>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '12px' }}>
                    動態規劃是一種將複雜大問題分解為互有重疊的子問題（Overlapping Subproblems），並透過記憶化（Memoization）避免重複計算的高效算法思維。
                  </p>
                  <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '10px 14px', borderRadius: 'var(--radius-xs)', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--color-brand-deep-slate)' }}>
                    狀態轉移方程：DP[i] = DP[i-1] + DP[i-2]
                  </div>
                </div>
              )}

              {activeTab === 1 && (
                /* Practice / Question Bank Mockup */
                <div style={{ backgroundColor: 'var(--surface-raised)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                    <span className="badge badge-neutral">題號 #104 · 二元樹深度</span>
                    <span style={{ fontSize: '12px', color: 'var(--status-success)', fontWeight: 600 }}>通過率 72.4%</span>
                  </div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
                    給定一個二元樹根節點 root，返回其最大深度（從根到最遠葉節點的路徑長度）。
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ padding: '8px 12px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-sm)', fontSize: '13px', backgroundColor: '#FAF9F6', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', border: '1.5px solid var(--color-brand-slate)', display: 'inline-block' }} />
                      選項 A：使用深度優先搜尋（DFS）遞迴計算
                    </div>
                    <div style={{ padding: '8px 12px', border: '1.5px solid var(--color-brand-deep-slate)', borderRadius: 'var(--radius-sm)', fontSize: '13px', backgroundColor: 'var(--color-brand-ice-slate)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: 'var(--color-brand-deep-slate)', display: 'inline-block' }} />
                      選項 B：使用廣度優先搜尋（BFS）層序遍歷
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 2 && (
                /* AI Scaffolding Mockup */
                <div style={{ backgroundColor: 'var(--surface-raised)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                    <Sparkles size={16} color="var(--color-brand-gold)" />
                    <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>
                      分階段智能引導對話
                    </span>
                  </div>
                  <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '12px', borderRadius: 'var(--radius-sm)', fontSize: '13px', marginBottom: '10px' }}>
                    <strong>學生提問：</strong>「我寫的遞迴函式在處理大數時直接記憶體崩潰（Stack Overflow），為什麼？」
                  </div>
                  <div style={{ backgroundColor: 'rgba(189, 167, 126, 0.12)', borderLeft: '3px solid var(--color-brand-gold)', padding: '12px', borderRadius: '0 var(--radius-sm) var(--radius-sm) 0', fontSize: '13px', color: 'var(--text-primary)' }}>
                    <strong>AI 鷹架提示：</strong>「遞迴過深會消耗呼叫堆疊。請檢查：(1) 終止條件（Base Case）是否在所有路徑均可達成？(2) 是否能改用『迴圈 + 迭代』消除呼叫開銷？」
                  </div>
                </div>
              )}

              {activeTab === 3 && (
                /* Analytics Mockup */
                <div style={{ backgroundColor: 'var(--surface-raised)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <span style={{ fontSize: '14px', fontWeight: 700 }}>知識掌握雷達分佈</span>
                    <span className="badge badge-success">成長率 +18%</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                    <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '12px', borderRadius: 'var(--radius-xs)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>邏輯演算法</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>88 / 100</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '12px', borderRadius: 'var(--radius-xs)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>代碼編寫穩定度</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>92 / 100</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '12px', borderRadius: 'var(--radius-xs)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>解題推導速度</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-brand-deep-slate)' }}>76 / 100</div>
                    </div>
                    <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '12px', borderRadius: 'var(--radius-xs)' }}>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>持續學習天數</div>
                      <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--color-brand-gold)' }}>24 天</div>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Status Caption */}
            <div style={{ paddingTop: '16px', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', color: 'var(--text-muted)' }}>
              <span>展示說明：四項模組完全互聯，建構無縫學習體驗</span>
              <span style={{ color: 'var(--color-brand-deep-slate)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                查看模組詳細規格 <ArrowUpRight size={14} />
              </span>
            </div>

          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 1023px) {
          .experience-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
