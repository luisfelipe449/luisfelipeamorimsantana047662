package com.pss.fullstack.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Service for generating environment-aware URLs for images.
 * In development, generates absolute URLs with host and port.
 * In Docker, generates relative URLs for nginx proxy.
 */
@Service
public class UrlGeneratorService {

    @Value("${application.base-url:}")
    private String baseUrl;

    /**
     * Generate an image URL based on the environment configuration.
     *
     * @param type The type of image (e.g., "album-covers", "artist-photos")
     * @param objectKey The object key/filename
     * @return The complete URL (absolute or relative based on configuration)
     */
    public String generateImageUrl(String type, String objectKey) {
        String path = String.format("/api/v1/images/%s/%s", type, objectKey);

        // If baseUrl is empty (Docker environment), return relative path
        // Otherwise, prepend the base URL for absolute path
        return baseUrl == null || baseUrl.isEmpty() ? path : baseUrl + path;
    }

    /**
     * Generate URL for album cover image.
     *
     * @param objectKey The object key/filename of the album cover
     * @return The complete URL for the album cover
     */
    public String generateAlbumCoverUrl(String objectKey) {
        return generateImageUrl("album-covers", objectKey);
    }

    /**
     * Generate URL for artist photo.
     *
     * @param objectKey The object key/filename of the artist photo
     * @return The complete URL for the artist photo
     */
    public String generateArtistPhotoUrl(String objectKey) {
        return generateImageUrl("artist-photos", objectKey);
    }
}