package com.example.smartcity.service.domain.impl;

import com.example.smartcity.service.domain.CityDataService;
import org.springframework.stereotype.Service;
import java.util.Map;

@Service
public class CityDataServiceImpl implements CityDataService {

    @Override
    public Map<String, Double> getTrafficData() {
        return Map.of(
                "vehicleCount", 100.0,
                "averageSpeed", 50.0,
                "congestionLevel", 0.4
        );
    }

    @Override
    public Map<String, Double> getTemperatureData() {
        return Map.of(
                "baseTemperature", 25.0,
                "humidity", 60.0
        );
    }

    @Override
    public Map<String, Double> getPollutionData() {
        return Map.of(
                "basePollution", 80.0,
                "pm25", 15.0,
                "pm10", 30.0
        );
    }
}