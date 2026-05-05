package com.example.smartcity.model.dto.create;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateScenarioDto {

    private String name;
    private String description;

    private Double temperatureDelta;
    private Double pollutionMultiplier;
    private Double trafficMultiplier;
    private Boolean roadClosure;

    private LocalDateTime createdAt;

    private Long locationId;
}