import express, { Request, Response } from 'express';
import { BlockService } from '../services/blockService';
import { BlockUpdatePayload, Document, Block } from '../types/block.types';

const router = express.Router();
const blockService = new BlockService();

const documentStore = new Map<string, Document>();

router.post('/api/generate', async (req: Request, res: Response) => {
  try {
    const { user_inputs, target_keywords } = req.body;

    const doc_id = `d_${Date.now()}`;
    const sections = [];

    if (user_inputs.projects) {
      user_inputs.projects.forEach((project: any, idx: number) => {
        const sectionId = `s_project_${idx + 1}`;
        const blocks: Block[] = [];

        if (project.name) {
          blocks.push(
            blockService.createBlock({
              section_id: sectionId,
              type: 'text',
              text: project.name,
              isAIGenerated: false
            })
          );
        }

        if (project.description) {
          blocks.push(
            blockService.createBlock({
              section_id: sectionId,
              type: 'text',
              text: project.description,
              isAIGenerated: false
            })
          );
        } else {
          blocks.push(
            blockService.createBlock({
              section_id: sectionId,
              type: 'text',
              text: '프로젝트 설명을 입력해주세요 (주요 기능, 사용 기술 등)',
              isAIGenerated: true,
              isPlaceholder: true,
              requiredFields: [
                {
                  field: '프로젝트 설명',
                  type: 'text',
                  hint: '프로젝트의 목적과 주요 기능을 설명해주세요'
                }
              ],
              confidence: 0.5,
              hallucinationRisk: 0.3
            })
          );
        }

        if (project.achievements) {
          blocks.push(
            blockService.createBlock({
              section_id: sectionId,
              type: 'text',
              text: project.achievements,
              isAIGenerated: false
            })
          );
        } else {
          blocks.push(
            blockService.createBlock({
              section_id: sectionId,
              type: 'text',
              text: '성과: {숫자 입력}% 개선 (구체적인 성과를 입력해주세요)',
              isAIGenerated: true,
              isPlaceholder: true,
              requiredFields: [
                {
                  field: '성과 수치',
                  type: 'number',
                  hint: '개선된 지표의 구체적인 수치'
                }
              ],
              confidence: 0.4,
              hallucinationRisk: 0.6
            })
          );
        }

        if (!project.period) {
          blocks.push(
            blockService.createBlock({
              section_id: sectionId,
              type: 'date',
              text: 'YYYY.MM-YYYY.MM (프로젝트 기간 입력 필요)',
              isAIGenerated: true,
              isPlaceholder: true,
              requiredFields: [
                {
                  field: '프로젝트 기간',
                  type: 'date',
                  hint: '시작일과 종료일 (YYYY.MM-YYYY.MM)'
                }
              ],
              confidence: 0.3,
              hallucinationRisk: 0.5
            })
          );
        }

        sections.push({
          section_id: sectionId,
          title: project.name || `프로젝트 ${idx + 1}`,
          blocks
        });
      });
    }

    const document: Document = {
      doc_id,
      sections,
      export_ready: false
    };

    documentStore.set(doc_id, document);

    const exportCheck = blockService.checkExportReady(document);
    document.export_ready = exportCheck.export_ready;

    res.json({
      doc_id,
      sections,
      export_ready: document.export_ready,
      validation_summary: {
        total_blocks: sections.reduce((acc, s) => acc + s.blocks.length, 0),
        needs_review: sections.reduce(
          (acc, s) => acc + s.blocks.filter(b => b.verify_status === 'needs_review').length,
          0
        ),
        placeholders: sections.reduce(
          (acc, s) => acc + s.blocks.filter(b => b.placeholder).length,
          0
        )
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate document' });
  }
});

router.post('/api/auto_fill_missing', async (req: Request, res: Response) => {
  try {
    const { doc_id, strategy = 'light' } = req.body;

    const document = documentStore.get(doc_id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const updatedBlocks: Block[] = [];

    document.sections = document.sections.map(section => ({
      ...section,
      blocks: blockService.autoFillMissing(section.blocks, strategy).map(block => {
        const original = section.blocks.find(b => b.block_id === block.block_id);
        if (original && original.text !== block.text) {
          updatedBlocks.push(block);
        }
        return block;
      })
    }));

    documentStore.set(doc_id, document);

    res.json({
      updated_blocks: updatedBlocks,
      message: `${updatedBlocks.length}개 블록이 자동 보강되었습니다`
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to auto-fill missing values' });
  }
});

router.patch('/api/blocks/:block_id', async (req: Request, res: Response) => {
  try {
    const { block_id } = req.params;
    const payload: BlockUpdatePayload = req.body;

    let blockFound = false;
    let updatedBlock: Block | null = null;

    documentStore.forEach(document => {
      document.sections.forEach(section => {
        const blockIndex = section.blocks.findIndex(b => b.block_id === block_id);
        if (blockIndex !== -1) {
          const block = section.blocks[blockIndex];
          updatedBlock = blockService.updateBlock(block, payload);

          const validation = blockService.validateBlock(updatedBlock);
          if (!validation.valid) {
            throw new Error(validation.errors.join(', '));
          }

          section.blocks[blockIndex] = updatedBlock;
          blockFound = true;

          const exportCheck = blockService.checkExportReady(document);
          document.export_ready = exportCheck.export_ready;
        }
      });
    });

    if (!blockFound) {
      return res.status(404).json({ error: 'Block not found' });
    }

    res.json({
      block: updatedBlock,
      message: 'Block updated successfully'
    });
  } catch (error: any) {
    res.status(422).json({ error: error.message });
  }
});

router.post('/api/export_check', async (req: Request, res: Response) => {
  try {
    const { doc_id } = req.body;

    const document = documentStore.get(doc_id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const exportCheck = blockService.checkExportReady(document);

    res.json(exportCheck);
  } catch (error) {
    res.status(500).json({ error: 'Failed to check export readiness' });
  }
});

router.post('/api/export', async (req: Request, res: Response) => {
  try {
    const { doc_id, format } = req.body;

    const document = documentStore.get(doc_id);
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const exportCheck = blockService.checkExportReady(document);
    if (!exportCheck.export_ready) {
      return res.status(400).json({
        error: 'Document is not ready for export',
        blockers: exportCheck.blockers
      });
    }

    const cleanedContent = {
      sections: document.sections.map(section => ({
        title: section.title,
        content: section.blocks
          .filter(b => b.verify_status === 'verified')
          .map(b => b.text)
          .join('\n')
      }))
    };

    res.json({
      format,
      content: cleanedContent,
      export_url: `/exports/${doc_id}.${format}`,
      message: 'Export generated successfully'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to export document' });
  }
});

export default router;