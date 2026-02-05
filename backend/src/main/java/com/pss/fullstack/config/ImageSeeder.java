package com.pss.fullstack.config;

import com.pss.fullstack.model.Album;
import com.pss.fullstack.model.Artist;
import com.pss.fullstack.repository.AlbumRepository;
import com.pss.fullstack.repository.ArtistRepository;
import com.pss.fullstack.service.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;
import org.springframework.http.ResponseEntity;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Seeds initial images for artists and albums by downloading from the internet.
 * Only runs in dev/docker profiles and skips if images already exist.
 */
@Component
@Profile({"dev", "docker"})
@RequiredArgsConstructor
@Slf4j
@Order(2) // Run after DataInitializer
public class ImageSeeder implements ApplicationRunner {

    private final ArtistRepository artistRepository;
    private final AlbumRepository albumRepository;
    private final StorageService storageService;
    private final RestTemplate restTemplate;

    @Value("${minio.bucket-name}")
    private String albumCoversBucket;

    // Artist photo URLs from Wikipedia/Wikimedia Commons (public domain or CC licensed)
    private static final Map<String, String> ARTIST_PHOTO_URLS = Map.of(
            "Serj Tankian", "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Serj_Tankian_2007.jpg/440px-Serj_Tankian_2007.jpg",
            "Mike Shinoda", "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Mike_Shinoda_2014.jpg/440px-Mike_Shinoda_2014.jpg",
            "Michel Teló", "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Michel_Tel%C3%B3_2012.jpg/440px-Michel_Tel%C3%B3_2012.jpg",
            "Guns N' Roses", "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Guns_N%27_Roses_logo.svg/440px-Guns_N%27_Roses_logo.svg.png"
    );

    // Album cover URLs from Wikipedia/Wikimedia Commons
    private static final Map<String, String> ALBUM_COVER_URLS = Map.ofEntries(
            // Serj Tankian
            Map.entry("Harakiri", "https://upload.wikimedia.org/wikipedia/en/5/5a/Harakiri_%28Serj_Tankian_album%29.jpg"),
            Map.entry("Black Blooms", "https://upload.wikimedia.org/wikipedia/en/9/9f/Serj_Tankian_-_Black_Blooms.jpg"),
            Map.entry("The Rough Dog", "https://upload.wikimedia.org/wikipedia/en/e/ed/Serj_Tankian_-_The_Rough_Dog.jpg"),
            // Mike Shinoda / Fort Minor
            Map.entry("The Rising Tied", "https://upload.wikimedia.org/wikipedia/en/a/af/The_Rising_Tied.jpg"),
            Map.entry("Post Traumatic", "https://upload.wikimedia.org/wikipedia/en/c/ce/Mike_Shinoda_-_Post_Traumatic.png"),
            Map.entry("Post Traumatic EP", "https://upload.wikimedia.org/wikipedia/en/6/6a/Post_Traumatic_EP.png"),
            Map.entry("Where'd You Go", "https://upload.wikimedia.org/wikipedia/en/6/6b/Where%27d_You_Go.jpg"),
            // Michel Teló
            Map.entry("Bem Sertanejo", "https://upload.wikimedia.org/wikipedia/pt/4/4c/Bem_Sertanejo.jpg"),
            Map.entry("Bem Sertanejo - O Show (Ao Vivo)", "https://upload.wikimedia.org/wikipedia/pt/3/36/Bem_Sertanejo_-_O_Show.jpg"),
            Map.entry("Bem Sertanejo - (1ª Temporada) - EP", "https://upload.wikimedia.org/wikipedia/pt/4/4c/Bem_Sertanejo.jpg"),
            // Guns N' Roses
            Map.entry("Use Your Illusion I", "https://upload.wikimedia.org/wikipedia/en/0/00/GnR--UseYourIllusion1.jpg"),
            Map.entry("Use Your Illusion II", "https://upload.wikimedia.org/wikipedia/en/2/2b/GnR--UseYourIllusion2.jpg"),
            Map.entry("Greatest Hits", "https://upload.wikimedia.org/wikipedia/en/4/49/GNRGreatestHits.jpg")
    );

    @Override
    public void run(ApplicationArguments args) {
        if (artistsAlreadyHavePhotos()) {
            log.info("Image seed: Artists already have photos, skipping seeding...");
            return;
        }

        log.info("Starting image seeding process...");
        seedArtistPhotos();
        seedAlbumCovers();
        log.info("Image seeding completed!");
    }

