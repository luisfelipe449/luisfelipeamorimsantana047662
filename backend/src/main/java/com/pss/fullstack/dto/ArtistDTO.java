package com.pss.fullstack.dto;

import com.pss.fullstack.model.Artist;
import com.pss.fullstack.model.ArtistType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtistDTO {

    private Long id;
    private String name;
    private ArtistType type;
    private String biography;
    private int albumCount;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ArtistDTO fromEntity(Artist artist) {
        return ArtistDTO.builder()
                .id(artist.getId())
                .name(artist.getName())
                .type(artist.getType())
                .biography(artist.getBiography())
                .albumCount(artist.getAlbums() != null ? artist.getAlbums().size() : 0)
                .createdAt(artist.getCreatedAt())
                .updatedAt(artist.getUpdatedAt())
                .build();
    }

}
