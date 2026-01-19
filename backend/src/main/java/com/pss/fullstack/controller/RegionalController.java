package com.pss.fullstack.controller;

import com.pss.fullstack.dto.RegionalDTO;
import com.pss.fullstack.service.RegionalService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/v1/regionais")
@RequiredArgsConstructor
@Tag(name = "Regionais", description = "Regional sync and management endpoints")
public class RegionalController {

    private final RegionalService regionalService;

    @PostMapping("/sync")
    @Operation(summary = "Synchronize regionais with external API")
    public ResponseEntity<Map<String, Object>> sync() {
        Map<String, Object> result = regionalService.syncRegionais();
        return ResponseEntity.ok(result);
    }

    @GetMapping
    @Operation(summary = "List all regionais")
    public ResponseEntity<List<RegionalDTO>> findAll() {
        return ResponseEntity.ok(regionalService.findAll());
    }

    @GetMapping("/active")
    @Operation(summary = "List only active regionais")
    public ResponseEntity<List<RegionalDTO>> findActive() {
        return ResponseEntity.ok(regionalService.findActive());
    }

}
