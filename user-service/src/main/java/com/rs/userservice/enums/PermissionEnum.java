package com.rs.userservice.enums;

public enum PermissionEnum {
    // Quyền người dùng
    USER_CREATE,
    USER_READ,
    USER_UPDATE,
    USER_DELETE,
    
    // Quyền quản lý tài liệu
    DOCUMENT_CREATE,
    DOCUMENT_READ,
    DOCUMENT_UPDATE,
    DOCUMENT_DELETE,
    DOCUMENT_APPROVE,
    DOCUMENT_DOWNLOAD,
    DOCUMENT_SEARCH,
    
    // Quyền quản lý metadata
    METADATA_CREATE,
    METADATA_READ,
    METADATA_UPDATE,
    METADATA_DELETE,
    METADATA_VALIDATE,
    
    // Quyền quản lý hệ thống
    SYSTEM_SETTINGS,
    STATISTICS_VIEW,
    
    // Quyền phân quyền
    ROLE_MANAGE
}