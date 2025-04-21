package com.rs.userservice.controller;

import com.rs.userservice.dto.UserInfoResponse;
import com.rs.userservice.model.User;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class UserProfileController {

    @GetMapping
    public ResponseEntity<UserInfoResponse> getCurrentUserInfo() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        
        if (authentication != null && authentication.getPrincipal() instanceof User) {
            User currentUser = (User) authentication.getPrincipal();
            
            UserInfoResponse response = UserInfoResponse.builder()
                .username(currentUser.getUsername())
                .email(currentUser.getEmail())
                .fullName(currentUser.getFullName())
                .role(currentUser.getRole().name())
                .permissions(currentUser.getRole().getPermissions().stream()
                    .map(Enum::name)
                    .collect(Collectors.toList()))
                .build();
                
            return ResponseEntity.ok(response);
        }
        
        return ResponseEntity.status(401).build();
    }
}