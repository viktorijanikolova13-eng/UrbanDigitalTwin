package com.example.smartcity.service.domain.impl;

import com.example.smartcity.model.dto.create.PredictionRequestDto;
import com.example.smartcity.model.dto.display.PredictionResponseDto;
import com.example.smartcity.model.dto.display.ZoneSimulationResultDto;
import com.example.smartcity.service.domain.CityDataService;
import com.example.smartcity.service.domain.PredictionEngine;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class PredictionEngineImpl implements PredictionEngine {

    private final CityDataService cityDataService;

    private record ZoneBaseline(
            String name, double lat, double lon,
            double baseTemp, double humidity, double windSpeed,
            double congestion, double basePm25, double baseVehicles
    ) {}

    private static final List<ZoneBaseline> SKOPJE_ZONES = List.of(
            new ZoneBaseline("Karpoš",        41.9940, 21.3900, 23.0, 62.0, 3.0, 0.35,  15.0,  80.0),
            new ZoneBaseline("Kisela Voda",   41.9760, 21.4600, 23.0, 65.0, 4.0, 0.25,  10.0,  70.0),
            new ZoneBaseline("Gazi Baba",     42.0100, 21.4800, 24.0, 63.0, 4.0, 0.30,  20.0,  90.0),
            new ZoneBaseline("Centar",        41.9965, 21.4314, 26.0, 58.0, 2.0, 0.70,  45.0, 150.0),
            new ZoneBaseline("Butel",         42.0280, 21.4350, 25.0, 60.0, 2.0, 0.62,  60.0, 120.0),
            new ZoneBaseline("Aerodrom",      41.9697, 21.4308, 25.0, 60.0, 2.5, 0.55, 100.0, 100.0),
            new ZoneBaseline("Čair",          41.9980, 21.4450, 27.0, 55.0, 1.5, 0.78, 110.0, 130.0),
            new ZoneBaseline("Stara Čaršija", 41.9993, 21.4380, 28.0, 52.0, 1.0, 0.88, 130.0, 200.0)
    );

    public PredictionEngineImpl(CityDataService cityDataService) {
        this.cityDataService = cityDataService;
    }

    @Override
    public PredictionResponseDto predict(PredictionRequestDto request) {
        return switch (request.getType().toLowerCase()) {
            case "temperature" -> predictTemperature(request);
            case "pollution"   -> predictPollution(request);
            case "traffic"     -> predictTraffic(request);
            case "all"         -> predictAll(request);
            default -> throw new IllegalArgumentException(
                    "Unknown prediction type: " + request.getType()
            );
        };
    }

    @Override
    public List<ZoneSimulationResultDto> predictZones(PredictionRequestDto request) {
        double tempOffset   = timeTempOffset(request.getTime()) + seasonalTempOffset(request.getDate());
        double trafficMult  = timeTrafficMultiplier(request.getTime());

        return SKOPJE_ZONES.stream().map(zone -> {

            double predictedTemp = (request.getTemperature() != null
                    ? request.getTemperature()
                    : zone.baseTemp()) + tempOffset;
            String heatRisk = heatRiskFor(predictedTemp);

            double humidity   = request.getHumidity()  != null ? request.getHumidity()  : zone.humidity();
            double windSpeed  = request.getWindSpeed() != null ? request.getWindSpeed() : zone.windSpeed();
            double congestion = request.getTraffic()   != null ? request.getTraffic()   : zone.congestion() * trafficMult;
            double vehicles   = zone.baseVehicles() * (congestion / zone.congestion());
            String trafficRisk = trafficRiskFor(congestion);

            double formulaPm25   = 20 + congestion * 25 + humidity * 0.12 - windSpeed * 2.3;
            double predictedPm25 = zone.basePm25() + formulaPm25;
            String airRisk       = airRiskFor(predictedPm25);

            String overallRisk = worstRisk(heatRisk, airRisk, trafficRisk);

            return new ZoneSimulationResultDto(
                    zone.name(), zone.lat(), zone.lon(),
                    round2(predictedTemp), round2(predictedPm25), round2(vehicles),
                    heatRisk, airRisk, trafficRisk, overallRisk
            );

        }).collect(Collectors.toList());
    }

    // ================= SINGLE PREDICT METHODS =================
    private PredictionResponseDto predictTemperature(PredictionRequestDto request) {
        Map<String, Double> tempData = cityDataService.getTemperatureData();
        double predicted = request.getTemperature() != null
                ? request.getTemperature()
                : tempData.get("baseTemperature");
        String risk = heatRiskFor(predicted);
        return new PredictionResponseDto(
                request.getZone(), "temperature", round2(predicted), risk, null, null, LocalDateTime.now()
        );
    }

    private PredictionResponseDto predictPollution(PredictionRequestDto request) {
        Map<String, Double> tempData    = cityDataService.getTemperatureData();
        Map<String, Double> trafficData = cityDataService.getTrafficData();

        double humidity   = request.getHumidity()  != null ? request.getHumidity()  : tempData.get("humidity");
        double windSpeed  = request.getWindSpeed() != null ? request.getWindSpeed() : 3.0;
        double congestion = request.getTraffic()   != null ? request.getTraffic()   : trafficData.get("congestionLevel");

        double pm25 = 20 + congestion * 25 + humidity * 0.12 - windSpeed * 2.3;
        String risk = airRiskFor(pm25);
        return new PredictionResponseDto(
                request.getZone(), "pollution", round2(pm25), risk, null, round2(pm25), LocalDateTime.now()
        );
    }

    private PredictionResponseDto predictTraffic(PredictionRequestDto request) {
        Map<String, Double> trafficData = cityDataService.getTrafficData();
        double congestion = request.getTraffic() != null ? request.getTraffic() : trafficData.get("congestionLevel");
        double vehicles   = trafficData.get("vehicleCount") * (congestion / trafficData.get("congestionLevel"));
        String risk = trafficRiskFor(congestion);
        return new PredictionResponseDto(
                request.getZone(), "traffic", round2(vehicles), risk, null, null, LocalDateTime.now()
        );
    }

    private PredictionResponseDto predictAll(PredictionRequestDto request) {
        PredictionResponseDto tempResult      = predictTemperature(request);
        PredictionResponseDto pollutionResult = predictPollution(request);
        PredictionResponseDto trafficResult   = predictTraffic(request);

        String overallRisk = worstRisk(
                tempResult.riskLevel(),
                pollutionResult.riskLevel(),
                trafficResult.riskLevel()
        );
        return new PredictionResponseDto(
                request.getZone(), "all",
                pollutionResult.predictedValue(), overallRisk,
                null, pollutionResult.pm25(),
                LocalDateTime.now()
        );
    }

    // ================= HELPERS =================

    private double timeTrafficMultiplier(String time) {
        if (time == null) return 1.0;
        return switch (time) {
            case "06:00" -> 1.3;   // morning rush
            case "12:00" -> 0.9;   // midday quiet
            case "15:00" -> 1.1;   // afternoon normal
            case "18:00" -> 1.5;   // evening peak rush
            case "22:00" -> 0.4;   // night very low
            default      -> 1.0;
        };
    }

    private double timeTempOffset(String time) {
        if (time == null) return 0.0;
        return switch (time) {
            case "06:00" -> -4.0;  // cool early morning
            case "12:00" ->  3.0;  // midday peak heat
            case "15:00" ->  2.0;  // afternoon still warm
            case "18:00" -> -1.0;  // evening cooling
            case "22:00" -> -6.0;  // cool night
            default      ->  0.0;
        };
    }

    private double seasonalTempOffset(String date) {
        if (date == null || date.length() < 7) return 0.0;
        try {
            int month = Integer.parseInt(date.substring(5, 7));
            return switch (month) {
                case 6, 7, 8   ->  4.0;   // summer
                case 12, 1, 2  -> -8.0;   // winter
                case 3, 4, 5   -> -2.0;   // spring
                default        -> -1.0;   // autumn
            };
        } catch (NumberFormatException e) {
            return 0.0;
        }
    }

    private String heatRiskFor(double temp) {
        if (temp >= 38) return "CRITICAL";
        if (temp >= 33) return "HIGH";
        if (temp >= 28) return "MODERATE";
        return "LOW";
    }

    private String airRiskFor(double pm25) {
        if (pm25 > 120) return "HIGH";
        if (pm25 > 55)  return "MODERATE";
        return "LOW";
    }

    private String trafficRiskFor(double congestion) {
        if (congestion >= 0.8) return "HIGH";
        if (congestion >= 0.5) return "MEDIUM";
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
