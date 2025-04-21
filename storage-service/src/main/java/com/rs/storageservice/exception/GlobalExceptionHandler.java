package com.rs.storageservice.exception;

import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ErrorResponse> handleApiException(ApiException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .errorCode(ex.getErrorCode())
                .message(ex.getMessage())
                .status(ex.getStatus().value())
                .timestamp(LocalDateTime.now())
                .path(request.getRequestURI())
                .build();
        
        log.error("API Exception: {}", ex.getMessage());
        return new ResponseEntity<>(errorResponse, ex.getStatus());
    }
    
    @ExceptionHandler(FileNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleFileNotFoundException(FileNotFoundException ex, HttpServletRequest request) {
        return handleApiException(ex, request);
    }
    
    @ExceptionHandler(FileStorageException.class)
    public ResponseEntity<ErrorResponse> handleFileStorageException(FileStorageException ex, HttpServletRequest request) {
        return handleApiException(ex, request);
    }
    
    @ExceptionHandler(InvalidFileTypeException.class)
    public ResponseEntity<ErrorResponse> handleInvalidFileTypeException(InvalidFileTypeException ex, HttpServletRequest request) {
        return handleApiException(ex, request);
    }
    
    @ExceptionHandler(FileSizeLimitExceededException.class)
    public ResponseEntity<ErrorResponse> handleFileSizeLimitExceededException(FileSizeLimitExceededException ex, HttpServletRequest request) {
        return handleApiException(ex, request);
    }
    
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .errorCode("FILE_SIZE_LIMIT_EXCEEDED")
                .message("The uploaded file size exceeds the maximum allowed size")
                .status(HttpStatus.PAYLOAD_TOO_LARGE.value())
                .timestamp(LocalDateTime.now())
                .path(request.getRequestURI())
                .build();
        
        log.error("File size limit exceeded: {}", ex.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.PAYLOAD_TOO_LARGE);
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDeniedException(AccessDeniedException ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .errorCode("ACCESS_DENIED")
                .message("You don't have permission to access this file")
                .status(HttpStatus.FORBIDDEN.value())
                .timestamp(LocalDateTime.now())
                .path(request.getRequestURI())
                .build();
        
        log.error("Access Denied Exception: {}", ex.getMessage());
        return new ResponseEntity<>(errorResponse, HttpStatus.FORBIDDEN);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Object> handleValidationExceptions(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        ErrorResponse errorResponse = ErrorResponse.builder()
                .errorCode("VALIDATION_FAILED")
                .message("Validation failed for file operation request")
                .status(HttpStatus.BAD_REQUEST.value())
                .timestamp(LocalDateTime.now())
                .path(request.getRequestURI())
                .build();
        
        Map<String, Object> response = new HashMap<>();
        response.put("error", errorResponse);
        response.put("validationErrors", errors);
        
        log.error("Validation Exception: {}", errors);
        return new ResponseEntity<>(response, HttpStatus.BAD_REQUEST);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGenericException(Exception ex, HttpServletRequest request) {
        ErrorResponse errorResponse = ErrorResponse.builder()
                .errorCode("INTERNAL_SERVER_ERROR")
                .message("An unexpected error occurred processing your file operation")
                .status(HttpStatus.INTERNAL_SERVER_ERROR.value())
                .timestamp(LocalDateTime.now())
                .path(request.getRequestURI())
                .build();
        
        log.error("Unexpected exception occurred: ", ex);
        return new ResponseEntity<>(errorResponse, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}