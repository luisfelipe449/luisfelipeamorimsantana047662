package com.pss.fullstack.service;

import com.pss.fullstack.dto.ArtistCreateDTO;
import com.pss.fullstack.dto.ArtistDTO;
import com.pss.fullstack.dto.ArtistUpdateDTO;
import com.pss.fullstack.dto.PageResponse;
import com.pss.fullstack.exception.ResourceNotFoundException;
import com.pss.fullstack.model.Artist;
import com.pss.fullstack.model.ArtistType;
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

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ArtistServiceTest {

    @Mock
    private ArtistRepository artistRepository;

    @InjectMocks
    private ArtistService artistService;

    private Artist testArtist;

    @BeforeEach
    void setUp() {
        testArtist = Artist.builder()
                .name("Test Artist")
                .type(ArtistType.SOLO)
                .biography("Test biography")
                .build();
        testArtist.setId(1L);
    }

    @Test
    void shouldFindAllArtists() {
        Page<Artist> artistPage = new PageImpl<>(List.of(testArtist));
        when(artistRepository.findAll(any(Pageable.class))).thenReturn(artistPage);

        PageResponse<ArtistDTO> result = artistService.findAll(0, 10, "name", "asc");

        assertNotNull(result);
        assertEquals(1, result.getContent().size());
        assertEquals("Test Artist", result.getContent().get(0).getName());
    }

    @Test
    void shouldFindArtistById() {
        when(artistRepository.findById(1L)).thenReturn(Optional.of(testArtist));

        ArtistDTO result = artistService.findById(1L);

        assertNotNull(result);
        assertEquals("Test Artist", result.getName());
        assertEquals(ArtistType.SOLO, result.getType());
    }

    @Test
    void shouldThrowExceptionWhenArtistNotFound() {
        when(artistRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> artistService.findById(99L));
    }

    @Test
    void shouldCreateArtist() {
        ArtistCreateDTO createDTO = ArtistCreateDTO.builder()
                .name("New Artist")
                .type(ArtistType.BAND)
                .biography("New artist bio")
                .build();

        Artist savedArtist = Artist.builder()
                .name("New Artist")
                .type(ArtistType.BAND)
                .biography("New artist bio")
                .build();
        savedArtist.setId(2L);

        when(artistRepository.save(any(Artist.class))).thenReturn(savedArtist);

        ArtistDTO result = artistService.create(createDTO);

        assertNotNull(result);
        assertEquals("New Artist", result.getName());
        assertEquals(ArtistType.BAND, result.getType());
        verify(artistRepository, times(1)).save(any(Artist.class));
    }

    @Test
    void shouldUpdateArtist() {
        ArtistUpdateDTO updateDTO = ArtistUpdateDTO.builder()
                .name("Updated Name")
                .build();

        when(artistRepository.findById(1L)).thenReturn(Optional.of(testArtist));
        when(artistRepository.save(any(Artist.class))).thenAnswer(inv -> inv.getArgument(0));

        ArtistDTO result = artistService.update(1L, updateDTO);

        assertNotNull(result);
        assertEquals("Updated Name", result.getName());
        verify(artistRepository, times(1)).save(any(Artist.class));
    }

    @Test
    void shouldSearchByNameAscending() {
        when(artistRepository.findByNameContainingIgnoreCaseOrderByNameAsc("test"))
                .thenReturn(List.of(testArtist));

        List<ArtistDTO> result = artistService.searchByName("test", "asc");

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Test Artist", result.get(0).getName());
    }

    @Test
    void shouldSearchByNameDescending() {
        when(artistRepository.findByNameContainingIgnoreCaseOrderByNameDesc("test"))
                .thenReturn(List.of(testArtist));

        List<ArtistDTO> result = artistService.searchByName("test", "desc");

        assertNotNull(result);
        assertEquals(1, result.size());
    }

}
