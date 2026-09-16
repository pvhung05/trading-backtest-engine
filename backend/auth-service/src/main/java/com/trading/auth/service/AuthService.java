package com.trading.auth.service;

import com.trading.auth.dto.request.LoginRequest;
import com.trading.auth.dto.request.RegisterRequest;
import com.trading.auth.dto.response.AuthResponse;
import com.trading.auth.dto.response.UserResponse;
import com.trading.auth.security.UserPrincipal;

public interface AuthService {

    AuthResponse register(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    UserResponse currentUser(UserPrincipal principal);
}
