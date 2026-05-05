    package com.example.smartcity.model.dto.create;

    import lombok.Data;

    import java.time.LocalDateTime;

    @Data
    public class CreateEnvironmentalMetricDto {

        private Double airQualityIndex;
        private Double pm25;
        private Double pm10;
        private Double temperature;
        private Double humidity;
        private Double windSpeed;
        private LocalDateTime recordedAt;
        private Long locationId;
    }