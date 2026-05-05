package com.example.smartcity.model.dto.display;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class DisplayEnvironmentalMetricDto {
    private Long id;
    private Double airQualityIndex;
    private Double pm25;
    private Double pm10;
    private Double temperature;
    private Double humidity;
    private Double windSpeed;
    private LocalDateTime recordedAt;
    private Long locationId;
    private String locationName;
}