package com.example.smartcity.model.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class EnvironmentalMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double airQualityIndex;
    private Double pm25;
    private Double pm10;
    private Double temperature;
    private Double humidity;
    private Double windSpeed;
    private LocalDateTime recordedAt;

    @ManyToOne
    private Location location;
}