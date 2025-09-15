import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DocumentArrowDownIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    ArrowDownTrayIcon,
    DocumentTextIcon,
    TableCellsIcon,
    CodeBracketIcon
} from '@heroicons/react/24/outline';
import enhancedSuggestionService, {
    AutoCompleteSection,
    ExportCheckResponse
} from '../services/enhancedSuggestionService';

interface ExportManagerProps {
    docId: string;
    sections: AutoCompleteSection[];
    onExport?: (format: string, content: any) => void;
}

type ExportFormat = 'html' | 'markdown' | 'pdf' | 'pptx';

const ExportManager: React.FC<ExportManagerProps> = ({
    docId,
    sections,
    onExport
}) => {
    const [exportCheck, setExportCheck] = useState<ExportCheckResponse | null>(null);
    const [isChecking, setIsChecking] = useState(false);
    const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('html');
    const [showPreview, setShowPreview] = useState(false);

    useEffect(() => {
        checkExportReady();
    }, [sections]);

    const checkExportReady = async () => {
        setIsChecking(true);
        try {
            const result = await enhancedSuggestionService.checkExportReady(docId, sections);
            setExportCheck(result);
        } catch (error) {
            console.error('Export check failed:', error);
        } finally {
            setIsChecking(false);
        }
    };

    const handleExport = async () => {
        if (!exportCheck || !exportCheck.export_summary.export_ready) {
            return;
        }

        // 포맷별 내보내기 처리
        const exportContent = formatContent(exportCheck.cleaned_content, selectedFormat);
        
        if (onExport) {
            onExport(selectedFormat, exportContent);
        } else {
            // 기본 다운로드 처리
            downloadContent(exportContent, selectedFormat);
        }
    };

    const formatContent = (content: any, format: ExportFormat): string => {
        switch (format) {
            case 'html':
                return generateHTML(content);
            case 'markdown':
                return generateMarkdown(content);
            case 'pdf':
                // PDF는 별도 라이브러리 필요
                return generateHTML(content);
            case 'pptx':
                // PPTX는 별도 라이브러리 필요
                return generateMarkdown(content);
            default:
                return JSON.stringify(content, null, 2);
        }
    };

    const generateHTML = (content: any): string => {
        const sections = content.sections || [];
        
        let html = `<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>포트폴리오</title>
    <style>
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 2rem;
            background: #f9fafb;
        }
        h1, h2, h3 {
            color: #111;
            margin-top: 2rem;
        }
        .section {
            background: white;
            padding: 2rem;
            margin: 1.5rem 0;
            border-radius: 8px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .block {
            margin: 1rem 0;
            padding: 1rem;
            background: #f9fafb;
            border-left: 3px solid #6366f1;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <h1>포트폴리오</h1>
`;
        
        sections.forEach((section: any) => {
            html += `
    <div class="section">
        <h2>${section.title}</h2>
`;
            section.content.forEach((block: any) => {
                html += `        <div class="block">${block.text}</div>\n`;
            });
            html += `    </div>\n`;
        });
        
        html += `</body>
</html>`;
        
        return html;
    };

    const generateMarkdown = (content: any): string => {
        const sections = content.sections || [];
        let markdown = '# 포트폴리오\n\n';
        
        sections.forEach((section: any) => {
            markdown += `## ${section.title}\n\n`;
            section.content.forEach((block: any) => {
                markdown += `${block.text}\n\n`;
            });
        });
        
        return markdown;
    };

    const downloadContent = (content: string, format: ExportFormat) => {
        const blob = new Blob([content], {
            type: format === 'html' ? 'text/html' : 'text/plain'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `portfolio_${Date.now()}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const formatOptions: Array<{ value: ExportFormat; label: string; icon: any }> = [
        { value: 'html', label: 'HTML', icon: CodeBracketIcon },
        { value: 'markdown', label: 'Markdown', icon: DocumentTextIcon },
        { value: 'pdf', label: 'PDF', icon: DocumentArrowDownIcon },
        { value: 'pptx', label: 'PowerPoint', icon: TableCellsIcon }
    ];

    return (
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center">
                        <DocumentArrowDownIcon className="w-8 h-8 mr-3" />
                        <div>
                            <h2 className="text-2xl font-bold">내보내기 관리</h2>
                            <p className="text-green-100">
                                포트폴리오 내보내기 준비 상태 확인
                            </p>
                        </div>
                    </div>
                    
                    {exportCheck && (
                        <div className="text-right">
                            {exportCheck.export_summary.export_ready ? (
                                <CheckCircleIcon className="w-12 h-12 text-green-200" />
                            ) : (
                                <ExclamationTriangleIcon className="w-12 h-12 text-yellow-200" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 콘텐츠 */}
            <div className="p-6">
                {isChecking ? (
                    <div className="text-center py-8">
                        <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
                        <p className="text-gray-600">내보내기 준비 상태 확인 중...</p>
                    </div>
                ) : exportCheck ? (
                    <div className="space-y-6">
                        {/* 상태 요약 */}
                        <div className={`p-4 rounded-lg border-2 ${
                            exportCheck.export_summary.export_ready
                                ? 'bg-green-50 border-green-300'
                                : 'bg-amber-50 border-amber-300'
                        }`}>
                            <div className="flex items-start">
                                {exportCheck.export_summary.export_ready ? (
                                    <CheckCircleIcon className="w-6 h-6 text-green-600 mr-3 mt-0.5" />
                                ) : (
                                    <ExclamationTriangleIcon className="w-6 h-6 text-amber-600 mr-3 mt-0.5" />
                                )}
                                <div className="flex-1">
                                    <h3 className={`font-semibold ${
                                        exportCheck.export_summary.export_ready
                                            ? 'text-green-900'
                                            : 'text-amber-900'
                                    }`}>
                                        {exportCheck.export_summary.message}
                                    </h3>
                                    
                                    {/* 미완성 항목 목록 */}
                                    {!exportCheck.export_summary.export_ready && (
                                        <div className="mt-3 space-y-2">
                                            {exportCheck.export_summary.missing_verifications.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-amber-700 mb-1">
                                                        검증 필요:
                                                    </p>
                                                    <ul className="text-sm text-amber-600 list-disc list-inside">
                                                        {exportCheck.export_summary.missing_verifications.map((item, idx) => (
                                                            <li key={idx}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                            
                                            {exportCheck.export_summary.placeholders.length > 0 && (
                                                <div>
                                                    <p className="text-sm font-medium text-amber-700 mb-1">
                                                        입력 필요:
                                                    </p>
                                                    <ul className="text-sm text-amber-600 list-disc list-inside">
                                                        {exportCheck.export_summary.placeholders.map((item, idx) => (
                                                            <li key={idx}>{item}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 내보내기 옵션 */}
                        {exportCheck.export_summary.export_ready && (
                            <div className="space-y-4">
                                <h3 className="font-semibold text-gray-900">내보내기 형식 선택</h3>
                                
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {formatOptions.map(option => {
                                        const Icon = option.icon;
                                        return (
                                            <button
                                                key={option.value}
                                                onClick={() => setSelectedFormat(option.value)}
                                                className={`p-4 rounded-lg border-2 transition-all ${
                                                    selectedFormat === option.value
                                                        ? 'border-blue-500 bg-blue-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                }`}
                                            >
                                                <Icon className={`w-8 h-8 mx-auto mb-2 ${
                                                    selectedFormat === option.value
                                                        ? 'text-blue-600'
                                                        : 'text-gray-500'
                                                }`} />
                                                <p className={`text-sm font-medium ${
                                                    selectedFormat === option.value
                                                        ? 'text-blue-900'
                                                        : 'text-gray-700'
                                                }`}>
                                                    {option.label}
                                                </p>
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* 미리보기 토글 */}
                                <div className="flex items-center justify-between">
                                    <button
                                        onClick={() => setShowPreview(!showPreview)}
                                        className="text-sm text-blue-600 hover:text-blue-700"
                                    >
                                        {showPreview ? '미리보기 숨기기' : '미리보기 표시'}
                                    </button>
                                    
                                    <button
                                        onClick={handleExport}
                                        className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center"
                                    >
                                        <ArrowDownTrayIcon className="w-5 h-5 mr-2" />
                                        내보내기
                                    </button>
                                </div>

                                {/* 미리보기 */}
                                <AnimatePresence>
                                    {showPreview && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: 'auto', opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            className="overflow-hidden"
                                        >
                                            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                <h4 className="font-medium text-gray-900 mb-3">
                                                    미리보기 ({selectedFormat.toUpperCase()})
                                                </h4>
                                                <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                                                    {formatContent(exportCheck.cleaned_content, selectedFormat).substring(0, 500)}...
                                                </pre>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <XCircleIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>내보내기 준비 상태를 확인할 수 없습니다</p>
                    </div>
                )}
            </div>

            {/* 푸터 메시지 */}
            <div className="bg-gray-50 px-6 py-3 border-t border-gray-200">
                <p className="text-xs text-gray-500 text-center">
                    * 내보낸 파일에는 AI 생성 표시가 제거됩니다. 메타데이터는 내부적으로만 보관됩니다.
                </p>
            </div>
        </div>
    );
};

export default ExportManager;