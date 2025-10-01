package com.rs.documentservice.exception;

import org.springframework.http.HttpStatus;

public class DocumentProcessingException extends ApiException {
    public DocumentProcessingException(String message) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, message, "DOCUMENT_PROCESSING_FAILED");
    }
}