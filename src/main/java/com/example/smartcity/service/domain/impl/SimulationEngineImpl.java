package com.example.smartcity.service.domain.impl;

import com.example.smartcity.model.dto.create.SimulateRequestDto;
import com.example.smartcity.model.dto.display.DisplaySimulationResultDto;
import com.example.smartcity.model.dto.display.ZoneSimulationResultDto;
import com.example.smartcity.service.ai.AiModelClientService;
import com.example.smartcity.service.domain.CityDataService;
import com.example.smartcity.service.domain.SimulationEngine;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SimulationEngineImpl implements SimulationEngine {

    private final CityDataService cityDataService;
    private final AiModelClientService aiModelClientService;

    // name, lat, lon, baseTemp, humidity, windSpeed, congestion, basePm25, baseVehicles
    private record ZoneBaseline(
            String name, double lat, double lon,
            double baseTemp, double humidity, double windSpeed,
            double congestion, double basePm25, double baseVehicles
    ) {}

    private static final List<ZoneBaseline> SKOPJE_ZONES = List.of(
            // LOW by default — residential/green zones
            new ZoneBaseline("Karpoš",        41.9940, 21.3900, 23.0, 62.0, 3.0, 0.35,  15.0,  80.0),
            new ZoneBaseline("Kisela Voda",   41.9760, 21.4600, 23.0, 65.0, 4.0, 0.25,  10.0,  70.0),
            new ZoneBaseline("Gazi Baba",     42.0100, 21.4800, 24.0, 63.0, 4.0, 0.30,  20.0,  90.0),
            // MODERATE by default — mixed urban
            new ZoneBaseline("Centar",        41.9965, 21.4314, 26.0, 58.0, 2.0, 0.70,  45.0, 150.0),
            new ZoneBaseline("Butel",         42.0280, 21.4350, 25.0, 60.0, 2.0, 0.62,  60.0, 120.0),
            // HIGH by default — industrial / dense / high traffic
            new ZoneBaseline("Aerodrom",      41.9697, 21.4308, 25.0, 60.0, 2.5, 0.55, 100.0, 100.0),
            new ZoneBaseline("Čair",          41.9980, 21.4450, 27.0, 55.0, 1.5, 0.78, 110.0, 130.0),
            new ZoneBaseline("Stara Čaršija", 41.9993, 21.4380, 28.0, 52.0, 1.0, 0.88, 130.0, 200.0)
    );

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
            case "all"         -> simulateAll(request);
            default -> throw new IllegalArgumentException(
                    "Unknown simulation type: " + request.getType()
            );
        };
    }

    @Override
    public List<ZoneSimulationResultDto> simulateZones(SimulateRequestDto request) {

        double tempDelta     = request.getTemperatureDelta()   != null ? request.getTemperatureDelta()   : 0.0;
        double trafficMult   = request.getTrafficMultiplier()  != null ? request.getTrafficMultiplier()  : 1.0;
        double pollutionMult = request.getPollutionMultiplier() != null ? request.getPollutionMultiplier() : 1.0;

        return SKOPJE_ZONES.stream().map(zone -> {

            double predictedTemp = zone.baseTemp() + tempDelta;
            String heatRisk      = heatRiskFor(predictedTemp);

            double humidity   = request.getHumidity()  != null ? request.getHumidity()  : zone.humidity();
            double windSpeed  = request.getWindSpeed() != null ? request.getWindSpeed() : zone.windSpeed();
            double congestion = zone.congestion() * trafficMult;
            double vehicles   = zone.baseVehicles() * trafficMult;
            String trafficRisk = trafficRiskFor(congestion);

            double formulaPm25    = 20 + congestion * 25 + humidity * 0.12 - windSpeed * 2.3;
            double predictedPm25  = (zone.basePm25() + formulaPm25) * pollutionMult;
            String airRisk        = airRiskFor(predictedPm25);

            String overallRisk = worstRisk(heatRisk, airRisk, trafficRisk);

            return new ZoneSimulationResultDto(
                    zone.name(), zone.lat(), zone.lon(),
                    round2(predictedTemp), round2(predictedPm25), round2(vehicles),
                    heatRisk, airRisk, trafficRisk, overallRisk
            );

        }).collect(Collectors.toList());
    }

    // ================= ALL (COMBINED) =================
    private DisplaySimulationResultDto simulateAll(SimulateRequestDto request) {

        Map<String, Double> tempData    = cityDataService.getTemperatureData();
        Map<String, Double> trafficData = cityDataService.getTrafficData();

        double baseTemp       = tempData.get("baseTemperature");
        double baseHumidity   = tempData.get("humidity");
        double baseCongestion = trafficData.get("congestionLevel");
        double baseVehicles   = trafficData.get("vehicleCount");

        double tempDelta     = request.getTemperatureDelta()   != null ? request.getTemperatureDelta()   : 0.0;
        double trafficMult   = request.getTrafficMultiplier()  != null ? request.getTrafficMultiplier()  : 1.0;
        double pollutionMult = request.getPollutionMultiplier() != null ? request.getPollutionMultiplier() : 1.0;
        double humidity      = request.getHumidity()  != null ? request.getHumidity()  : baseHumidity;
        double windSpeed     = request.getWindSpeed() != null ? request.getWindSpeed() : 3.0;

        double predictedTemp       = baseTemp + tempDelta;
        String heatRisk            = heatRiskFor(predictedTemp);
        double predictedCongestion = baseCongestion * trafficMult;
        double predictedVehicles   = baseVehicles * trafficMult;
        String trafficRisk         = trafficRiskFor(predictedCongestion);
        double predictedPollution  = (20 + predictedCongestion * 25 + humidity * 0.12 - windSpeed * 2.3) * pollutionMult;
        String airRisk             = airRiskFor(predictedPollution);
        String overallRisk         = worstRisk(heatRisk, airRisk, trafficRisk);

        DisplaySimulationResultDto dto = new DisplaySimulationResultDto();
        dto.setPredictedTemperature(round2(predictedTemp));
        dto.setPredictedPollution(round2(predictedPollution));
        dto.setPredictedTraffic(round2(predictedVehicles));
        dto.setHeatRiskLevel(heatRisk);
        dto.setAirRiskLevel(airRisk);
        dto.setTrafficRiskLevel(trafficRisk);
        dto.setOverallRiskLevel(overallRisk);
        dto.setGeneratedAt(LocalDateTime.now());

        return dto;
    }

    // ================= TRAFFIC =================
    private DisplaySimulationResultDto simulateTraffic(SimulateRequestDto request) {

        Map<String, Double> trafficData = cityDataService.getTrafficData();
        double trafficMult = request.getTrafficMultiplier() != null ? request.getTrafficMultiplier() : 1.0;
        double congestion  = trafficData.get("congestionLevel") * trafficMult;
        double vehicles    = trafficData.get("vehicleCount") * trafficMult;
        String risk        = trafficRiskFor(congestion);

        DisplaySimulationResultDto dto = new DisplaySimulationResultDto();
        dto.setPredictedTraffic(round2(vehicles));
        dto.setTrafficRiskLevel(risk);
        dto.setOverallRiskLevel(risk);
        dto.setGeneratedAt(LocalDateTime.now());

        return dto;
    }

    // ================= TEMPERATURE (AI MODEL) =================
    private DisplaySimulationResultDto simulateTemperature(SimulateRequestDto request) {

        Map<String, Object> aiRequest = new java.util.HashMap<>();
        aiRequest.put("date",          request.getDate());
        aiRequest.put("time",          request.getTime());
        aiRequest.put("zone",          request.getZone());
        aiRequest.put("temp_history",  request.getTempHistory());
        aiRequest.put("humidity",      request.getHumidity()      != null ? request.getHumidity()      : 65.0);
        aiRequest.put("wind_speed",    request.getWindSpeed()     != null ? request.getWindSpeed()     : 2.0);
        aiRequest.put("precipitation", request.getPrecipitation() != null ? request.getPrecipitation() : 0.0);
        aiRequest.put("pressure",      request.getPressure()      != null ? request.getPressure()      : 1013.0);

        Map<String, Object> response = aiModelClientService.predictTemperature(aiRequest);

        double predicted = ((Number) response.get("predicted_temperature_c")).doubleValue();
        double delta     = request.getTemperatureDelta() != null ? request.getTemperatureDelta() : 0.0;
        double adjusted  = predicted + delta;
        String risk      = heatRiskFor(adjusted);

        DisplaySimulationResultDto dto = new DisplaySimulationResultDto();
        dto.setPredictedTemperature(round2(adjusted));
        dto.setHeatRiskLevel(risk);
        dto.setOverallRiskLevel(risk);
        dto.setGeneratedAt(LocalDateTime.now());

        return dto;
    }

    // ================= POLLUTION =================
    private DisplaySimulationResultDto simulatePollution(SimulateRequestDto request) {

        Map<String, Double> trafficData = cityDataService.getTrafficData();
        Map<String, Double> tempData    = cityDataService.getTemperatureData();

        double trafficMult   = request.getTrafficMultiplier()   != null ? request.getTrafficMultiplier()   : 1.0;
        double pollutionMult = request.getPollutionMultiplier() != null ? request.getPollutionMultiplier() : 1.0;
        double congestion    = trafficData.get("congestionLevel") * trafficMult;

        Map<String, Object> aiRequest = Map.of(
                "temperature", request.getTemperature() != null ? request.getTemperature() : tempData.get("baseTemperature"),
                "humidity",    request.getHumidity()    != null ? request.getHumidity()    : tempData.get("humidity"),
                "wind_speed",  request.getWindSpeed()   != null ? request.getWindSpeed()   : 3.0,
                "traffic",     congestion,
                "hour",        LocalDateTime.now().getHour(),
                "month",       LocalDateTime.now().getMonthValue(),
                "weekday",     LocalDateTime.now().getDayOfWeek().getValue() - 1
        );

        Map<String, Object> response = aiModelClientService.predictPollution(aiRequest);
        double predicted = ((Number) response.get("predictedPm25")).doubleValue() * pollutionMult;
        String risk      = airRiskFor(predicted);

        DisplaySimulationResultDto dto = new DisplaySimulationResultDto();
        dto.setPredictedPollution(round2(predicted));
        dto.setAirRiskLevel(risk);
        dto.setOverallRiskLevel(risk);
        dto.setGeneratedAt(LocalDateTime.now());

        return dto;
    }

    // ================= HELPERS =================
    private String heatRiskFor(double temp) {
        if (temp >= 38) return "CRITICAL";
        if (temp >= 33) return "HIGH";
        if (temp >= 28) return "MODERATE";
        return "LOW";
    }

    private String trafficRiskFor(double congestion) {
        if (congestion >= 0.8) return "HIGH";
        if (congestion >= 0.5) return "MEDIUM";
        return "LOW";
    }

    private String airRiskFor(double pm25) {
        if (pm25 > 120) return "HIGH";
        if (pm25 > 55)  return "MODERATE";
        return "LOW";
    }

    private String worstRisk(String... risks) {
        int max = 0;
        for (String r : risks) max = Math.max(max, riskScore(r));
        return switch (max) {
            case 3  -> "CRITICAL";
            case 2  -> "HIGH";
            case 1  -> "MODERATE";
            default -> "LOW";
        };
    }

    private int riskScore(String risk) {
        return switch (risk.toUpperCase()) {
            case "CRITICAL"           -> 3;
            case "HIGH"               -> 2;
            case "MODERATE", "MEDIUM" -> 1;
            default                   -> 0;
        };
    }

    private double round2(double v) {
        return Math.round(v * 100.0) / 100.0;
    }
}
