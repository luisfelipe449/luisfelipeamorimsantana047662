package com.pss.fullstack.config;

import com.pss.fullstack.model.Album;
import com.pss.fullstack.model.Track;
import com.pss.fullstack.repository.AlbumRepository;
import com.pss.fullstack.repository.TrackRepository;
import io.minio.BucketExistsArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import javax.sound.sampled.AudioFileFormat;
import javax.sound.sampled.AudioFormat;
import javax.sound.sampled.AudioInputStream;
import javax.sound.sampled.AudioSystem;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.util.*;

/**
 * Seeds sample audio tracks for albums.
 * Generates simple sine wave audio files (royalty-free) for demonstration purposes.
 * Only runs in dev/docker profiles and skips if tracks already exist.
 */
@Component
@Profile({"dev", "docker"})
@RequiredArgsConstructor
@Slf4j
@Order(3) // Run after ImageSeeder
public class TrackSeeder implements ApplicationRunner {

    private final AlbumRepository albumRepository;
    private final TrackRepository trackRepository;
    private final MinioClient minioClient;

    @Value("${minio.bucket.audio:audio-tracks}")
    private String audioBucket;

    // Sample tracks for each album (title, duration in seconds, frequency in Hz)
    private static final Map<String, List<TrackInfo>> ALBUM_TRACKS = createAlbumTracks();

    private static Map<String, List<TrackInfo>> createAlbumTracks() {
        Map<String, List<TrackInfo>> tracks = new LinkedHashMap<>();

        // Serj Tankian - Harakiri
        tracks.put("Harakiri", List.of(
                new TrackInfo("Cornucopia", 15, 440),
                new TrackInfo("Figure It Out", 12, 494),
                new TrackInfo("Harakiri", 18, 523)
        ));

        // Serj Tankian - Black Blooms
        tracks.put("Black Blooms", List.of(
                new TrackInfo("Black Blooms", 14, 392),
                new TrackInfo("Rumi", 16, 349)
        ));

        // Serj Tankian - The Rough Dog
        tracks.put("The Rough Dog", List.of(
                new TrackInfo("The Rough Dog", 13, 330),
                new TrackInfo("Get Out Alive", 15, 370)
        ));

        // Mike Shinoda - The Rising Tied
        tracks.put("The Rising Tied", List.of(
                new TrackInfo("Introduction", 10, 262),
                new TrackInfo("Remember the Name", 17, 294),
                new TrackInfo("Right Now", 14, 330),
                new TrackInfo("Petrified", 12, 349)
        ));

        // Mike Shinoda - Post Traumatic
        tracks.put("Post Traumatic", List.of(
                new TrackInfo("Place to Start", 11, 392),
                new TrackInfo("Over Again", 16, 440),
                new TrackInfo("Watching As I Fall", 14, 494)
        ));

        // Mike Shinoda - Post Traumatic EP
        tracks.put("Post Traumatic EP", List.of(
                new TrackInfo("Place to Start", 11, 523),
                new TrackInfo("Over Again", 15, 587)
        ));

        // Mike Shinoda - Where'd You Go
        tracks.put("Where'd You Go", List.of(
                new TrackInfo("Where'd You Go", 18, 659),
                new TrackInfo("Where'd You Go (Instrumental)", 18, 698)
        ));

        // Michel Teló - Bem Sertanejo
        tracks.put("Bem Sertanejo", List.of(
                new TrackInfo("Ai Se Eu Te Pego", 12, 784),
                new TrackInfo("Fugidinha", 14, 880),
                new TrackInfo("Amanhã Sei Lá", 13, 988)
        ));

        // Michel Teló - Bem Sertanejo - O Show (Ao Vivo)
        tracks.put("Bem Sertanejo - O Show (Ao Vivo)", List.of(
                new TrackInfo("Ai Se Eu Te Pego (Ao Vivo)", 13, 523),
                new TrackInfo("Bara Bara Bere Bere (Ao Vivo)", 15, 587)
        ));

        // Michel Teló - Bem Sertanejo - (1ª Temporada) - EP
        tracks.put("Bem Sertanejo - (1ª Temporada) - EP", List.of(
                new TrackInfo("Modão Duído", 14, 659),
                new TrackInfo("Coração Na Cama", 12, 698)
        ));

        // Guns N' Roses - Use Your Illusion I
        tracks.put("Use Your Illusion I", List.of(
                new TrackInfo("Right Next Door to Hell", 11, 262),
                new TrackInfo("Dust N' Bones", 16, 294),
                new TrackInfo("Live and Let Die", 13, 330),
                new TrackInfo("November Rain", 20, 349)
        ));

        // Guns N' Roses - Use Your Illusion II
        tracks.put("Use Your Illusion II", List.of(
                new TrackInfo("Civil War", 18, 392),
                new TrackInfo("14 Years", 14, 440),
                new TrackInfo("Yesterdays", 12, 494),
                new TrackInfo("Knockin' on Heaven's Door", 17, 523)
        ));

        // Guns N' Roses - Greatest Hits
        tracks.put("Greatest Hits", List.of(
                new TrackInfo("Welcome to the Jungle", 15, 587),
                new TrackInfo("Sweet Child O' Mine", 17, 659),
                new TrackInfo("Paradise City", 18, 698),
                new TrackInfo("Patience", 16, 784)
        ));

        return tracks;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (tracksAlreadyExist()) {
            log.info("Track seed: Tracks already exist, skipping seeding...");
            return;
        }

        log.info("Starting track seeding process...");
        ensureAudioBucketExists();
        seedTracks();
        log.info("Track seeding completed!");
    }

