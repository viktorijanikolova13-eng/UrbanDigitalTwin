package com.example.smartcity.model.dto.create;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class CreateTrafficMetricDto {

    private Integer vehicleCount;
    private Double averageSpeed;
    private String congestionLevel;
    private Boolean roadClosed;
    private LocalDateTime recordedAt;
    private Long locationId;
}