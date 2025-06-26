package com.rs.documentservice.exception;

import org.springframework.http.HttpStatus;

public class DocumentNotFoundException extends ApiException {
    public DocumentNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message, "DOCUMENT_NOT_FOUND");
    }
}