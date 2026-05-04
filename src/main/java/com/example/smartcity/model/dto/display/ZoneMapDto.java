package com.example.smartcity.model.dto.display;

import java.time.LocalDateTime;

public record ZoneMapDto(
        String zoneName,
        String type,
        Double value,
        String riskLevel,
        Double lat,
        Double lng,
        LocalDateTime lastUpdated
) {}