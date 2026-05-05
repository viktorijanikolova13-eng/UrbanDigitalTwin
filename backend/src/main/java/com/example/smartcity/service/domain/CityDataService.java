package com.example.smartcity.service.domain;

import java.util.Map;

public interface CityDataService {

    Map<String, Double> getTrafficData();

    Map<String, Double> getTemperatureData();

    Map<String, Double> getPollutionData();
}