// src/components/DocumentList.tsx
import React from 'react';
import { Card, Badge, Row, Col } from 'react-bootstrap';
import { DocumentEntity } from '../types';

interface DocumentListProps {
  documents: DocumentEntity[];
}

const DocumentList: React.FC<DocumentListProps> = ({ documents }) => {
  if (!documents || documents.length === 0) {
    return <p className="text-center my-5">Không tìm thấy tài liệu nào.</p>;
  }

  const formatDate = (dateString: string): string => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="document-list">
      {documents.map((doc) => (
        <Card key={doc.id} className="mb-3">
          <Card.Body>
            <Card.Title>
              {doc.title}
            </Card.Title>
            <Card.Subtitle className="mb-2 text-muted">
              {doc.documentType} {doc.documentNumber}
            </Card.Subtitle>
            <Row className="mb-2">
              <Col md={6}>
                <Badge bg="secondary" className="me-1">
                  Ngày ban hành: {formatDate(doc.issueDate)}
                </Badge>
              </Col>
              <Col md={6}>
                <Badge bg="info" className="me-1">
                  Cơ quan: {doc.issuingAgency}
                </Badge>
              </Col>
            </Row>
            <Card.Text className="text-truncate">
              {doc.content?.substring(0, 200)}...
            </Card.Text>
            <div className="d-flex justify-content-between align-items-center">
              <Badge bg="primary">Người ký: {doc.signer}</Badge>
              {doc.fileLink && (
                <a 
                  href={doc.fileLink} 
                  className="btn btn-sm btn-outline-primary"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Xem tài liệu
                </a>
              )}
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
};

export default DocumentList;