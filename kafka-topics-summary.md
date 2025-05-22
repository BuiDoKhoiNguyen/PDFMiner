# Kafka Topic Changes Summary

## Old Topics
- pdf-uploaded
- pdf-text-extracted
- pdf-text-normalized
- pdf-indexed
- table-extracted
- file-processing-complete

## New Topics
- file-uploaded: Used when files are uploaded to the system
- file-text-extracted: Used when file content has been processed

## Topic Details

### file-uploaded
Producer: document-service  
Consumer: document-process-service  
Purpose: Thông báo về file PDF mới được upload và cần được xử lý OCR

Message format:
```json
{
  "documentId": "unique-id",
  "fileName": "example.pdf",
  "fileUrl": "https://storage.example.com/file.pdf",
  "mimeType": "application/pdf",
  "uploadTime": "2023-05-22"
}
```

### file-text-extracted
Producer: document-process-service  
Consumer: document-service  
Purpose: Kết quả xử lý OCR và trích xuất thông tin từ file PDF

Message format:
```json
{
  "documentId": "unique-id",
  "documentNumber": "123/QD-TTg",
  "documentName": "example.pdf",
  "title": "Quyết định về...",
  "content": "Nội dung văn bản...",
  "documentType": "Quyết định",
  "issuingAgency": "Thủ tướng Chính phủ",
  "signer": "Phạm Minh Chính",
  "issueDate": "2023-01-01",
  "status": "COMPLETED",
  "fileUrl": "https://storage.example.com/file.pdf"
}
``` 
   - Updated to use new topic names
   - Unified upload endpoints with `useKafka` parameter
   - Retained legacy endpoints with @Deprecated annotation

3. document-process-service: 
   - Updated message flow to work with two topics
   - Simplified consumer and producer logic

## API Endpoint Changes
1. Unified Upload Endpoints:
   - `/api/files/upload?useKafka=true|false`
   - `/api/documents/upload?useKafka=true|false`

2. Legacy Endpoints (Deprecated):
   - `/api/files/upload-with-kafka`
   - `/api/documents/upload-with-kafka`

The new unified endpoints provide a more consistent API while maintaining backward compatibility with existing clients.
