package com.pss.fullstack.config;

import com.pss.fullstack.model.User;
import com.pss.fullstack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        // Update admin password if user exists
        userRepository.findByUsername("admin").ifPresent(user -> {
            String encodedPassword = passwordEncoder.encode("admin123");
            user.setPassword(encodedPassword);
            userRepository.save(user);
            log.info("Admin password has been updated");
        });
    }
}
