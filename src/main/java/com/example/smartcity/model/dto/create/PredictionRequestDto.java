package com.example.smartcity.model.dto.create;

import lombok.Data;

import java.util.List;

@Data
public class PredictionRequestDto {

    private String date;
    private String time;
    private String zone;
    private String type;

    private Double temperature;
    private Double humidity;
    private Double windSpeed;
    private Double precipitation;
    private Double pressure;
    private Double traffic;

    private List<Double> tempHistory;
}