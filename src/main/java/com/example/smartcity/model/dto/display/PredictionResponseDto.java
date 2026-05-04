package com.example.smartcity.model.dto.display;

import java.time.LocalDateTime;

public record PredictionResponseDto(
        String zoneName,
        String type,
        Double predictedValue,
        String riskLevel,
        Double aqi,
        Double pm25,
        LocalDateTime lastUpdated
) {}