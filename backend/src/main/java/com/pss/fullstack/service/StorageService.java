package com.pss.fullstack.service;

import com.pss.fullstack.exception.BusinessException;
import io.minio.*;
import io.minio.http.Method;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class StorageService {

    private final MinioClient minioClient;

    @Value("${minio.bucket-name}")
    private String bucketName;

    @Value("${minio.presigned-url-expiration}")
    private int presignedUrlExpiration;

    /**
     * Upload a file to MinIO and return the object key
     */
    public String uploadFile(MultipartFile file) {
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
     * Ensure the bucket exists, create if not
     */
    private void ensureBucketExists() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(bucketName)
                            .build()
            );

            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(bucketName)
                                .build()
                );
                log.info("Bucket created: {}", bucketName);
            }

        } catch (Exception e) {
            log.error("Error checking/creating bucket: {}", e.getMessage());
            throw new BusinessException("Failed to ensure bucket exists: " + e.getMessage());
        }
    }

}
