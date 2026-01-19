package com.pss.fullstack.dto;

import com.pss.fullstack.model.Artist;
import com.pss.fullstack.model.ArtistType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtistSimpleDTO {

    private Long id;
    private String name;
    private ArtistType type;

    public static ArtistSimpleDTO fromEntity(Artist artist) {
        return ArtistSimpleDTO.builder()
                .id(artist.getId())
                .name(artist.getName())
                .type(artist.getType())
                .build();
    }

}
