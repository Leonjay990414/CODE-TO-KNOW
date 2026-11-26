import { describe, it, expect } from 'vitest';
import {
  escapeHtml,
  sanitizeUrl,
  sanitizeHeader,
  renderVerificationEmail,
  renderPasswordResetEmail,
  renderSecurityLoginAlertEmail,
  renderExamScheduledEmail,
  renderTeacherAnnouncementEmail,
  renderMaintenanceNotificationEmail,
} from '../src/services/email.templates.js';

describe('Phase 10: Official Email Templates & Notification System (P10-EML-005, P10-EML-006)', () => {
  describe('Security & XSS Prevention (escapeHtml, sanitizeUrl, sanitizeHeader)', () => {
    it('properly escapes dangerous HTML characters to prevent email-based injection', () => {
      const malicious = '<script>alert("xss")</script>&"\'';
      const escaped = escapeHtml(malicious);
      expect(escaped).not.toContain('<script>');
      expect(escaped).toContain('&lt;script&gt;');
      expect(escaped).toContain('&quot;');
      expect(escaped).toContain('&#039;');
      expect(escaped).toContain('&amp;');
    });

    it('handles empty or undefined values safely in escapeHtml', () => {
      expect(escapeHtml('')).toBe('');
      // @ts-expect-error test undefined
      expect(escapeHtml(undefined)).toBe('');
    });

    it('sanitizeUrl blocks dangerous URI schemes like javascript: and data:', () => {
      expect(sanitizeUrl('javascript:alert(document.cookie)')).toBe('#');
      expect(sanitizeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==')).toBe('#');
      expect(sanitizeUrl('vbscript:msgbox(1)')).toBe('#');
      expect(sanitizeUrl('   ')).toBe('#');
      expect(sanitizeUrl('')).toBe('#');
    });

    it('sanitizeUrl permits valid http:// and https:// URLs', () => {
      expect(sanitizeUrl('https://codetoknow.edu.tw/verify?token=123')).toBe('https://codetoknow.edu.tw/verify?token=123');
      expect(sanitizeUrl('http://localhost:3000/reset?token=abc')).toBe('http://localhost:3000/reset?token=abc');
    });

    it('sanitizeHeader strips CRLF to prevent email header injection', () => {
      const dirty = 'Normal Subject\r\nBcc: victim@example.com\r\nContent-Type: text/html';
      const clean = sanitizeHeader(dirty);
      expect(clean).not.toContain('\r');
      expect(clean).not.toContain('\n');
      expect(clean).toBe('Normal Subject Bcc: victim@example.com Content-Type: text/html');
    });
  });

  describe('P10-EML-005: Account Security & Authentication Templates', () => {
    it('renders email verification template with dual text and HTML output', () => {
      const result = renderVerificationEmail({
        displayName: '測試學員 <img src=x onerror=alert(1)>',
        verificationUrl: 'https://codetoknow.edu.tw/verify?token=SECURE123',
        expiresInMinutes: 30,
      });

      expect(result.subject).toContain('【碼上學】請完成電子信箱驗證');
      expect(result.text).toContain('測試學員');
      expect(result.text).toContain('https://codetoknow.edu.tw/verify?token=SECURE123');
      expect(result.text).toContain('30 分鐘內');

      // Verify HTML security and brand design elements
      expect(result.html).toContain('<!DOCTYPE html>');
      expect(result.html).toContain('碼上學｜CODE TO KNOW');
      expect(result.html).not.toContain('<img src=x');
      expect(result.html).toContain('&lt;img src=x');
      expect(result.html).toContain('https://codetoknow.edu.tw/verify?token=SECURE123');
    });

    it('renders password reset template safely and includes expiration notice', () => {
      const result = renderPasswordResetEmail({
        displayName: '王大明',
        resetUrl: 'https://codetoknow.edu.tw/reset-password?token=RESET456',
        expiresInMinutes: 15,
      });

      expect(result.subject).toContain('【碼上學】重設您的帳號密碼請求');
      expect(result.text).toContain('王大明');
      expect(result.text).toContain('15 分鐘內');
      expect(result.text).toContain('https://codetoknow.edu.tw/reset-password?token=RESET456');
      expect(result.html).toContain('密碼重設通知');
      expect(result.html).toContain('Session 將自動失效');
    });

    it('renders security login alert template with IP, device, and timestamp', () => {
      const result = renderSecurityLoginAlertEmail({
        displayName: '林小華',
        loginTime: '2026-11-15 12:05:00 UTC+8',
        ipAddress: '140.112.1.1',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/157.0.0.0',
        deviceType: 'Windows PC (Chrome)',
      });

      expect(result.subject).toContain('【安全警報】碼上學帳號在新裝置登入通知');
      expect(result.text).toContain('140.112.1.1');
      expect(result.text).toContain('若非您本人操作');
      expect(result.html).toContain('140.112.1.1');
      expect(result.html).toContain('Windows PC (Chrome)');
      expect(result.html).toContain('#A24B46'); // warning accent color
    });
  });

  describe('P10-EML-006: Academic, Examination & System Notifications', () => {
    it('renders exam scheduled notification email with timing and duration', () => {
      const result = renderExamScheduledEmail({
        studentName: '張志豪',
        examTitle: '17300 網頁設計丙級第一次全真模擬試卷',
        courseName: '高三專題網頁程式設計',
        startTime: '2026-11-20 09:00',
        durationMinutes: 120,
        examUrl: 'https://codetoknow.edu.tw/#mock-exam',
      });

      expect(result.subject).toContain('【測驗通知】17300 網頁設計丙級第一次全真模擬試卷 即將開始');
      expect(result.text).toContain('張志豪');
      expect(result.text).toContain('120 分鐘');
      expect(result.html).toContain('高三專題網頁程式設計');
      expect(result.html).toContain('切頁偵測與異常防作弊紀錄');
    });

    it('renders teacher announcement notification with multi-line content formatting', () => {
      const result = renderTeacherAnnouncementEmail({
        recipientName: '全班學員',
        teacherName: '李教授',
        className: '資訊科技一乙',
        announcementTitle: '期末術科實作專案繳交提醒',
        announcementContent: '第一行重要提醒\n第二行務必壓縮成 zip\n第三行繳交至平台作業區',
        publishDate: '2026-11-15',
      });

      expect(result.subject).toContain('【班級公告】資訊科技一乙 - 期末術科實作專案繳交提醒');
      expect(result.text).toContain('第一行重要提醒');
      expect(result.html).toContain('第一行重要提醒<br>第二行務必壓縮成 zip<br>第三行繳交至平台作業區');
      expect(result.html).toContain('李教授');
    });

    it('renders scheduled maintenance notification with clear affected scopes', () => {
      const result = renderMaintenanceNotificationEmail({
        recipientName: '全體會員',
        maintenanceTitle: '資料庫定期安全性微修復與網路維護',
        startTime: '2026-11-16 02:00',
        endTime: '2026-11-16 04:00',
        affectedServices: '線上模擬考試即時評分與程式碼沙盒暫停服務 2 小時',
      });

      expect(result.subject).toContain('【系統維護公告】資料庫定期安全性微修復與網路維護');
      expect(result.text).toContain('2026-11-16 02:00 至 2026-11-16 04:00');
      expect(result.html).toContain('線上模擬考試即時評分');
      expect(result.html).toContain('#B38634'); // maintenance gold accent
    });
  });
});
