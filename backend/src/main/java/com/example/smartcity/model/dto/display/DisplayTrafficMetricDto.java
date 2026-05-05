package com.example.smartcity.model.dto.display;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class DisplayTrafficMetricDto {

    private Long id;
    private Integer vehicleCount;
    private Double averageSpeed;
    private String congestionLevel;
    private Boolean roadClosed;
    private LocalDateTime recordedAt;

    private Long locationId;
    private String locationName;
}