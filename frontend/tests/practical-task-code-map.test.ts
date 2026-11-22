import { describe, it, expect } from 'vitest';
import {
  toTaskNumber,
  toExamCode,
  toFullCode,
  getOfficialTaskMeta,
  isOfficialPracticalTask,
  isNonOfficialTopic,
  getCanonicalStorageKey,
  getCanonicalSandboxStorageKey,
  OFFICIAL_PRACTICAL_TASKS,
  OfficialPracticalTaskNumber,
} from '../src/utils/practicalTaskCodeMap';
import { getStorageKey } from '../src/utils/learningStorage';

describe('practicalTaskCodeMap (ISS-INC-003 官方術科題組代碼對照與規範)', () => {
  describe('toTaskNumber 轉換邏輯', () => {
    it('正確轉換數字 1 ~ 5', () => {
      expect(toTaskNumber(1)).toBe(1);
      expect(toTaskNumber(2)).toBe(2);
      expect(toTaskNumber(3)).toBe(3);
      expect(toTaskNumber(4)).toBe(4);
      expect(toTaskNumber(5)).toBe(5);
    });

    it('正確轉換字串 "1" ~ "5"', () => {
      expect(toTaskNumber('1')).toBe(1);
      expect(toTaskNumber('2')).toBe(2);
      expect(toTaskNumber('3')).toBe(3);
      expect(toTaskNumber('4')).toBe(4);
      expect(toTaskNumber('5')).toBe(5);
    });

    it('正確轉換 6 碼檢定代碼 "104301" ~ "104305"', () => {
      expect(toTaskNumber('104301')).toBe(1);
      expect(toTaskNumber('104302')).toBe(2);
      expect(toTaskNumber('104303')).toBe(3);
      expect(toTaskNumber('104304')).toBe(4);
      expect(toTaskNumber('104305')).toBe(5);
    });

    it('正確轉換完整官方代碼 "17300-104301" ~ "17300-104305"', () => {
      expect(toTaskNumber('17300-104301')).toBe(1);
      expect(toTaskNumber('17300-104302')).toBe(2);
      expect(toTaskNumber('17300-104303')).toBe(3);
      expect(toTaskNumber('17300-104304')).toBe(4);
      expect(toTaskNumber('17300-104305')).toBe(5);
    });

    it('正確轉換 slug 形式 "task-1" ~ "task-5"', () => {
      expect(toTaskNumber('task-1')).toBe(1);
      expect(toTaskNumber('task-2')).toBe(2);
      expect(toTaskNumber('task 2')).toBe(2);
      expect(toTaskNumber('TASK 3')).toBe(3);
      expect(toTaskNumber('task3')).toBe(3);
      expect(toTaskNumber('task-4')).toBe(4);
      expect(toTaskNumber('task-5')).toBe(5);
    });

    it('對非官方範圍輸入嚴格回傳 null', () => {
      expect(toTaskNumber(0)).toBeNull();
      expect(toTaskNumber(6)).toBeNull();
      expect(toTaskNumber(-1)).toBeNull();
      expect(toTaskNumber(1.5)).toBeNull();
      expect(toTaskNumber('0')).toBeNull();
      expect(toTaskNumber('6')).toBeNull();
      expect(toTaskNumber('104306')).toBeNull();
      expect(toTaskNumber('104300')).toBeNull();
      expect(toTaskNumber('17300-104306')).toBeNull();
      expect(toTaskNumber(null)).toBeNull();
      expect(toTaskNumber(undefined)).toBeNull();
      expect(toTaskNumber('')).toBeNull();
      expect(toTaskNumber('台灣美食')).toBeNull();
    });
  });

  describe('toExamCode 與 toFullCode 雙向對應', () => {
    it('回傳官方標準 6 碼與全碼', () => {
      expect(toExamCode(1)).toBe('104301');
      expect(toFullCode(1)).toBe('17300-104301');
      expect(toExamCode(5)).toBe('104305');
      expect(toFullCode(5)).toBe('17300-104305');
    });
  });

  describe('getOfficialTaskMeta 查詢', () => {
    it('取得完整的官方題組名稱與元資料', () => {
      const task1 = getOfficialTaskMeta(1);
      expect(task1).not.toBeNull();
      expect(task1?.title).toBe('校園社團介紹網');
      expect(task1?.examCode).toBe('104301');
      expect(task1?.isOfficial).toBe(true);

      const task2 = getOfficialTaskMeta('104302');
      expect(task2?.title).toBe('運動休閒廣場');

      const task3 = getOfficialTaskMeta('17300-104303');
      expect(task3?.title).toBe('線上資訊展');

      const task4 = getOfficialTaskMeta('task-4');
      expect(task4?.title).toBe('國家公園介紹');

      const task5 = getOfficialTaskMeta(5);
      expect(task5?.title).toBe('樂活日照中心');
    });

    it('查無資料時回傳 null', () => {
      expect(getOfficialTaskMeta(999)).toBeNull();
      expect(getOfficialTaskMeta('non-existent')).toBeNull();
    });
  });

  describe('isOfficialPracticalTask 驗證', () => {
    it('官方合法題號與代碼回傳 true', () => {
      expect(isOfficialPracticalTask(1)).toBe(true);
      expect(isOfficialPracticalTask('104301')).toBe(true);
      expect(isOfficialPracticalTask('17300-104305')).toBe(true);
      expect(isOfficialPracticalTask('task-3')).toBe(true);
    });

    it('非法或未定義物件回傳 false', () => {
      expect(isOfficialPracticalTask(0)).toBe(false);
      expect(isOfficialPracticalTask(6)).toBe(false);
      expect(isOfficialPracticalTask('104306')).toBe(false);
      expect(isOfficialPracticalTask(null)).toBe(false);
      expect(isOfficialPracticalTask({})).toBe(false);
    });
  });

  describe('isNonOfficialTopic 非官方主題過濾', () => {
    it('正確識別展示型/非官方主題（如「台灣美食」）', () => {
      expect(isNonOfficialTopic('台灣美食主題介紹')).toBe(true);
      expect(isNonOfficialTopic('Taiwan Food Demo')).toBe(true);
      expect(isNonOfficialTopic('custom-task-01')).toBe(true);
    });

    it('官方主題不應被判定為非官方', () => {
      expect(isNonOfficialTopic('校園社團介紹網')).toBe(false);
      expect(isNonOfficialTopic('運動休閒廣場')).toBe(false);
      expect(isNonOfficialTopic('線上資訊展')).toBe(false);
      expect(isNonOfficialTopic('國家公園介紹')).toBe(false);
      expect(isNonOfficialTopic('樂活日照中心')).toBe(false);
      expect(isNonOfficialTopic('104301')).toBe(false);
    });
  });

  describe('getCanonicalStorageKey 與 learningStorage 100% 格式相容性', () => {
    it('格式完全相容於 learningStorage.getStorageKey', () => {
      const testCases: Array<{ userId: string; taskNum: OfficialPracticalTaskNumber; ver: 'A' | 'B' }> = [
        { userId: 'test-user-123', taskNum: 1, ver: 'A' },
        { userId: 'test-user-123', taskNum: 2, ver: 'B' },
        { userId: '', taskNum: 3, ver: 'A' },
        { userId: 'admin', taskNum: 5, ver: 'B' },
      ];

      for (const tc of testCases) {
        const canonicalFromNumber = getCanonicalStorageKey(tc.userId, tc.taskNum, tc.ver);
        const legacyFromNumber = getStorageKey(tc.userId, tc.taskNum, tc.ver);
        expect(canonicalFromNumber).toBe(legacyFromNumber);

        // 使用 6 碼檢定代號轉換後，也應產出相同的 storage key
        const examCode = OFFICIAL_PRACTICAL_TASKS[tc.taskNum].examCode;
        const canonicalFromExamCode = getCanonicalStorageKey(tc.userId, examCode, tc.ver);
        expect(canonicalFromExamCode).toBe(legacyFromNumber);
      }
    });
  });

  describe('getCanonicalSandboxStorageKey 與 practicalSandboxEngine 100% 格式相容性', () => {
    it('支援數字與代碼轉換為標準沙盒儲存鍵 c2k_student_sandbox_workspace_{taskId}', () => {
      expect(getCanonicalSandboxStorageKey(1)).toBe('c2k_student_sandbox_workspace_1');
      expect(getCanonicalSandboxStorageKey('104302')).toBe('c2k_student_sandbox_workspace_2');
      expect(getCanonicalSandboxStorageKey('17300-104303')).toBe('c2k_student_sandbox_workspace_3');
      expect(getCanonicalSandboxStorageKey('task-4')).toBe('c2k_student_sandbox_workspace_4');
      expect(getCanonicalSandboxStorageKey(5)).toBe('c2k_student_sandbox_workspace_5');
    });
  });
});

