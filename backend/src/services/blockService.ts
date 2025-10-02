import {
  Block,
  BlockOrigin,
  VerifyStatus,
  BlockUpdatePayload,
  Document,
  ExportCheckResponse
} from '../types/block.types';

export class BlockService {
  private generateBlockId(): string {
    return `b_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }

  private createAudit() {
    const now = new Date().toISOString();
    return {
      created_at: now,
      updated_at: now,
      history: [
        {
          ts: now,
          by: 'system',
          change: 'created'
        }
      ]
    };
  }

  createBlock(params: {
    section_id: string;
    type: Block['type'];
    text: string;
    isAIGenerated?: boolean;
    isPlaceholder?: boolean;
    requiredFields?: Block['required_fields'];
    confidence?: number;
    hallucinationRisk?: number;
  }): Block {
    const {
      section_id,
      type,
      text,
      isAIGenerated = false,
      isPlaceholder = false,
      requiredFields = [],
      confidence = 1.0,
      hallucinationRisk = 0
    } = params;

    let origin: BlockOrigin = 'user_provided';
    let verify_status: VerifyStatus = 'verified';

    if (isAIGenerated) {
      origin = 'ai_generated';
      verify_status = 'needs_review';
    }

    if (isPlaceholder) {
      verify_status = 'needs_review';
    }

    return {
      block_id: this.generateBlockId(),
      section_id,
      type,
      text,
      origin,
      placeholder: isPlaceholder,
      verify_status,
      required_fields: requiredFields,
      confidence,
      hallucination_risk: hallucinationRisk,
      audit: this.createAudit()
    };
  }

  updateBlock(block: Block, payload: BlockUpdatePayload): Block {
    const updated = { ...block };
    const now = new Date().toISOString();

    if (payload.text !== undefined) {
      updated.text = payload.text;
      updated.origin = 'user_edited';
      updated.verify_status = 'pending';
      updated.placeholder = false;

      updated.audit.history.push({
        ts: now,
        by: 'user',
        change: `text updated from "${block.text}" to "${payload.text}"`
      });
    }

    if (payload.verified === true) {
      updated.verify_status = 'verified';
      updated.placeholder = false;

      updated.audit.history.push({
        ts: now,
        by: 'user',
        change: 'verified'
      });
    }

    updated.audit.updated_at = now;
    return updated;
  }

  validateBlock(block: Block): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (block.type === 'number' && block.text) {
      const numberPattern = /\d+(\.\d+)?/;
      if (!numberPattern.test(block.text)) {
        errors.push('숫자 형식이 올바르지 않습니다');
      }
    }

    if (block.type === 'date' && block.text) {
      const datePattern = /^\d{4}\.\d{2}(-\d{4}\.\d{2})?$/;
      if (!datePattern.test(block.text)) {
        errors.push('날짜 형식이 올바르지 않습니다 (YYYY.MM 또는 YYYY.MM-YYYY.MM)');
      }
    }

    if (block.required_fields.length > 0 && block.placeholder) {
      errors.push('필수 필드를 입력해주세요');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  checkExportReady(document: Document): ExportCheckResponse {
    const blockers: ExportCheckResponse['blockers'] = [];

    document.sections.forEach(section => {
      section.blocks.forEach(block => {
        if (block.placeholder) {
          blockers.push({
            block_id: block.block_id,
            reason: `임시값이 포함되어 있습니다: ${section.title}`
          });
        }

        if (block.verify_status !== 'verified') {
          blockers.push({
            block_id: block.block_id,
            reason: `검증이 필요합니다: ${section.title}`
          });
        }

        if (block.required_fields.length > 0) {
          block.required_fields.forEach(field => {
            if (!block.text.includes(field.field) && block.placeholder) {
              blockers.push({
                block_id: block.block_id,
                reason: `필수 필드 "${field.field}" 입력 필요`
              });
            }
          });
        }
      });
    });

    return {
      export_ready: blockers.length === 0,
      blockers
    };
  }

  autoFillMissing(blocks: Block[], strategy: 'light' | 'aggressive' = 'light'): Block[] {
    return blocks.map(block => {
      if (block.placeholder || block.verify_status === 'needs_review') {
        const filledBlock = { ...block };

        if (strategy === 'aggressive') {
          if (block.type === 'number' && block.text.includes('{숫자 입력}')) {
            filledBlock.text = block.text.replace('{숫자 입력}', '약 30-50');
            filledBlock.auto_fill_reason = '일반적인 범위값으로 임시 대체';
            filledBlock.hallucination_risk = 0.7;
          }

          if (block.type === 'date' && block.text.includes('YYYY.MM')) {
            const currentYear = new Date().getFullYear();
            filledBlock.text = `${currentYear - 1}.01-${currentYear}.12 (추정)`;
            filledBlock.auto_fill_reason = '최근 1년 기간으로 임시 설정';
            filledBlock.hallucination_risk = 0.8;
          }
        } else {
          if (!block.text.includes('입력') && !block.text.includes('추정')) {
            filledBlock.text = block.text + ' (검증 필요)';
          }
        }

        filledBlock.verify_status = 'needs_review';
        filledBlock.placeholder = true;

        return filledBlock;
      }

      return block;
    });
  }
}