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

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ArtistService {

    private final ArtistRepository artistRepository;

    @Transactional(readOnly = true)
    public PageResponse<ArtistDTO> findAll(int page, int size, String sortBy, String sortDir) {
        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending()
                : Sort.by(sortBy).ascending();

        Pageable pageable = PageRequest.of(page, size, sort);
        Page<Artist> artistPage = artistRepository.findAll(pageable);

        List<ArtistDTO> artists = artistPage.getContent().stream()
                .map(ArtistDTO::fromEntity)
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
                .map(ArtistDTO::fromEntity)
                .collect(Collectors.toList());

        return PageResponse.from(artistPage, artists);
    }

    @Transactional(readOnly = true)
    public ArtistDTO findById(Long id) {
        Artist artist = artistRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Artist", id));
        return ArtistDTO.fromEntity(artist);
    }

    @Transactional
    public ArtistDTO create(ArtistCreateDTO dto) {
        log.info("Creating new artist: {}", dto.getName());

        Artist artist = dto.toEntity();
        artist = artistRepository.save(artist);

        log.info("Artist created with id: {}", artist.getId());
        return ArtistDTO.fromEntity(artist);
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
        if (dto.getBiography() != null) {
            artist.setBiography(dto.getBiography());
        }

        artist = artistRepository.save(artist);
        log.info("Artist updated: {}", artist.getId());

        return ArtistDTO.fromEntity(artist);
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
                .map(ArtistDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public boolean existsById(Long id) {
        return artistRepository.existsById(id);
    }

}
