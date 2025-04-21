package com.rs.userservice.config;

import com.rs.userservice.enums.RoleEnum;
import com.rs.userservice.model.User;
import com.rs.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AdminInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) throws Exception {
        // Kiểm tra xem đã có admin chưa
        if (userRepository.findByUsername("admin").isEmpty()) {
            User adminUser = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .email("admin@pdfminer.com")
                    .fullName("Administrator")
                    .role(RoleEnum.ADMIN)
                    .enabled(true)
                    .accountNonExpired(true)
                    .accountNonLocked(true)
                    .credentialsNonExpired(true)
                    .build();
            
            userRepository.save(adminUser);
            System.out.println("Tài khoản admin được tạo thành công với username: admin và password: admin123");
        }
    }
}