    private boolean artistsAlreadyHavePhotos() {
        List<Artist> artists = artistRepository.findAll();
        return artists.stream().anyMatch(a -> a.getPhotoKey() != null && !a.getPhotoKey().isEmpty());
    }

    private void seedArtistPhotos() {
        log.info("Seeding artist photos...");
        String artistPhotoBucket = storageService.getArtistPhotoBucket();

        for (Map.Entry<String, String> entry : ARTIST_PHOTO_URLS.entrySet()) {
            String artistName = entry.getKey();
            String imageUrl = entry.getValue();

            try {
                Optional<Artist> artistOpt = findArtistByName(artistName);
                if (artistOpt.isEmpty()) {
                    log.warn("Artist not found: {}", artistName);
                    continue;
                }

                Artist artist = artistOpt.get();
                if (artist.getPhotoKey() != null && !artist.getPhotoKey().isEmpty()) {
                    log.debug("Artist {} already has a photo, skipping", artistName);
                    continue;
                }

                byte[] imageBytes = downloadImage(imageUrl);
                if (imageBytes == null || imageBytes.length == 0) {
                    log.warn("Failed to download image for artist: {}", artistName);
                    continue;
                }

                String contentType = detectContentType(imageUrl);
                String objectKey = storageService.uploadBytesToBucket(imageBytes, contentType, artistPhotoBucket);

                artist.setPhotoKey(objectKey);
                artistRepository.save(artist);
                log.info("Seeded photo for artist: {} (key: {})", artistName, objectKey);

            } catch (Exception e) {
                log.warn("Error seeding photo for artist {}: {}", artistName, e.getMessage());
            }
        }
    }

    private void seedAlbumCovers() {
        log.info("Seeding album covers...");

        for (Map.Entry<String, String> entry : ALBUM_COVER_URLS.entrySet()) {
            String albumTitle = entry.getKey();
            String imageUrl = entry.getValue();

            try {
                Optional<Album> albumOpt = findAlbumByTitle(albumTitle);
                if (albumOpt.isEmpty()) {
                    log.warn("Album not found: {}", albumTitle);
                    continue;
                }

                Album album = albumOpt.get();
                if (!album.getCoverKeys().isEmpty()) {
                    log.debug("Album {} already has covers, skipping", albumTitle);
                    continue;
                }

                byte[] imageBytes = downloadImage(imageUrl);
                if (imageBytes == null || imageBytes.length == 0) {
                    log.warn("Failed to download cover for album: {}", albumTitle);
                    continue;
                }

                String contentType = detectContentType(imageUrl);
                String objectKey = storageService.uploadBytesToBucket(imageBytes, contentType, albumCoversBucket);

                album.addCoverKey(objectKey);
                albumRepository.save(album);
                log.info("Seeded cover for album: {} (key: {})", albumTitle, objectKey);

            } catch (Exception e) {
                log.warn("Error seeding cover for album {}: {}", albumTitle, e.getMessage());
            }
        }
    }

    private Optional<Artist> findArtistByName(String name) {
        return artistRepository.findAll().stream()
                .filter(a -> a.getName().equalsIgnoreCase(name))
                .findFirst();
    }

    private Optional<Album> findAlbumByTitle(String title) {
        return albumRepository.findAll().stream()
                .filter(a -> a.getTitle().equalsIgnoreCase(title))
                .findFirst();
    }

    private byte[] downloadImage(String url) {
        try {
            log.debug("Downloading image from: {}", url);
            ResponseEntity<byte[]> response = restTemplate.getForEntity(url, byte[].class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                return response.getBody();
            }
            return null;
        } catch (Exception e) {
            log.warn("Failed to download image from {}: {}", url, e.getMessage());
            return null;
        }
    }

    private String detectContentType(String url) {
        String lowerUrl = url.toLowerCase();
        if (lowerUrl.endsWith(".png")) {
            return "image/png";
        } else if (lowerUrl.endsWith(".gif")) {
            return "image/gif";
        } else if (lowerUrl.endsWith(".webp")) {
            return "image/webp";
        } else if (lowerUrl.endsWith(".svg")) {
            return "image/png"; // SVGs will be downloaded as-is but served as PNG
        }
        return "image/jpeg";
    }
}
