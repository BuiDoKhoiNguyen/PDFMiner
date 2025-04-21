package com.rs.userservice.controller;

import com.rs.userservice.config.JwtService;
import com.rs.userservice.dto.AuthenticationRequest;
import com.rs.userservice.dto.AuthenticationResponse;
import com.rs.userservice.dto.RegisterRequest;
import com.rs.userservice.enums.RoleEnum;
import com.rs.userservice.model.User;
import com.rs.userservice.service.CustomUserDetailsService;
import com.rs.userservice.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserService userService;
    private final CustomUserDetailsService customUserDetailsService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/register")
    public ResponseEntity<AuthenticationResponse> register(@RequestBody RegisterRequest request) {
        // Kiểm tra nếu tên người dùng hoặc email đã tồn tại
        if (userService.existsByUsername(request.getUsername())) {
            return ResponseEntity.badRequest()
                    .body(AuthenticationResponse.builder()
                            .token(null)
                            .message("Tên người dùng đã tồn tại")
                            .build());
        }

        if (userService.existsByEmail(request.getEmail())) {
            return ResponseEntity.badRequest()
                    .body(AuthenticationResponse.builder()
                            .token(null)
                            .message("Email đã tồn tại")
                            .build());
        }

        // Mặc định mọi người đăng ký mới đều là STANDARD_USER
        // Admin sẽ phải được tạo từ backend hoặc thông qua API đặc biệt
        User user = User.builder()
                .username(request.getUsername())
                .password(request.getPassword())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .role(RoleEnum.STANDARD_USER)
                .enabled(true)
                .accountNonExpired(true)
                .accountNonLocked(true)
                .credentialsNonExpired(true)
                .build();

        User savedUser = userService.saveUser(user);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(savedUser.getUsername());
        String jwtToken = jwtService.generateToken(userDetails);

        return ResponseEntity.ok(AuthenticationResponse.builder()
                .token(jwtToken)
                .message("Đăng ký thành công")
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthenticationResponse> authenticate(@RequestBody AuthenticationRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );

            UserDetails userDetails = customUserDetailsService.loadUserByUsername(request.getUsername());
            String jwtToken = jwtService.generateToken(userDetails);

            return ResponseEntity.ok(AuthenticationResponse.builder()
                    .token(jwtToken)
                    .message("Đăng nhập thành công")
                    .build());
        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(AuthenticationResponse.builder()
                            .token(null)
                            .message("Tên đăng nhập hoặc mật khẩu không đúng")
                            .build());
        }
    }
}