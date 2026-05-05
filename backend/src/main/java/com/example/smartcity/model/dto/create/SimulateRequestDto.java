package com.example.smartcity.model.dto.create;

import lombok.Data;

import java.util.List;

@Data
public class SimulateRequestDto {

    private String type;

    private Double temperatureOffset;
    private Double temperatureDelta;

    private Double pollutionMultiplier;
    private Double trafficMultiplier;

    private Boolean roadClosure;
    private String heatRiskLevel;

    private Long locationId;
    private String date;
    private String time;
    private String zone;

    private Double temperature;
    private Double pollution;
    private Double traffic;

    private List<Double> tempHistory;
    private Double humidity;
    private Double windSpeed;
    private Double precipitation;
    private Double pressure;
}