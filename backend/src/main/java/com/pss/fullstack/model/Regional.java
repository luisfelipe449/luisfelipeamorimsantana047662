package com.pss.fullstack.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "regionais")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Regional {

    @Id
    private Integer id;

    @Column(nullable = false, length = 200)
    private String nome;

    @Column(nullable = false)
    @Builder.Default
    private Boolean ativo = true;

}
