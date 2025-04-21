package com.rs.storageservice.exception;

import org.springframework.http.HttpStatus;

public class FileSizeLimitExceededException extends ApiException {
    public FileSizeLimitExceededException(String message) {
        super(HttpStatus.PAYLOAD_TOO_LARGE, message, "FILE_SIZE_LIMIT_EXCEEDED");
    }
}