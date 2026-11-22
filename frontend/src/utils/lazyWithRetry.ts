import { lazy, ComponentType, LazyExoticComponent } from 'react';

export type ComponentFactory<T extends ComponentType<any>> = () => Promise<{ default: T }>;

export const RETRY_STORAGE_PREFIX = 'c2k_chunk_retry_';

/**
 * 安全存取 sessionStorage，相容無痕模式、儲存空間超額或非瀏覽器環境
 */
export function safeStorageGet(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage.getItem(key);
    }
  } catch {
    // 忽略隱私模式或跨域儲存限制
  }
  return null;
}

export function safeStorageSet(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.setItem(key, value);
    }
  } catch {
    // 忽略隱私模式或跨域儲存限制
  }
}

export function safeStorageRemove(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      window.sessionStorage.removeItem(key);
    }
  } catch {
    // 忽略隱私模式或跨域儲存限制
  }
}

/**
 * 包裹動態 React.lazy 模組匯入，提供有限度（一次）的自動重新載入復原機制。
 * 當版本更新發布導致舊版 Chunk 404（ChunkLoadError）時，觸發全頁重新整理以獲取最新 index.html。
 * 若重試一次後仍失敗，則將例外向上拋出交由 Q1 ErrorBoundary 呈現品牌友善 Fallback，嚴防無限迴圈。
 *
 * @param factory 回傳動態 import Promise 的工廠函式
 * @param componentName 模組識別名稱（用於 scoped retry 追蹤）
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: ComponentFactory<T>,
  componentName: string = 'route'
): LazyExoticComponent<T> {
  return lazy(async () => {
    const storageKey = `${RETRY_STORAGE_PREFIX}${componentName}`;

    try {
      const module = await factory();
      // 載入成功即清除重試標記
      safeStorageRemove(storageKey);
      return module;
    } catch (error) {
      const hasRetried = safeStorageGet(storageKey);

      if (!hasRetried) {
        // 首次失敗：標記已重試，並在真實瀏覽器環境觸發單次全頁重整
        safeStorageSet(storageKey, '1');

        if (
          typeof window !== 'undefined' &&
          window.location &&
          typeof window.location.reload === 'function'
        ) {
          window.location.reload();
          // 返回掛起的 Promise 等待頁面卸載刷新
          return new Promise<{ default: T }>(() => {});
        }

        // 測試或無 location.reload 環境：重試一次工廠函式
        try {
          const retryModule = await factory();
          safeStorageRemove(storageKey);
          return retryModule;
        } catch (retryError) {
          safeStorageRemove(storageKey);
          throw retryError;
        }
      }

      // 已重試過一次仍失敗：清除標記，嚴格拋出例外給 ErrorBoundary
      safeStorageRemove(storageKey);
      throw error;
    }
  });
}

export default lazyWithRetry;
