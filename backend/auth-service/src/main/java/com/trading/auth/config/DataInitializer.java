package com.trading.auth.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.trading.auth.model.AppUser;
import com.trading.auth.model.Role;
import com.trading.auth.repository.UserRepository;

@Component
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        // Seed / Reset default Admin user
        userRepository.findByUsernameIgnoreCase("admin").ifPresentOrElse(
                admin -> {
                    admin.setPasswordHash(passwordEncoder.encode("admin123"));
                    admin.setRole(Role.ADMIN);
                    userRepository.save(admin);
                    log.info("Ensured default admin account password: admin / admin123");
                },
                () -> {
                    AppUser admin = AppUser.create(
                            "admin",
                            "admin@quant.io",
                            passwordEncoder.encode("admin123"),
                            Role.ADMIN);
                    userRepository.save(admin);
                    log.info("Initialized default admin account: admin / admin123");
                }
        );

        // Seed default Demo Trader user
        if (userRepository.findByUsernameIgnoreCase("demo_trader").isEmpty()) {
            AppUser demo = AppUser.create(
                    "demo_trader",
                    "demo@quant.io",
                    passwordEncoder.encode("demo123"),
                    Role.USER);
            userRepository.save(demo);
            log.info("Initialized default demo trader account: demo_trader / demo123");
        }
    }
}
