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

    // ================= TRAFFIC (MOCK) =================
    private DisplaySimulationResultDto simulateTraffic(SimulateRequestDto request) {

        DisplaySimulationResultDto dto = new DisplaySimulationResultDto();

        double traffic = request.getTraffic() != null ? request.getTraffic() : 0.5;

        String risk;

        if (traffic >= 0.8) {
            risk = "HIGH";
        } else if (traffic >= 0.5) {
            risk = "MEDIUM";
        } else {
            risk = "LOW";
        }

        dto.setPredictedTraffic(traffic);
        dto.setTrafficRiskLevel(risk);
        dto.setOverallRiskLevel(risk);
        dto.setGeneratedAt(LocalDateTime.now());

        return dto;
    }

    // ================= TEMPERATURE (AI MODEL) =================
    private DisplaySimulationResultDto simulateTemperature(SimulateRequestDto request) {

        Map<String, Object> aiRequest = new java.util.HashMap<>();

        aiRequest.put("date", request.getDate());
        aiRequest.put("time", request.getTime());
        aiRequest.put("zone", request.getZone());
        aiRequest.put("temp_history", request.getTempHistory());

        aiRequest.put("humidity", request.getHumidity() != null ? request.getHumidity() : 65.0);
        aiRequest.put("wind_speed", request.getWindSpeed() != null ? request.getWindSpeed() : 2.0);
        aiRequest.put("precipitation", request.getPrecipitation() != null ? request.getPrecipitation() : 0.0);
        aiRequest.put("pressure", request.getPressure() != null ? request.getPressure() : 1013.0);

        Map<String, Object> response = aiModelClientService.predictTemperature(aiRequest);

        Double predicted = ((Number) response.get("predicted_temperature_c")).doubleValue();
        String risk = response.get("heat_risk_level").toString();

        DisplaySimulationResultDto dto = new DisplaySimulationResultDto();
        dto.setPredictedTemperature(predicted);
        dto.setHeatRiskLevel(risk);
        dto.setOverallRiskLevel(risk);
        dto.setGeneratedAt(LocalDateTime.now());

        return dto;
    }

    // ================= POLLUTION =================
    private DisplaySimulationResultDto simulatePollution(SimulateRequestDto request) {

        Map<String, Object> aiRequest = Map.of(
                "temperature", 20.0,
                "humidity", 60.0,
                "wind_speed", 3.0,
                "traffic", request.getTraffic() != null ? request.getTraffic() : 0.5,
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