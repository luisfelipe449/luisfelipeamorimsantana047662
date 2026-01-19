package com.pss.fullstack.dto;

import com.pss.fullstack.model.ArtistType;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArtistUpdateDTO {

    @Size(max = 200, message = "Name must be at most 200 characters")
    private String name;

    private ArtistType type;

    @Size(max = 1000, message = "Biography must be at most 1000 characters")
    private String biography;

}
