package com.pss.fullstack.service;

import com.pss.fullstack.exception.BusinessException;
import com.pss.fullstack.exception.InvalidFileException;
import com.pss.fullstack.exception.ResourceNotFoundException;
import io.minio.*;
import io.minio.errors.ErrorResponseException;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import jakarta.annotation.PostConstruct;

import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class StorageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
            "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"
    );

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.artist-photo-bucket:artist-photos}")
    private String artistPhotoBucket;

    @Value("${minio.presigned-url-expiration}")
    private int presignedUrlExpiration;

    @Value("${minio.endpoint}")
    private String minioInternalUrl;

    @Value("${minio.external-url:#{null}}")
    private String minioExternalUrl;

    @PostConstruct
    public void init() {
        log.info("MinIO Configuration:");
        log.info("  Internal URL: {}", minioInternalUrl);
        log.info("  External URL: {}", minioExternalUrl);
    }

    /**
     * Upload a file to MinIO and return the object key
     */
    public String uploadFile(MultipartFile file) {
        // Validate file size
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new InvalidFileException("File size exceeds 5MB limit");
        }

        // Validate content type
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType.toLowerCase())) {
            throw new InvalidFileException("Invalid file type. Only images (JPEG, PNG, GIF, WebP) are allowed");
        }

        try {
            ensureBucketExists();

            String originalFilename = file.getOriginalFilename();
            String extension = originalFilename != null
                    ? originalFilename.substring(originalFilename.lastIndexOf("."))
                    : ".jpg";

            String objectKey = UUID.randomUUID().toString() + extension;

            try (InputStream inputStream = file.getInputStream()) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucketName)
                                .object(objectKey)
                                .stream(inputStream, file.getSize(), -1)
                                .contentType(file.getContentType())
                                .build()
                );
            }

            log.info("File uploaded successfully: {}", objectKey);
            return objectKey;

        } catch (Exception e) {
            log.error("Error uploading file: {}", e.getMessage());
            throw new BusinessException("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * Generate a presigned URL for accessing a file (30 minutes expiration)
     */
    public String getPresignedUrl(String objectKey) {
        try {
            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucketName)
                            .object(objectKey)
                            .expiry(presignedUrlExpiration, TimeUnit.MINUTES)
                            .build()
            );

            url = replaceInternalWithExternalUrl(url);
            log.debug("Generated presigned URL for: {}", objectKey);
            return url;

        } catch (Exception e) {
            log.error("Error generating presigned URL: {}", e.getMessage());
            throw new BusinessException("Failed to generate presigned URL: " + e.getMessage());
        }
    }

    /**
     * Generate presigned URLs for multiple files
     */
    public List<String> getPresignedUrls(List<String> objectKeys) {
        return objectKeys.stream()
                .map(this::getPresignedUrl)
                .collect(Collectors.toList());
    }

    /**
     * Generate a presigned URL for accessing a file in a specific bucket
     */
    public String getPresignedUrlForBucket(String objectKey, String bucket, int expirySeconds) {
        try {
            String url = minioClient.getPresignedObjectUrl(
                    GetPresignedObjectUrlArgs.builder()
                            .method(Method.GET)
                            .bucket(bucket)
                            .object(objectKey)
                            .expiry(expirySeconds, TimeUnit.SECONDS)
                            .build()
            );

            url = replaceInternalWithExternalUrl(url);
            log.debug("Generated presigned URL for: {} in bucket: {}", objectKey, bucket);
            return url;

        } catch (Exception e) {
            log.error("Error generating presigned URL: {}", e.getMessage());
            throw new BusinessException("Failed to generate presigned URL: " + e.getMessage());
        }
    }

    /**
     * Delete a file from MinIO
     */
    public void deleteFile(String objectKey) {
        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );

            log.info("File deleted successfully: {}", objectKey);

        } catch (Exception e) {
            log.error("Error deleting file: {}", e.getMessage());
            throw new BusinessException("Failed to delete file: " + e.getMessage());
        }
    }

    /**
     * Get object data from MinIO as byte array
     */
    public byte[] getObject(String objectKey) {
        try (InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectKey)
                        .build());
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            byte[] buffer = new byte[8192];
            int bytesRead;
            while ((bytesRead = stream.read(buffer)) != -1) {
                baos.write(buffer, 0, bytesRead);
            }

            log.debug("Retrieved object: {} ({} bytes)", objectKey, baos.size());
            return baos.toByteArray();

        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                throw new ResourceNotFoundException("Image", "key", objectKey);
            }
            throw new BusinessException("Failed to retrieve image: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error retrieving object: {}", objectKey, e);
            throw new BusinessException("Failed to retrieve image");
        }
    }

    /**
     * Get object data from a specific bucket
     */
    public byte[] getObjectFromBucket(String objectKey, String bucketName) {
        try (InputStream stream = minioClient.getObject(
                GetObjectArgs.builder()
                        .bucket(bucketName)
                        .object(objectKey)
                        .build());
             ByteArrayOutputStream baos = new ByteArrayOutputStream()) {

            stream.transferTo(baos);
            return baos.toByteArray();

        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                throw new ResourceNotFoundException("File", "key", objectKey);
            }
            throw new BusinessException("Failed to retrieve file: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error retrieving object from bucket {}: {}", bucketName, objectKey, e);
            throw new BusinessException("Failed to retrieve file");
        }
    }

    /**
     * Get object content type from MinIO metadata
     */
    public String getContentType(String objectKey) {
        try {
            StatObjectResponse stat = minioClient.statObject(
                    StatObjectArgs.builder()
                            .bucket(bucketName)
                            .object(objectKey)
                            .build()
            );

            String contentType = stat.contentType();
            // Default to image/jpeg if not set
            return contentType != null ? contentType : "image/jpeg";

        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                throw new ResourceNotFoundException("Image", "key", objectKey);
            }
            throw new BusinessException("Failed to get image metadata: " + e.getMessage());
        } catch (Exception e) {
            log.error("Error getting object metadata: {}", objectKey, e);
            return "image/jpeg"; // Default fallback
        }
    }

    /**
     * Upload bytes to a specific bucket and return the object key
     */
    public String uploadBytesToBucket(byte[] content, String contentType, String bucket) {
        try {
            ensureBucketExists(bucket);

            String extension = getExtensionFromContentType(contentType);
            String objectKey = UUID.randomUUID().toString() + extension;

            try (InputStream inputStream = new java.io.ByteArrayInputStream(content)) {
                minioClient.putObject(
                        PutObjectArgs.builder()
                                .bucket(bucket)
                                .object(objectKey)
                                .stream(inputStream, content.length, -1)
                                .contentType(contentType)
                                .build()
                );
            }

            log.info("File uploaded successfully to bucket {}: {}", bucket, objectKey);
            return objectKey;

        } catch (Exception e) {
            log.error("Error uploading file to bucket {}: {}", bucket, e.getMessage());
            throw new BusinessException("Failed to upload file: " + e.getMessage());
        }
    }

    /**
     * Get the artist photo bucket name
     */
    public String getArtistPhotoBucket() {
        return artistPhotoBucket;
    }

    private String getExtensionFromContentType(String contentType) {
        if (contentType == null) return ".jpg";
        return switch (contentType.toLowerCase()) {
            case "image/png" -> ".png";
            case "image/gif" -> ".gif";
            case "image/webp" -> ".webp";
            default -> ".jpg";
        };
    }

    /**
     * Ensure the default bucket exists, create if not
     */
    private void ensureBucketExists() {
        ensureBucketExists(bucketName);
    }

    /**
     * Ensure a specific bucket exists, create if not
     */
    private void ensureBucketExists(String bucket) {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(bucket)
                            .build()
            );

            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(bucket)
                                .build()
                );
                log.info("Bucket created: {}", bucket);
            }

        } catch (Exception e) {
            log.error("Error checking/creating bucket: {}", e.getMessage());
            throw new BusinessException("Failed to ensure bucket exists: " + e.getMessage());
        }
    }

    /**
     * Replace internal URL with external URL for browser access
     */
    private String replaceInternalWithExternalUrl(String url) {
        if (minioExternalUrl != null && !minioInternalUrl.equals(minioExternalUrl)) {
            return url.replace(minioInternalUrl, minioExternalUrl);
        }
        return url;
    }

}
