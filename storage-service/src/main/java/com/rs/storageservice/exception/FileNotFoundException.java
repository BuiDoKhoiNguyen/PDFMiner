package com.rs.storageservice.exception;

import org.springframework.http.HttpStatus;

public class FileNotFoundException extends ApiException {
    public FileNotFoundException(String message) {
        super(HttpStatus.NOT_FOUND, message, "FILE_NOT_FOUND");
    }
}