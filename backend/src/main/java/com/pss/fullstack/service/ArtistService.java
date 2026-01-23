package com.pss.fullstack.service;

import com.pss.fullstack.dto.*;
import com.pss.fullstack.exception.ResourceNotFoundException;
import com.pss.fullstack.model.Artist;
import com.pss.fullstack.model.ArtistType;
import com.pss.fullstack.repository.ArtistRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArtistService {

    private final ArtistRepository artistRepository;
    private final StorageService storageService;

    @Transactional(readOnly = true)
    public PageResponse<ArtistDTO> findAll(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Artist> artistPage = artistRepository.findByActiveTrue(pageable);

        List<ArtistDTO> artists = artistPage.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return PageResponse.from(artistPage, artists);
    }

    @Transactional(readOnly = true)
    public PageResponse<ArtistDTO> findByFilters(String name, ArtistType type, int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Artist> artistPage = artistRepository.findByFilters(name, type, pageable);

        List<ArtistDTO> artists = artistPage.getContent().stream()
                .map(this::toDTO)
                .collect(Collectors.toList());

        return PageResponse.from(artistPage, artists);
    }

    @Transactional(readOnly = true)
    public ArtistDTO findById(Long id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist", id));
        return toDTO(artist);
    }

    @Transactional
    public ArtistDTO create(ArtistCreateDTO dto) {
        log.info("Creating new artist: {}", dto.getName());

        Artist artist = dto.toEntity();
        artist = artistRepository.save(artist);

        log.info("Artist created with id: {}", artist.getId());
        return toDTO(artist);
    }

    @Transactional
    public ArtistDTO update(Long id, ArtistUpdateDTO dto) {
        log.info("Updating artist with id: {}", id);

        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist", id));

        if (dto.getName() != null) {
            artist.setName(dto.getName());
        }
        if (dto.getType() != null) {
            artist.setType(dto.getType());
        }
        if (dto.getCountry() != null) {
            artist.setCountry(dto.getCountry());
        }
        if (dto.getBiography() != null) {
            artist.setBiography(dto.getBiography());
        }
        if (dto.getActive() != null) {
            artist.setActive(dto.getActive());
        }

        artist = artistRepository.save(artist);
        log.info("Artist updated: {}", artist.getId());

        return toDTO(artist);
    }

    @Transactional(readOnly = true)
    public List<ArtistDTO> searchByName(String name, String sortDir) {
        List<Artist> artists;

        if (sortDir.equalsIgnoreCase("desc")) {
            artists = artistRepository.findByNameContainingIgnoreCaseOrderByNameDesc(name);
        } else {
            artists = artistRepository.findByNameContainingIgnoreCaseOrderByNameAsc(name);
        }

        return artists.stream()
                .filter(Artist::getActive)
                .map(this::toDTO)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return artistRepository.existsById(id);
    }

    @Transactional
    public String uploadPhoto(Long id, MultipartFile file) {
        log.info("Uploading photo for artist: {}", id);

        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist", id));

        // Delete old photo if exists
        if (artist.getPhotoKey() != null) {
            try {
                storageService.deleteFile(artist.getPhotoKey());
            } catch (Exception e) {
                log.warn("Could not delete old photo: {}", e.getMessage());
            }
        }

        String photoKey = storageService.uploadFile(file);
        artist.setPhotoKey(photoKey);
        artistRepository.save(artist);

        log.info("Photo uploaded for artist {}: {}", id, photoKey);
        return photoKey;
    }

    @Transactional
    public void deletePhoto(Long id) {
        log.info("Deleting photo for artist: {}", id);

        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist", id));

        if (artist.getPhotoKey() != null) {
            storageService.deleteFile(artist.getPhotoKey());
            artist.setPhotoKey(null);
            artistRepository.save(artist);
            log.info("Photo deleted for artist: {}", id);
        }
    }

    public String getPhotoUrl(Long id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist", id));

        if (artist.getPhotoKey() == null) {
            return null;
        }

        return storageService.getPresignedUrl(artist.getPhotoKey());
    }

    @Transactional
    public void deactivate(Long id) {
        log.info("Deactivating artist: {}", id);

        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist", id));

        artist.setActive(false);
        artistRepository.save(artist);

        log.info("Artist deactivated: {}", id);
    }

    private ArtistDTO toDTO(Artist artist) {
        ArtistDTO dto = ArtistDTO.fromEntity(artist);

        // Add presigned URL for photo
        if (artist.getPhotoKey() != null) {
            try {
                dto.setPhotoUrl(storageService.getPresignedUrl(artist.getPhotoKey()));
            } catch (Exception e) {
                log.warn("Could not generate presigned URL for artist {}: {}", artist.getId(), e.getMessage());
            }
        }

        // Include albums with cover URLs
        if (artist.getAlbums() != null && !artist.getAlbums().isEmpty()) {
            List<AlbumSummaryDTO> albumDTOs = artist.getAlbums().stream()
                    .map(album -> {
                        AlbumSummaryDTO albumDTO = AlbumSummaryDTO.fromEntity(album);
                        // Add first cover URL if exists
                        if (album.getCoverKeys() != null && !album.getCoverKeys().isEmpty()) {
                            try {
                                albumDTO.setCoverUrl(storageService.getPresignedUrl(album.getCoverKeys().get(0)));
                            } catch (Exception e) {
                                log.warn("Could not generate cover URL for album {}", album.getId());
                            }
                        }
                        return albumDTO;
                    })
                    .collect(Collectors.toList());
            dto.setAlbums(albumDTOs);
        }

        return dto;
    }

}
