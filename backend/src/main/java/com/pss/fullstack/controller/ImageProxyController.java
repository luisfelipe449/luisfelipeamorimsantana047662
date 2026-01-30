package com.pss.fullstack.controller;

import com.pss.fullstack.exception.ResourceNotFoundException;
import com.pss.fullstack.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/v1/images")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Image Proxy", description = "Direct image serving from MinIO storage")
public class ImageProxyController {

    private final StorageService storageService;

    @GetMapping("/album-covers/{objectKey}")
    @Operation(summary = "Get album cover image")
    public ResponseEntity<byte[]> getAlbumCover(
            @PathVariable String objectKey,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {

        // Validate object key format (prevent directory traversal)
        if (!isValidObjectKey(objectKey)) {
            log.warn("Invalid object key requested: {}", objectKey);
            return ResponseEntity.badRequest().build();
        }

        try {
            // Get image from MinIO
            byte[] imageData = storageService.getObject(objectKey);
            String contentType = storageService.getContentType(objectKey);

            // Calculate ETag
            String etag = "\"" + objectKey.hashCode() + "\"";

            // Check if client has cached version
            if (ifNoneMatch != null && ifNoneMatch.equals(etag)) {
                return ResponseEntity.status(304).build(); // Not Modified
            }

            // Return image with caching headers
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600") // 1 hour cache
                    .header(HttpHeaders.ETAG, etag)
                    .body(imageData);

        } catch (ResourceNotFoundException e) {
            log.debug("Image not found: {}", objectKey);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to proxy image: {}", objectKey, e);
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/artist-photos/{objectKey}")
    @Operation(summary = "Get artist photo")
    public ResponseEntity<byte[]> getArtistPhoto(
            @PathVariable String objectKey,
            @RequestHeader(value = "If-None-Match", required = false) String ifNoneMatch) {

        // Validate object key format (prevent directory traversal)
        if (!isValidObjectKey(objectKey)) {
            log.warn("Invalid object key requested: {}", objectKey);
            return ResponseEntity.badRequest().build();
        }

        try {
            // Get image from MinIO (artist photos might be in a different bucket in the future)
            byte[] imageData = storageService.getObject(objectKey);
            String contentType = storageService.getContentType(objectKey);

            // Calculate ETag
            String etag = "\"" + objectKey.hashCode() + "\"";

            // Check if client has cached version
            if (ifNoneMatch != null && ifNoneMatch.equals(etag)) {
                return ResponseEntity.status(304).build(); // Not Modified
            }

            // Return image with caching headers
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CACHE_CONTROL, "public, max-age=3600") // 1 hour cache
                    .header(HttpHeaders.ETAG, etag)
                    .body(imageData);

        } catch (ResourceNotFoundException e) {
            log.debug("Artist photo not found: {}", objectKey);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            log.error("Failed to proxy artist photo: {}", objectKey, e);
            return ResponseEntity.notFound().build();
        }
    }

    private boolean isValidObjectKey(String objectKey) {
        // Allow only alphanumeric, dash, dot, and underscore
        // Must not be empty and must not contain directory traversal attempts
        return objectKey != null &&
               !objectKey.isEmpty() &&
               objectKey.matches("^[a-zA-Z0-9._-]+$") &&
               !objectKey.contains("..") && // Prevent directory traversal
               !objectKey.startsWith("/") &&
               !objectKey.startsWith("\\");
    }
}