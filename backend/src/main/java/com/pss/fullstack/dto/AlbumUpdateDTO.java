package com.pss.fullstack.dto;

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
public class AlbumUpdateDTO {

    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;

    private Integer releaseYear;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    @Size(max = 100, message = "Genre must be at most 100 characters")
    private String genre;

    private Integer trackCount;

    private Integer totalDuration;

    private List<Long> artistIds;

    private List<TrackInputDTO> tracks;

}
