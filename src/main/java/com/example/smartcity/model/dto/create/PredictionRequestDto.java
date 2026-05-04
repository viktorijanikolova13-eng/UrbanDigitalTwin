package com.example.smartcity.model.dto.create;

import lombok.Data;

@Data
public class PredictionRequestDto {

    private String date;
    private String time;
    private String zone;
    private String type;
    private Double temperature;

}