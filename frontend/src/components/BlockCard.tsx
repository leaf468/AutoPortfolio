import React, { useState, useCallback } from 'react';
import { Block, BlockUpdatePayload } from '../types/block.types';
import './BlockCard.css';

interface BlockCardProps {
  block: Block;
  onUpdate: (blockId: string, payload: BlockUpdatePayload) => Promise<void>;
}

export const BlockCard: React.FC<BlockCardProps> = ({ block, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(block.text);
  const [isUpdating, setIsUpdating] = useState(false);

  const getBlockClass = () => {
    const classes = ['block-card'];

    if (block.origin === 'ai_generated' || block.placeholder) {
      classes.push('block-ai-generated');
    }

    if (block.verify_status === 'needs_review') {
      classes.push('block-needs-review');
    }

    if (block.verify_status === 'verified') {
      classes.push('block-verified');
    }

    return classes.join(' ');
  };

  const handleSave = async () => {
    if (editValue !== block.text) {
      setIsUpdating(true);
      try {
        await onUpdate(block.block_id, { text: editValue });
      } catch (error) {
        console.error('Failed to update block:', error);
      }
      setIsUpdating(false);
    }
    setIsEditing(false);
  };

  const handleVerify = async () => {
    setIsUpdating(true);
    try {
      await onUpdate(block.block_id, { verified: true });
    } catch (error) {
      console.error('Failed to verify block:', error);
    }
    setIsUpdating(false);
  };

  const validateInput = (value: string): boolean => {
    if (block.type === 'number') {
      return /\d+(\.\d+)?/.test(value);
    }

    if (block.type === 'date') {
      return /^\d{4}\.\d{2}(-\d{4}\.\d{2})?$/.test(value);
    }

    return true;
  };

  const renderBadges = () => {
    const badges = [];

    if (block.origin === 'ai_generated') {
      badges.push(
        <span key="ai" className="badge badge-ai">
          AI 제안
        </span>
      );
    }

    if (block.placeholder) {
      badges.push(
        <span key="placeholder" className="badge badge-placeholder">
          임시값
        </span>
      );
    }

    if (block.verify_status === 'needs_review') {
      badges.push(
        <span key="review" className="badge badge-review">
          ⚠️ 검증 필요
        </span>
      );
    }

    if (block.verify_status === 'verified') {
      badges.push(
        <span key="verified" className="badge badge-verified">
          ✓ 검증됨
        </span>
      );
    }

    return <div className="badges">{badges}</div>;
  };

  const renderRequiredFields = () => {
    if (!block.required_fields || block.required_fields.length === 0) {
      return null;
    }

    return (
      <div className="required-fields">
        {block.required_fields.map((field, index) => (
          <div key={index} className="required-field-chip">
            <span className="chip-label">{field.field}</span>
            <span className="chip-type">{field.type}</span>
            {field.hint && (
              <span className="chip-hint" title={field.hint}>
                ?
              </span>
            )}
          </div>
        ))}
      </div>
    );
  };

  const renderConfidenceIndicator = () => {
    if (!block.origin.includes('ai')) return null;

    const confidenceLevel = block.confidence > 0.7 ? 'high' :
                          block.confidence > 0.4 ? 'medium' : 'low';

    return (
      <div className={`confidence-indicator confidence-${confidenceLevel}`}>
        <span>신뢰도: {Math.round(block.confidence * 100)}%</span>
        {block.hallucination_risk && block.hallucination_risk > 0.5 && (
          <span className="risk-warning">⚠️ 검증 필수</span>
        )}
      </div>
    );
  };

  return (
    <div className={getBlockClass()}>
      <div className="block-header">
        {renderBadges()}
        {renderConfidenceIndicator()}
      </div>

      <div className="block-content">
        {isEditing ? (
          <div className="edit-mode">
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className={`edit-input ${!validateInput(editValue) ? 'invalid' : ''}`}
              autoFocus
            />
            {!validateInput(editValue) && (
              <div className="validation-error">
                {block.type === 'number' && '올바른 숫자 형식을 입력하세요'}
                {block.type === 'date' && 'YYYY.MM 또는 YYYY.MM-YYYY.MM 형식으로 입력하세요'}
              </div>
            )}
          </div>
        ) : (
          <div className="view-mode" onClick={() => setIsEditing(true)}>
            {block.text}
            {block.auto_fill_reason && (
              <div className="auto-fill-reason">
                💡 {block.auto_fill_reason}
              </div>
            )}
          </div>
        )}
      </div>

      {renderRequiredFields()}

      <div className="block-actions">
        {isEditing && (
          <>
            <button
              onClick={handleSave}
              disabled={!validateInput(editValue) || isUpdating}
              className="btn btn-save"
            >
              저장
            </button>
            <button
              onClick={() => {
                setEditValue(block.text);
                setIsEditing(false);
              }}
              className="btn btn-cancel"
            >
              취소
            </button>
          </>
        )}

        {!isEditing && block.verify_status !== 'verified' && (
          <button
            onClick={handleVerify}
            disabled={isUpdating}
            className="btn btn-verify"
          >
            ✓ 검증 완료
          </button>
        )}
      </div>
    </div>
  );
};