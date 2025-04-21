package com.rs.userservice.exception;

import org.springframework.http.HttpStatus;

public class DuplicateResourceException extends ApiException {
    public DuplicateResourceException(String message) {
        super(HttpStatus.CONFLICT, message, "USER_ALREADY_EXISTS");
    }
}