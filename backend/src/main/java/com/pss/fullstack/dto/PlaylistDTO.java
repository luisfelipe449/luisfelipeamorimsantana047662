package com.pss.fullstack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PlaylistDTO {

    private Long albumId;
    private String albumTitle;
    private String artistName;
    private Integer releaseYear;
    private String coverUrl;
    private Integer totalDuration;
    private List<TrackDTO> tracks;

}