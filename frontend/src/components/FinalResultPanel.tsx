import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    CheckCircleIcon,
    DocumentArrowDownIcon,
    EyeIcon,
    ShareIcon,
    StarIcon,
    ChartBarIcon,
    SparklesIcon,
    ArrowPathIcon,
    DocumentTextIcon,
    ClipboardDocumentIcon,
    CodeBracketIcon,
} from "@heroicons/react/24/outline";
import { StarIcon as StarIconSolid } from "@heroicons/react/24/solid";
import { GenerationResult } from "../services/oneClickGenerator";
import { BoostResult } from "../services/interactiveBooster";
import { FeedbackResult } from "../services/userFeedbackService";
import { portfolioTemplates } from "../templates/portfolioTemplates";
import { htmlToMarkdownConverter } from "../services/htmlToMarkdownConverter";
import { pdfGenerator } from "../services/pdfGenerator";

type TemplateType = "minimal" | "clean" | "colorful" | "elegant";

interface FinalResultPanelProps {
    finalResult: GenerationResult;
    boostResult?: BoostResult;
    feedbackResult?: FeedbackResult;
    selectedTemplate?: TemplateType;
    onReset: () => void;
}

const FinalResultPanel: React.FC<FinalResultPanelProps> = ({
    finalResult,
    boostResult,
    feedbackResult,
    selectedTemplate = "minimal",
    onReset,
}) => {
    const [showPreview, setShowPreview] = useState(false);
    const [userRating, setUserRating] = useState<number>(0);
    const [hoverRating, setHoverRating] = useState<number>(0);
    const [ratingSubmitted, setRatingSubmitted] = useState(false);
    const [copySuccess, setCopySuccess] = useState<string>('');
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const portfolioRef = useRef<HTMLDivElement>(null);

    // 기존 평가 불러오기
    useEffect(() => {
        try {
            const savedRating = localStorage.getItem(
                `portfolio_rating_${finalResult.id}`
            );
            if (savedRating) {
                const ratingData = JSON.parse(savedRating);
                setUserRating(ratingData.rating);
                setRatingSubmitted(true);
            }
        } catch (error) {
            console.error("기존 평가 불러오기 실패:", error);
        }
    }, [finalResult.id]);

    // 선택한 템플릿을 사용해서 완전한 HTML 생성 (CSS 포함)
    const generateTemplatedHTML = () => {
        try {
            // finalResult.content가 PortfolioDocument JSON이라면 파싱해서 사용
            let portfolioData;

            try {
                portfolioData = JSON.parse(finalResult.content);
                console.log("파싱된 포트폴리오 데이터:", portfolioData);

                // 편집된 HTML을 우선적으로 사용 (EnhancedPortfolioEditor에서 저장한 HTML)
                const editedHTML =
                    portfolioData.sections?.[0]?.blocks?.[0]?.text;
                if (editedHTML) {
                    // 편집된 HTML이 있으면 그대로 사용
                    console.log("편집된 HTML 사용");
                    return editedHTML;
                }
            } catch (parseError) {
                console.error("JSON 파싱 실패:", parseError);
            }

            // fallback: 기본 템플릿으로 생성
            const template = portfolioTemplates[selectedTemplate];
            if (template && template.generateHTML) {
                const defaultData = template.sampleData;
                console.log("기본 데이터로 템플릿 생성");
                return template.generateHTML(defaultData);
            }

            return finalResult.content;
        } catch (error) {
            console.error("템플릿 HTML 생성 실패:", error);
            return finalResult.content;
        }
    };

    // 브라우저 인쇄 기능을 사용한 PDF 저장 (빠른 방법)
    const handlePrintToPDF = () => {
        const printWindow = window.open("", "_blank");
        if (!printWindow) {
            alert("팝업이 차단되었습니다. 팝업을 허용해주세요.");
            return;
        }

        const htmlContent = generateTemplatedHTML();
        const optimizedHTML = pdfGenerator.generatePrintOptimizedHTML(htmlContent);

        printWindow.document.write(optimizedHTML);
        printWindow.document.close();

        // 콘텐츠 로딩 대기 후 인쇄 다이얼로그 표시
        printWindow.onload = () => {
            setTimeout(() => {
                printWindow.print();
            }, 500);
        };
    };

    // 고품질 PDF 생성 (섹션별 페이지 구분)
    const handleDownloadHighQualityPDF = async () => {
        try {
            setIsGeneratingPDF(true);
            const htmlContent = generateTemplatedHTML();
            await pdfGenerator.generatePDF(htmlContent, 'portfolio.pdf', {
                quality: 2,
                format: 'a4',
                orientation: 'portrait',
            });
        } catch (error) {
            console.error('고품질 PDF 생성 실패:', error);
            alert('PDF 생성에 실패했습니다. 다시 시도해주세요.');
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    // 별점 평가 핸들러
    const handleRating = (rating: number) => {
        setUserRating(rating);
        setRatingSubmitted(true);

        // 평가 데이터 저장 (로컬 스토리지 또는 서버)
        const ratingData = {
            portfolioId: finalResult.id,
            rating: rating,
            timestamp: new Date().toISOString(),
            template: selectedTemplate,
        };

        try {
            localStorage.setItem(
                `portfolio_rating_${finalResult.id}`,
                JSON.stringify(ratingData)
            );
            console.log("사용자 평가 저장됨:", ratingData);
        } catch (error) {
            console.error("평가 저장 실패:", error);
        }
    };

    const handleRatingHover = (rating: number) => {
        setHoverRating(rating);
    };

    const handleRatingLeave = () => {
        setHoverRating(0);
    };

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: "내 포트폴리오",
                    text: "AI로 생성한 포트폴리오를 확인해보세요!",
                    url: window.location.href,
                });
            } catch (error) {
                console.log("공유 취소됨");
            }
        } else {
            try {
                await navigator.clipboard.writeText(window.location.href);
                alert("포트폴리오 링크가 클립보드에 복사되었습니다!");
            } catch (error) {
                console.error("클립보드 복사 실패:", error);
                alert("클립보드 복사에 실패했습니다.");
            }
        }
    };

    // Markdown 다운로드 핸들러
    const handleDownloadMarkdown = () => {
        try {
            const htmlContent = generateTemplatedHTML();
            const markdown = htmlToMarkdownConverter.convertToMarkdown(htmlContent);
            htmlToMarkdownConverter.downloadMarkdown(markdown, 'portfolio.md');
        } catch (error) {
            console.error('Markdown 변환 실패:', error);
            alert('Markdown 변환에 실패했습니다.');
        }
    };

    // Markdown 클립보드 복사 핸들러
    const handleCopyMarkdown = async () => {
        try {
            const htmlContent = generateTemplatedHTML();
            const markdown = htmlToMarkdownConverter.convertToMarkdown(htmlContent);
            const success = await htmlToMarkdownConverter.copyToClipboard(markdown);

            if (success) {
                setCopySuccess('Markdown이 클립보드에 복사되었습니다!');
                setTimeout(() => setCopySuccess(''), 3000);
            } else {
                alert('클립보드 복사에 실패했습니다.');
            }
        } catch (error) {
            console.error('Markdown 복사 실패:', error);
            alert('Markdown 복사에 실패했습니다.');
        }
    };

    // HTML 파일 다운로드 핸들러
    const handleDownloadHTML = () => {
        try {
            const htmlContent = generateTemplatedHTML();
            const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'portfolio.html';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('HTML 다운로드 실패:', error);
            alert('HTML 다운로드에 실패했습니다.');
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto p-6">
                {/* 헤더 */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="flex justify-center items-center mb-4">
                        <CheckCircleIcon className="w-8 h-8 text-green-600 mr-2" />
                        <h2 className="text-3xl font-bold text-gray-900">
                            포트폴리오 완성!
                        </h2>
                    </div>
                    <p className="text-lg text-gray-600">
                        AI가 생성한 포트폴리오가 완성되었습니다. 미리보기를
                        확인하고 다운로드하세요.
                    </p>
                </motion.div>

                {/* 메인 콘텐츠 그리드 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* 왼쪽: 통계 카드 */}
                    <motion.div
                        className="lg:col-span-1 space-y-6"
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                    >
                        {/* 통계 정보 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <ChartBarIcon className="w-5 h-5 mr-2 text-blue-600" />
                                포트폴리오 정보
                            </h3>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">
                                        사용된 템플릿:
                                    </span>
                                    <strong className="text-gray-900 capitalize">
                                        {selectedTemplate}
                                    </strong>
                                </div>
                            </div>
                        </div>

                        {/* 사용자 만족도 평가 */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                                <StarIcon className="w-5 h-5 mr-2 text-yellow-600" />
                                만족도 평가
                            </h3>

                            {!ratingSubmitted ? (
                                <div className="text-center">
                                    <p className="text-sm text-gray-600 mb-4">
                                        생성된 포트폴리오에 대한 만족도를
                                        평가해주세요
                                    </p>

                                    <div className="flex justify-center space-x-1 mb-4">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() =>
                                                    handleRating(star)
                                                }
                                                onMouseEnter={() =>
                                                    handleRatingHover(star)
                                                }
                                                onMouseLeave={handleRatingLeave}
                                                className="p-1 transition-transform hover:scale-110 focus:outline-none"
                                            >
                                                {star <=
                                                (hoverRating || userRating) ? (
                                                    <StarIconSolid className="w-8 h-8 text-yellow-400" />
                                                ) : (
                                                    <StarIcon className="w-8 h-8 text-gray-300 hover:text-yellow-400" />
                                                )}
                                            </button>
                                        ))}
                                    </div>

                                    <p className="text-xs text-gray-500">
                                        {hoverRating === 1 && "매우 불만족"}
                                        {hoverRating === 2 && "불만족"}
                                        {hoverRating === 3 && "보통"}
                                        {hoverRating === 4 && "만족"}
                                        {hoverRating === 5 && "매우 만족"}
                                        {hoverRating === 0 &&
                                            "별점을 클릭해주세요"}
                                    </p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <div className="flex justify-center space-x-1 mb-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <StarIconSolid
                                                key={star}
                                                className={`w-6 h-6 ${
                                                    star <= userRating
                                                        ? "text-yellow-400"
                                                        : "text-gray-300"
                                                }`}
                                            />
                                        ))}
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                        평가해주셔서 감사합니다!
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {userRating === 1 &&
                                            "소중한 의견 감사합니다"}
                                        {userRating === 2 &&
                                            "더 나은 서비스를 위해 노력하겠습니다"}
                                        {userRating === 3 &&
                                            "의견을 반영하여 개선하겠습니다"}
                                        {userRating === 4 &&
                                            "만족스러운 결과를 제공할 수 있어 기쁩니다"}
                                        {userRating === 5 &&
                                            "최고의 평가 감사합니다!"}
                                    </p>
                                </div>
                            )}
                        </div>

                        {/* AI 개선 효과 */}
                        {(boostResult || feedbackResult) && (
                            <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-xl p-6">
                                <h3 className="font-bold text-purple-900 mb-4 flex items-center">
                                    <SparklesIcon className="w-5 h-5 mr-2" />
                                    AI 개선 효과
                                </h3>

                                {boostResult && (
                                    <div className="mb-4 p-3 bg-white bg-opacity-60 rounded-lg">
                                        <div className="text-sm font-medium text-blue-800 mb-1">
                                            대화형 보강
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                완성도:{" "}
                                                <strong>
                                                    {
                                                        boostResult
                                                            .qualityMetrics
                                                            .completeness
                                                    }
                                                    %
                                                </strong>
                                            </div>
                                            <div>
                                                구체성:{" "}
                                                <strong>
                                                    {
                                                        boostResult
                                                            .qualityMetrics
                                                            .specificity
                                                    }
                                                    %
                                                </strong>
                                            </div>
                                            <div>
                                                임팩트:{" "}
                                                <strong>
                                                    {
                                                        boostResult
                                                            .qualityMetrics
                                                            .impact
                                                    }
                                                    %
                                                </strong>
                                            </div>
                                            <div>
                                                ATS:{" "}
                                                <strong>
                                                    {
                                                        boostResult
                                                            .qualityMetrics
                                                            .atsScore
                                                    }
                                                </strong>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {feedbackResult && (
                                    <div className="p-3 bg-white bg-opacity-60 rounded-lg">
                                        <div className="text-sm font-medium text-purple-800 mb-2">
                                            스타일 개선
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {feedbackResult.changesApplied
                                                .slice(0, 3)
                                                .map((change, idx) => (
                                                    <span
                                                        key={idx}
                                                        className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs"
                                                    >
                                                        {change.length > 15
                                                            ? change.substring(
                                                                  0,
                                                                  15
                                                              ) + "..."
                                                            : change}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>

                    {/* 오른쪽: 메인 액션 */}
                    <motion.div
                        className="lg:col-span-2"
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                    >
                        <div className="bg-white rounded-xl border border-gray-200 p-8">
                            <h2 className="text-2xl font-bold mb-6 text-gray-900">
                                포트폴리오 다운로드 & 공유
                            </h2>

                            {/* 메인 액션 버튼들 */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <button
                                    onClick={() => setShowPreview(true)}
                                    className="group flex items-center justify-center p-6 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl font-medium hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    <EyeIcon className="w-6 h-6 mr-2" />
                                    미리보기
                                </button>

                                <button
                                    onClick={handlePrintToPDF}
                                    className="group flex items-center justify-center p-6 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-medium hover:from-green-700 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    <DocumentArrowDownIcon className="w-6 h-6 mr-2" />
                                    빠른 인쇄
                                </button>

                                <button
                                    onClick={handleDownloadHighQualityPDF}
                                    disabled={isGeneratingPDF}
                                    className="group flex items-center justify-center p-6 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl font-medium hover:from-purple-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isGeneratingPDF ? (
                                        <>
                                            <svg className="animate-spin w-6 h-6 mr-2" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            생성 중...
                                        </>
                                    ) : (
                                        <>
                                            <DocumentArrowDownIcon className="w-6 h-6 mr-2" />
                                            고품질 PDF
                                        </>
                                    )}
                                </button>
                            </div>

                            {/* 다운로드 옵션 */}
                            <div className="space-y-4 mb-8">
                                <h3 className="font-semibold text-gray-700">
                                    다운로드 형식
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    <button
                                        onClick={handleDownloadMarkdown}
                                        className="flex items-center justify-center p-4 border-2 border-blue-300 bg-blue-50 text-blue-700 rounded-lg hover:border-blue-400 hover:bg-blue-100 transition-all"
                                    >
                                        <DocumentTextIcon className="w-5 h-5 mr-2" />
                                        Markdown 다운로드
                                    </button>

                                    <button
                                        onClick={handleDownloadHTML}
                                        className="flex items-center justify-center p-4 border-2 border-green-300 bg-green-50 text-green-700 rounded-lg hover:border-green-400 hover:bg-green-100 transition-all"
                                    >
                                        <CodeBracketIcon className="w-5 h-5 mr-2" />
                                        HTML 다운로드
                                    </button>

                                    <button
                                        onClick={handleCopyMarkdown}
                                        className="flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                                    >
                                        <ClipboardDocumentIcon className="w-5 h-5 mr-2" />
                                        Markdown 복사
                                    </button>

                                    <button
                                        onClick={handleShare}
                                        className="flex items-center justify-center p-4 border border-gray-300 text-gray-700 rounded-lg hover:border-gray-400 hover:bg-gray-50 transition-all"
                                    >
                                        <ShareIcon className="w-5 h-5 mr-2" />
                                        공유하기
                                    </button>
                                </div>

                                {/* 복사 성공 메시지 */}
                                {copySuccess && (
                                    <div className="text-sm text-green-600 font-medium text-center bg-green-50 p-2 rounded-lg">
                                        ✓ {copySuccess}
                                    </div>
                                )}

                                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                    <p className="text-xs text-blue-800">
                                        <strong>💡 다운로드 형식 안내</strong>
                                    </p>
                                    <ul className="text-xs text-blue-700 mt-2 space-y-1 list-disc list-inside">
                                        <li><strong>빠른 인쇄</strong>: 브라우저 인쇄 기능으로 빠르게 PDF 저장. 섹션별 페이지 구분 최적화.</li>
                                        <li><strong>고품질 PDF</strong>: HTML을 이미지로 변환하여 PDF 생성. 섹션(기본정보+소개, 경험, 프로젝트 등)이 각각 별도 페이지로 구성. 디자인 완벽 보존.</li>
                                        <li><strong>Markdown</strong>: 텍스트 기반 형식으로 콘텐츠 구조 유지. GitHub, Notion 등에서 사용 가능.</li>
                                        <li><strong>HTML</strong>: 완전한 웹 페이지 파일. 브라우저에서 직접 열어 확인 가능.</li>
                                    </ul>
                                </div>
                            </div>

                            {/* 하단 액션 */}
                            <div className="flex justify-center pt-6 border-t border-gray-200">
                                <button
                                    onClick={onReset}
                                    className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-lg font-medium hover:from-blue-700 hover:to-cyan-700 shadow-md hover:shadow-lg transition-all duration-200"
                                >
                                    <ArrowPathIcon className="w-5 h-5 mr-2" />새
                                    포트폴리오 만들기
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* 미리보기 모달 */}
                <AnimatePresence>
                    {showPreview && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                            onClick={() => setShowPreview(false)}
                        >
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="bg-white rounded-xl max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="bg-gray-50 p-4 border-b flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900">
                                        포트폴리오 미리보기
                                    </h3>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="p-2 hover:bg-gray-200 rounded-lg transition-colors text-gray-600"
                                    >
                                        <svg
                                            className="w-6 h-6"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M6 18L18 6M6 6l12 12"
                                            />
                                        </svg>
                                    </button>
                                </div>

                                <div className="p-8 bg-white overflow-auto max-h-[calc(90vh-140px)]">
                                    {/* EnhancedPortfolioEditor와 동일한 iframe 방식 사용 */}
                                    <div className="border border-gray-200 rounded-lg overflow-auto max-h-[600px] bg-white">
                                        <div
                                            ref={portfolioRef}
                                            style={{
                                                width: "794px", // A4 width in pixels at 96 DPI
                                                minHeight: "1123px", // A4 height in pixels at 96 DPI
                                                margin: "0 auto",
                                                transform: "scale(0.8)",
                                                transformOrigin: "top left",
                                                backgroundColor: "#ffffff",
                                            }}
                                        >
                                            <iframe
                                                srcDoc={generateTemplatedHTML()}
                                                className="w-full h-[600px] border-0"
                                                title="Portfolio Preview"
                                                style={{
                                                    transform: "scale(0.8)",
                                                    transformOrigin: "top left",
                                                    width: "125%",
                                                    height: "750px",
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-gray-50 p-4 border-t flex justify-center space-x-3">
                                    <button
                                        onClick={handlePrintToPDF}
                                        className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-indigo-700 shadow-md hover:shadow-lg transition-all"
                                    >
                                        PDF 다운로드
                                    </button>
                                    <button
                                        onClick={() => setShowPreview(false)}
                                        className="px-6 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-all"
                                    >
                                        닫기
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default FinalResultPanel;
