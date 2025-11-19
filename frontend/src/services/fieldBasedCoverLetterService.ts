import { supabase } from '../lib/supabaseClient';
import { FieldBasedCoverLetter, FieldBasedQuestion } from '../types/fieldBasedCoverLetter';
import { CoverLetterQuestion } from '../components/CoverLetterQuestionInput';

/**
 * 필드 기반 자소서 저장
 */
export const saveFieldBasedCoverLetter = async (
  userId: string,
  companyName: string,
  position: string,
  questions: FieldBasedQuestion[]
): Promise<{ success: boolean; documentId?: number; message?: string }> => {
  try {
    // 현재 인증된 사용자 가져오기
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, message: '로그인이 필요합니다.' };
    }

    // 1. 문서 생성
    const { data: docData, error: docError } = await supabase
      .from('field_based_documents')
      .insert({
        user_id: user.id, // auth.uid()와 동일한 UUID 사용
        company_name: companyName,
        position: position,
      })
      .select('document_id')
      .single();

    if (docError || !docData) {
      console.error('Document insert error:', docError);
      return { success: false, message: '문서 저장에 실패했습니다.' };
    }

    const documentId = docData.document_id;

    // 2. 질문 데이터 생성
    const questionInserts = questions.map((q, index) => ({
      document_id: documentId,
      question_text: q.question,
      field_type: q.fieldType,
      max_length: q.maxLength || 1000,
      fields: q.fields, // JSONB로 통째로 저장
      generated_answer: q.generatedAnswer || null,
      edited_answer: q.editedAnswer || null,
      display_order: index,
    }));

    const { error: questionsError } = await supabase
      .from('field_based_questions')
      .insert(questionInserts);

    if (questionsError) {
      console.error('Questions insert error:', questionsError);
      // 문서는 생성되었지만 질문 저장 실패 시 문서 삭제
      await supabase
        .from('field_based_documents')
        .delete()
        .eq('document_id', documentId);
      return { success: false, message: '질문 저장에 실패했습니다.' };
    }

    return { success: true, documentId, message: '자소서가 성공적으로 저장되었습니다.' };
  } catch (error) {
    console.error('Save field-based cover letter error:', error);
    return { success: false, message: '저장 중 오류가 발생했습니다.' };
  }
};

/**
 * 필드 기반 자소서 업데이트
 */
export const updateFieldBasedCoverLetter = async (
  documentId: number,
  companyName: string,
  position: string,
  questions: FieldBasedQuestion[]
): Promise<{ success: boolean; message?: string }> => {
  try {
    // 1. 문서 업데이트
    const { error: docError } = await supabase
      .from('field_based_documents')
      .update({
        company_name: companyName,
        position: position,
      })
      .eq('document_id', documentId);

    if (docError) {
      console.error('Document update error:', docError);
      return { success: false, message: '문서 업데이트에 실패했습니다.' };
    }

    // 2. 기존 질문 삭제
    await supabase
      .from('field_based_questions')
      .delete()
      .eq('document_id', documentId);

    // 3. 새로운 질문 데이터 삽입
    const questionInserts = questions.map((q, index) => ({
      document_id: documentId,
      question_text: q.question,
      field_type: q.fieldType,
      max_length: q.maxLength || 1000,
      fields: q.fields,
      generated_answer: q.generatedAnswer || null,
      edited_answer: q.editedAnswer || null,
      display_order: index,
    }));

    const { error: questionsError } = await supabase
      .from('field_based_questions')
      .insert(questionInserts);

    if (questionsError) {
      console.error('Questions insert error:', questionsError);
      return { success: false, message: '질문 업데이트에 실패했습니다.' };
    }

    return { success: true, message: '자소서가 성공적으로 수정되었습니다.' };
  } catch (error) {
    console.error('Update field-based cover letter error:', error);
    return { success: false, message: '수정 중 오류가 발생했습니다.' };
  }
};

/**
 * 필드 기반 자소서 불러오기
 */
