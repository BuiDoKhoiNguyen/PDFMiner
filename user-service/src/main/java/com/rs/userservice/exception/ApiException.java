package com.rs.userservice.exception;

import lombok.Getter;
import lombok.Setter;
import org.springframework.http.HttpStatus;

@Getter
@Setter
public class ApiException extends RuntimeException {
    private final HttpStatus status;
    private final String message;
    private final String errorCode;

    public ApiException(HttpStatus status, String message, String errorCode) {
        super(message);
        this.status = status;
        this.message = message;
        this.errorCode = errorCode;
    }
}