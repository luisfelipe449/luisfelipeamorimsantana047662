package com.pss.fullstack.repository;

import com.pss.fullstack.model.Regional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RegionalRepository extends JpaRepository<Regional, Integer> {

    List<Regional> findByAtivoTrue();

    List<Regional> findByAtivoFalse();

    @Modifying
    @Query("UPDATE Regional r SET r.ativo = false WHERE r.id = :id")
    void inactivateById(@Param("id") Integer id);

    @Modifying
    @Query("UPDATE Regional r SET r.ativo = false WHERE r.id NOT IN :ids")
    void inactivateNotInIds(@Param("ids") List<Integer> ids);

}
