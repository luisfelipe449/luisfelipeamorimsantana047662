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

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "album_id", nullable = false)
    private Album album;

}
