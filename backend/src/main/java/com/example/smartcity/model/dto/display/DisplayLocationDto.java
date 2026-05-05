package com.example.smartcity.model.dto.display;

import lombok.Data;

@Data
public class DisplayLocationDto {
    private Long id;
    private String name;
    private Double latitude;
    private Double longitude;
}