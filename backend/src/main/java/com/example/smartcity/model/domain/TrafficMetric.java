package com.example.smartcity.model.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class TrafficMetric {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Integer vehicleCount;
    private Double averageSpeed;
    private String congestionLevel;
    private Boolean roadClosed;
    private LocalDateTime recordedAt;

    @ManyToOne
    private Location location;
}