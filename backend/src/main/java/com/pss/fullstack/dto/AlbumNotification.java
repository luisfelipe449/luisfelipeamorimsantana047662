package com.pss.fullstack.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumNotification {

    private Long albumId;
    private String title;
    private String artistName;
    private String message;
    private LocalDateTime timestamp;

    public static AlbumNotification newAlbum(Long albumId, String title, String artistName) {
        return AlbumNotification.builder()
                .albumId(albumId)
                .title(title)
                .artistName(artistName)
                .message(String.format("New album '%s' by %s has been added!", title, artistName))
                .timestamp(LocalDateTime.now())
                .build();
    }

}
