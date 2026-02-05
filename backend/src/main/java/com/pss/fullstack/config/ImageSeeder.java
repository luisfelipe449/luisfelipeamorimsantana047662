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
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Seeds initial images for artists and albums from local classpath resources.
 * If local images are not found, generates placeholder images with artist/album names.
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

    @Value("${minio.bucket-name}")
    private String albumCoversBucket;

    private static final String SEED_IMAGES_PATH = "seed-images/";
    private static final String ARTISTS_PATH = SEED_IMAGES_PATH + "artists/";
    private static final String ALBUMS_PATH = SEED_IMAGES_PATH + "albums/";

    // Mapping of artist names to their image filenames
    private static final Map<String, String> ARTIST_IMAGE_FILES = Map.of(
            "Serj Tankian", "serj-tankian.jpg",
            "Mike Shinoda", "mike-shinoda.jpg",
            "Michel Teló", "michel-telo.jpg",
            "Guns N' Roses", "guns-n-roses.jpg"
    );

    // Mapping of album titles to their image filenames
    private static final Map<String, String> ALBUM_IMAGE_FILES = Map.ofEntries(
            Map.entry("Harakiri", "harakiri.jpg"),
            Map.entry("Black Blooms", "black-blooms.jpg"),
            Map.entry("The Rough Dog", "the-rough-dog.jpg"),
            Map.entry("The Rising Tied", "the-rising-tied.jpg"),
            Map.entry("Post Traumatic", "post-traumatic.jpg"),
            Map.entry("Post Traumatic EP", "post-traumatic-ep.jpg"),
            Map.entry("Where'd You Go", "whered-you-go.jpg"),
            Map.entry("Bem Sertanejo", "bem-sertanejo.jpg"),
            Map.entry("Bem Sertanejo - O Show (Ao Vivo)", "bem-sertanejo-ao-vivo.jpg"),
            Map.entry("Bem Sertanejo - (1ª Temporada) - EP", "bem-sertanejo-ep.jpg"),
            Map.entry("Use Your Illusion I", "use-your-illusion-i.jpg"),
            Map.entry("Use Your Illusion II", "use-your-illusion-ii.jpg"),
            Map.entry("Greatest Hits", "greatest-hits.jpg")
    );

    // Colors for placeholder generation (one per artist)
    private static final Map<String, Color> ARTIST_COLORS = Map.of(
            "Serj Tankian", new Color(139, 0, 0),      // Dark red
            "Mike Shinoda", new Color(25, 25, 112),    // Midnight blue
            "Michel Teló", new Color(0, 100, 0),       // Dark green
            "Guns N' Roses", new Color(255, 140, 0)    // Dark orange
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

        for (Map.Entry<String, String> entry : ARTIST_IMAGE_FILES.entrySet()) {
            String artistName = entry.getKey();
            String imageFile = entry.getValue();

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

                byte[] imageBytes = loadImageFromClasspath(ARTISTS_PATH + imageFile);
                String contentType = "image/jpeg";

                if (imageBytes == null) {
                    log.info("Local image not found for artist {}, generating placeholder...", artistName);
                    imageBytes = generatePlaceholderImage(artistName, ARTIST_COLORS.getOrDefault(artistName, Color.GRAY), 400, 400);
                    contentType = "image/png";
                }

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

        // Get artist colors for album placeholders
        Map<String, Color> albumColors = Map.ofEntries(
                // Serj Tankian albums
                Map.entry("Harakiri", ARTIST_COLORS.get("Serj Tankian")),
                Map.entry("Black Blooms", ARTIST_COLORS.get("Serj Tankian")),
                Map.entry("The Rough Dog", ARTIST_COLORS.get("Serj Tankian")),
                // Mike Shinoda albums
                Map.entry("The Rising Tied", ARTIST_COLORS.get("Mike Shinoda")),
                Map.entry("Post Traumatic", ARTIST_COLORS.get("Mike Shinoda")),
                Map.entry("Post Traumatic EP", ARTIST_COLORS.get("Mike Shinoda")),
                Map.entry("Where'd You Go", ARTIST_COLORS.get("Mike Shinoda")),
                // Michel Teló albums
                Map.entry("Bem Sertanejo", ARTIST_COLORS.get("Michel Teló")),
                Map.entry("Bem Sertanejo - O Show (Ao Vivo)", ARTIST_COLORS.get("Michel Teló")),
                Map.entry("Bem Sertanejo - (1ª Temporada) - EP", ARTIST_COLORS.get("Michel Teló")),
                // Guns N' Roses albums
                Map.entry("Use Your Illusion I", ARTIST_COLORS.get("Guns N' Roses")),
                Map.entry("Use Your Illusion II", ARTIST_COLORS.get("Guns N' Roses")),
                Map.entry("Greatest Hits", ARTIST_COLORS.get("Guns N' Roses"))
        );

        for (Map.Entry<String, String> entry : ALBUM_IMAGE_FILES.entrySet()) {
            String albumTitle = entry.getKey();
            String imageFile = entry.getValue();

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

                byte[] imageBytes = loadImageFromClasspath(ALBUMS_PATH + imageFile);
                String contentType = "image/jpeg";

                if (imageBytes == null) {
                    log.info("Local image not found for album {}, generating placeholder...", albumTitle);
                    imageBytes = generatePlaceholderImage(albumTitle, albumColors.getOrDefault(albumTitle, Color.GRAY), 300, 300);
                    contentType = "image/png";
                }

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

    /**
     * Load image from classpath resources.
     * Returns null if the file doesn't exist.
     */
    private byte[] loadImageFromClasspath(String path) {
        try {
            ClassPathResource resource = new ClassPathResource(path);
            if (resource.exists()) {
                try (InputStream is = resource.getInputStream()) {
                    return is.readAllBytes();
                }
            }
        } catch (IOException e) {
            log.debug("Could not load image from classpath: {}", path);
        }
        return null;
    }

    /**
     * Generate a placeholder image with the given text and background color.
     */
    private byte[] generatePlaceholderImage(String text, Color backgroundColor, int width, int height) {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g2d = image.createGraphics();

        // Enable anti-aliasing
        g2d.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2d.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        // Fill background
        g2d.setColor(backgroundColor);
        g2d.fillRect(0, 0, width, height);

        // Add a subtle gradient overlay
        GradientPaint gradient = new GradientPaint(
                0, 0, new Color(255, 255, 255, 30),
                0, height, new Color(0, 0, 0, 50)
        );
        g2d.setPaint(gradient);
        g2d.fillRect(0, 0, width, height);

        // Draw text
        g2d.setColor(Color.WHITE);

        // Calculate font size based on text length and image size
        int fontSize = Math.min(width, height) / 8;
        if (text.length() > 20) {
            fontSize = fontSize * 2 / 3;
        }
        g2d.setFont(new Font("SansSerif", Font.BOLD, fontSize));

        // Word wrap for long text
        FontMetrics fm = g2d.getFontMetrics();
        String[] words = text.split(" ");
        StringBuilder line = new StringBuilder();
        java.util.List<String> lines = new java.util.ArrayList<>();

        for (String word : words) {
            String testLine = line.length() == 0 ? word : line + " " + word;
            if (fm.stringWidth(testLine) > width - 40) {
                if (line.length() > 0) {
                    lines.add(line.toString());
                    line = new StringBuilder(word);
                } else {
                    lines.add(word);
                }
            } else {
                line = new StringBuilder(testLine);
            }
        }
        if (line.length() > 0) {
            lines.add(line.toString());
        }

        // Draw centered text
        int totalTextHeight = lines.size() * fm.getHeight();
        int startY = (height - totalTextHeight) / 2 + fm.getAscent();

        for (String l : lines) {
            int textWidth = fm.stringWidth(l);
            int x = (width - textWidth) / 2;
            g2d.drawString(l, x, startY);
            startY += fm.getHeight();
        }

        g2d.dispose();

        // Convert to PNG bytes
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(image, "png", baos);
            return baos.toByteArray();
        } catch (IOException e) {
            log.error("Failed to generate placeholder image", e);
            return new byte[0];
        }
    }
}
