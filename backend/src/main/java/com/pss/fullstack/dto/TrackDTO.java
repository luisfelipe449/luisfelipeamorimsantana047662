package com.pss.fullstack.dto;

import com.pss.fullstack.model.Track;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackDTO {

    private Long id;
    private String title;
    private Integer trackNumber;
    private Integer duration;
    private String audioFormat;
    private Integer bitrate;
    private Long fileSize;
    private String streamUrl; // Presigned URL for streaming

    public static TrackDTO fromEntity(Track track) {
        return TrackDTO.builder()
                .id(track.getId())
                .title(track.getTitle())
                .trackNumber(track.getTrackNumber())
                .duration(track.getDuration())
                .audioFormat(track.getAudioFormat())
                .bitrate(track.getBitrate())
                .fileSize(track.getFileSize())
                // streamUrl will be set by service when needed
                .build();
    }

}
