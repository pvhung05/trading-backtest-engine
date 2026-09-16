package com.trading.auth.service.impl;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.trading.auth.dto.request.LoginRequest;
import com.trading.auth.dto.request.RegisterRequest;
import com.trading.auth.dto.response.AuthResponse;
import com.trading.auth.dto.response.UserResponse;
import com.trading.auth.exception.InvalidCredentialsException;
import com.trading.auth.exception.UsernameAlreadyExistsException;
import com.trading.auth.model.AppUser;
import com.trading.auth.repository.UserRepository;
import com.trading.auth.security.JwtService;
import com.trading.auth.security.UserPrincipal;
import com.trading.auth.service.AuthService;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;

    public AuthServiceImpl(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtService jwtService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtService = jwtService;
    }

    @Override
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsernameIgnoreCaseOrEmailIgnoreCase(request.username(), request.email())) {
            throw new UsernameAlreadyExistsException("Username or email already exists");
        }

        AppUser user = AppUser.create(
                request.username().trim(),
                request.email().trim().toLowerCase(),
                passwordEncoder.encode(request.password()));

        AppUser savedUser = userRepository.save(user);
        return new AuthResponse(jwtService.generateToken(UserPrincipal.from(savedUser)), "Bearer", toUserResponse(savedUser));
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        try {
            authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(
                    request.username(),
                    request.password()));
        } catch (BadCredentialsException ex) {
            throw new InvalidCredentialsException("Invalid username or password");
        }

        AppUser user = userRepository.findByUsernameIgnoreCase(request.username())
                .orElseThrow(() -> new InvalidCredentialsException("Invalid username or password"));

        return new AuthResponse(jwtService.generateToken(UserPrincipal.from(user)), "Bearer", toUserResponse(user));
    }

    @Override
    @Transactional(readOnly = true)
    public UserResponse currentUser(UserPrincipal principal) {
        return toUserResponse(userRepository.findByUsernameIgnoreCase(principal.getUsername())
                .orElseThrow(() -> new InvalidCredentialsException("User not found")));
    }

    private UserResponse toUserResponse(AppUser user) {
        return new UserResponse(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name(),
                user.isEnabled(),
                user.getCreatedAt());
    }
}
