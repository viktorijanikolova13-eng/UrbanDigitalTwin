package com.example.smartcity.model.dto.display;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DisplaySimulationResultDto {

    private Long id;

    private Double predictedTemperature;
    private Double predictedPollution;
    private Double predictedTraffic;

    private String heatRiskLevel;
    private String airRiskLevel;
    private String trafficRiskLevel;
    private String overallRiskLevel;

    private LocalDateTime generatedAt;

    private Long scenarioId;
    private Long locationId;
}