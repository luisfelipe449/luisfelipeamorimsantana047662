package com.pss.fullstack.service;

import com.pss.fullstack.exception.BusinessException;
import com.pss.fullstack.exception.InvalidFileException;
import com.pss.fullstack.exception.ResourceNotFoundException;
import com.pss.fullstack.model.Track;
import com.pss.fullstack.repository.TrackRepository;
import io.minio.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class AudioService {

    private final MinioClient minioClient;
    private final StorageService storageService;
    private final TrackRepository trackRepository;

    @Value("${minio.bucket.audio:audio-tracks}")
    private String audioBucket;

    @Value("${audio.max-file-size:52428800}")
    private long maxFileSize;

    private static final List<String> ALLOWED_FORMATS = Arrays.asList(
            "audio/mpeg", // MP3
            "audio/mp3",
            "audio/ogg",  // OGG
            "audio/wav",  // WAV
            "audio/wave",
            "audio/x-wav"
    );

    /**
     * Upload audio file for a track
     */
    public String uploadAudioFile(Long trackId, MultipartFile file) {
        // Validate track exists
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track", trackId));

        // Validate file
        validateAudioFile(file);

        try {
            // Ensure audio bucket exists
            ensureAudioBucketExists();

            // Generate unique key for the audio file
            String fileExtension = getFileExtension(file.getOriginalFilename());
            String audioKey = String.format("albums/%d/tracks/%d-%s.%s",
                    track.getAlbum().getId(),
                    trackId,
                    UUID.randomUUID().toString(),
                    fileExtension);

            // Upload to MinIO
            minioClient.putObject(
                    PutObjectArgs.builder()
                            .bucket(audioBucket)
                            .object(audioKey)
                            .stream(file.getInputStream(), file.getSize(), -1)
                            .contentType(file.getContentType())
                            .build()
            );

            // Update track with audio information
            track.setAudioKey(audioKey);
            track.setAudioFormat(fileExtension.toUpperCase());
            track.setFileSize(file.getSize());

            // Try to extract bitrate (simplified - in production would use a library)
            track.setBitrate(estimateBitrate(file.getSize(), track.getDuration()));

            trackRepository.save(track);

            log.info("Audio file uploaded successfully for track {}: {}", trackId, audioKey);
            return audioKey;

        } catch (Exception e) {
            log.error("Failed to upload audio file for track {}: {}", trackId, e.getMessage());
            throw new BusinessException("Failed to upload audio file: " + e.getMessage());
        }
    }

    /**
     * Get presigned URL for streaming audio
     */
    public String getStreamUrl(Long trackId) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track", trackId));

        if (track.getAudioKey() == null) {
            throw new BusinessException("Track has no audio file");
        }

        // Use StorageService to generate URL with proper external URL handling
        return storageService.getPresignedUrlForBucket(track.getAudioKey(), audioBucket, 3600);
    }

    /**
     * Delete audio file for a track
     */
    public void deleteAudioFile(Long trackId) {
        Track track = trackRepository.findById(trackId)
                .orElseThrow(() -> new ResourceNotFoundException("Track", trackId));

        if (track.getAudioKey() == null) {
            return;
        }

        try {
            minioClient.removeObject(
                    RemoveObjectArgs.builder()
                            .bucket(audioBucket)
                            .object(track.getAudioKey())
                            .build()
            );

            // Clear audio fields
            track.setAudioKey(null);
            track.setAudioFormat(null);
            track.setBitrate(null);
            track.setFileSize(null);
            trackRepository.save(track);

            log.info("Audio file deleted for track {}: {}", trackId, track.getAudioKey());

        } catch (Exception e) {
            log.error("Failed to delete audio file for track {}: {}", trackId, e.getMessage());
            throw new BusinessException("Failed to delete audio file: " + e.getMessage());
        }
    }

    /**
     * Validate audio file
     */
    private void validateAudioFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new InvalidFileException("File is empty");
        }

        if (file.getSize() > maxFileSize) {
            throw new InvalidFileException("File size exceeds maximum allowed size of " + (maxFileSize / 1024 / 1024) + "MB");
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_FORMATS.contains(contentType.toLowerCase())) {
            throw new InvalidFileException("Invalid file format. Allowed formats: MP3, OGG, WAV");
        }
    }

    /**
     * Ensure audio bucket exists
     */
    private void ensureAudioBucketExists() throws Exception {
        boolean bucketExists = minioClient.bucketExists(
                BucketExistsArgs.builder()
                        .bucket(audioBucket)
                        .build()
        );

        if (!bucketExists) {
            minioClient.makeBucket(
                    MakeBucketArgs.builder()
                            .bucket(audioBucket)
                            .build()
            );
            log.info("Created audio bucket: {}", audioBucket);
        }
    }

    /**
     * Get file extension from filename
     */
    private String getFileExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "mp3"; // default
        }
        return filename.substring(filename.lastIndexOf(".") + 1).toLowerCase();
    }

    /**
     * Estimate bitrate from file size and duration
     */
    private Integer estimateBitrate(long fileSize, Integer duration) {
        if (duration == null || duration == 0) {
            return 128; // default bitrate
        }
        // Calculate approximate bitrate in kbps
        // (file_size_in_bytes * 8) / (duration_in_seconds * 1000)
        return (int) ((fileSize * 8) / (duration * 1000));
    }
}