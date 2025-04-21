package com.rs.storageservice.exception;

import org.springframework.http.HttpStatus;

public class InvalidFileTypeException extends ApiException {
    public InvalidFileTypeException(String message) {
        super(HttpStatus.BAD_REQUEST, message, "INVALID_FILE_TYPE");
    }
}