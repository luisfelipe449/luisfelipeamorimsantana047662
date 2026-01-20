package com.pss.fullstack.controller;

import com.pss.fullstack.dto.*;
import com.pss.fullstack.model.ArtistType;
import com.pss.fullstack.service.ArtistService;
import com.pss.fullstack.service.StorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/artists")
@RequiredArgsConstructor
@Tag(name = "Artists", description = "Artist management endpoints")
public class ArtistController {

    private final ArtistService artistService;

    @GetMapping
    @Operation(summary = "List all artists with pagination and filtering")
    public ResponseEntity<PageResponse<ArtistDTO>> findAll(
            @Parameter(description = "Filter by name (partial match)")
            @RequestParam(required = false) String name,

            @Parameter(description = "Filter by type (SOLO or BAND)")
            @RequestParam(required = false) ArtistType type,

            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "name") String sortBy,

            @Parameter(description = "Sort direction (asc or desc)")
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        PageResponse<ArtistDTO> response;

        if (name != null || type != null) {
            response = artistService.findByFilters(name, type, page, size, sortBy, sortDir);
        } else {
            response = artistService.findAll(page, size, sortBy, sortDir);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get artist by ID")
    public ResponseEntity<ArtistDTO> findById(
            @Parameter(description = "Artist ID")
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(artistService.findById(id));
    }

    @GetMapping("/search")
    @Operation(summary = "Search artists by name with sorting")
    public ResponseEntity<List<ArtistDTO>> searchByName(
            @Parameter(description = "Name to search for")
            @RequestParam String name,

            @Parameter(description = "Sort direction (asc or desc)")
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        return ResponseEntity.ok(artistService.searchByName(name, sortDir));
    }

    @PostMapping
    @Operation(summary = "Create a new artist")
    public ResponseEntity<ArtistDTO> create(
            @Valid @RequestBody ArtistCreateDTO dto
    ) {
        ArtistDTO created = artistService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing artist")
    public ResponseEntity<ArtistDTO> update(
            @Parameter(description = "Artist ID")
            @PathVariable Long id,

            @Valid @RequestBody ArtistUpdateDTO dto
    ) {
        return ResponseEntity.ok(artistService.update(id, dto));
    }

    // ==================== Photo Endpoints ====================

    @PostMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload artist photo")
    public ResponseEntity<Map<String, String>> uploadPhoto(
            @Parameter(description = "Artist ID")
            @PathVariable Long id,

            @Parameter(description = "Photo file")
            @RequestParam("file") MultipartFile file
    ) {
        String photoKey = artistService.uploadPhoto(id, file);
        String photoUrl = artistService.getPhotoUrl(id);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of("key", photoKey, "url", photoUrl));
    }

    @DeleteMapping("/{id}/photo")
    @Operation(summary = "Delete artist photo")
    public ResponseEntity<Void> deletePhoto(
            @Parameter(description = "Artist ID")
            @PathVariable Long id
    ) {
        artistService.deletePhoto(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/photo/url")
    @Operation(summary = "Get artist photo URL")
    public ResponseEntity<Map<String, String>> getPhotoUrl(
            @Parameter(description = "Artist ID")
            @PathVariable Long id
    ) {
        String url = artistService.getPhotoUrl(id);
        if (url == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(Map.of("url", url));
    }

    // ==================== Soft Delete ====================

    @DeleteMapping("/{id}")
    @Operation(summary = "Deactivate an artist (soft delete)")
    public ResponseEntity<Void> deactivate(
            @Parameter(description = "Artist ID")
            @PathVariable Long id
    ) {
        artistService.deactivate(id);
        return ResponseEntity.noContent().build();
    }

}
