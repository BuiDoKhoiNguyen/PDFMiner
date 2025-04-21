package com.rs.storageservice.exception;

import org.springframework.http.HttpStatus;

public class FileStorageException extends ApiException {
    public FileStorageException(String message) {
        super(HttpStatus.INTERNAL_SERVER_ERROR, message, "FILE_STORAGE_ERROR");
    }
}