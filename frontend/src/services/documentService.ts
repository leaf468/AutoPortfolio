import { UserDocument } from '../types/auth.types';
import { tokenService } from './authService';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

// 문서 목록 조회
export const getUserDocuments = async (userId: string): Promise<UserDocument[]> => {
  const token = tokenService.getToken();

  if (!token) return [];

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/documents`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return [];

    const result = await response.json();
    return result.documents || [];
  } catch (error) {
    console.error('Get user documents error:', error);
    return [];
  }
};

// 문서 조회
export const getDocument = async (documentId: string): Promise<UserDocument | null> => {
  const token = tokenService.getToken();

  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.document || null;
  } catch (error) {
    console.error('Get document error:', error);
    return null;
  }
};

// 문서 생성
export const createDocument = async (
  userId: string,
  data: Partial<UserDocument>
): Promise<UserDocument | null> => {
  const token = tokenService.getToken();

  if (!token) return null;

  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/documents`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) return null;

    const result = await response.json();
    return result.document || null;
  } catch (error) {
    console.error('Create document error:', error);
    return null;
  }
};

// 문서 수정
export const updateDocument = async (
  documentId: string,
  data: Partial<UserDocument>
): Promise<boolean> => {
  const token = tokenService.getToken();

  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error('Update document error:', error);
    return false;
  }
};

// 문서 삭제
export const deleteDocument = async (documentId: string): Promise<boolean> => {
  const token = tokenService.getToken();

  if (!token) return false;

  try {
    const response = await fetch(`${API_BASE_URL}/api/documents/${documentId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    const result = await response.json();
    return result.success || false;
  } catch (error) {
    console.error('Delete document error:', error);
    return false;
  }
};
