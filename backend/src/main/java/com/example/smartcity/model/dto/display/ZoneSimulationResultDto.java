package com.example.smartcity.model.dto.display;

public record ZoneSimulationResultDto(
        String zoneName,
        Double latitude,
        Double longitude,
        Double predictedTemperature,
        Double predictedPollution,
        Double predictedTraffic,
        String heatRiskLevel,
        String airRiskLevel,
        String trafficRiskLevel,
        String overallRiskLevel
) {}
