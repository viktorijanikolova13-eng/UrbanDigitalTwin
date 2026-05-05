package com.example.smartcity.model.domain;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;

@Entity
@Data
public class Scenario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;
    private String description;

    private Double temperatureDelta;
    private Double pollutionMultiplier;
    private Double trafficMultiplier;
    private Boolean roadClosure;

    private LocalDateTime createdAt;

    @ManyToOne
    private Location location;
}