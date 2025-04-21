export interface DocumentEntity {
    id: string;
    documentNumber: string;
    documentName: string;
    title: string;
    content: string;
    documentType: string;
    issuingAgency: string;
    signer: string;
    issueDate: string;
    status: string;
    fileLink: string;
    searchText: string;
  }
  
  export interface DocumentSuggestResponse {
    id: string;
    textSearch: string;
  }