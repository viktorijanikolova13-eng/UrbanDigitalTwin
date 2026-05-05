package com.example.smartcity.model.dto.display;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DisplayScenarioDto {

    private Long id;
    private String name;
    private String description;

    private Double temperatureDelta;
    private Double pollutionMultiplier;
    private Double trafficMultiplier;
    private Boolean roadClosure;

    private LocalDateTime createdAt;

    private Long locationId;
    private String locationName;
}