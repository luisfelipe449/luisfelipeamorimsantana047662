package com.pss.fullstack.model;

import jakarta.persistence.*;
import lombok.*;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Entity
@Table(name = "albums")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Album extends BaseEntity {

    @Column(nullable = false)
    private String title;

    @Column(name = "release_year")
    private Integer releaseYear;

    @Column(length = 1000)
    private String description;

    @Column(length = 100)
    private String genre;

    @Column(name = "track_count")
    @Builder.Default
    private Integer trackCount = 0;

    @Column(name = "total_duration")
    @Builder.Default
    private Integer totalDuration = 0;

    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(
            name = "artist_albums",
            joinColumns = @JoinColumn(name = "album_id"),
            inverseJoinColumns = @JoinColumn(name = "artist_id")
    )
    @Builder.Default
    private Set<Artist> artists = new HashSet<>();

    @ElementCollection
    @CollectionTable(
            name = "album_covers",
            joinColumns = @JoinColumn(name = "album_id")
    )
    @Column(name = "cover_key")
    @Builder.Default
    private List<String> coverKeys = new ArrayList<>();

    @OneToMany(mappedBy = "album", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("trackNumber ASC")
    @Builder.Default
    private List<Track> tracks = new ArrayList<>();

    public void addArtist(Artist artist) {
        this.artists.add(artist);
        artist.getAlbums().add(this);
    }

    public void removeArtist(Artist artist) {
        this.artists.remove(artist);
        artist.getAlbums().remove(this);
    }

    public void addCoverKey(String key) {
        this.coverKeys.add(key);
    }

    public void addTrack(Track track) {
        this.tracks.add(track);
        track.setAlbum(this);
    }

    public void removeTrack(Track track) {
        this.tracks.remove(track);
        track.setAlbum(null);
    }

    public void clearTracks() {
        this.tracks.forEach(track -> track.setAlbum(null));
        this.tracks.clear();
    }

    public void updateTrackMetadata() {
        this.trackCount = this.tracks.size();
        this.totalDuration = this.tracks.stream()
                .mapToInt(Track::getDuration)
                .sum();
    }

}
