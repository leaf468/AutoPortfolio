import { useCallback, useRef, useEffect } from 'react';
import autoFillService from '../services/autoFillService';

interface UseAutoExpandOptions {
    enabled?: boolean;
    debounceMs?: number;
    minLength?: number;
}

/**
 * 자동 텍스트 확장 Hook
 * 사용자가 텍스트를 입력하면 자동으로 AI가 확장해주는 기능
 */
export function useAutoExpand(
    onExpanded: (expandedText: string, originalText: string) => void,
    options: UseAutoExpandOptions = {}
) {
    const {
        enabled = true,
        debounceMs = 2000, // 2초 대기 후 자동 확장
        minLength = 10 // 최소 10글자 이상일 때만 확장
    } = options;

    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastExpandedTextRef = useRef<string>('');
    const isExpandingRef = useRef(false);

    // 자동 확장 실행 함수
    const triggerAutoExpand = useCallback(async (text: string) => {
        if (!enabled || isExpandingRef.current) return;
        if (text.length < minLength) return;

        // 이미 확장한 적이 있는 텍스트면 스킵
        if (text === lastExpandedTextRef.current) {
            return;
        }

        try {
            isExpandingRef.current = true;

            const expandedText = await autoFillService.expandText(text);

            if (expandedText && expandedText !== text) {
                lastExpandedTextRef.current = text;
                onExpanded(expandedText, text);
            } else {
            }
        } catch (error) {
        } finally {
            isExpandingRef.current = false;
        }
    }, [enabled, minLength, onExpanded]);

    // Debounced 자동 확장
    const scheduleAutoExpand = useCallback((text: string) => {
        // 기존 타이머 취소
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }


        // 길이 체크
        if (text.length < minLength) {
            return;
        }

        // 새 타이머 설정
        timeoutRef.current = setTimeout(() => {
            triggerAutoExpand(text);
        }, debounceMs);
    }, [debounceMs, triggerAutoExpand, minLength]);

    // 컴포넌트 언마운트 시 타이머 정리
    useEffect(() => {
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return {
        scheduleAutoExpand,
        triggerAutoExpand,
        isExpanding: isExpandingRef.current
    };
}
