package com.pss.fullstack.dto;

import com.pss.fullstack.model.Artist;
import com.pss.fullstack.model.ArtistType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtistDTO {

    private Long id;
    private String name;
    private ArtistType type;
    private String country;
    private String biography;
    private String photoKey;
    private String photoUrl;
    private Boolean active;
    private int albumCount;
    private List<AlbumSummaryDTO> albums;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public static ArtistDTO fromEntity(Artist artist) {
        return ArtistDTO.builder()
                .id(artist.getId())
                .name(artist.getName())
                .type(artist.getType())
                .country(artist.getCountry())
                .biography(artist.getBiography())
                .photoKey(artist.getPhotoKey())
                .active(artist.getActive())
                .albumCount(artist.getAlbums() != null ? artist.getAlbums().size() : 0)
                .albums(new ArrayList<>())
                .createdAt(artist.getCreatedAt())
                .updatedAt(artist.getUpdatedAt())
                .build();
    }

}
