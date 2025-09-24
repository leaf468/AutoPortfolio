import React, { useState } from 'react';
import { Document } from '../types/block.types';
import './ExportGuard.css';

interface ExportGuardProps {
  document: Document;
  onExport: (format: string) => Promise<void>;
  onJumpToBlock?: (blockId: string) => void;
}

interface ExportBlocker {
  block_id: string;
  reason: string;
}

export const ExportGuard: React.FC<ExportGuardProps> = ({
  document,
  onExport,
  onJumpToBlock
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<string>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const [blockers, setBlockers] = useState<ExportBlocker[]>([]);

  const checkExportReady = async (): Promise<{ ready: boolean; blockers: ExportBlocker[] }> => {
    const blockersFound: ExportBlocker[] = [];

    document.sections.forEach(section => {
      section.blocks.forEach(block => {
        if (block.placeholder) {
          blockersFound.push({
            block_id: block.block_id,
            reason: `[${section.title}] 임시값이 포함되어 있습니다`
          });
        }

        if (block.verify_status !== 'verified') {
          blockersFound.push({
            block_id: block.block_id,
            reason: `[${section.title}] 검증이 필요합니다`
          });
        }

        if (block.required_fields.length > 0 && block.placeholder) {
          block.required_fields.forEach(field => {
            blockersFound.push({
              block_id: block.block_id,
              reason: `[${section.title}] 필수 필드 "${field.field}" 입력 필요`
            });
          });
        }
      });
    });

    return {
      ready: blockersFound.length === 0,
      blockers: blockersFound
    };
  };

  const handleExportClick = async () => {
    const exportCheck = await checkExportReady();

    if (!exportCheck.ready) {
      setBlockers(exportCheck.blockers);
      setIsModalOpen(true);
    } else {
      await performExport();
    }
  };

  const performExport = async () => {
    setIsExporting(true);
    try {
      await onExport(selectedFormat);
      if (isModalOpen) {
        setIsModalOpen(false);
      }
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const renderBlockersModal = () => {
    if (!isModalOpen) return null;

    const uniqueBlockers = blockers.reduce((acc: ExportBlocker[], current) => {
      const exists = acc.find(b => b.block_id === current.block_id);
      if (!exists) {
        acc.push(current);
      }
      return acc;
    }, []);

    return (
      <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <div className="modal-header">
            <h2 className="modal-title">Export 불가</h2>
            <button
              className="modal-close"
              onClick={() => setIsModalOpen(false)}
            >
              ✕
            </button>
          </div>

          <div className="modal-body">
            <div className="warning-message">
              <span className="warning-icon">⚠️</span>
              <p>포트폴리오에 검증되지 않은 내용이 있습니다.</p>
            </div>

            <div className="blockers-list">
              <h3>해결이 필요한 항목 ({uniqueBlockers.length}개)</h3>
              <div className="blocker-items">
                {uniqueBlockers.slice(0, 10).map((blocker, index) => (
                  <div
                    key={`${blocker.block_id}-${index}`}
                    className="blocker-item"
                    onClick={() => {
                      if (onJumpToBlock) {
                        onJumpToBlock(blocker.block_id);
                        setIsModalOpen(false);
                      }
                    }}
                  >
                    <span className="blocker-number">{index + 1}</span>
                    <span className="blocker-reason">{blocker.reason}</span>
                    {onJumpToBlock && (
                      <span className="blocker-action">→ 이동</span>
                    )}
                  </div>
                ))}
              </div>
              {uniqueBlockers.length > 10 && (
                <div className="more-blockers">
                  외 {uniqueBlockers.length - 10}개 항목
                </div>
              )}
            </div>

            <div className="help-text">
              모든 노란색 블록을 검토하고 실제 값으로 수정한 후 Export가 가능합니다.
            </div>
          </div>

          <div className="modal-footer">
            <button
              className="btn btn-secondary"
              onClick={() => setIsModalOpen(false)}
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    );
  };

  const isExportReady = document.export_ready !== false;

  return (
    <>
      <div className="export-container">
        <div className="format-selector">
          <label>Export 형식:</label>
          <select
            value={selectedFormat}
            onChange={(e) => setSelectedFormat(e.target.value)}
            className="format-select"
          >
            <option value="pdf">PDF</option>
            <option value="pptx">PowerPoint</option>
            <option value="docx">Word</option>
            <option value="html">HTML</option>
          </select>
        </div>

        <button
          className={`export-button ${!isExportReady ? 'export-disabled' : ''}`}
          onClick={handleExportClick}
          disabled={isExporting}
        >
          {isExporting ? (
            <span className="loading">Export 중...</span>
          ) : (
            <>
              {!isExportReady && <span className="lock-icon">🔒</span>}
              <span>Export {selectedFormat.toUpperCase()}</span>
            </>
          )}
        </button>

        {!isExportReady && (
          <div className="export-hint">
            검증이 필요한 항목이 있습니다
          </div>
        )}
      </div>

      {renderBlockersModal()}
    </>
  );
};