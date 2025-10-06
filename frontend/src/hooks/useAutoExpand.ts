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
            console.log('⏭️ 이미 확장한 텍스트입니다. 스킵.');
            return;
        }

        try {
            isExpandingRef.current = true;
            console.log('🚀 [자동 확장] 시작:', text.substring(0, 50) + '...');

            const expandedText = await autoFillService.expandText(text);

            if (expandedText && expandedText !== text) {
                lastExpandedTextRef.current = text;
                console.log('✨ [자동 확장] 완료!');
                console.log('   원본:', text.substring(0, 100) + (text.length > 100 ? '...' : ''));
                console.log('   확장:', expandedText.substring(0, 100) + (expandedText.length > 100 ? '...' : ''));
                onExpanded(expandedText, text);
            } else {
                console.log('ℹ️ [자동 확장] 변화 없음 - 이미 충분히 상세한 내용입니다.');
            }
        } catch (error) {
            console.error('❌ [자동 확장] 실패:', error);
        } finally {
            isExpandingRef.current = false;
        }
    }, [enabled, minLength, onExpanded]);

    // Debounced 자동 확장
    const scheduleAutoExpand = useCallback((text: string) => {
        // 기존 타이머 취소
        if (timeoutRef.current) {
            console.log('⏱️  [useAutoExpand] 기존 타이머 취소 - 새로운 입력 감지');
            clearTimeout(timeoutRef.current);
        }

        console.log(`⏱️  [useAutoExpand] 자동 확장 스케줄링 - ${debounceMs}ms 후 실행 예정`);
        console.log(`📝 [useAutoExpand] 입력 텍스트: "${text.substring(0, 50)}${text.length > 50 ? '...' : ''}" (${text.length}자)`);

        // 길이 체크
        if (text.length < minLength) {
            console.log(`⚠️  [useAutoExpand] 텍스트가 너무 짧습니다. 최소 ${minLength}자 필요, 현재 ${text.length}자`);
            return;
        }

        // 새 타이머 설정
        timeoutRef.current = setTimeout(() => {
            console.log(`⏰ [useAutoExpand] ${debounceMs}ms 대기 완료 - 자동 확장 트리거`);
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
