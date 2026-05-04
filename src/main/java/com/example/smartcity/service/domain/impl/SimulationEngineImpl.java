package com.example.smartcity.service.domain.impl;

import com.example.smartcity.model.dto.create.SimulateRequestDto;
import com.example.smartcity.model.dto.display.DisplaySimulationResultDto;
import com.example.smartcity.service.ai.AiModelClientService;
import com.example.smartcity.service.domain.CityDataService;
import com.example.smartcity.service.domain.SimulationEngine;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

@Service
public class SimulationEngineImpl implements SimulationEngine {

    private final CityDataService cityDataService;
    private final AiModelClientService aiModelClientService;

    public SimulationEngineImpl(CityDataService cityDataService,
                                AiModelClientService aiModelClientService) {
        this.cityDataService = cityDataService;
        this.aiModelClientService = aiModelClientService;
    }

    @Override
    public DisplaySimulationResultDto simulate(SimulateRequestDto request) {
        return switch (request.getType().toLowerCase()) {
            case "traffic"     -> simulateTraffic(request);
            case "temperature" -> simulateTemperature(request);
            case "pollution"   -> simulatePollution(request);
            default -> throw new IllegalArgumentException(
                    "Unknown simulation type: " + request.getType()
            );
        };
    }

    private DisplaySimulationResultDto simulateTraffic(SimulateRequestDto request) {

        Map<String, Double> data = cityDataService.getTrafficData();

        Map<String, Object> aiRequest = Map.of(
                "current_traffic", data.get("vehicleCount") / 100.0,
                "hour", 12,
                "weekday", 2,
                "is_rush_hour", false
        );

        Map<String, Object> response = aiModelClientService.predictTraffic(aiRequest);

        Double predicted = ((Number) response.get("predictedTraffic")).doubleValue();

        String risk = predicted > 0.7 ? "HIGH" : "LOW";

        DisplaySimulationResultDto dto = new DisplaySimulationResultDto();
        dto.setPredictedTraffic(predicted);
        dto.setTrafficRiskLevel(risk);
        dto.setOverallRiskLevel(risk);
        dto.setGeneratedAt(LocalDateTime.now());

        return dto;
    }

    private DisplaySimulationResultDto simulateTemperature(SimulateRequestDto request) {

        Map<String, Double> data = cityDataService.getTemperatureData();

        Map<String, Object> aiRequest = Map.of(
                "current_temperature", data.get("baseTemperature"),
                "humidity", 60.0,
                "month", 5,
                "hour", 12
        );

        Map<String, Object> response = aiModelClientService.predictTemperature(aiRequest);

        Double predicted = ((Number) response.get("predictedTemperature")).doubleValue();

        String risk = predicted > 35 ? "HIGH" : "LOW";

        DisplaySimulationResultDto dto = new DisplaySimulationResultDto();
        dto.setPredictedTemperature(predicted);
        dto.setHeatRiskLevel(risk);
        dto.setOverallRiskLevel(risk);
        dto.setGeneratedAt(LocalDateTime.now());

        return dto;
    }

    private DisplaySimulationResultDto simulatePollution(SimulateRequestDto request) {

        Map<String, Double> data = cityDataService.getPollutionData();

        Map<String, Object> aiRequest = Map.of(
                "temperature", 20.0,
                "humidity", 60.0,
                "wind_speed", 3.0,
                "traffic", 0.5,
                "hour", 12,
                "month", 5,
                "weekday", 2
        );

        Map<String, Object> response = aiModelClientService.predictPollution(aiRequest);

        Double predicted = ((Number) response.get("predictedPm25")).doubleValue();

        String risk = predicted > 120 ? "HIGH" : "LOW";

        DisplaySimulationResultDto dto = new DisplaySimulationResultDto();
        dto.setPredictedPollution(predicted);
        dto.setAirRiskLevel(risk);
        dto.setOverallRiskLevel(risk);
        dto.setGeneratedAt(LocalDateTime.now());

        return dto;
    }
}