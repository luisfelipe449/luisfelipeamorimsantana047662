package com.pss.fullstack.dto;

import com.pss.fullstack.model.Album;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumSummaryDTO {

    private Long id;
    private String title;
    private Integer releaseYear;
    private String coverUrl;

    public static AlbumSummaryDTO fromEntity(Album album) {
        return AlbumSummaryDTO.builder()
                .id(album.getId())
                .title(album.getTitle())
                .releaseYear(album.getReleaseYear())
                .build();
    }

}
