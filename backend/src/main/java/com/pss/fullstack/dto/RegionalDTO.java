package com.pss.fullstack.dto;

import com.pss.fullstack.model.Regional;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegionalDTO {

    private Integer id;
    private String nome;
    private Boolean ativo;

    public static RegionalDTO fromEntity(Regional regional) {
        return RegionalDTO.builder()
                .id(regional.getId())
                .nome(regional.getNome())
                .ativo(regional.getAtivo())
                .build();
    }

    public Regional toEntity() {
        return Regional.builder()
                .id(this.id)
                .nome(this.nome)
                .ativo(this.ativo != null ? this.ativo : true)
                .build();
    }

}
