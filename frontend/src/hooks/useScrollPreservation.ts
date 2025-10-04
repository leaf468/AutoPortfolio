import { useRef, useCallback } from 'react';

interface ScrollPreservationHook {
  iframeRef: React.RefObject<HTMLIFrameElement>;
  preserveScrollAndUpdate: (newHtml: string) => Promise<void>;
}

/**
 * Custom hook for preserving scroll position in iframe during content updates
 * This prevents the jarring experience of scroll position jumping to top when editing content
 */
export function useScrollPreservation(): ScrollPreservationHook {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const lastScrollPosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const updateTimeoutRef = useRef<number | undefined>(undefined);

  const preserveScrollAndUpdate = useCallback(async (newHtml: string): Promise<void> => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    try {
      // 실시간 미리보기에서 주황색 AI 추가 표시 제거
      const cleanHtml = newHtml.replace(/<span style="color:orange">(.*?)<\/span>/g, '$1');

      // Store current scroll position before updating
      const iframeDocument = iframe.contentDocument || iframe.contentWindow?.document;
      if (iframeDocument) {
        lastScrollPosition.current = {
          x: (iframeDocument.documentElement?.scrollLeft ?? iframeDocument.body?.scrollLeft) ?? 0,
          y: (iframeDocument.documentElement?.scrollTop ?? iframeDocument.body?.scrollTop) ?? 0
        };
      }

      // Try to update content without changing srcDoc (DOM manipulation approach)
      // This is more efficient and preserves scroll position better
      if (iframeDocument) {
        try {
          // Parse the new HTML
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = cleanHtml;

          // Update the body content directly
          const newBody = tempDiv.querySelector('body');
          if (newBody && iframeDocument.body) {
            // Clear existing timeout
            if (updateTimeoutRef.current) {
              clearTimeout(updateTimeoutRef.current);
            }

            // Update content immediately for real-time synchronization
            if (iframeDocument.body) {
              iframeDocument.body.innerHTML = newBody.innerHTML;

              // Update head content if needed (styles, etc.)
              const newHead = tempDiv.querySelector('head');
              if (newHead && iframeDocument.head) {
                // Only update style elements to avoid disrupting scripts
                const newStyles = newHead.querySelectorAll('style, link[rel="stylesheet"]');
                const existingStyles = iframeDocument.head.querySelectorAll('style, link[rel="stylesheet"]');

                // Remove old styles
                existingStyles.forEach(style => style.remove());

                // Add new styles
                newStyles.forEach(style => {
                  iframeDocument.head.appendChild(style.cloneNode(true));
                });
              }

              // Restore scroll position immediately after content update
              requestAnimationFrame(() => {
                if (iframeDocument) {
                  // Check if documentElement exists before setting scroll
                  if (iframeDocument.documentElement) {
                    iframeDocument.documentElement.scrollLeft = lastScrollPosition.current.x;
                    iframeDocument.documentElement.scrollTop = lastScrollPosition.current.y;
                  }

                  // Fallback for browsers that use body for scrolling
                  if (iframeDocument.body) {
                    iframeDocument.body.scrollLeft = lastScrollPosition.current.x;
                    iframeDocument.body.scrollTop = lastScrollPosition.current.y;
                  }
                }
              });
            }

            return; // Successfully updated without srcDoc change
          }
        } catch (domError) {
          console.warn('DOM manipulation failed, falling back to srcDoc update:', domError);
        }
      }

      // Fallback to srcDoc update if DOM manipulation fails
      iframe.src = 'about:blank'; // Clear first to ensure fresh load

      // Use a promise to wait for iframe to be ready for srcDoc update
      await new Promise<void>((resolve) => {
        const onLoad = () => {
          iframe.removeEventListener('load', onLoad);
          // Set the new content (cleanHtml로 변경)
          iframe.srcdoc = cleanHtml;

          // Wait for content to load and then restore scroll
          const onContentLoad = () => {
            iframe.removeEventListener('load', onContentLoad);
            requestAnimationFrame(() => {
              const doc = iframe.contentDocument || iframe.contentWindow?.document;
              if (doc) {
                // Check if documentElement exists before setting scroll
                if (doc.documentElement) {
                  doc.documentElement.scrollLeft = lastScrollPosition.current.x;
                  doc.documentElement.scrollTop = lastScrollPosition.current.y;
                }

                // Fallback for body scrolling
                if (doc.body) {
                  doc.body.scrollLeft = lastScrollPosition.current.x;
                  doc.body.scrollTop = lastScrollPosition.current.y;
                }
              }
              resolve();
            });
          };

          iframe.addEventListener('load', onContentLoad);
        };

        iframe.addEventListener('load', onLoad);
      });

    } catch (error) {
      console.error('Failed to preserve scroll position during update:', error);
      // Fallback: just update srcDoc normally (cleanHtml 사용)
      const cleanHtml = newHtml.replace(/<span style="color:orange">(.*?)<\/span>/g, '$1');
      iframe.srcdoc = cleanHtml;
    }
  }, []);

  return {
    iframeRef,
    preserveScrollAndUpdate
  };
}