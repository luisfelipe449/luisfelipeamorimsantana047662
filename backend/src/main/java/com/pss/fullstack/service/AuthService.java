package com.pss.fullstack.service;

import com.pss.fullstack.dto.LoginRequest;
import com.pss.fullstack.dto.RefreshTokenRequest;
import com.pss.fullstack.dto.TokenResponse;
import com.pss.fullstack.exception.BusinessException;
import com.pss.fullstack.model.User;
import com.pss.fullstack.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final AuthenticationManager authenticationManager;
    private final JwtService jwtService;
    private final UserRepository userRepository;

    @Value("${jwt.expiration}")
    private long accessTokenExpiration;

    public TokenResponse login(LoginRequest request) {
        log.info("Login attempt for user: {}", request.getUsername());

        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(
                            request.getUsername(),
                            request.getPassword()
                    )
            );
        } catch (AuthenticationException e) {
            log.warn("Authentication failed for user: {}", request.getUsername());
            throw new BusinessException("Invalid username or password");
        }

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new BusinessException("User not found"));

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        log.info("Login successful for user: {}", request.getUsername());

        return TokenResponse.of(accessToken, refreshToken, accessTokenExpiration / 1000);
    }

    public TokenResponse refresh(RefreshTokenRequest request) {
        String refreshToken = request.getRefreshToken();

        if (!jwtService.isRefreshToken(refreshToken)) {
            throw new BusinessException("Invalid refresh token");
        }

        if (jwtService.isTokenExpired(refreshToken)) {
            throw new BusinessException("Refresh token expired");
        }

        String username = jwtService.extractUsername(refreshToken);
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new BusinessException("User not found"));

        String newAccessToken = jwtService.generateAccessToken(user);
        String newRefreshToken = jwtService.generateRefreshToken(user);

        log.info("Token refreshed for user: {}", username);

        return TokenResponse.of(newAccessToken, newRefreshToken, accessTokenExpiration / 1000);
    }

}
