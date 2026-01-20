package com.pss.fullstack.repository;

import com.pss.fullstack.model.Artist;
import com.pss.fullstack.model.ArtistType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ArtistRepository extends JpaRepository<Artist, Long> {

    Page<Artist> findByNameContainingIgnoreCase(String name, Pageable pageable);

    Page<Artist> findByType(ArtistType type, Pageable pageable);

    Page<Artist> findByNameContainingIgnoreCaseAndType(String name, ArtistType type, Pageable pageable);

    @Query("SELECT a FROM Artist a WHERE " +
            "(:name IS NULL OR LOWER(a.name) LIKE LOWER(CONCAT('%', :name, '%'))) AND " +
            "(:type IS NULL OR a.type = :type) AND " +
            "a.active = true")
    Page<Artist> findByFilters(
            @Param("name") String name,
            @Param("type") ArtistType type,
            Pageable pageable
    );

    Page<Artist> findByActiveTrue(Pageable pageable);

    List<Artist> findByNameContainingIgnoreCaseOrderByNameAsc(String name);

    List<Artist> findByNameContainingIgnoreCaseOrderByNameDesc(String name);

    boolean existsByNameIgnoreCase(String name);

}
