package com.pss.fullstack.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrackInputDTO {

    private Long id;  // null para novas faixas, preenchido para existentes

    @NotBlank(message = "Track title is required")
    private String title;

    @NotNull(message = "Track number is required")
    @Min(value = 1, message = "Track number must be at least 1")
    private Integer trackNumber;

    @NotNull(message = "Duration is required")
    @Min(value = 0, message = "Duration must be positive")
    private Integer duration;

}
