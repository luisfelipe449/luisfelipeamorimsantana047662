package com.pss.fullstack.dto;

import com.pss.fullstack.model.Album;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumCreateDTO {

    @NotBlank(message = "Title is required")
    @Size(max = 200, message = "Title must be at most 200 characters")
    private String title;

    private Integer releaseYear;

    @Size(max = 1000, message = "Description must be at most 1000 characters")
    private String description;

    @NotEmpty(message = "At least one artist is required")
    private List<Long> artistIds;

    public Album toEntity() {
        return Album.builder()
                .title(this.title)
                .releaseYear(this.releaseYear)
                .description(this.description)
                .build();
    }

}
