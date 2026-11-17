import { useEffect, useRef, useState } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
}

/**
 * CODE TO KNOW (碼上學) - 輕量無無障礙疑慮之 Scroll Reveal Hook
 * 遵循 CTK-SPEC-ANIMATION-INTERACTION-20261117 規範：
 * 1. 原生 IntersectionObserver 驅動，不引起重排或卡頓。
 * 2. 嚴格支援 prefers-reduced-motion：若使用者停用動態，立即視為已顯現。
 * 3. 生命週期安全：組件卸載時自動 disconnect()，避免記憶體洩漏。
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>(
  options: ScrollRevealOptions = {}
) {
  const { threshold = 0.15, rootMargin = '0px 0px -40px 0px', triggerOnce = true } = options;
  const ref = useRef<T | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    // 檢查瀏覽器無障礙減速偏好
    if (typeof window !== 'undefined') {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        setIsRevealed(true);
        return;
      }
    }

    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') {
      setIsRevealed(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsRevealed(true);
            if (triggerOnce) {
              observer.unobserve(entry.target);
            }
          } else if (!triggerOnce) {
            setIsRevealed(false);
          }
        });
      },
      { threshold, rootMargin }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  return { ref, isRevealed };
}
