// src/services/api.ts
import axios from 'axios';
import { DocumentEntity, DocumentSuggestResponse } from '../types';

const API_URL = 'http://localhost:8080';

const api = {
  uploadDocument: async (file: File): Promise<DocumentEntity> => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post<DocumentEntity>(`${API_URL}/documents/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  searchDocuments: async (keyword: string): Promise<DocumentEntity[]> => {
    try {
      const response = await axios.get<DocumentEntity[]>(`${API_URL}/documents/search`, {
        params: { keyword }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  },

  getSuggestions: async (query: string, limit: number = 6): Promise<DocumentSuggestResponse[]> => {
    try {
      const response = await axios.get<DocumentSuggestResponse[]>(`${API_URL}/documents/suggest`, {
        params: { query, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error getting suggestions:', error);
      throw error;
    }
  }
};

export default api;