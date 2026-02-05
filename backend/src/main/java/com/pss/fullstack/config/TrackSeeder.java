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

        // Serj Tankian - Harakiri (2012) - Rock alternativo/Metal
        tracks.put("Harakiri", List.of(
                new TrackInfo("Cornucopia", 18, 440),      // A4
                new TrackInfo("Figure It Out", 15, 494),   // B4
                new TrackInfo("Weave On", 16, 523),        // C5
                new TrackInfo("Uneducated Democracy", 17, 392), // G4
                new TrackInfo("Harakiri", 20, 349)         // F4
        ));

        // Serj Tankian - Black Blooms (2019) - EP colaborativo
        tracks.put("Black Blooms", List.of(
                new TrackInfo("Black Blooms", 18, 392),    // G4
                new TrackInfo("Rumi", 16, 349),            // F4
                new TrackInfo("Disarming Time", 15, 330)   // E4
        ));

        // Serj Tankian - The Rough Dog (2018) - Jazz experimental
        tracks.put("The Rough Dog", List.of(
                new TrackInfo("The Rough Dog", 14, 330),   // E4
                new TrackInfo("Jazz-Iz-Christ", 16, 370),  // F#4
                new TrackInfo("Lie Lie Lie", 13, 415)      // G#4
        ));

        // Fort Minor (Mike Shinoda) - The Rising Tied (2005) - Hip-hop
        tracks.put("The Rising Tied", List.of(
                new TrackInfo("Introduction", 8, 262),     // C4
                new TrackInfo("Remember the Name", 18, 294), // D4
                new TrackInfo("Right Now", 15, 330),       // E4
                new TrackInfo("Petrified", 14, 349),       // F4
                new TrackInfo("Feel Like Home", 16, 392),  // G4
                new TrackInfo("Believe Me", 17, 440)       // A4
        ));

        // Mike Shinoda - Post Traumatic (2018) - Pop/Rock alternativo
        tracks.put("Post Traumatic", List.of(
                new TrackInfo("Place to Start", 12, 392),  // G4
                new TrackInfo("Over Again", 16, 440),      // A4
                new TrackInfo("Watching As I Fall", 15, 494), // B4
                new TrackInfo("Nothing Makes Sense Anymore", 14, 523), // C5
                new TrackInfo("Crossing a Line", 17, 587)  // D5
        ));

        // Mike Shinoda - Post Traumatic EP (2018)
        tracks.put("Post Traumatic EP", List.of(
                new TrackInfo("Place to Start", 12, 523),  // C5
                new TrackInfo("Over Again", 16, 587),      // D5
                new TrackInfo("Watching As I Fall", 15, 659) // E5
        ));

        // Fort Minor - Where'd You Go (2006) - Single
        tracks.put("Where'd You Go", List.of(
                new TrackInfo("Where'd You Go", 18, 659),  // E5
                new TrackInfo("Where'd You Go (Instrumental)", 18, 698), // F5
                new TrackInfo("Where'd You Go (A Cappella)", 18, 784) // G5
        ));

        // Michel Teló - Bem Sertanejo (2014) - Sertanejo
        tracks.put("Bem Sertanejo", List.of(
                new TrackInfo("Ai Se Eu Te Pego", 12, 784),  // G5
                new TrackInfo("Fugidinha", 14, 880),         // A5
                new TrackInfo("Bara Bara Bere Bere", 13, 988), // B5
                new TrackInfo("Humilde Residência", 15, 523), // C5
                new TrackInfo("Ei Psiu Beijo Me Liga", 14, 587) // D5
        ));

        // Michel Teló - Bem Sertanejo - O Show (Ao Vivo) (2015)
        tracks.put("Bem Sertanejo - O Show (Ao Vivo)", List.of(
                new TrackInfo("Ai Se Eu Te Pego (Ao Vivo)", 14, 523), // C5
                new TrackInfo("Fugidinha (Ao Vivo)", 15, 587),        // D5
                new TrackInfo("Bara Bara Bere Bere (Ao Vivo)", 13, 659), // E5
                new TrackInfo("Amanhã Sei Lá (Ao Vivo)", 16, 698)    // F5
        ));

        // Michel Teló - Bem Sertanejo - (1ª Temporada) - EP (2014)
        tracks.put("Bem Sertanejo - (1ª Temporada) - EP", List.of(
                new TrackInfo("Modão Duído (Ao Vivo)", 15, 659), // E5
                new TrackInfo("Coração Na Cama", 13, 698),       // F5
                new TrackInfo("Chocolate Quente", 14, 784)       // G5
        ));

        // Guns N' Roses - Use Your Illusion I (1991) - Hard rock
        tracks.put("Use Your Illusion I", List.of(
                new TrackInfo("Right Next Door to Hell", 12, 262), // C4
                new TrackInfo("Dust N' Bones", 16, 294),           // D4
                new TrackInfo("Live and Let Die", 13, 330),        // E4
                new TrackInfo("Don't Cry (Original)", 17, 349),    // F4
                new TrackInfo("November Rain", 20, 392),           // G4
                new TrackInfo("The Garden", 18, 440)               // A4
        ));

        // Guns N' Roses - Use Your Illusion II (1991) - Hard rock
        tracks.put("Use Your Illusion II", List.of(
                new TrackInfo("Civil War", 18, 392),               // G4
                new TrackInfo("14 Years", 15, 440),                // A4
                new TrackInfo("Yesterdays", 13, 494),              // B4
                new TrackInfo("Knockin' on Heaven's Door", 17, 523), // C5
                new TrackInfo("Estranged", 20, 587),               // D5
                new TrackInfo("You Could Be Mine", 16, 659)        // E5
        ));

        // Guns N' Roses - Greatest Hits (2004) - Compilação
        tracks.put("Greatest Hits", List.of(
                new TrackInfo("Welcome to the Jungle", 15, 587),   // D5
                new TrackInfo("Sweet Child O' Mine", 17, 659),     // E5
                new TrackInfo("Patience", 16, 698),                // F5
                new TrackInfo("Paradise City", 18, 784),           // G5
                new TrackInfo("November Rain", 20, 880),           // A5
                new TrackInfo("Don't Cry", 17, 988)                // B5
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
