package com.pss.fullstack.dto;

import com.pss.fullstack.model.Album;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import com.pss.fullstack.model.Track;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumDTO {

    private Long id;
    private String title;
    private Integer releaseYear;
    private String description;
    private String genre;
    private Integer trackCount;
    private Integer totalDuration;
    private List<ArtistSimpleDTO> artists;
    private List<TrackDTO> tracks;
    private List<String> coverUrls;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AlbumDTO fromEntity(Album album) {
        return AlbumDTO.builder()
                .id(album.getId())
                .title(album.getTitle())
                .releaseYear(album.getReleaseYear())
                .description(album.getDescription())
                .genre(album.getGenre())
                .trackCount(album.getTracks() != null ? album.getTracks().size() : 0)
                .totalDuration(album.getTracks() != null ?
                        album.getTracks().stream().mapToInt(Track::getDuration).sum() : 0)
                .artists(album.getArtists().stream()
                        .map(ArtistSimpleDTO::fromEntity)
                        .collect(Collectors.toList()))
                .tracks(album.getTracks().stream()
                        .map(TrackDTO::fromEntity)
                        .collect(Collectors.toList()))
                .coverUrls(album.getCoverKeys())
                .createdAt(album.getCreatedAt())
                .updatedAt(album.getUpdatedAt())
                .build();
    }

    public static AlbumDTO fromEntityWithPresignedUrls(Album album, List<String> presignedUrls) {
        AlbumDTO dto = fromEntity(album);
        dto.setCoverUrls(presignedUrls);
        return dto;
    }

}
