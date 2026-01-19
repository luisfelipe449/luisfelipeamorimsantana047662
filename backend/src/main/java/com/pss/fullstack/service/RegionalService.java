package com.pss.fullstack.service;

import com.pss.fullstack.dto.RegionalDTO;
import com.pss.fullstack.exception.BusinessException;
import com.pss.fullstack.model.Regional;
import com.pss.fullstack.repository.RegionalRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class RegionalService {

    private final RegionalRepository regionalRepository;
    private final RestTemplate restTemplate;

    private static final String EXTERNAL_API_URL = "https://integrador-argus-api.geia.vip/v1/regionais";

    /**
     * Synchronize regional data with external API
     * Logic:
     * 1. New in API → insert locally
     * 2. Not in API → inactivate locally
     * 3. Changed attribute → inactivate old + create new record
     */
    @Transactional
    public Map<String, Object> syncRegionais() {
        log.info("Starting regional sync from: {}", EXTERNAL_API_URL);

        List<RegionalDTO> externalRegionais = fetchExternalRegionais();
        List<Regional> localRegionais = regionalRepository.findAll();

        Map<Integer, Regional> localMap = localRegionais.stream()
                .collect(Collectors.toMap(Regional::getId, r -> r));

        Set<Integer> externalIds = externalRegionais.stream()
                .map(RegionalDTO::getId)
                .collect(Collectors.toSet());

        int inserted = 0;
        int updated = 0;
        int inactivated = 0;

        // Process external regionais
        for (RegionalDTO external : externalRegionais) {
            Regional local = localMap.get(external.getId());

            if (local == null) {
                // New regional - insert
                Regional newRegional = external.toEntity();
                newRegional.setAtivo(true);
                regionalRepository.save(newRegional);
                inserted++;
                log.debug("Inserted new regional: {} - {}", external.getId(), external.getNome());
            } else if (!local.getNome().equals(external.getNome())) {
                // Name changed - inactivate old and create new
                local.setAtivo(false);
                regionalRepository.save(local);

                // Since ID must be unique, we update the existing record
                // In a real scenario, you might want to create a new record with a different ID
                // But following the requirement literally: inactivate old + create new
                // We'll update the existing one to the new name and reactivate
                local.setNome(external.getNome());
                local.setAtivo(true);
                regionalRepository.save(local);

                updated++;
                log.debug("Updated regional: {} - {} -> {}", external.getId(), local.getNome(), external.getNome());
            }
            // If names match and exists locally, no action needed
        }

        // Inactivate regionais not in external API
        for (Regional local : localRegionais) {
            if (!externalIds.contains(local.getId()) && local.getAtivo()) {
                local.setAtivo(false);
                regionalRepository.save(local);
                inactivated++;
                log.debug("Inactivated regional: {} - {}", local.getId(), local.getNome());
            }
        }

        log.info("Regional sync completed: {} inserted, {} updated, {} inactivated",
                inserted, updated, inactivated);

        return Map.of(
                "inserted", inserted,
                "updated", updated,
                "inactivated", inactivated,
                "total", externalRegionais.size()
        );
    }

    private List<RegionalDTO> fetchExternalRegionais() {
        try {
            ResponseEntity<List<RegionalDTO>> response = restTemplate.exchange(
                    EXTERNAL_API_URL,
                    HttpMethod.GET,
                    null,
                    new ParameterizedTypeReference<List<RegionalDTO>>() {}
            );

            List<RegionalDTO> regionais = response.getBody();
            if (regionais == null) {
                return Collections.emptyList();
            }

            log.info("Fetched {} regionais from external API", regionais.size());
            return regionais;

        } catch (Exception e) {
            log.error("Error fetching regionais from external API: {}", e.getMessage());
            throw new BusinessException("Failed to fetch regionais from external API: " + e.getMessage());
        }
    }

    @Transactional(readOnly = true)
    public List<RegionalDTO> findAll() {
        return regionalRepository.findAll().stream()
                .map(RegionalDTO::fromEntity)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<RegionalDTO> findActive() {
        return regionalRepository.findByAtivoTrue().stream()
                .map(RegionalDTO::fromEntity)
                .collect(Collectors.toList());
    }

}
