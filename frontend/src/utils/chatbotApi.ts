import { api } from './api';

// Interface definitions
export interface ChatbotResponse {
  answer: string;
  documentIds: string[];
  documentSummaries?: {
    [key: string]: DocumentSummary;
  };
}

export interface DocumentSummary {
  id: string;
  title: string;
  documentNumber: string;
  documentType: string;
  issuingAgency: string;
}

export interface DocumentLink {
  id: string;
  title: string;
  documentNumber: string;
  documentType: string;
  url: string;
}

// Chatbot API
export const chatbotApi = {
  processQuery: (query: string) => 
    api.post<ChatbotResponse>('/documents/chatbot/query', { query }),
  
  getDocumentLinks: (documentIds: string[]) => 
    api.get<DocumentLink[]>('/documents/chatbot/document-links', { 
      params: { ids: documentIds.join(',') }, 
      paramsSerializer: { indexes: null } // This prevents axios from using array brackets
    })
};
