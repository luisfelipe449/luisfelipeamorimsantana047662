package com.pss.fullstack.service;

import com.pss.fullstack.dto.AlbumCreateDTO;
import com.pss.fullstack.dto.AlbumDTO;
import com.pss.fullstack.dto.PageResponse;
import com.pss.fullstack.exception.ResourceNotFoundException;
import com.pss.fullstack.model.Album;
import com.pss.fullstack.model.Artist;
import com.pss.fullstack.model.ArtistType;
import com.pss.fullstack.repository.AlbumRepository;
import com.pss.fullstack.repository.ArtistRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AlbumServiceTest {

    @Mock
    private AlbumRepository albumRepository;

    @Mock
    private ArtistRepository artistRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private AlbumService albumService;

    private Album testAlbum;
    private Artist testArtist;

    @BeforeEach
    void setUp() {
        testArtist = Artist.builder()
                .name("Test Artist")
                .type(ArtistType.SOLO)
                .build();
        testArtist.setId(1L);

        testAlbum = Album.builder()
                .title("Test Album")
                .releaseYear(2024)
                .description("Test description")
                .artists(new HashSet<>(Set.of(testArtist)))
                .build();
        testAlbum.setId(1L);
    }

    @Test
    void shouldFindAllAlbums() {
        Page<Album> albumPage = new PageImpl<>(List.of(testAlbum));
        when(albumRepository.findAll(any(Pageable.class))).thenReturn(albumPage);

        PageResponse<AlbumDTO> result = albumService.findAll(0, 10, "title", "asc");

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("Test Album", result.getContent().get(0).getTitle());
    }

    @Test
    void shouldFindAlbumById() {
        when(albumRepository.findById(1L)).thenReturn(Optional.of(testAlbum));

        AlbumDTO result = albumService.findById(1L);

        assertNotNull(result);
        assertEquals("Test Album", result.getTitle());
        assertEquals(2024, result.getReleaseYear());
    }

    @Test
    void shouldThrowExceptionWhenAlbumNotFound() {
        when(albumRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> albumService.findById(99L));
    }

    @Test
    void shouldCreateAlbum() {
        AlbumCreateDTO createDTO = AlbumCreateDTO.builder()
                .title("New Album")
                .releaseYear(2024)
                .artistIds(List.of(1L))
                .build();

        Album savedAlbum = Album.builder()
                .title("New Album")
                .releaseYear(2024)
                .artists(new HashSet<>(Set.of(testArtist)))
                .build();
        savedAlbum.setId(2L);

        when(artistRepository.findById(1L)).thenReturn(Optional.of(testArtist));
        when(albumRepository.save(any(Album.class))).thenReturn(savedAlbum);

        AlbumDTO result = albumService.create(createDTO);

        assertNotNull(result);
        assertEquals("New Album", result.getTitle());
        verify(albumRepository, times(1)).save(any(Album.class));
        verify(notificationService, times(1)).notifyNewAlbum(any(), any(), any());
    }

    @Test
    void shouldAddCoverKey() {
        when(albumRepository.findById(1L)).thenReturn(Optional.of(testAlbum));
        when(albumRepository.save(any(Album.class))).thenReturn(testAlbum);

        albumService.addCoverKey(1L, "test-cover-key.jpg");

        verify(albumRepository, times(1)).save(any(Album.class));
        assertTrue(testAlbum.getCoverKeys().contains("test-cover-key.jpg"));
    }

    @Test
    void shouldGetCoverKeys() {
        testAlbum.getCoverKeys().add("cover1.jpg");
        testAlbum.getCoverKeys().add("cover2.jpg");

        when(albumRepository.findById(1L)).thenReturn(Optional.of(testAlbum));

        List<String> result = albumService.getCoverKeys(1L);

        assertEquals(2, result.size());
        assertTrue(result.contains("cover1.jpg"));
        assertTrue(result.contains("cover2.jpg"));
    }

}
