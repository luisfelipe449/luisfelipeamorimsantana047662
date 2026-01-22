package com.pss.fullstack.controller;

import com.pss.fullstack.dto.TrackDTO;
import com.pss.fullstack.service.AudioService;
import com.pss.fullstack.service.TrackService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/v1/tracks")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Tracks", description = "Track management and audio streaming endpoints")
public class TrackController {

    private final TrackService trackService;
    private final AudioService audioService;

    @GetMapping("/{id}")
    @Operation(summary = "Get track by ID")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Track found"),
            @ApiResponse(responseCode = "404", description = "Track not found")
    })
    public ResponseEntity<TrackDTO> getTrack(
            @Parameter(description = "Track ID")
            @PathVariable Long id
    ) {
        TrackDTO track = trackService.findById(id);
        return ResponseEntity.ok(track);
    }

    @PostMapping(value = "/{id}/audio", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload audio file for a track")
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Audio uploaded successfully"),
            @ApiResponse(responseCode = "400", description = "Invalid file format or size"),
            @ApiResponse(responseCode = "404", description = "Track not found")
    })
    public ResponseEntity<Map<String, String>> uploadAudio(
            @Parameter(description = "Track ID")
            @PathVariable Long id,

            @Parameter(description = "Audio file (MP3, OGG, or WAV)")
            @RequestParam("file") MultipartFile file
    ) {
        log.info("Uploading audio for track {}: {} ({})", id, file.getOriginalFilename(), file.getSize());

        String audioKey = audioService.uploadAudioFile(id, file);
        String streamUrl = audioService.getStreamUrl(id);

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(Map.of(
                        "audioKey", audioKey,
                        "streamUrl", streamUrl,
                        "message", "Audio uploaded successfully"
                ));
    }

    @GetMapping("/{id}/stream")
    @Operation(summary = "Get streaming URL for track audio")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Streaming URL generated"),
            @ApiResponse(responseCode = "404", description = "Track not found or no audio available")
    })
    public ResponseEntity<Map<String, String>> getStreamUrl(
            @Parameter(description = "Track ID")
            @PathVariable Long id
    ) {
        String streamUrl = audioService.getStreamUrl(id);

        if (streamUrl == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(Map.of(
                "streamUrl", streamUrl,
                "expiresIn", "3600" // 1 hour in seconds
        ));
    }

    @DeleteMapping("/{id}/audio")
    @Operation(summary = "Delete audio file for a track")
    @ApiResponses({
            @ApiResponse(responseCode = "204", description = "Audio deleted successfully"),
            @ApiResponse(responseCode = "404", description = "Track not found")
    })
    public ResponseEntity<Void> deleteAudio(
            @Parameter(description = "Track ID")
            @PathVariable Long id
    ) {
        log.info("Deleting audio for track {}", id);
        audioService.deleteAudioFile(id);
        return ResponseEntity.noContent().build();
    }
}