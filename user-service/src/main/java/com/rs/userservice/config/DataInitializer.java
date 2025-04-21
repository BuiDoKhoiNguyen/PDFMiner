package com.rs.userservice.config;

import com.rs.userservice.enums.RoleEnum;
import com.rs.userservice.model.User;
import com.rs.userservice.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.experimental.FieldDefaults;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
@RequiredArgsConstructor
@FieldDefaults(level = lombok.AccessLevel.PRIVATE, makeFinal = true)
@Slf4j
public class DataInitializer {

    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_USERNAME = "admin";
    private static final String ADMIN_PASSWORD = "admin";

    @Bean
    public ApplicationRunner applicationRunner(UserRepository userRepository) {
        return args -> {
            log.info("Checking for existing admin user...");
            if (userRepository.findByUsername(ADMIN_USERNAME).isEmpty()) {
                log.info("Creating default admin user...");
                User user = User.builder()
                        .username(ADMIN_USERNAME)
                        .password(passwordEncoder.encode(ADMIN_PASSWORD))
                        .email("admin@example.com")
                        .fullName("Administrator")
                        .role(RoleEnum.ADMIN)
                        .enabled(true)
                        .accountNonExpired(true)
                        .accountNonLocked(true)
                        .credentialsNonExpired(true)
                        .build();

                userRepository.save(user);
                log.warn("Default admin created -> username: {}, password: {}", ADMIN_USERNAME, ADMIN_PASSWORD);
            } else {
                log.info("Admin user already exists. Skipping initialization.");
            }
        };
    }
}
