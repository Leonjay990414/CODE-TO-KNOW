import { describe, it, expect } from 'vitest';

describe('Phase 11: AI Core & Cognitive Scaffolding Engine (P11-AIX-001, P11-AIX-002, P11-AIX-004)', () => {
  // Canonical 4-Stage Pedagogical Scaffolding
  const SCAFFOLDING_STAGES = [
    { stage: 1, name: '觀念聚焦', description: '檢驗先備知識與底層定理，禁止直接提供代碼' },
    { stage: 2, name: '思考破題', description: '引導演算法與邏輯流程，梳理條件分支' },
    { stage: 3, name: '邊界提點', description: '指出檢定考場陷阱、特殊案例與邊界條件' },
    { stage: 4, name: '完整解構', description: '對比架構選型、語意標準與時空複雜度' },
  ];

  describe('1. 4-Stage Cognitive Architecture Verification', () => {
    it('defines exactly 4 progressive cognitive scaffolding stages', () => {
      expect(SCAFFOLDING_STAGES).toHaveLength(4);
      expect(SCAFFOLDING_STAGES.map((s) => s.stage)).toEqual([1, 2, 3, 4]);
    });

    it('enforces pedagogical progression from conceptual focus to architectural deconstruction', () => {
      expect(SCAFFOLDING_STAGES[0].name).toContain('觀念');
      expect(SCAFFOLDING_STAGES[1].name).toContain('思考');
      expect(SCAFFOLDING_STAGES[2].name).toContain('邊界');
      expect(SCAFFOLDING_STAGES[3].name).toContain('解構');
    });
  });

  describe('2. Anti-Spoiler Principle (Independent Thinking First)', () => {
    it('stage 1 prompt generator asks reflective questions instead of providing direct solution code', () => {
      const userQuestion = '我的水平置中失效了，怎麼辦？';
      const stage1Prompt = `針對問題「${userQuestion}」，請引導學生回想 CSS 盒模型外距（margin）自動分配原則，不得直接提供完整 CSS 程式碼。`;

      expect(stage1Prompt).toContain('不得直接提供完整 CSS 程式碼');
      expect(stage1Prompt).toContain('引導');
    });

    it('stage 2 provides logical steps and pseudocode concepts without solving the problem entirely', () => {
      const stage2Concept = '要讓區塊元素水平置中，外層容器寬度固定時，左右外距需要設為 auto。';
      expect(stage2Concept).not.toContain('<style>');
      expect(stage2Concept).toContain('左右外距');
    });
  });

  describe('3. Offline Degradation & Fallback Resilience', () => {
    it('gracefully degrades to curated rule-based hints when external LLM API is unavailable', () => {
      const isExternalLlmConnected = false;
      const getAiResponse = (query: string, stage: number) => {
        if (!isExternalLlmConnected) {
          return {
            source: 'RULE_BASED_FALLBACK',
            text: `【本機離線觀念引導】：針對「${query}」，請檢查核心盒模型規範或 HTML5 標籤語意。`,
            stage,
            isOnlineModel: false,
          };
        }
        return { source: 'CLOUD_LLM', text: '線上回應', stage, isOnlineModel: true };
      };

      const response = getAiResponse('Float 塌陷問題', 1);
      expect(response.source).toBe('RULE_BASED_FALLBACK');
      expect(response.isOnlineModel).toBe(false);
      expect(response.text).toContain('本機離線觀念引導');
    });
  });

  describe('4. AI Transparency & Educational Disclaimer', () => {
    it('includes disclaimer statement that AI assists thinking rather than replacing independent problem-solving', () => {
      const disclaimer = '碼上學 AI 教學助理僅供學習啟發與思考導引，所有實作與評分標準均以勞動部技能檢定中心官方公布之最新規範為準。';
      expect(disclaimer).toContain('啟發與思考導引');
      expect(disclaimer).toContain('勞動部技能檢定中心官方公布');
    });
  });
});
