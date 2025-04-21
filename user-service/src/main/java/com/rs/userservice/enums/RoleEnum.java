package com.rs.userservice.enums;

import java.util.Arrays;
import java.util.List;

public enum RoleEnum {
    // Admin có tất cả quyền trong hệ thống
    ADMIN(Arrays.asList(PermissionEnum.values())),
    
    // Người quản lý tài liệu
    DOCUMENT_MANAGER(Arrays.asList(
        PermissionEnum.USER_READ, 
        PermissionEnum.DOCUMENT_CREATE, PermissionEnum.DOCUMENT_READ, 
        PermissionEnum.DOCUMENT_UPDATE, PermissionEnum.DOCUMENT_DELETE,
        PermissionEnum.DOCUMENT_APPROVE, PermissionEnum.DOCUMENT_DOWNLOAD,
        PermissionEnum.DOCUMENT_SEARCH,
        PermissionEnum.METADATA_READ, PermissionEnum.METADATA_UPDATE,
        PermissionEnum.METADATA_VALIDATE,
        PermissionEnum.STATISTICS_VIEW
    )),
    
    // Người dùng tiêu chuẩn
    STANDARD_USER(Arrays.asList(
        PermissionEnum.DOCUMENT_READ,
        PermissionEnum.DOCUMENT_SEARCH,
        PermissionEnum.DOCUMENT_DOWNLOAD,
        PermissionEnum.METADATA_READ
    )),
    
    // Người nhập liệu
    DATA_ENTRY_USER(Arrays.asList(
        PermissionEnum.DOCUMENT_CREATE,
        PermissionEnum.DOCUMENT_READ,
        PermissionEnum.DOCUMENT_UPDATE,
        PermissionEnum.DOCUMENT_SEARCH,
        PermissionEnum.METADATA_CREATE,
        PermissionEnum.METADATA_READ,
        PermissionEnum.METADATA_UPDATE
    )),
    
    // Người phê duyệt tài liệu
    DOCUMENT_APPROVER(Arrays.asList(
        PermissionEnum.DOCUMENT_READ,
        PermissionEnum.DOCUMENT_SEARCH,
        PermissionEnum.DOCUMENT_APPROVE,
        PermissionEnum.METADATA_READ,
        PermissionEnum.METADATA_VALIDATE
    )),
    
    // Nhà phân tích dữ liệu
    DATA_ANALYST(Arrays.asList(
        PermissionEnum.DOCUMENT_READ,
        PermissionEnum.DOCUMENT_SEARCH,
        PermissionEnum.METADATA_READ,
        PermissionEnum.STATISTICS_VIEW
    ));
    
    private final List<PermissionEnum> permissions;
    
    RoleEnum(List<PermissionEnum> permissions) {
        this.permissions = permissions;
    }
    
    public List<PermissionEnum> getPermissions() {
        return permissions;
    }
}