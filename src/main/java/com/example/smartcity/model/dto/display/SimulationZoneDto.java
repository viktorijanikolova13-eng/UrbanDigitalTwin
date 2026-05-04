package com.example.smartcity.model.dto.display;

public record SimulationZoneDto(
        String zoneName,
        Double temperature,
        Double traffic,
        Double pollution,
        String riskLevel
) {}