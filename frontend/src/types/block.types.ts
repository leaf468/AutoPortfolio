export type BlockOrigin = 'user_provided' | 'ai_generated' | 'user_edited' | 'verified';
export type VerifyStatus = 'pending' | 'needs_review' | 'verified';
export type BlockType = 'text' | 'number' | 'date' | 'list';

export interface RequiredField {
  field: string;
  type: string;
  hint: string;
}

export interface Block {
  block_id: string;
  section_id: string;
  type: BlockType;
  text: string;
  origin: BlockOrigin;
  placeholder: boolean;
  verify_status: VerifyStatus;
  required_fields: RequiredField[];
  confidence: number;
  auto_fill_reason?: string;
  hallucination_risk?: number;
}

export interface Section {
  section_id: string;
  title: string;
  blocks: Block[];
}

export interface Document {
  doc_id: string;
  sections: Section[];
  export_ready: boolean;
}

export interface ValidationSummary {
  total_blocks: number;
  needs_review: number;
  placeholders: number;
}