export type BlockOrigin = 'user_provided' | 'ai_generated' | 'user_edited' | 'verified';
export type VerifyStatus = 'pending' | 'needs_review' | 'verified';
export type BlockType = 'text' | 'number' | 'date' | 'list';

export interface RequiredField {
  field: string;
  type: string;
  hint: string;
}

export interface AuditHistory {
  ts: string;
  by: string;
  change: string;
}

export interface Audit {
  created_at: string;
  updated_at: string;
  history: AuditHistory[];
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
  audit: Audit;
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

export interface BlockUpdatePayload {
  text?: string;
  value?: string | number;
  verified?: boolean;
}

export interface ExportCheckResponse {
  export_ready: boolean;
  blockers: Array<{
    block_id: string;
    reason: string;
  }>;
}