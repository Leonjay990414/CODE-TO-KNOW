import React, { useState } from 'react';
import { Sparkles, MessageSquare, HelpCircle, Check } from 'lucide-react';

export const AIScaffoldingDemo: React.FC = () => {
  const [selectedLevel, setSelectedLevel] = useState<number>(1);

  const guidanceLevels = [
    {
      level: 1,
      name: '階段一：觀念釐清',
      shortDesc: '檢驗先備知識與底層定理',
      prompt: '我不知道該如何下手處理「陣列中尋找兩數之和等於目標值」？',
      aiReply: '別急著寫雙重迴圈！先思考：如果我們已經檢查過數字 A，當前正在看數字 B，我們希望過去已經記錄過哪個數值？這與雜湊表（Hash Map）的 O(1) 查找特性有何關聯？',
      benefit: '幫助學生確認底層資料結構，而非直接貼答案。',
    },
    {
      level: 2,
      name: '階段二：思考破題',
      shortDesc: '梳理演算邏輯與流程設計',
      prompt: '了解雜湊表原理了，那我遍歷陣列時具體該怎麼記錄？',
      aiReply: '你可以維護一個字典 `seen = {}`。遍歷每個元素 `num` 時：先計算出它的互補值 `complement = target - num`。如果 `complement` 已經在 `seen` 裡，你就找到了答案！否則，將當前數字存入字典。',
      benefit: '引導學生自己寫出狀態轉移與條件判斷。',
    },
    {
      level: 3,
      name: '階段三：邊界提點',
      shortDesc: '挖掘邊界條件與潛在陷阱',
      prompt: '如果陣列裡有重複的數字，或者 target 是同一個數字的兩倍呢？',
      aiReply: '這正是最關鍵的邊界條件！注意：同一個元素不能使用兩次。所以「先查後存」的順序非常精妙——在當前索引還沒存進去之前查字典，天然避開了元素與自身配對的錯誤。',
      benefit: '培養自我審查代碼與測試極端案例的直覺。',
    },
    {
      level: 4,
      name: '階段四：完整解構',
      shortDesc: '對比多種解法與時空複雜度',
      prompt: '這個解法就是最優解了嗎？還有沒有其他思考角度？',
      aiReply: '當前雜湊法時間為 O(N)、空間為 O(N)，已是未排序陣列的極限。但若題目規定「陣列已排序且額外空間 O(1)」，則應轉向雙指針法（Two Pointers）。學會根據限制條件切換策略，才是真正的掌握。',
      benefit: '拓展高階工程視野，理解架構取捨。',
    },
  ];

  return (
    <section id="ai-learning" className="section-padding" style={{ backgroundColor: 'var(--surface-sunken)', position: 'relative' }}>
      <div className="container">

        {/* Section Header */}
        <div style={{ textAlign: 'center', maxWidth: '760px', margin: '0 auto var(--space-12) auto' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: 'var(--space-2)' }}>
            <Sparkles size={16} color="var(--color-brand-gold)" />
            <span className="text-caption" style={{ color: 'var(--color-brand-deep-slate)' }}>
              SCAFFOLDING INTELLIGENCE // 鷹架智能導航
            </span>
          </div>
          <h2 className="text-h2" style={{ marginBottom: 'var(--space-4)' }}>
            AI 智慧引導：不是給出答案，而是點亮思路
          </h2>
          <p className="text-body" style={{ fontSize: 'var(--font-size-md)' }}>
            傳統 AI 常在第一個回合就直接給出完整程式碼，剝奪了學習者的思考樂趣。「碼上學」獨創四階啟發系統，根據你的卡點程度給予最恰到好處的助推。
          </p>
        </div>

        {/* 4-Step Scaffolding Selector */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: 'var(--space-8)' }} className="scaffolding-level-grid">
          {guidanceLevels.map((lvl) => {
            const isSelected = selectedLevel === lvl.level;
            return (
              <div
                key={lvl.level}
                onClick={() => setSelectedLevel(lvl.level)}
                style={{
                  padding: '16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: isSelected ? 'var(--color-brand-deep-slate)' : 'var(--surface-raised)',
                  color: isSelected ? 'var(--color-brand-ivory)' : 'var(--text-primary)',
                  border: isSelected ? '1px solid var(--color-brand-deep-slate)' : '1px solid var(--border-default)',
                  cursor: 'pointer',
                  boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-subtle)',
                  transition: 'all var(--duration-fast) var(--ease-out)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '6px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: isSelected ? 'var(--color-brand-gold)' : 'var(--text-muted)' }}>
                    STEP 0{lvl.level}
                  </span>
                  {isSelected && <Check size={14} color="var(--color-brand-gold)" />}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700 }}>
                  {lvl.name}
                </div>
                <div style={{ fontSize: '12px', opacity: isSelected ? 0.85 : 0.65 }}>
                  {lvl.shortDesc}
                </div>
              </div>
            );
          })}
        </div>

        {/* Dynamic Simulated Dialogue Box */}
        <div className="card" style={{ padding: '32px', borderRadius: 'var(--radius-xl)', boxShadow: 'var(--shadow-lg)' }}>

          {/* Status Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '16px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="var(--color-brand-deep-slate)" />
              <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--color-brand-charcoal)' }}>
                分階段引導情境模擬：{guidanceLevels[selectedLevel - 1].name}
              </span>
            </div>
            <span className="badge badge-gold" style={{ fontSize: '11px' }}>
              ✦ 啟發式推理對話
            </span>
          </div>

          {/* Student Bubble */}
          <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-brand-ice-slate)', color: 'var(--color-brand-deep-slate)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
              學
            </div>
            <div style={{ backgroundColor: 'var(--surface-sunken)', padding: '14px 18px', borderRadius: '4px 16px 16px 16px', maxWidth: '80%' }}>
              <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>學生提問</div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                &quot;{guidanceLevels[selectedLevel - 1].prompt}&quot;
              </div>
            </div>
          </div>

          {/* AI Bubble */}
          <div style={{ display: 'flex', gap: '14px', marginBottom: '24px', alignItems: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'var(--color-brand-deep-slate)', color: 'var(--color-brand-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
              AI
            </div>
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid var(--border-default)', padding: '16px 20px', borderRadius: '4px 16px 16px 16px', maxWidth: '85%', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
                <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-brand-gold)', letterSpacing: '0.05em' }}>
                  ✦ 碼上學 AI 思考鷹架助推
                </span>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.7 }}>
                {guidanceLevels[selectedLevel - 1].aiReply}
              </div>
            </div>
          </div>

          {/* Educational Purpose Note */}
          <div style={{ padding: '12px 16px', backgroundColor: 'rgba(189, 167, 126, 0.12)', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '13px', color: '#7C663D', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <HelpCircle size={16} />
              教育設計目標：{guidanceLevels[selectedLevel - 1].benefit}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              展示說明：此為預設引導流程展示，正式功能開發中
            </span>
          </div>

        </div>

      </div>

      <style>{`
        @media (max-width: 840px) {
          .scaffolding-level-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
        @media (max-width: 540px) {
          .scaffolding-level-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
};
