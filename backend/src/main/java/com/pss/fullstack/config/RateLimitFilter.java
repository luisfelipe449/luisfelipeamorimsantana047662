package com.pss.fullstack.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.lang.NonNull;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
@Slf4j
public class RateLimitFilter extends OncePerRequestFilter {

    @Value("${rate-limit.requests-per-minute}")
    private int requestsPerMinute;

    private final Map<String, BucketWrapper> buckets = new ConcurrentHashMap<>();

    private static class BucketWrapper {
        final Bucket bucket;
        final Instant lastAccessed;

        BucketWrapper(Bucket bucket) {
            this.bucket = bucket;
            this.lastAccessed = Instant.now();
        }
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {

        // Skip rate limiting for public endpoints
        String path = request.getRequestURI();
        if (isPublicEndpoint(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String userKey = getUserKey(request);
        BucketWrapper wrapper = buckets.compute(userKey, (key, existing) -> {
            if (existing == null) {
                return new BucketWrapper(createBucket(key));
            }
            return new BucketWrapper(existing.bucket);
        });

        if (wrapper.bucket.tryConsume(1)) {
            filterChain.doFilter(request, response);
        } else {
            log.warn("Rate limit exceeded for user: {}", userKey);
            response.setStatus(HttpStatus.TOO_MANY_REQUESTS.value());
            response.setContentType("application/json");
            response.getWriter().write(
                    "{\"error\":\"Too Many Requests\",\"message\":\"Rate limit exceeded. Maximum " +
                            requestsPerMinute + " requests per minute allowed.\"}"
            );
        }
    }

    private boolean isPublicEndpoint(String path) {
        return path.startsWith("/api/v1/auth") ||
                path.startsWith("/api/actuator") ||
                path.startsWith("/api/swagger-ui") ||
                path.startsWith("/api/v3/api-docs") ||
                path.startsWith("/api/ws") ||
                path.startsWith("/api/v1/images"); // Image proxy endpoints
    }

    private String getUserKey(HttpServletRequest request) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();

        if (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal())) {
            return "user:" + auth.getName();
        }

        // Fall back to IP address for unauthenticated requests
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty()) {
            ip = request.getRemoteAddr();
        }
        return "ip:" + ip;
    }

    private Bucket createBucket(String key) {
        Bandwidth limit = Bandwidth.classic(
                requestsPerMinute,
                Refill.greedy(requestsPerMinute, Duration.ofMinutes(1))
        );
        return Bucket.builder()
                .addLimit(limit)
                .build();
    }

    /**
     * Clean up expired buckets every 5 minutes to prevent memory leak
     */
    @Scheduled(fixedDelay = 300000) // 5 minutes
    public void cleanupExpiredBuckets() {
        Instant cutoff = Instant.now().minus(Duration.ofMinutes(10));
        int sizeBefore = buckets.size();

        buckets.entrySet().removeIf(entry ->
            entry.getValue().lastAccessed.isBefore(cutoff)
        );

        int removedCount = sizeBefore - buckets.size();
        if (removedCount > 0) {
            log.debug("Cleaned up {} expired rate limit buckets", removedCount);
        }
    }

}
