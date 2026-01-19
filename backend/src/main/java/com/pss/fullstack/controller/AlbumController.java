package com.pss.fullstack.controller;

import com.pss.fullstack.dto.*;
import com.pss.fullstack.service.AlbumService;
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
@RequestMapping("/v1/albums")
@RequiredArgsConstructor
@Tag(name = "Albums", description = "Album management endpoints")
public class AlbumController {

    private final AlbumService albumService;
    private final StorageService storageService;

    @GetMapping
    @Operation(summary = "List all albums with pagination and filtering")
    public ResponseEntity<PageResponse<AlbumDTO>> findAll(
            @Parameter(description = "Filter by title (partial match)")
            @RequestParam(required = false) String title,

            @Parameter(description = "Filter by release year")
            @RequestParam(required = false) Integer year,

            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size,

            @Parameter(description = "Sort field")
            @RequestParam(defaultValue = "title") String sortBy,

            @Parameter(description = "Sort direction (asc or desc)")
            @RequestParam(defaultValue = "asc") String sortDir
    ) {
        PageResponse<AlbumDTO> response;

        if (title != null || year != null) {
            response = albumService.findByFilters(title, year, page, size, sortBy, sortDir);
        } else {
            response = albumService.findAll(page, size, sortBy, sortDir);
        }

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get album by ID")
    public ResponseEntity<AlbumDTO> findById(
            @Parameter(description = "Album ID")
            @PathVariable Long id
    ) {
        return ResponseEntity.ok(albumService.findById(id));
    }

    @GetMapping("/artist/{artistId}")
    @Operation(summary = "Get albums by artist ID with pagination")
    public ResponseEntity<PageResponse<AlbumDTO>> findByArtistId(
            @Parameter(description = "Artist ID")
            @PathVariable Long artistId,

            @Parameter(description = "Page number (0-based)")
            @RequestParam(defaultValue = "0") int page,

            @Parameter(description = "Page size")
            @RequestParam(defaultValue = "10") int size
    ) {
        return ResponseEntity.ok(albumService.findByArtistId(artistId, page, size));
    }

    @PostMapping
    @Operation(summary = "Create a new album")
    public ResponseEntity<AlbumDTO> create(
            @Valid @RequestBody AlbumCreateDTO dto
    ) {
        AlbumDTO created = albumService.create(dto);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Update an existing album")
    public ResponseEntity<AlbumDTO> update(
            @Parameter(description = "Album ID")
            @PathVariable Long id,

            @Valid @RequestBody AlbumUpdateDTO dto
    ) {
        return ResponseEntity.ok(albumService.update(id, dto));
    }

    @PostMapping(value = "/{id}/covers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload album cover image")
    public ResponseEntity<Map<String, String>> uploadCover(
            @Parameter(description = "Album ID")
            @PathVariable Long id,

            @Parameter(description = "Cover image file")
            @RequestParam("file") MultipartFile file
    ) {
        String objectKey = storageService.uploadFile(file);
        albumService.addCoverKey(id, objectKey);

        String presignedUrl = storageService.getPresignedUrl(objectKey);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "key", objectKey,
                        "url", presignedUrl
                ));
    }

    @PostMapping(value = "/{id}/covers/batch", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload multiple album cover images")
    public ResponseEntity<List<Map<String, String>>> uploadCovers(
            @Parameter(description = "Album ID")
            @PathVariable Long id,

            @Parameter(description = "Cover image files")
            @RequestParam("files") List<MultipartFile> files
    ) {
        List<Map<String, String>> results = files.stream()
                .map(file -> {
                    String objectKey = storageService.uploadFile(file);
                    albumService.addCoverKey(id, objectKey);
                    String presignedUrl = storageService.getPresignedUrl(objectKey);
                    return Map.of("key", objectKey, "url", presignedUrl);
                })
                .toList();

        return ResponseEntity.status(HttpStatus.CREATED).body(results);
    }

    @GetMapping("/{id}/covers")
    @Operation(summary = "Get album cover URLs with presigned URLs (30 min expiration)")
    public ResponseEntity<List<String>> getCoverUrls(
            @Parameter(description = "Album ID")
            @PathVariable Long id
    ) {
        List<String> coverKeys = albumService.getCoverKeys(id);
        List<String> presignedUrls = storageService.getPresignedUrls(coverKeys);
        return ResponseEntity.ok(presignedUrls);
    }

}
