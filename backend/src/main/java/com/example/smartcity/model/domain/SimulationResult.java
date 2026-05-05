package com.example.smartcity.model.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class SimulationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Double predictedTemperature;
    private Double predictedPollution;
    private Double predictedTraffic;

    private String heatRiskLevel;
    private String airRiskLevel;
    private String trafficRiskLevel;
    private String overallRiskLevel;

    private LocalDateTime generatedAt;

    @ManyToOne
    private Scenario scenario;

    @ManyToOne
    private Location location;
}