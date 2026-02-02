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

    Page<Artist> findByNameContainingIgnoreCaseAndActiveTrue(String name, Pageable pageable);

    Page<Artist> findByTypeAndActiveTrue(ArtistType type, Pageable pageable);

    Page<Artist> findByNameContainingIgnoreCaseAndTypeAndActiveTrue(String name, ArtistType type, Pageable pageable);

    // Removed complex JPQL query due to PostgreSQL bytea/LOWER function incompatibility
    // Using specific finder methods instead in the service layer

    Page<Artist> findByActiveTrue(Pageable pageable);

    List<Artist> findByNameContainingIgnoreCaseOrderByNameAsc(String name);

    List<Artist> findByNameContainingIgnoreCaseOrderByNameDesc(String name);

    boolean existsByNameIgnoreCase(String name);

}
