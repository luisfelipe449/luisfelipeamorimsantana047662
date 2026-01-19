package com.pss.fullstack.controller;

import com.pss.fullstack.dto.*;
import com.pss.fullstack.model.ArtistType;
import com.pss.fullstack.service.ArtistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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

}
