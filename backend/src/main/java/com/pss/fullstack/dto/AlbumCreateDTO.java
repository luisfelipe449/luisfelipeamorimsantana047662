package com.pss.fullstack.dto;

import com.pss.fullstack.model.Album;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumCreateDTO {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;

    private Integer releaseYear;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    @Size(max = 100, message = "Genre must be at most 100 characters")
    private String genre;

    private Integer trackCount;

    private Integer totalDuration;

    @NotEmpty(message = "At least one artist is required")
    private List<Long> artistIds;

    private List<TrackInputDTO> tracks;

    public Album toEntity() {
        return Album.builder()
                .title(this.title)
                .releaseYear(this.releaseYear)
                .description(this.description)
                .genre(this.genre)
                .trackCount(this.trackCount != null ? this.trackCount : 0)
                .totalDuration(this.totalDuration != null ? this.totalDuration : 0)
                .build();
    }

}
