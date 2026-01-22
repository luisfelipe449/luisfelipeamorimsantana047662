package com.pss.fullstack.service;

import com.pss.fullstack.dto.TrackDTO;
import com.pss.fullstack.exception.ResourceNotFoundException;
import com.pss.fullstack.model.Track;
import com.pss.fullstack.repository.TrackRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
@Transactional
public class TrackService {

    private final TrackRepository trackRepository;
    private final AudioService audioService;

    /**
     * Find track by ID and return DTO with stream URL
     */
    public TrackDTO findById(Long id) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found with id: " + id));

        TrackDTO dto = TrackDTO.fromEntity(track);

        // Add stream URL if audio exists
        if (track.getAudioKey() != null) {
            try {
                dto.setStreamUrl(audioService.getStreamUrl(id));
            } catch (Exception e) {
                log.warn("Could not generate stream URL for track {}: {}", id, e.getMessage());
            }
        }

        return dto;
    }

    /**
     * Update track
     */
    public TrackDTO update(Long id, TrackDTO dto) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found with id: " + id));

        // Update basic fields
        if (dto.getTitle() != null) {
            track.setTitle(dto.getTitle());
        }
        if (dto.getTrackNumber() != null) {
            track.setTrackNumber(dto.getTrackNumber());
        }
        if (dto.getDuration() != null) {
            track.setDuration(dto.getDuration());
        }

        Track savedTrack = trackRepository.save(track);
        TrackDTO resultDto = TrackDTO.fromEntity(savedTrack);

        // Add stream URL if audio exists
        if (savedTrack.getAudioKey() != null) {
            try {
                resultDto.setStreamUrl(audioService.getStreamUrl(id));
            } catch (Exception e) {
                log.warn("Could not generate stream URL for track {}: {}", id, e.getMessage());
            }
        }

        return resultDto;
    }

    /**
     * Delete track
     */
    public void delete(Long id) {
        Track track = trackRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Track not found with id: " + id));

        // Delete audio file if exists
        if (track.getAudioKey() != null) {
            try {
                audioService.deleteAudioFile(id);
            } catch (Exception e) {
                log.error("Failed to delete audio file for track {}: {}", id, e.getMessage());
            }
        }

        trackRepository.delete(track);
        log.info("Track {} deleted successfully", id);
    }
}