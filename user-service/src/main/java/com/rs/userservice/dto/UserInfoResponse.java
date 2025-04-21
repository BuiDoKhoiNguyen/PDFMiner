package com.rs.userservice.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class UserInfoResponse {
    private String username;
    private String email;
    private String fullName;
    private String role;
    private List<String> permissions;
}