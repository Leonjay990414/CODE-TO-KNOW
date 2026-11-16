import { describe, it, expect } from 'vitest';
import {
  classifyTechnology,
  generateFallbackResponse,
  validateAiSourceStatus,
  AIS_009_PROMPT_METADATA,
  SCAFFOLDING_STAGES_INFO,
} from '../src/utils/aiFallbackEngine';

describe('Phase 11: AI Core & Cognitive Scaffolding Engine (P11-AIS-001 ~ P11-AIS-011)', () => {
  describe('1. HTML / CSS / JavaScript Technology Classification (P11-AIS-004)', () => {
    it('classifies HTML structural questions accurately', () => {
      const res = classifyTechnology('如何在頁面中加入 iframe 並且讓超連結可以在裡面開啟？');
      expect(res.category).toBe('HTML');
      expect(res.nameZh).toContain('HTML');
      expect(res.focusZh).toContain('結構');
    });

    it('classifies CSS styling and layout questions accurately', () => {
      const res = classifyTechnology('為什麼我的外層容器設定了 margin: 0 auto 卻無法水平置中？');
      expect(res.category).toBe('CSS');
      expect(res.nameZh).toContain('CSS');
      expect(res.focusZh).toContain('排版');
    });

    it('classifies JavaScript interactive and DOM questions accurately', () => {
      const res = classifyTechnology('使用 addEventListener 綁定 click 事件卻一直報錯 null 怎麼辦？');
      expect(res.category).toBe('JAVASCRIPT');
      expect(res.nameZh).toContain('JavaScript');
      expect(res.focusZh).toContain('互動');
    });

    it('classifies general certification or unspecified questions as GENERAL', () => {
      const res = classifyTechnology('丙級技術士檢定的評分規則與考場注意事項有哪些？');
      expect(res.category).toBe('GENERAL');
      expect(res.nameZh).toContain('通識');
    });
  });

  describe('2. Canonical 4-Stage Pedagogical Scaffolding (P11-AIS-005)', () => {
    it('defines exactly 4 progressive cognitive scaffolding stages', () => {
      const stages = Object.keys(SCAFFOLDING_STAGES_INFO).map(Number);
      expect(stages).toEqual([1, 2, 3, 4]);
    });

    it('enforces pedagogical progression from conceptual focus to architectural deconstruction', () => {
      expect(SCAFFOLDING_STAGES_INFO[1].name).toBe('觀念聚焦');
      expect(SCAFFOLDING_STAGES_INFO[2].name).toBe('思考破題');
      expect(SCAFFOLDING_STAGES_INFO[3].name).toBe('邊界提點');
      expect(SCAFFOLDING_STAGES_INFO[4].name).toBe('完整解構');
    });

    it('stage 1 enforces anti-spoiler rule: forbids direct code dump and focuses on reflective guiding', () => {
      expect(SCAFFOLDING_STAGES_INFO[1].antiSpoilerRuleZh).toContain('嚴禁直接輸出解答程式碼');
    });
  });

  describe('3. Offline Fallback Engine & Curated Patterns (P11-AIS-006, P11-AIS-010)', () => {
    it('produces curated multi-stage advice for CSS float collapse', () => {
      const stage1 = generateFallbackResponse('子元素 float 導致父容器高度塌陷怎麼辦？', 1);
      expect(stage1.source).toBe('OFFLINE');
      expect(stage1.category).toBe('CSS');
      expect(stage1.stage).toBe(1);
      expect(stage1.contentZh).toContain('文件流');
      expect(stage1.guidingQuestionZh).toBeDefined();

      const stage3 = generateFallbackResponse('子元素 float 導致父容器高度塌陷怎麼辦？', 3);
      expect(stage3.stage).toBe(3);
      expect(stage3.contentZh).toContain('考場邊界提點');
    });

    it('produces curated advice for HTML target iframe mismatch', () => {
      const res = generateFallbackResponse('點選超連結無法在 iframe 內嵌框架開啟', 2);
      expect(res.category).toBe('HTML');
      expect(res.contentZh).toContain('name');
      expect(res.stage).toBe(2);
    });

    it('provides honest and non-hallucinatory generic guidance when question does not match curated patterns', () => {
      const res = generateFallbackResponse('某個冷門未知的語法或奇怪錯誤', 1);
      expect(res.source).toBe('OFFLINE');
      expect(res.contentZh).toContain('觀念聚焦引導');
      expect(res.transparencyNoticeZh).toContain('未匹配到特定特定考題模式');
      expect(res.isLiveModel).toBe(false);
    });
  });

  describe('4. AI Source Status Verification: DEMO / OFFLINE / AI_LIVE (P11-AIS-011)', () => {
    it('allows DEMO source for curated scenario demonstrations', () => {
      const res = generateFallbackResponse('版面置中失效', 1, { isDemoScenario: true, hasActiveLlmKey: false });
      expect(res.source).toBe('DEMO');
      expect(res.isLiveModel).toBe(false);
      expect(res.transparencyNoticeZh).toContain('展示模式');
    });

    it('strictly forbids AI_LIVE when no active commercial LLM key is configured', () => {
      const validated = validateAiSourceStatus('AI_LIVE', false);
      expect(validated).toBe('OFFLINE');
    });

    it('only permits AI_LIVE when an active commercial LLM key is verified', () => {
      const validated = validateAiSourceStatus('AI_LIVE', true);
      expect(validated).toBe('AI_LIVE');
    });
  });

  describe('5. AIS-009 Protection & Metadata Regression (P11-AIS-009 100% PASS)', () => {
    it('preserves AIS-009 prompt version and metadata contracts', () => {
      expect(AIS_009_PROMPT_METADATA.uid).toBe('P11-AIS-009');
      expect(AIS_009_PROMPT_METADATA.version).toBe('v1.4.0-socratic-offline');
      expect(AIS_009_PROMPT_METADATA.antiSpoilerEnforced).toBe(true);
    });

    it('attaches AIS-009 prompt version to every generated fallback response', () => {
      const res = generateFallbackResponse('任意題目測試', 1);
      expect(res.promptVersion).toBe('v1.4.0-socratic-offline');
    });
  });
});