    private boolean tracksAlreadyExist() {
        return trackRepository.count() > 0;
    }

    private void ensureAudioBucketExists() {
        try {
            boolean exists = minioClient.bucketExists(
                    BucketExistsArgs.builder()
                            .bucket(audioBucket)
                            .build()
            );

            if (!exists) {
                minioClient.makeBucket(
                        MakeBucketArgs.builder()
                                .bucket(audioBucket)
                                .build()
                );
                log.info("Created audio bucket: {}", audioBucket);
            }
        } catch (Exception e) {
            log.error("Failed to ensure audio bucket exists: {}", e.getMessage());
        }
    }

    private void seedTracks() {
        List<Album> albums = albumRepository.findAll();

        for (Album album : albums) {
            List<TrackInfo> trackInfos = ALBUM_TRACKS.get(album.getTitle());
            if (trackInfos == null) {
                log.warn("No track definitions found for album: {}", album.getTitle());
                continue;
            }

            int trackNumber = 1;
            for (TrackInfo trackInfo : trackInfos) {
                try {
                    // Create track entity
                    Track track = Track.builder()
                            .title(trackInfo.title)
                            .trackNumber(trackNumber)
                            .duration(trackInfo.duration)
                            .album(album)
                            .audioFormat("WAV")
                            .build();

                    track = trackRepository.save(track);

                    // Generate and upload audio file
                    byte[] audioData = generateSineWaveAudio(trackInfo.frequency, trackInfo.duration);
                    String audioKey = uploadAudioFile(album.getId(), track.getId(), audioData);

                    // Update track with audio info
                    track.setAudioKey(audioKey);
                    track.setFileSize((long) audioData.length);
                    track.setBitrate(calculateBitrate(audioData.length, trackInfo.duration));
                    trackRepository.save(track);

                    log.info("Seeded track: {} - {} (key: {})", album.getTitle(), trackInfo.title, audioKey);
                    trackNumber++;

                } catch (Exception e) {
                    log.warn("Error seeding track {} for album {}: {}", trackInfo.title, album.getTitle(), e.getMessage());
                }
            }

            // Update album track count
            album.updateTrackMetadata();
            albumRepository.save(album);
        }
    }

    /**
     * Generate a simple sine wave audio file in WAV format.
     * Creates a pleasant tone with fade in/out to avoid clicks.
     */
    private byte[] generateSineWaveAudio(double frequency, int durationSeconds) {
        float sampleRate = 44100;
        int sampleSizeInBits = 16;
        int channels = 1; // Mono
        boolean signed = true;
        boolean bigEndian = false;

        AudioFormat format = new AudioFormat(sampleRate, sampleSizeInBits, channels, signed, bigEndian);

        int totalSamples = (int) (sampleRate * durationSeconds);
        byte[] audioBytes = new byte[totalSamples * 2]; // 16 bits = 2 bytes per sample

        double fadeTime = 0.1; // 100ms fade in/out
        int fadeSamples = (int) (sampleRate * fadeTime);

        for (int i = 0; i < totalSamples; i++) {
            double time = i / sampleRate;
            double angle = 2.0 * Math.PI * frequency * time;

            // Generate sine wave with harmonics for richer sound
            double value = Math.sin(angle) * 0.6 +
                    Math.sin(angle * 2) * 0.2 +
                    Math.sin(angle * 3) * 0.1;

            // Apply fade in/out
            double envelope = 1.0;
            if (i < fadeSamples) {
                envelope = (double) i / fadeSamples;
            } else if (i > totalSamples - fadeSamples) {
                envelope = (double) (totalSamples - i) / fadeSamples;
            }

            // Apply slight tremolo effect for more musical sound
            double tremolo = 1.0 + 0.1 * Math.sin(2.0 * Math.PI * 5.0 * time);

            value = value * envelope * tremolo * 0.7; // 0.7 to prevent clipping

            // Convert to 16-bit signed integer
            short sample = (short) (value * Short.MAX_VALUE);

            // Write as little-endian
            audioBytes[i * 2] = (byte) (sample & 0xFF);
            audioBytes[i * 2 + 1] = (byte) ((sample >> 8) & 0xFF);
        }

        // Convert to WAV format
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ByteArrayInputStream bais = new ByteArrayInputStream(audioBytes);
            AudioInputStream audioInputStream = new AudioInputStream(bais, format, totalSamples);

            AudioSystem.write(audioInputStream, AudioFileFormat.Type.WAVE, baos);
            return baos.toByteArray();

        } catch (Exception e) {
            log.error("Failed to generate audio file: {}", e.getMessage());
            return new byte[0];
        }
    }

    /**
     * Upload audio file to MinIO.
     */
    private String uploadAudioFile(Long albumId, Long trackId, byte[] audioData) throws Exception {
        String audioKey = String.format("albums/%d/tracks/%d-%s.wav",
                albumId, trackId, UUID.randomUUID().toString());

        minioClient.putObject(
                PutObjectArgs.builder()
                        .bucket(audioBucket)
                        .object(audioKey)
                        .stream(new ByteArrayInputStream(audioData), audioData.length, -1)
                        .contentType("audio/wav")
                        .build()
        );

        return audioKey;
    }

    private int calculateBitrate(int fileSize, int duration) {
        if (duration == 0) return 0;
        return (fileSize * 8) / (duration * 1000);
    }

    /**
     * Track information holder.
     */
    private record TrackInfo(String title, int duration, double frequency) {}
}
