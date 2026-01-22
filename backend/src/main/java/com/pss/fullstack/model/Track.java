package com.pss.fullstack.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "tracks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Track extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(name = "track_number", nullable = false)
    private Integer trackNumber;

    @Column(nullable = false)
    @Builder.Default
    private Integer duration = 0;

    @Column(name = "audio_key")
    private String audioKey; // MinIO storage key for audio file

    @Column(name = "audio_format", length = 10)
    private String audioFormat; // MP3, OGG, WAV

    @Column(name = "bitrate")
    private Integer bitrate; // Bitrate in kbps

    @Column(name = "file_size")
    private Long fileSize; // File size in bytes

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id", nullable = false)
    private Album album;

}