export const loadFieldBasedCoverLetter = async (
  documentId: number
): Promise<{ success: boolean; data?: FieldBasedCoverLetter; message?: string }> => {
  try {
    // 1. 문서 조회
    const { data: docData, error: docError } = await supabase
      .from('field_based_documents')
      .select('*')
      .eq('document_id', documentId)
      .single();

    if (docError || !docData) {
      console.error('Document load error:', docError);
      return { success: false, message: '문서를 찾을 수 없습니다.' };
    }

    // 2. 질문 조회
    const { data: questionsData, error: questionsError } = await supabase
      .from('field_based_questions')
      .select('*')
      .eq('document_id', documentId)
      .order('display_order', { ascending: true });

    if (questionsError) {
      console.error('Questions load error:', questionsError);
      return { success: false, message: '질문을 불러오는데 실패했습니다.' };
    }

    // 3. TypeScript 타입으로 변환
    const questions: FieldBasedQuestion[] = (questionsData || []).map((q) => ({
      id: q.question_id.toString(),
      question: q.question_text,
      fieldType: q.field_type,
      fields: q.fields, // JSONB → Object 자동 변환
      generatedAnswer: q.generated_answer || '',
      editedAnswer: q.edited_answer || undefined,
      maxLength: q.max_length,
    }));

    const coverLetter: FieldBasedCoverLetter = {
      documentId: docData.document_id,
      userId: docData.user_id,
      companyName: docData.company_name,
      position: docData.position,
      questions,
      feedbacks: [], // 피드백은 나중에 구현 시 추가
      createdAt: new Date(docData.created_at),
      updatedAt: new Date(docData.updated_at),
    };

    return { success: true, data: coverLetter };
  } catch (error) {
    console.error('Load field-based cover letter error:', error);
    return { success: false, message: '불러오기 중 오류가 발생했습니다.' };
  }
};

/**
 * 사용자의 필드 기반 자소서 목록 조회
 */
export const getUserFieldBasedDocuments = async (
  userId: string
): Promise<{ success: boolean; data?: Array<{ documentId: number; companyName: string; position: string; createdAt: Date }>; message?: string }> => {
  try {
    const { data, error } = await supabase
      .from('field_based_documents')
      .select('document_id, company_name, position, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Load documents error:', error);
      return { success: false, message: '문서 목록을 불러오는데 실패했습니다.' };
    }

    const documents = (data || []).map((d) => ({
      documentId: d.document_id,
      companyName: d.company_name,
      position: d.position,
      createdAt: new Date(d.created_at),
    }));

    return { success: true, data: documents };
  } catch (error) {
    console.error('Get user documents error:', error);
    return { success: false, message: '문서 목록 조회 중 오류가 발생했습니다.' };
  }
};

/**
 * 필드 기반 자소서 삭제
 */
export const deleteFieldBasedCoverLetter = async (
  documentId: number
): Promise<{ success: boolean; message?: string }> => {
  try {
    const { error } = await supabase
      .from('field_based_documents')
      .delete()
      .eq('document_id', documentId);

    if (error) {
      console.error('Delete document error:', error);
      return { success: false, message: '문서 삭제에 실패했습니다.' };
    }

    return { success: true, message: '문서가 삭제되었습니다.' };
  } catch (error) {
    console.error('Delete field-based cover letter error:', error);
    return { success: false, message: '삭제 중 오류가 발생했습니다.' };
  }
};

/**
 * 필드 기반 자소서를 일반 자소서 형식으로 변환
 */
export const convertFieldBasedToRegular = (
  fieldBasedDoc: FieldBasedCoverLetter
): CoverLetterQuestion[] => {
  return fieldBasedDoc.questions.map((q) => ({
    id: q.id,
    question: q.question,
    answer: q.editedAnswer || q.generatedAnswer || '', // 수정된 답변 우선, 없으면 생성된 답변
    placeholder: `${q.question}에 대한 답변을 작성해주세요...`,
    maxLength: q.maxLength || 1000,
  }));
};
