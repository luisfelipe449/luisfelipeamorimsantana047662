package com.pss.fullstack.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Collections;

import static org.junit.jupiter.api.Assertions.*;

class JwtServiceTest {

    private JwtService jwtService;
    private UserDetails userDetails;

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        // Set test values using reflection
        ReflectionTestUtils.setField(jwtService, "secretKey",
                "myTestSecretKeyForJWTTokenGenerationThatIsAtLeast256BitsLongForTesting");
        ReflectionTestUtils.setField(jwtService, "accessTokenExpiration", 300000L); // 5 min
        ReflectionTestUtils.setField(jwtService, "refreshTokenExpiration", 86400000L); // 24 hours

        userDetails = new User("testuser", "password", Collections.emptyList());
    }

    @Test
    void shouldGenerateAccessToken() {
        String token = jwtService.generateAccessToken(userDetails);

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void shouldGenerateRefreshToken() {
        String token = jwtService.generateRefreshToken(userDetails);

        assertNotNull(token);
        assertTrue(jwtService.isRefreshToken(token));
    }

    @Test
    void shouldExtractUsername() {
        String token = jwtService.generateAccessToken(userDetails);
        String username = jwtService.extractUsername(token);

        assertEquals("testuser", username);
    }

    @Test
    void shouldValidateToken() {
        String token = jwtService.generateAccessToken(userDetails);

        assertTrue(jwtService.isTokenValid(token, userDetails));
    }

    @Test
    void shouldDetectExpiredToken() {
        // Create a service with very short expiration
        JwtService shortLivedService = new JwtService();
        ReflectionTestUtils.setField(shortLivedService, "secretKey",
                "myTestSecretKeyForJWTTokenGenerationThatIsAtLeast256BitsLongForTesting");
        ReflectionTestUtils.setField(shortLivedService, "accessTokenExpiration", 1L); // 1ms
        ReflectionTestUtils.setField(shortLivedService, "refreshTokenExpiration", 1L);

        String token = shortLivedService.generateAccessToken(userDetails);

        // Wait for token to expire
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        assertTrue(shortLivedService.isTokenExpired(token));
    }

    @Test
    void shouldIdentifyRefreshToken() {
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        assertFalse(jwtService.isRefreshToken(accessToken));
        assertTrue(jwtService.isRefreshToken(refreshToken));
    }

}
