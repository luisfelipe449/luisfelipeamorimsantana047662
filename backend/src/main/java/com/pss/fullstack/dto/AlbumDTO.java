package com.pss.fullstack.dto;

import com.pss.fullstack.model.Album;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

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
    private List<ArtistSimpleDTO> artists;
    private List<String> coverUrls;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static AlbumDTO fromEntity(Album album) {
        return AlbumDTO.builder()
                .id(album.getId())
                .title(album.getTitle())
                .releaseYear(album.getReleaseYear())
                .description(album.getDescription())
                .artists(album.getArtists().stream()
                        .map(ArtistSimpleDTO::fromEntity)
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
