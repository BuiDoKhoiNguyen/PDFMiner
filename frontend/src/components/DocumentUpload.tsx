import React, { useState } from 'react';
import { Form, Button, Alert, ProgressBar, Card } from 'react-bootstrap';
import api from '../services/api';
import { DocumentEntity } from '../types';

interface MessageState {
  text: string;
  type: string;
}

const DocumentUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [message, setMessage] = useState<MessageState>({ text: '', type: '' });
  const [uploadedDocument, setUploadedDocument] = useState<DocumentEntity | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      // Kiểm tra nếu là file PDF
      if (selectedFile.type === 'application/pdf') {
        setFile(selectedFile);
        setMessage({ text: '', type: '' });
      } else {
        setFile(null);
        setMessage({ 
          text: 'Chỉ chấp nhận file PDF.', 
          type: 'danger' 
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage({ 
        text: 'Vui lòng chọn file PDF để tải lên.', 
        type: 'warning' 
      });
      return;
    }

    setUploading(true);
    setProgress(0);
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 5;
        return newProgress > 90 ? 90 : newProgress;
      });
    }, 200);

    try {
      const response = await api.uploadDocument(file);
      clearInterval(interval);
      setProgress(100);
      setMessage({ 
        text: 'Tài liệu đã được tải lên thành công!', 
        type: 'success' 
      });
      setUploadedDocument(response);
    } catch (error) {
      clearInterval(interval);
      setProgress(0);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải lên tài liệu';
      setMessage({ 
        text: `Lỗi khi tải lên: ${errorMessage}`, 
        type: 'danger' 
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2 className="text-center mb-4">Tải lên tài liệu PDF</h2>
      
      {message.text && (
        <Alert variant={message.type as any} dismissible onClose={() => setMessage({ text: '', type: '' })}>
          {message.text}
        </Alert>
      )}
      
      <Card className="p-4">
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Chọn file PDF</Form.Label>
            <Form.Control 
              type="file" 
              onChange={handleFileChange}
              accept="application/pdf"
              disabled={uploading}
            />
          </Form.Group>
          
          {uploading && (
            <ProgressBar animated now={progress} className="mb-3" />
          )}
          
          <div className="d-grid gap-2">
            <Button 
              type="submit" 
              variant="primary" 
              disabled={!file || uploading}
            >
              {uploading ? 'Đang tải lên...' : 'Tải lên'}
            </Button>
          </div>
        </Form>
      </Card>
      
      {uploadedDocument && (
        <Card className="mt-4 p-3">
          <Card.Body>
            <Card.Title>Thông tin tài liệu đã tải lên</Card.Title>
            <hr />
            <p><strong>Tiêu đề:</strong> {uploadedDocument.title}</p>
            <p><strong>Số hiệu:</strong> {uploadedDocument.documentNumber}</p>
            <p><strong>Loại:</strong> {uploadedDocument.documentType}</p>
            <p><strong>Cơ quan ban hành:</strong> {uploadedDocument.issuingAgency}</p>
            <p><strong>Người ký:</strong> {uploadedDocument.signer}</p>
            {uploadedDocument.fileLink && (
              <div className="d-grid gap-2">
                <a 
                  href={uploadedDocument.fileLink}
                  className="btn btn-outline-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Xem tài liệu
                </a>
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default DocumentUpload;