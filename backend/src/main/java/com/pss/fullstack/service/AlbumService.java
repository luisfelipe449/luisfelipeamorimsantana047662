package com.pss.fullstack.service;

import com.pss.fullstack.dto.*;
import com.pss.fullstack.exception.BusinessException;
import com.pss.fullstack.exception.ResourceNotFoundException;
import com.pss.fullstack.model.Album;
import com.pss.fullstack.model.Artist;
import com.pss.fullstack.model.Track;
import com.pss.fullstack.repository.AlbumRepository;
import com.pss.fullstack.repository.ArtistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlbumService {

    private final AlbumRepository albumRepository;
    private final ArtistRepository artistRepository;
    private final NotificationService notificationService;
    private final AudioService audioService;
    private final StorageService storageService;
    private final UrlGeneratorService urlGeneratorService;

    @Transactional(readOnly = true)
    public PageResponse<AlbumDTO> findAll(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Album> albumPage = albumRepository.findAll(pageable);

        List<AlbumDTO> albums = albumPage.getContent().stream()
                .map(album -> {
                    // Generate proxy URLs for cover images
                    List<String> proxyUrls = album.getCoverKeys().stream()
                            .map(urlGeneratorService::generateAlbumCoverUrl)
                            .collect(Collectors.toList());
                    return AlbumDTO.fromEntityWithPresignedUrls(album, proxyUrls);
                })
                .collect(Collectors.toList());

        return PageResponse.from(albumPage, albums);
    }

    @Transactional(readOnly = true)
    public PageResponse<AlbumDTO> findByFilters(String title, Integer year, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Album> albumPage = albumRepository.findByFilters(title, year, pageable);

        List<AlbumDTO> albums = albumPage.getContent().stream()
                .map(album -> {
                    // Generate proxy URLs for cover images
                    List<String> proxyUrls = album.getCoverKeys().stream()
                            .map(urlGeneratorService::generateAlbumCoverUrl)
                            .collect(Collectors.toList());
                    return AlbumDTO.fromEntityWithPresignedUrls(album, proxyUrls);
                })
                .collect(Collectors.toList());

        return PageResponse.from(albumPage, albums);
    }

    @Transactional(readOnly = true)
    public PageResponse<AlbumDTO> findByArtistId(Long artistId, int page, int size) {
        if (!artistRepository.existsById(artistId)) {
            throw new ResourceNotFoundException("Artist", artistId);
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("title").ascending());
        Page<Album> albumPage = albumRepository.findByArtistId(artistId, pageable);

        List<AlbumDTO> albums = albumPage.getContent().stream()
                .map(album -> {
                    // Generate proxy URLs for cover images
                    List<String> proxyUrls = album.getCoverKeys().stream()
                            .map(urlGeneratorService::generateAlbumCoverUrl)
                            .collect(Collectors.toList());
                    return AlbumDTO.fromEntityWithPresignedUrls(album, proxyUrls);
                })
                .collect(Collectors.toList());

        return PageResponse.from(albumPage, albums);
    }

    @Transactional(readOnly = true)
    public AlbumDTO findById(Long id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album", id));

        // Generate proxy URLs for cover images
        List<String> proxyUrls = album.getCoverKeys().stream()
                .map(urlGeneratorService::generateAlbumCoverUrl)
                .collect(Collectors.toList());

        return AlbumDTO.fromEntityWithPresignedUrls(album, proxyUrls);
    }

    @Transactional
    public AlbumDTO create(AlbumCreateDTO dto) {
        log.info("Creating new album: {}", dto.getTitle());

        // Validate and fetch artists
        Set<Artist> artists = new HashSet<>();
        for (Long artistId : dto.getArtistIds()) {
            Artist artist = artistRepository.findById(artistId)
                    .orElseThrow(() -> new ResourceNotFoundException("Artist", artistId));
            artists.add(artist);
        }

        Album album = dto.toEntity();
        album.setArtists(artists);

        // Process tracks if provided
        if (dto.getTracks() != null && !dto.getTracks().isEmpty()) {
            for (TrackInputDTO trackDto : dto.getTracks()) {
                Track track = Track.builder()
                        .title(trackDto.getTitle())
                        .trackNumber(trackDto.getTrackNumber())
                        .duration(trackDto.getDuration())
                        .build();
                album.addTrack(track);
            }
            album.updateTrackMetadata();
        }

        album = albumRepository.save(album);

        log.info("Album created with id: {}", album.getId());

        // Notify connected clients about the new album via WebSocket
        String artistNames = artists.stream()
                .map(Artist::getName)
                .collect(Collectors.joining(", "));
        notificationService.notifyNewAlbum(album.getId(), album.getTitle(), artistNames);

        // Generate proxy URLs for cover images
        List<String> proxyUrls = album.getCoverKeys().stream()
                .map(urlGeneratorService::generateAlbumCoverUrl)
                .collect(Collectors.toList());

        return AlbumDTO.fromEntityWithPresignedUrls(album, proxyUrls);
    }

    @Transactional
    public AlbumDTO update(Long id, AlbumUpdateDTO dto) {
        log.info("Updating album with id: {}", id);

        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album", id));

        if (dto.getTitle() != null) {
            album.setTitle(dto.getTitle());
        }
        if (dto.getReleaseYear() != null) {
            album.setReleaseYear(dto.getReleaseYear());
        }
        if (dto.getDescription() != null) {
            album.setDescription(dto.getDescription());
        }
        if (dto.getGenre() != null) {
            album.setGenre(dto.getGenre());
        }
        if (dto.getTrackCount() != null) {
            album.setTrackCount(dto.getTrackCount());
        }
        if (dto.getTotalDuration() != null) {
            album.setTotalDuration(dto.getTotalDuration());
        }
        if (dto.getArtistIds() != null && !dto.getArtistIds().isEmpty()) {
            Set<Artist> artists = new HashSet<>();
            for (Long artistId : dto.getArtistIds()) {
                Artist artist = artistRepository.findById(artistId)
                        .orElseThrow(() -> new ResourceNotFoundException("Artist", artistId));
                artists.add(artist);
            }
            album.setArtists(artists);
        }

        // Process tracks if provided (replace all tracks)
        if (dto.getTracks() != null) {
            album.getTracks().clear();
            for (TrackInputDTO trackDto : dto.getTracks()) {
                Track track = Track.builder()
                        .title(trackDto.getTitle())
                        .trackNumber(trackDto.getTrackNumber())
                        .duration(trackDto.getDuration())
                        .build();
                album.addTrack(track);
            }
            album.updateTrackMetadata();
        }

        album = albumRepository.save(album);
        log.info("Album updated: {}", album.getId());

        // Generate proxy URLs for cover images
        List<String> proxyUrls = album.getCoverKeys().stream()
                .map(urlGeneratorService::generateAlbumCoverUrl)
                .collect(Collectors.toList());

        return AlbumDTO.fromEntityWithPresignedUrls(album, proxyUrls);
    }

    @Transactional
    public void addCoverKey(Long id, String coverKey) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album", id));

        // Delete old covers from storage if they exist
        if (!album.getCoverKeys().isEmpty()) {
            for (String oldKey : album.getCoverKeys()) {
                try {
                    storageService.deleteFile(oldKey);
                    log.info("Deleted old cover: {}", oldKey);
                } catch (Exception e) {
                    log.warn("Could not delete old cover {}: {}", oldKey, e.getMessage());
                }
            }
            album.getCoverKeys().clear();
        }

        album.addCoverKey(coverKey);
        albumRepository.save(album);

        log.info("Cover added to album {}: {}", id, coverKey);
    }

    @Transactional(readOnly = true)
    public List<String> getCoverKeys(Long id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album", id));
        return album.getCoverKeys();
    }

    @Transactional(readOnly = true)
    public PlaylistDTO getAlbumPlaylist(Long id) {
        Album album = albumRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Album", id));

        // Build playlist DTO
        PlaylistDTO.PlaylistDTOBuilder playlistBuilder = PlaylistDTO.builder()
                .albumId(album.getId())
                .albumTitle(album.getTitle())
                .releaseYear(album.getReleaseYear())
                .totalDuration(album.getTotalDuration());

        // Add artist name (first artist if multiple)
        if (album.getArtists() != null && !album.getArtists().isEmpty()) {
            playlistBuilder.artistName(album.getArtists().iterator().next().getName());
        }

        // Add cover URL (first cover if multiple)
        if (album.getCoverKeys() != null && !album.getCoverKeys().isEmpty()) {
            String coverUrl = urlGeneratorService.generateAlbumCoverUrl(album.getCoverKeys().get(0));
            playlistBuilder.coverUrl(coverUrl);
        }

        // Add tracks with streaming URLs
        List<TrackDTO> tracksWithUrls = album.getTracks().stream()
                .map(track -> {
                    TrackDTO dto = TrackDTO.fromEntity(track);
                    if (track.getAudioKey() != null) {
                        try {
                            dto.setStreamUrl(audioService.getStreamUrl(track.getId()));
                        } catch (Exception e) {
                            log.warn("Could not generate stream URL for track {}: {}", track.getId(), e.getMessage());
                        }
                    }
                    return dto;
                })
                .collect(Collectors.toList());

        playlistBuilder.tracks(tracksWithUrls);

        return playlistBuilder.build();
    }

}
