import React from 'react';
import { Document, Block } from '../types/block.types';
import './VerificationSummary.css';

interface VerificationSummaryProps {
  document: Document;
  onJumpToBlock: (blockId: string) => void;
}

export const VerificationSummary: React.FC<VerificationSummaryProps> = ({
  document,
  onJumpToBlock
}) => {
  const getNeedsReviewBlocks = (): Array<{ block: Block; sectionTitle: string }> => {
    const blocks: Array<{ block: Block; sectionTitle: string }> = [];

    document.sections.forEach(section => {
      section.blocks.forEach(block => {
        if (block.verify_status === 'needs_review' || block.placeholder) {
          blocks.push({
            block,
            sectionTitle: section.title
          });
        }
      });
    });

    return blocks;
  };

  const getStatistics = () => {
    let totalBlocks = 0;
    let verifiedBlocks = 0;
    let needsReviewBlocks = 0;
    let placeholderBlocks = 0;

    document.sections.forEach(section => {
      section.blocks.forEach(block => {
        totalBlocks++;

        if (block.verify_status === 'verified') {
          verifiedBlocks++;
        } else if (block.verify_status === 'needs_review') {
          needsReviewBlocks++;
        }

        if (block.placeholder) {
          placeholderBlocks++;
        }
      });
    });

    return {
      total: totalBlocks,
      verified: verifiedBlocks,
      needsReview: needsReviewBlocks,
      placeholders: placeholderBlocks,
      progress: totalBlocks > 0 ? Math.round((verifiedBlocks / totalBlocks) * 100) : 0
    };
  };

  const stats = getStatistics();
  const needsReviewBlocks = getNeedsReviewBlocks();

  return (
    <div className="verification-summary">
      <h3 className="summary-title">검증 현황</h3>

      <div className="progress-container">
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${stats.progress}%` }}
          />
        </div>
        <div className="progress-text">{stats.progress}% 완료</div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-value">{stats.total}</div>
          <div className="stat-label">전체 블록</div>
        </div>
        <div className="stat-card verified">
          <div className="stat-value">{stats.verified}</div>
          <div className="stat-label">검증 완료</div>
        </div>
        <div className="stat-card needs-review">
          <div className="stat-value">{stats.needsReview}</div>
          <div className="stat-label">검증 필요</div>
        </div>
        <div className="stat-card placeholder">
          <div className="stat-value">{stats.placeholders}</div>
          <div className="stat-label">임시값</div>
        </div>
      </div>

      {needsReviewBlocks.length > 0 && (
        <div className="review-list">
          <h4 className="list-title">검증 필요 항목</h4>
          <div className="review-items">
            {needsReviewBlocks.slice(0, 5).map(({ block, sectionTitle }) => (
              <div
                key={block.block_id}
                className="review-item"
                onClick={() => onJumpToBlock(block.block_id)}
              >
                <div className="item-section">{sectionTitle}</div>
                <div className="item-text">{block.text.substring(0, 50)}...</div>
                {block.required_fields.length > 0 && (
                  <div className="item-required">
                    {block.required_fields.map(f => f.field).join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
          {needsReviewBlocks.length > 5 && (
            <div className="more-items">
              + {needsReviewBlocks.length - 5}개 더 보기
            </div>
          )}
        </div>
      )}
    </div>
  );
};