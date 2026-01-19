package com.pss.fullstack.repository;

import com.pss.fullstack.model.Album;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AlbumRepository extends JpaRepository<Album, Long> {

    Page<Album> findByTitleContainingIgnoreCase(String title, Pageable pageable);

    @Query("SELECT a FROM Album a JOIN a.artists ar WHERE ar.id = :artistId")
    Page<Album> findByArtistId(@Param("artistId") Long artistId, Pageable pageable);

    @Query("SELECT a FROM Album a JOIN a.artists ar WHERE ar.id = :artistId")
    List<Album> findAllByArtistId(@Param("artistId") Long artistId);

    @Query("SELECT a FROM Album a WHERE " +
            "(:title IS NULL OR LOWER(a.title) LIKE LOWER(CONCAT('%', :title, '%'))) AND " +
            "(:year IS NULL OR a.releaseYear = :year)")
    Page<Album> findByFilters(
            @Param("title") String title,
            @Param("year") Integer year,
            Pageable pageable
    );

    @Query("SELECT COUNT(a) FROM Album a JOIN a.artists ar WHERE ar.id = :artistId")
    long countByArtistId(@Param("artistId") Long artistId);

}
